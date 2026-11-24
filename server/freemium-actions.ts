"use server";

import { pool } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DAILY_FREE_MESSAGE_LIMIT, getTodayDateString } from "@/lib/freemium-constants";

export interface UserMessageQuota {
  isPremium: boolean;
  used: number;
  limit: number;
  remaining: number;
  date: string;
}

/**
 * Retrieves the current message quota for the specified user or current session
 */
export async function getUserMessageQuota(userIdOverride?: string): Promise<UserMessageQuota> {
  let userId = userIdOverride;
  if (!userId) {
    const session = await getSession();
    if (!session?.userId) {
      return {
        isPremium: false,
        used: 0,
        limit: DAILY_FREE_MESSAGE_LIMIT,
        remaining: DAILY_FREE_MESSAGE_LIMIT,
        date: getTodayDateString(),
      };
    }
    userId = session.userId;
  }

  const today = getTodayDateString();

  // 1. Check user premium status
  const userRes = await pool.query<{ isPremium: boolean; premiumUntil: Date | null }>(
    `SELECT "isPremium", "premiumUntil" FROM "User" WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const user = userRes.rows[0];
  const isPremium = Boolean(
    user?.isPremium === true && (!user.premiumUntil || new Date(user.premiumUntil) > new Date())
  );

  if (isPremium) {
    return {
      isPremium: true,
      used: 0,
      limit: 999999, // unlimited display indicator
      remaining: 999999,
      date: today,
    };
  }

  // 2. Fetch daily message usage
  const usageRes = await pool.query<{ count: number }>(
    `SELECT count FROM "DailyMessageUsage" WHERE "userId" = $1 AND date = $2 LIMIT 1`,
    [userId, today]
  );
  const used = usageRes.rows[0]?.count || 0;
  const remaining = Math.max(0, DAILY_FREE_MESSAGE_LIMIT - used);

  return {
    isPremium: false,
    used,
    limit: DAILY_FREE_MESSAGE_LIMIT,
    remaining,
    date: today,
  };
}

/**
 * Atomically checks and reserves 1 message from the daily quota.
 * Uses atomic conditional update so concurrent requests cannot exceed limit.
 */
export async function reserveMessageQuotaAtomic(userId: string): Promise<{
  allowed: boolean;
  isPremium: boolean;
  used: number;
  limit: number;
  remaining: number;
  date: string;
}> {
  const today = getTodayDateString();

  // 1. Check if user is premium
  const userRes = await pool.query<{ isPremium: boolean; premiumUntil: Date | null }>(
    `SELECT "isPremium", "premiumUntil" FROM "User" WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const user = userRes.rows[0];
  const isPremium = Boolean(
    user?.isPremium === true && (!user.premiumUntil || new Date(user.premiumUntil) > new Date())
  );

  if (isPremium) {
    return {
      allowed: true,
      isPremium: true,
      used: 0,
      limit: 999999,
      remaining: 999999,
      date: today,
    };
  }

  // 2. Atomic upsert with conditional limit guard:
  // If record doesn't exist, insert with count = 1.
  // If record exists and count < DAILY_FREE_MESSAGE_LIMIT, increment count by 1.
  // If count >= DAILY_FREE_MESSAGE_LIMIT, no row is returned!
  const genId = `dmu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const res = await pool.query<{ count: number }>(
    `INSERT INTO "DailyMessageUsage" (id, "userId", date, count, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 1, NOW(), NOW())
     ON CONFLICT ("userId", date)
     DO UPDATE SET count = "DailyMessageUsage".count + 1, "updatedAt" = NOW()
     WHERE "DailyMessageUsage".count < $4
     RETURNING count;`,
    [genId, userId, today, DAILY_FREE_MESSAGE_LIMIT]
  );

  if (res.rows.length === 0) {
    // Quota reached! Fetch actual current count
    const curRes = await pool.query<{ count: number }>(
      `SELECT count FROM "DailyMessageUsage" WHERE "userId" = $1 AND date = $2`,
      [userId, today]
    );
    const curUsed = curRes.rows[0]?.count || DAILY_FREE_MESSAGE_LIMIT;
    return {
      allowed: false,
      isPremium: false,
      used: curUsed,
      limit: DAILY_FREE_MESSAGE_LIMIT,
      remaining: 0,
      date: today,
    };
  }

  const newUsed = res.rows[0].count;
  return {
    allowed: true,
    isPremium: false,
    used: newUsed,
    limit: DAILY_FREE_MESSAGE_LIMIT,
    remaining: Math.max(0, DAILY_FREE_MESSAGE_LIMIT - newUsed),
    date: today,
  };
}

/**
 * Rollback reserved message count if message creation failed unexpectedly
 * Ensures only successfully accepted outgoing messages are counted against quota.
 */
export async function refundMessageQuotaAtomic(userId: string) {
  const today = getTodayDateString();
  try {
    await pool.query(
      `UPDATE "DailyMessageUsage"
       SET count = GREATEST(0, count - 1), "updatedAt" = NOW()
       WHERE "userId" = $1 AND date = $2`,
      [userId, today]
    );
  } catch {
    // ignore
  }
}

/**
 * Upgrades a user to Premium tier (unlimited messaging)
 */
export async function upgradeUserToPremium(
  userId: string,
  durationDays: number = 30
): Promise<{ success: boolean; message: string }> {
  const premiumUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  await pool.query(
    `UPDATE "User"
     SET "isPremium" = true, "premiumUntil" = $1
     WHERE id = $2`,
    [premiumUntil, userId]
  );

  return {
    success: true,
    message: `Upgraded to Premium successfully! Unlimited messaging enabled until ${premiumUntil.toLocaleDateString()}.`,
  };
}
