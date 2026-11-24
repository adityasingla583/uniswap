import "./setup";
import test from "node:test";
import assert from "node:assert";
import { pool } from "../lib/prisma";
import {
  getUserMessageQuota,
  reserveMessageQuotaAtomic,
  refundMessageQuotaAtomic,
  upgradeUserToPremium,
} from "../server/freemium-actions";
import {
  getTodayDateString,
  DAILY_FREE_MESSAGE_LIMIT,
} from "../lib/freemium-constants";

const hasDb = Boolean(process.env.DATABASE_URL);

test.after(async () => {
  if (hasDb) {
    try {
      await pool.query(`DELETE FROM "DailyMessageUsage" WHERE "userId" LIKE 'TEST_USER_%'`);
      await pool.query(`DELETE FROM "User" WHERE id LIKE 'TEST_USER_%'`);
      await pool.end();
    } catch {
      // ignore
    }
  }
});

test("Freemium Messaging: date string matches YYYY-MM-DD format", () => {
  const dateStr = getTodayDateString("Asia/Kolkata");
  assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
});

test("Freemium Messaging: free user starts with full 100 message quota", { skip: !hasDb }, async () => {
  const testUserId = `TEST_USER_${Date.now()}`;
  // Create mock user
  const campus = await pool.query<{ id: string }>(`SELECT id FROM "Campus" LIMIT 1`);
  const campusId = campus.rows[0]?.id || "cmp_default";

  await pool.query(
    `INSERT INTO "User" (id, name, email, password, "campusId", "isPremium", "createdAt")
     VALUES ($1, 'Test Student', $2, 'pass123', $3, false, NOW())`,
    [testUserId, `${testUserId}@campus.ac.in`, campusId]
  );

  const quota = await getUserMessageQuota(testUserId);
  assert.strictEqual(quota.isPremium, false);
  assert.strictEqual(quota.used, 0);
  assert.strictEqual(quota.limit, DAILY_FREE_MESSAGE_LIMIT);
  assert.strictEqual(quota.remaining, DAILY_FREE_MESSAGE_LIMIT);
});

test("Freemium Messaging: atomic reservation increments usage and enforces daily limit", { skip: !hasDb }, async () => {
  const testUserId = `TEST_USER_LIMIT_${Date.now()}`;
  const campus = await pool.query<{ id: string }>(`SELECT id FROM "Campus" LIMIT 1`);
  const campusId = campus.rows[0]?.id || "cmp_default";

  await pool.query(
    `INSERT INTO "User" (id, name, email, password, "campusId", "isPremium", "createdAt")
     VALUES ($1, 'Quota Student', $2, 'pass123', $3, false, NOW())`,
    [testUserId, `${testUserId}@campus.ac.in`, campusId]
  );

  // Reserve 1 message
  const res1 = await reserveMessageQuotaAtomic(testUserId);
  assert.strictEqual(res1.allowed, true);
  assert.strictEqual(res1.used, 1);
  assert.strictEqual(res1.remaining, 99);

  // Simulate reaching the daily boundary limit (100 messages)
  const today = getTodayDateString();
  await pool.query(
    `UPDATE "DailyMessageUsage" SET count = 100 WHERE "userId" = $1 AND date = $2`,
    [testUserId, today]
  );

  // Attempting to send message 101 must be strictly rejected
  const resOver = await reserveMessageQuotaAtomic(testUserId);
  assert.strictEqual(resOver.allowed, false);
  assert.strictEqual(resOver.used, 100);
  assert.strictEqual(resOver.remaining, 0);
});

test("Freemium Messaging: refund atomically decrements message count on failure", { skip: !hasDb }, async () => {
  const testUserId = `TEST_USER_REFUND_${Date.now()}`;
  const today = getTodayDateString();

  const campus = await pool.query<{ id: string }>(`SELECT id FROM "Campus" LIMIT 1`);
  const campusId = campus.rows[0]?.id || "cmp_default";

  await pool.query(
    `INSERT INTO "User" (id, name, email, password, "campusId", "isPremium", "createdAt")
     VALUES ($1, 'Refund Student', $2, 'pass123', $3, false, NOW())`,
    [testUserId, `${testUserId}@campus.ac.in`, campusId]
  );

  await pool.query(
    `INSERT INTO "DailyMessageUsage" (id, "userId", date, count, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 5, NOW(), NOW())
     ON CONFLICT ("userId", date) DO UPDATE SET count = 5`,
    [`dmu_test_${Date.now()}`, testUserId, today]
  );

  await refundMessageQuotaAtomic(testUserId);

  const res = await pool.query<{ count: number }>(
    `SELECT count FROM "DailyMessageUsage" WHERE "userId" = $1 AND date = $2`,
    [testUserId, today]
  );
  assert.strictEqual(res.rows[0].count, 4);
});

test("Freemium Messaging: premium user enjoys unlimited messaging", { skip: !hasDb }, async () => {
  const testUserId = `TEST_USER_PREMIUM_${Date.now()}`;
  const campus = await pool.query<{ id: string }>(`SELECT id FROM "Campus" LIMIT 1`);
  const campusId = campus.rows[0]?.id || "cmp_default";

  await pool.query(
    `INSERT INTO "User" (id, name, email, password, "campusId", "isPremium", "createdAt")
     VALUES ($1, 'Premium Student', $2, 'pass123', $3, true, NOW())`,
    [testUserId, `${testUserId}@campus.ac.in`, campusId]
  );

  await upgradeUserToPremium(testUserId, 30);

  const quota = await getUserMessageQuota(testUserId);
  assert.strictEqual(quota.isPremium, true);
  assert.strictEqual(quota.remaining, 999999);

  const reserveRes = await reserveMessageQuotaAtomic(testUserId);
  assert.strictEqual(reserveRes.allowed, true);
  assert.strictEqual(reserveRes.isPremium, true);
});
