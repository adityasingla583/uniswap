"use server";

import { prisma, pool } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizeWebsiteUrl } from "@/lib/ssrf-filter";
import { runAiCampusVerification } from "./ai-verification";

export interface CampusRequestInput {
  name: string;
  website?: string;
  domain?: string;
  institutionType?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
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
  website: string | null;
  institutionType: string | null;
  requesterName: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  note: string | null;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  aiRecommendation: "APPROVE" | "MANUAL_REVIEW" | "REJECT" | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
  aiEvidence: string | null;
  aiCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentVerificationItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  campusName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  studentIdNumber: string | null;
  collegeEmail: string | null;
  documentUrl: string | null;
  rejectionReason: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  paymentAmount: number | null;
  paymentOrderId: string | null;
  createdAt: Date;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: Date;
}

// ─── Verification of Admin Session ─────────────────────────────

export async function verifyAdminSession(userIdOverride?: string) {
  let userId = userIdOverride;
  if (!userId) {
    try {
      const session = await getSession();
      userId = session?.userId;
    } catch {
      // outside request context
    }
  }

  if (!userId) {
    return { isAdmin: false, user: null };
  }

  let user: { id: string; email: string; name: string; isAdmin: boolean } | null = null;
  try {
    const res = await pool.query<{ id: string; email: string; name: string; isAdmin: boolean }>(
      `SELECT id, email, name, "isAdmin" FROM "User" WHERE id = $1 LIMIT 1`,
      [userId]
    );
    user = res.rows[0] || null;
  } catch {
    user = await prisma.user
      .findUnique({
        where: { id: userId },
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

// ─── Module 3: Campus Registration ─────────────────────────────

/**
 * Submits a new campus request with SSRF-safe URL normalization,
 * strict concurrent duplicate checks against Campus & CampusRequest,
 * and automatic background AI verification.
 */
export async function submitCampusRequest(data: CampusRequestInput): Promise<{
  success?: boolean;
  error?: string;
  requestId?: string;
  exists?: boolean;
  status?: string;
  message?: string;
}> {
  const trimmedName = (data.name || "").trim();
  if (!trimmedName || trimmedName.length < 3) {
    return { error: "Please enter a valid institute name (at least 3 characters)." };
  }

  // Normalize Website URL and extract Domain safely
  let normalizedUrl: string | null = null;
  let extractedDomain: string | null = null;

  if (data.website && data.website.trim()) {
    const urlValidation = normalizeWebsiteUrl(data.website);
    if (urlValidation.isValid) {
      normalizedUrl = urlValidation.normalizedUrl;
      extractedDomain = urlValidation.domain;
    } else {
      return { error: urlValidation.error || "Please enter a valid official website URL." };
    }
  } else if (data.domain && data.domain.trim()) {
    extractedDomain = data.domain.trim().toLowerCase().replace(/^www\./, "");
  }

  // 1. Check if campus is already officially active in Campus table (by name OR by domain)
  const activeCampusRes = await pool.query<{ id: string; name: string; domain: string | null }>(
    `SELECT id, name, domain FROM "Campus"
     WHERE LOWER(name) = LOWER($1)
        OR ($2::text IS NOT NULL AND domain IS NOT NULL AND LOWER(domain) = LOWER($2))
        OR $1 = ANY(aliases)
     LIMIT 1`,
    [trimmedName, extractedDomain]
  );

  const existingActive = activeCampusRes.rows[0];
  if (existingActive) {
    return {
      error: `"${existingActive.name}" is already registered and active in our system! You can select it directly from the campus list.`,
      exists: true,
      status: "APPROVED",
    };
  }

  // 2. Check if a request already exists in CampusRequest table (by name OR domain)
  const existingReqRes = await pool.query<{ id: string; name: string; status: string }>(
    `SELECT id, name, status FROM "CampusRequest"
     WHERE (LOWER(name) = LOWER($1) OR ($2::text IS NOT NULL AND domain IS NOT NULL AND LOWER(domain) = LOWER($2)))
       AND status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED')
     LIMIT 1`,
    [trimmedName, extractedDomain]
  );

  const existingPending = existingReqRes.rows[0];
  if (existingPending) {
    return {
      error: `A verification request for "${existingPending.name}" already exists with status: ${existingPending.status}.`,
      exists: true,
      status: existingPending.status,
    };
  }

  // Default geographical coordinates if not provided (geographical center of India)
  const lat = typeof data.latitude === "number" && !isNaN(data.latitude) ? data.latitude : 20.5937;
  const lng = typeof data.longitude === "number" && !isNaN(data.longitude) ? data.longitude : 78.9629;

  // Insert CampusRequest atomically
  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const insertRes = await pool.query<CampusRequestRecord>(
    `INSERT INTO "CampusRequest" (
       id, name, city, state, latitude, longitude, domain, website, "institutionType",
       "requesterName", "requesterEmail", "requesterPhone", note, status, "createdAt", "updatedAt"
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING', NOW(), NOW())
     RETURNING *`,
    [
      id,
      trimmedName,
      data.city?.trim() || null,
      data.state?.trim() || null,
      lat,
      lng,
      extractedDomain,
      normalizedUrl,
      data.institutionType?.trim() || null,
      data.requesterName?.trim() || null,
      data.requesterEmail?.trim() || null,
      data.requesterPhone?.trim() || null,
      data.note?.trim() || null,
    ]
  );

  const createdRequest = insertRes.rows[0];

  // 3. Module 4: Run AI Website Verification
  if (normalizedUrl) {
    try {
      const aiResult = await runAiCampusVerification({
        institutionName: trimmedName,
        websiteUrl: normalizedUrl,
        domain: extractedDomain || undefined,
        city: data.city,
        state: data.state,
        institutionType: data.institutionType,
      });

      const initialStatus = aiResult.recommendation === "MANUAL_REVIEW" ? "UNDER_REVIEW" : "PENDING";

      await pool.query(
        `UPDATE "CampusRequest"
         SET "aiRecommendation" = $1,
             "aiConfidence" = $2,
             "aiReasoning" = $3,
             "aiEvidence" = $4,
             "aiCheckedAt" = NOW(),
             status = $5,
             "updatedAt" = NOW()
         WHERE id = $6`,
        [
          aiResult.recommendation,
          aiResult.confidence,
          aiResult.reasoningSummary,
          JSON.stringify({
            supportingEvidence: aiResult.supportingEvidence,
            riskFactors: aiResult.riskFactors,
            extractedDetails: aiResult.extractedDetails,
          }),
          initialStatus,
          id,
        ]
      );
    } catch (aiErr) {
      console.error("Auto AI verification error upon submission:", aiErr);
    }
  }

  try {
    revalidatePath("/admin");
  } catch {
    // outside request context
  }

  return {
    success: true,
    requestId: createdRequest.id,
    message: `Your request to add "${trimmedName}" has been submitted for admin verification. You can track its status as our review team processes it.`,
  };
}

// ─── Module 5: Admin Dashboard & Actions ─────────────────────────

/**
 * Retrieves comprehensive admin dashboard data:
 * - Filterable CampusRequests (Pending, Under Review, Approved, Rejected)
 * - Student Verification Requests with Payment details
 * - Audit Logs
 * - Active Campuses (for merge/alias resolution)
 */
export async function getAdminDashboardData(filterStatus?: string) {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin) {
    return { error: "Unauthorized access: Admin privileges required." };
  }

  const [
    countsRes,
    allRequestsRes,
    verificationsRes,
    auditLogsRes,
    campusesRes,
  ] = await Promise.all([
    // Overview Metrics
    pool.query<{
      campuses: string;
      users: string;
      listings: string;
      pendingCampuses: string;
      pendingVerifications: string;
    }>(`
      SELECT
        (SELECT count(*) FROM "Campus") as campuses,
        (SELECT count(*) FROM "User") as users,
        (SELECT count(*) FROM "Listing") as listings,
        (SELECT count(*) FROM "CampusRequest" WHERE status IN ('PENDING', 'UNDER_REVIEW')) as "pendingCampuses",
        (SELECT count(*) FROM "VerificationRequest" WHERE status = 'PENDING') as "pendingVerifications"
    `),

    // Campus Requests
    pool.query<CampusRequestRecord>(
      `SELECT * FROM "CampusRequest"
       WHERE ($1::text IS NULL OR status = $1)
       ORDER BY "createdAt" DESC
       LIMIT 100`,
      [filterStatus && filterStatus !== "ALL" ? filterStatus : null]
    ),

    // Student Verification Requests with User & Payment details
    pool.query<StudentVerificationItem>(`
      SELECT
        vr.id,
        vr."userId",
        u.name as "userName",
        u.email as "userEmail",
        u.phone as "userPhone",
        c.name as "campusName",
        vr.status,
        vr."studentIdNumber",
        vr."collegeEmail",
        vr."documentUrl",
        vr."rejectionReason",
        vr."paymentId",
        p.status as "paymentStatus",
        p.amount as "paymentAmount",
        p."orderId" as "paymentOrderId",
        vr."createdAt"
      FROM "VerificationRequest" vr
      JOIN "User" u ON u.id = vr."userId"
      LEFT JOIN "Campus" c ON c.id = u."campusId"
      LEFT JOIN "PaymentRecord" p ON p.id = vr."paymentId"
      ORDER BY vr."createdAt" DESC
      LIMIT 100
    `),

    // Recent Audit Logs
    pool.query<AuditLogItem>(`
      SELECT id, "adminId", "adminEmail", action, "targetType", "targetId", details, "createdAt"
      FROM "AuditLog"
      ORDER BY "createdAt" DESC
      LIMIT 50
    `),

    // Active Campuses for Merging / Alias Management
    pool.query<{ id: string; name: string; domain: string | null; aliases: string[]; userCount: string; listingCount: string }>(`
      SELECT
        c.id,
        c.name,
        c.domain,
        c.aliases,
        count(DISTINCT u.id) as "userCount",
        count(DISTINCT l.id) as "listingCount"
      FROM "Campus" c
      LEFT JOIN "User" u ON u."campusId" = c.id
      LEFT JOIN "Listing" l ON l."campusId" = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `),
  ]);

  const metricsRow = countsRes.rows[0];
  const allRequests = allRequestsRes.rows;

  return {
    success: true,
    metrics: {
      totalCampuses: parseInt(metricsRow?.campuses || "0", 10),
      totalUsers: parseInt(metricsRow?.users || "0", 10),
      totalListings: parseInt(metricsRow?.listings || "0", 10),
      pendingCampusCount: parseInt(metricsRow?.pendingCampuses || "0", 10),
      pendingVerificationCount: parseInt(metricsRow?.pendingVerifications || "0", 10),
    },
    requests: allRequests,
    verifications: verificationsRes.rows,
    auditLogs: auditLogsRes.rows,
    campuses: campusesRes.rows.map((c) => ({
      ...c,
      userCount: parseInt(c.userCount || "0", 10),
      listingCount: parseInt(c.listingCount || "0", 10),
    })),
  };
}

/**
 * Confirms and activates a requested institute.
 * Creates/activates official Campus entry, marks request as APPROVED, and logs audit action.
 */
export async function approveCampusRequest(
  requestId: string,
  overrides?: {
    name?: string;
    latitude?: number;
    longitude?: number;
    domain?: string;
    website?: string;
  }
) {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin || !auth.user) {
    return { error: "Unauthorized access: Admin privileges required." };
  }

  const reqRes = await pool.query<CampusRequestRecord>(
    `SELECT * FROM "CampusRequest" WHERE id = $1 LIMIT 1`,
    [requestId]
  );
  const request = reqRes.rows[0];
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
  const finalWebsite = overrides?.website?.trim() || request.website;

  // Insert or activate Campus (upsert)
  const cid = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const campusRes = await pool.query<{ id: string; name: string; domain: string | null }>(
    `INSERT INTO "Campus" (id, name, latitude, longitude, domain, website)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (name) DO UPDATE
     SET latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         domain = COALESCE(EXCLUDED.domain, "Campus".domain),
         website = COALESCE(EXCLUDED.website, "Campus".website)
     RETURNING *`,
    [cid, finalName, finalLat, finalLng, finalDomain, finalWebsite]
  );
  const newCampus = campusRes.rows[0];

  // Mark request as APPROVED
  await pool.query(
    `UPDATE "CampusRequest"
     SET status = 'APPROVED',
         name = $1,
         latitude = $2,
         longitude = $3,
         domain = $4,
         website = $5,
         "updatedAt" = NOW()
     WHERE id = $6`,
    [finalName, finalLat, finalLng, finalDomain, finalWebsite, requestId]
  );

  // Record Audit Log
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await pool.query(
    `INSERT INTO "AuditLog" (id, "adminId", "adminEmail", action, "targetType", "targetId", details, "createdAt")
     VALUES ($1, $2, $3, 'APPROVE_CAMPUS_REQUEST', 'CampusRequest', $4, $5, NOW())`,
    [
      auditId,
      auth.user.id,
      auth.user.email,
      requestId,
      JSON.stringify({
        campusId: newCampus.id,
        campusName: newCampus.name,
        approvedAt: new Date().toISOString(),
      }),
    ]
  );

  try {
    revalidatePath("/admin");
    revalidatePath("/register");
    revalidatePath("/");
  } catch {
    // outside request context
  }

  return {
    success: true,
    message: `"${newCampus.name}" has been confirmed and is now active across all student feeds & registration!`,
    campus: newCampus,
  };
}

/**
 * Rejects a campus request with a clear reason and logs audit event.
 */
export async function rejectCampusRequest(requestId: string, reason?: string) {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin || !auth.user) {
    return { error: "Unauthorized access." };
  }

  const finalReason = reason?.trim() || "Institute details or affiliation could not be verified.";

  await pool.query(
    `UPDATE "CampusRequest"
     SET status = 'REJECTED',
         "rejectionReason" = $1,
         "updatedAt" = NOW()
     WHERE id = $2`,
    [finalReason, requestId]
  );

  // Record Audit Log
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await pool.query(
    `INSERT INTO "AuditLog" (id, "adminId", "adminEmail", action, "targetType", "targetId", details, "createdAt")
     VALUES ($1, $2, $3, 'REJECT_CAMPUS_REQUEST', 'CampusRequest', $4, $5, NOW())`,
    [
      auditId,
      auth.user.id,
      auth.user.email,
      requestId,
      JSON.stringify({ reason: finalReason }),
    ]
  );

  try {
    revalidatePath("/admin");
  } catch {
    // outside request context
  }

  return { success: true, message: "Campus request marked as rejected." };
}

/**
 * Merges duplicate campus records:
 * Reassigns all users and listings from sourceCampus to targetCampus,
 * appends sourceCampus name into targetCampus aliases,
 * deletes sourceCampus, and creates an audit record.
 */
export async function mergeCampuses(
  sourceCampusId: string,
  targetCampusId: string,
  adminUserIdOverride?: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const auth = await verifyAdminSession(adminUserIdOverride);
  if (!auth.isAdmin || !auth.user) {
    return { error: "Unauthorized access: Admin privileges required." };
  }

  if (sourceCampusId === targetCampusId) {
    return { error: "Source and target campus cannot be identical." };
  }

  // Fetch both campuses
  const res = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM "Campus" WHERE id IN ($1, $2)`,
    [sourceCampusId, targetCampusId]
  );

  const source = res.rows.find((c) => c.id === sourceCampusId);
  const target = res.rows.find((c) => c.id === targetCampusId);

  if (!source || !target) {
    return { error: "One or both campus records could not be found." };
  }

  // Perform merge in a database transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Move all users
    const userUpdate = await client.query(
      `UPDATE "User" SET "campusId" = $1 WHERE "campusId" = $2 RETURNING id`,
      [targetCampusId, sourceCampusId]
    );

    // 2. Move all listings
    const listingUpdate = await client.query(
      `UPDATE "Listing" SET "campusId" = $1 WHERE "campusId" = $2 RETURNING id`,
      [targetCampusId, sourceCampusId]
    );

    // 3. Append source campus name to target's aliases array
    await client.query(
      `UPDATE "Campus"
       SET aliases = array_append(aliases, $1)
       WHERE id = $2 AND NOT ($1 = ANY(aliases))`,
      [source.name, targetCampusId]
    );

    // 4. Delete the duplicate source campus
    await client.query(`DELETE FROM "Campus" WHERE id = $1`, [sourceCampusId]);

    // 5. Create Audit Log
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await client.query(
      `INSERT INTO "AuditLog" (id, "adminId", "adminEmail", action, "targetType", "targetId", details, "createdAt")
       VALUES ($1, $2, $3, 'MERGE_CAMPUS', 'Campus', $4, $5, NOW())`,
      [
        auditId,
        auth.user.id,
        auth.user.email,
        targetCampusId,
        JSON.stringify({
          mergedSourceCampusId: sourceCampusId,
          mergedSourceCampusName: source.name,
          targetCampusName: target.name,
          usersReassigned: userUpdate.rowCount || 0,
          listingsReassigned: listingUpdate.rowCount || 0,
        }),
      ]
    );

    await client.query("COMMIT");

    try {
      revalidatePath("/admin");
      revalidatePath("/");
    } catch {
      // outside request context
    }

    return {
      success: true,
      message: `Successfully merged "${source.name}" into "${target.name}". Reassigned ${
        userUpdate.rowCount || 0
      } users and ${listingUpdate.rowCount || 0} listings.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Campus merge transaction failed:", err);
    return { error: `Merge failed: ${(err as Error).message}` };
  } finally {
    client.release();
  }
}

/**
 * Returns count of pending campus approval notifications
 */
export async function getPendingCampusNotificationsCount() {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin) return 0;

  try {
    const res = await pool.query<{ count: string }>(
      `SELECT count(*) FROM "CampusRequest" WHERE status IN ('PENDING', 'UNDER_REVIEW')`
    );
    return parseInt(res.rows[0]?.count || "0", 10);
  } catch {
    return 0;
  }
}
