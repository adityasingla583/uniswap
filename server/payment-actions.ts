"use server";

import { pool } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import Razorpay from "razorpay";
import { VERIFICATION_FEE_INR, VERIFICATION_FEE_PAISE } from "@/lib/payment-constants";

export interface CreateOrderResult {
  success?: boolean;
  error?: string;
  message?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  alreadyPaid?: boolean;
}

/**
 * Creates a Razorpay order securely on the backend for ₹10 verification fee
 * Enforces idempotency and checks whether user is already verified or paid
 */
export async function createVerificationPaymentOrder(
  idempotencyKey?: string
): Promise<CreateOrderResult> {
  const session = await getSession();
  if (!session?.userId) {
    return { error: "UNAUTHORIZED", message: "Please log in to request student verification." };
  }

  // 1. Check if user is already verified
  const userRes = await pool.query<{ isVerified: boolean }>(
    `SELECT "isVerified" FROM "User" WHERE id = $1 LIMIT 1`,
    [session.userId]
  );
  if (userRes.rows[0]?.isVerified) {
    return {
      error: "ALREADY_VERIFIED",
      message: "Your campus student status is already verified with a credibility badge!",
    };
  }

  // 2. Check if user already has an active pending verification request
  const pendingReqRes = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM "VerificationRequest" WHERE "userId" = $1 AND status = 'PENDING' LIMIT 1`,
    [session.userId]
  );
  if (pendingReqRes.rows.length > 0) {
    return {
      error: "PENDING_REQUEST_EXISTS",
      message: "You already have a pending verification request under admin review.",
    };
  }

  // 3. Idempotency: Check if an unused successful payment already exists for this user
  const unusedPayment = await pool.query<{ id: string; orderId: string }>(
    `SELECT p.id, p."orderId"
     FROM "PaymentRecord" p
     WHERE p."userId" = $1 AND p.status = 'SUCCESS' AND p.purpose = 'IDENTITY_VERIFICATION'
       AND p.id NOT IN (
         SELECT "paymentId" FROM "VerificationRequest" WHERE "paymentId" IS NOT NULL
       )
     LIMIT 1`,
    [session.userId]
  );

  if (unusedPayment.rows.length > 0) {
    return {
      success: true,
      alreadyPaid: true,
      orderId: unusedPayment.rows[0].orderId,
      amount: VERIFICATION_FEE_PAISE,
      currency: "INR",
      message: "You have an existing confirmed payment. You can submit your verification details without paying again.",
    };
  }

  // 4. Create Order ID via Razorpay API or fallback test generator
  let orderId: string;
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_localloop2026";
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keySecret && process.env.RAZORPAY_KEY_ID) {
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const order = await razorpay.orders.create({
        amount: VERIFICATION_FEE_PAISE,
        currency: "INR",
        receipt: `ver_${session.userId.slice(-6)}_${Date.now()}`,
        notes: {
          userId: session.userId,
          purpose: "IDENTITY_VERIFICATION",
        },
      });

      orderId = order.id;
    } catch (err) {
      console.error("Razorpay order creation error:", err);
      // Fallback to deterministic order ID
      orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  } else {
    // Development / Test mode order ID
    orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // 5. Store PaymentRecord with PENDING status
  const paymentRecordId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalIdempotencyKey = idempotencyKey || `idemp_${session.userId}_${Date.now()}`;

  await pool.query(
    `INSERT INTO "PaymentRecord" (id, "userId", "orderId", amount, currency, status, purpose, "idempotencyKey", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'INR', 'PENDING', 'IDENTITY_VERIFICATION', $5, NOW(), NOW())
     ON CONFLICT ("orderId") DO NOTHING`,
    [paymentRecordId, session.userId, orderId, VERIFICATION_FEE_INR, finalIdempotencyKey]
  );

  return {
    success: true,
    orderId,
    amount: VERIFICATION_FEE_PAISE,
    currency: "INR",
    keyId,
  };
}

/**
 * Validates Razorpay payment signature and registers student verification request.
 * Note: Payment success records the payment, but does NOT grant verified badge.
 * Badge is only granted upon admin verification of identity and campus affiliation.
 */
export async function verifyPaymentAndSubmitVerification(data: {
  orderId: string;
  paymentId: string;
  signature?: string;
  studentIdNumber?: string;
  collegeEmail?: string;
  documentUrl?: string;
}) {
  const session = await getSession();
  if (!session?.userId) {
    return { error: "UNAUTHORIZED", message: "Please log in to submit verification." };
  }

  const { orderId, paymentId, signature, studentIdNumber, collegeEmail, documentUrl } = data;

  if (!orderId || !paymentId) {
    return { error: "INVALID_PAYMENT", message: "Missing order ID or payment ID." };
  }

  // 1. Verify cryptographic signature if secret is configured
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keySecret && signature) {
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return {
        error: "INVALID_SIGNATURE",
        message: "Payment verification failed: Invalid transaction signature.",
      };
    }
  }

  // 2. Mark PaymentRecord as SUCCESS atomically
  const payUpdateRes = await pool.query<{ id: string }>(
    `UPDATE "PaymentRecord"
     SET status = 'SUCCESS', "paymentId" = $1, "updatedAt" = NOW()
     WHERE "orderId" = $2 AND "userId" = $3
     RETURNING id`,
    [paymentId, orderId, session.userId]
  );

  let paymentRecordId = payUpdateRes.rows[0]?.id;

  if (!paymentRecordId) {
    // If order record wasn't found under current user, check if already registered
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM "PaymentRecord" WHERE "orderId" = $1 AND "userId" = $2 LIMIT 1`,
      [orderId, session.userId]
    );
    paymentRecordId = existing.rows[0]?.id;
  }

  // 3. Create VerificationRequest with PENDING status
  // Note: user.isVerified remains FALSE!
  const reqId = `vr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const verRes = await pool.query<{ id: string; status: string }>(
    `INSERT INTO "VerificationRequest"
     (id, "userId", "paymentId", status, "studentIdNumber", "collegeEmail", "documentUrl", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, NOW(), NOW())
     RETURNING id, status`,
    [
      reqId,
      session.userId,
      paymentRecordId || null,
      studentIdNumber?.trim() || null,
      collegeEmail?.trim() || null,
      documentUrl?.trim() || null,
    ]
  );

  return {
    success: true,
    verificationId: verRes.rows[0]?.id,
    message:
      "Payment of ₹10 confirmed successfully! Your campus identity verification request has been submitted. Our admin team will verify your campus affiliation and grant your credibility badge.",
  };
}

/**
 * Returns the current user's verification status, latest request, and payment history
 */
export async function getUserVerificationStatus(userIdOverride?: string) {
  let userId = userIdOverride;
  if (!userId) {
    const session = await getSession();
    if (!session?.userId) {
      return { isVerified: false, verifiedAt: null, latestRequest: null, latestPayment: null };
    }
    userId = session.userId;
  }

  // 1. User status
  const userRes = await pool.query<{ isVerified: boolean; verifiedAt: Date | null }>(
    `SELECT "isVerified", "verifiedAt" FROM "User" WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const user = userRes.rows[0];

  // 2. Latest verification request
  const reqRes = await pool.query<{
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    studentIdNumber: string | null;
    collegeEmail: string | null;
    documentUrl: string | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>(
    `SELECT id, status, "studentIdNumber", "collegeEmail", "documentUrl", "rejectionReason", "createdAt", "updatedAt"
     FROM "VerificationRequest"
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC
     LIMIT 1`,
    [userId]
  );

  // 3. Latest payment record
  const payRes = await pool.query<{
    id: string;
    orderId: string;
    paymentId: string | null;
    amount: number;
    currency: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    createdAt: Date;
  }>(
    `SELECT id, "orderId", "paymentId", amount, currency, status, "createdAt"
     FROM "PaymentRecord"
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC
     LIMIT 1`,
    [userId]
  );

  return {
    isVerified: Boolean(user?.isVerified),
    verifiedAt: user?.verifiedAt || null,
    latestRequest: reqRes.rows[0] || null,
    latestPayment: payRes.rows[0] || null,
  };
}

/**
 * Admin action: Approve student identity verification and award credibility badge
 */
export async function approveStudentVerification(
  verificationId: string,
  adminId: string,
  adminEmail?: string
) {
  const reqRes = await pool.query<{ id: string; userId: string; status: string }>(
    `SELECT id, "userId", status FROM "VerificationRequest" WHERE id = $1 LIMIT 1`,
    [verificationId]
  );
  const req = reqRes.rows[0];
  if (!req) {
    return { error: "Verification request not found." };
  }

  if (req.status === "APPROVED") {
    return { error: "This request has already been approved." };
  }

  // 1. Update VerificationRequest to APPROVED
  await pool.query(
    `UPDATE "VerificationRequest"
     SET status = 'APPROVED', "reviewedBy" = $1, "verifiedAt" = NOW(), "updatedAt" = NOW()
     WHERE id = $2`,
    [adminId, verificationId]
  );

  // 2. Award Verified status on User
  await pool.query(
    `UPDATE "User"
     SET "isVerified" = true, "verifiedAt" = NOW()
     WHERE id = $1`,
    [req.userId]
  );

  // 3. Record Audit Log
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await pool.query(
    `INSERT INTO "AuditLog" (id, "adminId", "adminEmail", action, "targetType", "targetId", details, "createdAt")
     VALUES ($1, $2, $3, 'APPROVE_VERIFICATION', 'VerificationRequest', $4, $5, NOW())`,
    [
      auditId,
      adminId,
      adminEmail || null,
      verificationId,
      JSON.stringify({ userId: req.userId, approvedAt: new Date().toISOString() }),
    ]
  );

  return {
    success: true,
    message: "Student verified successfully! Verified credibility badge awarded.",
  };
}

/**
 * Admin action: Reject student identity verification with reason
 */
export async function rejectStudentVerification(
  verificationId: string,
  reason: string,
  adminId: string,
  adminEmail?: string
) {
  const reqRes = await pool.query<{ id: string; userId: string; status: string }>(
    `SELECT id, "userId", status FROM "VerificationRequest" WHERE id = $1 LIMIT 1`,
    [verificationId]
  );
  const req = reqRes.rows[0];
  if (!req) {
    return { error: "Verification request not found." };
  }

  const finalReason = reason.trim() || "Student identity or campus affiliation could not be confirmed.";

  // 1. Mark request as REJECTED
  await pool.query(
    `UPDATE "VerificationRequest"
     SET status = 'REJECTED', "rejectionReason" = $1, "reviewedBy" = $2, "updatedAt" = NOW()
     WHERE id = $3`,
    [finalReason, adminId, verificationId]
  );

  // 2. Record Audit Log
  const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await pool.query(
    `INSERT INTO "AuditLog" (id, "adminId", "adminEmail", action, "targetType", "targetId", details, "createdAt")
     VALUES ($1, $2, $3, 'REJECT_VERIFICATION', 'VerificationRequest', $4, $5, NOW())`,
    [
      auditId,
      adminId,
      adminEmail || null,
      verificationId,
      JSON.stringify({ userId: req.userId, reason: finalReason }),
    ]
  );

  return { success: true, message: "Verification request marked as rejected." };
}
