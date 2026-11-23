"use server";

import { prisma, pool } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CampusRequestInput {
  name: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  domain?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  note?: string;
}

export interface CampusRequestRecord {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  domain: string | null;
  requesterName: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  note: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Resilient Data Access Helpers (Prisma + Postgres pool fallback) ──

async function dbFindPendingRequestByName(name: string): Promise<CampusRequestRecord | null> {
  try {
    const pc = (prisma as unknown as { campusRequest?: { findFirst: (args: unknown) => Promise<CampusRequestRecord | null> } }).campusRequest;
    if (pc?.findFirst) {
      const res = await pc.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          status: "PENDING",
        },
      });
      if (res) return res;
    }
  } catch {
    // fallback
  }

  const res = await pool.query<CampusRequestRecord>(
    `SELECT * FROM "CampusRequest" WHERE LOWER(name) = LOWER($1) AND status = 'PENDING' LIMIT 1`,
    [name]
  );
  return res.rows[0] || null;
}

async function dbInsertCampusRequest(data: {
  name: string;
  city?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
  domain?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  note?: string | null;
}): Promise<CampusRequestRecord> {
  try {
    const pc = (prisma as unknown as { campusRequest?: { create: (args: { data: unknown }) => Promise<CampusRequestRecord> } }).campusRequest;
    if (pc?.create) {
      return await pc.create({
        data: {
          ...data,
          status: "PENDING",
        },
      });
    }
  } catch {
    // fallback
  }

  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const res = await pool.query<CampusRequestRecord>(
    `INSERT INTO "CampusRequest" (id, name, city, state, latitude, longitude, domain, "requesterName", "requesterEmail", "requesterPhone", note, status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', NOW(), NOW())
     RETURNING *`,
    [
      id,
      data.name,
      data.city || null,
      data.state || null,
      data.latitude,
      data.longitude,
      data.domain || null,
      data.requesterName || null,
      data.requesterEmail || null,
      data.requesterPhone || null,
      data.note || null,
    ]
  );
  return res.rows[0];
}

async function dbGetPendingRequests(): Promise<CampusRequestRecord[]> {
  try {
    const pc = (prisma as unknown as { campusRequest?: { findMany: (args: unknown) => Promise<CampusRequestRecord[]> } }).campusRequest;
    if (pc?.findMany) {
      return await pc.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch {
    // fallback
  }

  const res = await pool.query<CampusRequestRecord>(
    `SELECT * FROM "CampusRequest" WHERE status = 'PENDING' ORDER BY "createdAt" DESC`
  );
  return res.rows;
}

async function dbGetRecentReviewedRequests(take = 10): Promise<CampusRequestRecord[]> {
  try {
    const pc = (prisma as unknown as { campusRequest?: { findMany: (args: unknown) => Promise<CampusRequestRecord[]> } }).campusRequest;
    if (pc?.findMany) {
      return await pc.findMany({
        where: { status: { in: ["APPROVED", "REJECTED"] } },
        orderBy: { updatedAt: "desc" },
        take,
      });
    }
  } catch {
    // fallback
  }

  const res = await pool.query<CampusRequestRecord>(
    `SELECT * FROM "CampusRequest" WHERE status IN ('APPROVED', 'REJECTED') ORDER BY "updatedAt" DESC LIMIT $1`,
    [take]
  );
  return res.rows;
}

async function dbGetRequestById(id: string): Promise<CampusRequestRecord | null> {
  try {
    const pc = (prisma as unknown as { campusRequest?: { findUnique: (args: { where: { id: string } }) => Promise<CampusRequestRecord | null> } }).campusRequest;
    if (pc?.findUnique) {
      const res = await pc.findUnique({ where: { id } });
      if (res) return res;
    }
  } catch {
    // fallback
  }

  const res = await pool.query<CampusRequestRecord>(
    `SELECT * FROM "CampusRequest" WHERE id = $1 LIMIT 1`,
    [id]
  );
  return res.rows[0] || null;
}

async function dbApproveRequest(
  id: string,
  details: { name: string; latitude: number; longitude: number; domain?: string | null }
): Promise<CampusRequestRecord> {
  try {
    const pc = (prisma as unknown as { campusRequest?: { update: (args: unknown) => Promise<CampusRequestRecord> } }).campusRequest;
    if (pc?.update) {
      return await pc.update({
        where: { id },
        data: {
          status: "APPROVED",
          name: details.name,
          latitude: details.latitude,
          longitude: details.longitude,
          domain: details.domain,
        },
      });
    }
  } catch {
    // fallback
  }

  const res = await pool.query<CampusRequestRecord>(
    `UPDATE "CampusRequest"
     SET status = 'APPROVED', name = $1, latitude = $2, longitude = $3, domain = $4, "updatedAt" = NOW()
     WHERE id = $5
     RETURNING *`,
    [details.name, details.latitude, details.longitude, details.domain || null, id]
  );
  return res.rows[0];
}

async function dbRejectRequest(id: string, reason: string): Promise<CampusRequestRecord> {
  try {
    const pc = (prisma as unknown as { campusRequest?: { update: (args: unknown) => Promise<CampusRequestRecord> } }).campusRequest;
    if (pc?.update) {
      return await pc.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
        },
      });
    }
  } catch {
    // fallback
  }

  const res = await pool.query<CampusRequestRecord>(
    `UPDATE "CampusRequest"
     SET status = 'REJECTED', "rejectionReason" = $1, "updatedAt" = NOW()
     WHERE id = $2
     RETURNING *`,
    [reason, id]
  );
  return res.rows[0];
}

// ─── Exported Actions ───────────────────────────────────────────

/**
 * Checks if current authenticated session belongs to an Admin user
 */
export async function verifyAdminSession() {
  const session = await getSession();
  if (!session?.userId) {
    return { isAdmin: false, user: null };
  }

  let user: { id: string; email: string; name: string; isAdmin: boolean } | null = null;
  try {
    const res = await pool.query<{ id: string; email: string; name: string; isAdmin: boolean }>(
      `SELECT id, email, name, "isAdmin" FROM "User" WHERE id = $1 LIMIT 1`,
      [session.userId]
    );
    user = res.rows[0] || null;
  } catch {
    user = await prisma.user
      .findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, name: true, isAdmin: true },
      })
      .catch(() => null);
  }

  if (!user) {
    return { isAdmin: false, user: null };
  }

  const emailLower = (user.email || "").toLowerCase();
  const isAdmin =
    user.isAdmin === true ||
    emailLower === "adityasingla03583@gmail.com" ||
    emailLower === "aditysasingla03583@gmail.com";
  return { isAdmin, user };
}

/**
 * Submits a new campus request for owner/admin verification
 */
export async function submitCampusRequest(data: CampusRequestInput) {
  const trimmedName = data.name.trim();
  if (!trimmedName || trimmedName.length < 3) {
    return { error: "Please enter a valid institute name (at least 3 characters)." };
  }

  // 1. Check if campus is already officially active
  let existingActive = null;
  try {
    existingActive = await prisma.campus.findFirst({
      where: { name: { equals: trimmedName, mode: "insensitive" } },
    });
  } catch {
    const r = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM "Campus" WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [trimmedName]
    );
    existingActive = r.rows[0] || null;
  }

  if (existingActive) {
    return {
      error: `"${existingActive.name}" is already registered and active in our system! You can select it directly from the list.`,
    };
  }

  // 2. Check if already requested and pending
  const existingPending = await dbFindPendingRequestByName(trimmedName);
  if (existingPending) {
    return {
      error: `A verification request for "${trimmedName}" has already been submitted and is currently awaiting admin confirmation.`,
    };
  }

  // Default coordinates if not provided (geographical center of India or approx)
  const lat = typeof data.latitude === "number" && !isNaN(data.latitude) ? data.latitude : 20.5937;
  const lng = typeof data.longitude === "number" && !isNaN(data.longitude) ? data.longitude : 78.9629;

  const request = await dbInsertCampusRequest({
    name: trimmedName,
    city: data.city?.trim() || null,
    state: data.state?.trim() || null,
    latitude: lat,
    longitude: lng,
    domain: data.domain?.trim() || null,
    requesterName: data.requesterName?.trim() || null,
    requesterEmail: data.requesterEmail?.trim() || null,
    requesterPhone: data.requesterPhone?.trim() || null,
    note: data.note?.trim() || null,
  });

  // Revalidate admin dashboard so admin sees incoming notification immediately
  try {
    revalidatePath("/admin");
  } catch {
    // ignore outside request context
  }

  return {
    success: true,
    requestId: request.id,
    message: `Your request to add "${trimmedName}" has been submitted to the platform admin. Once verified, it will be activated for student registration!`,
  };
}

/**
 * Retrieves admin overview metrics & pending campus notifications
 */
export async function getAdminDashboardData() {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin) {
    return { error: "Unauthorized access: Admin privileges required." };
  }

  const [
    totalCampuses,
    totalUsers,
    totalListings,
    pendingRequests,
    recentRequests,
  ] = await Promise.all([
    prisma.campus.count().catch(async () => {
      const r = await pool.query<{ count: string }>(`SELECT count(*) FROM "Campus"`);
      return parseInt(r.rows[0]?.count || "0", 10);
    }),
    prisma.user.count().catch(async () => {
      const r = await pool.query<{ count: string }>(`SELECT count(*) FROM "User"`);
      return parseInt(r.rows[0]?.count || "0", 10);
    }),
    prisma.listing.count().catch(async () => {
      const r = await pool.query<{ count: string }>(`SELECT count(*) FROM "Listing"`);
      return parseInt(r.rows[0]?.count || "0", 10);
    }),
    dbGetPendingRequests(),
    dbGetRecentReviewedRequests(10),
  ]);

  return {
    success: true,
    metrics: {
      totalCampuses,
      totalUsers,
      totalListings,
      pendingCount: pendingRequests.length,
    },
    pendingRequests,
    recentRequests,
  };
}

/**
 * Confirms and activates a requested institute
 * Creates the official Campus entry and marks request as APPROVED
 */
export async function approveCampusRequest(
  requestId: string,
  overrides?: { name?: string; latitude?: number; longitude?: number; domain?: string }
) {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin) {
    return { error: "Unauthorized access." };
  }

  const request = await dbGetRequestById(requestId);
  if (!request) {
    return { error: "Campus request not found." };
  }

  if (request.status === "APPROVED") {
    return { error: "This campus has already been approved." };
  }

  const finalName = overrides?.name?.trim() || request.name;
  const finalLat = typeof overrides?.latitude === "number" ? overrides.latitude : request.latitude;
  const finalLng = typeof overrides?.longitude === "number" ? overrides.longitude : request.longitude;
  const finalDomain = overrides?.domain?.trim() || request.domain;

  // Insert or activate Campus (upsert)
  let newCampus = null;
  try {
    newCampus = await prisma.campus.upsert({
      where: { name: finalName },
      update: {
        latitude: finalLat,
        longitude: finalLng,
        domain: finalDomain,
      },
      create: {
        name: finalName,
        latitude: finalLat,
        longitude: finalLng,
        domain: finalDomain,
      },
    });
  } catch {
    const cid = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await pool.query<{ id: string; name: string; latitude: number; longitude: number; domain: string | null }>(
      `INSERT INTO "Campus" (id, name, latitude, longitude, domain)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, domain = EXCLUDED.domain
       RETURNING *`,
      [cid, finalName, finalLat, finalLng, finalDomain]
    );
    newCampus = res.rows[0];
  }

  // Mark request as APPROVED
  await dbApproveRequest(requestId, {
    name: finalName,
    latitude: finalLat,
    longitude: finalLng,
    domain: finalDomain,
  });

  try {
    revalidatePath("/admin");
    revalidatePath("/register");
    revalidatePath("/");
  } catch {
    // ignore outside request context
  }

  return {
    success: true,
    message: `"${newCampus.name}" has been confirmed and is now active across all student feeds & registration!`,
    campus: newCampus,
  };
}

/**
 * Rejects a campus request
 */
export async function rejectCampusRequest(requestId: string, reason?: string) {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin) {
    return { error: "Unauthorized access." };
  }

  await dbRejectRequest(
    requestId,
    reason?.trim() || "Institute details could not be verified."
  );

  try {
    revalidatePath("/admin");
  } catch {
    // ignore outside request context
  }

  return { success: true, message: "Campus request marked as rejected." };
}

/**
 * Returns count of pending campus approval notifications
 */
export async function getPendingCampusNotificationsCount() {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin) return 0;

  try {
    const pc = (prisma as unknown as { campusRequest?: { count: (args: unknown) => Promise<number> } }).campusRequest;
    if (pc?.count) {
      return await pc.count({
        where: { status: "PENDING" },
      });
    }
  } catch {
    // fallback
  }

  try {
    const res = await pool.query<{ count: string }>(
      `SELECT count(*) FROM "CampusRequest" WHERE status = 'PENDING'`
    );
    return parseInt(res.rows[0]?.count || "0", 10);
  } catch {
    return 0;
  }
}
