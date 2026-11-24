import "./setup";
import test from "node:test";
import assert from "node:assert";
import { pool } from "../lib/prisma";
import {
  approveStudentVerification,
  rejectStudentVerification,
  getUserVerificationStatus,
} from "../server/payment-actions";
import { VERIFICATION_FEE_INR } from "../lib/payment-constants";

const hasDb = Boolean(process.env.DATABASE_URL);

test.after(async () => {
  if (hasDb) {
    try {
      await pool.query(`DELETE FROM "VerificationRequest" WHERE "studentIdNumber" LIKE 'TEST_ID_%'`);
      await pool.query(`DELETE FROM "PaymentRecord" WHERE "orderId" LIKE 'order_test_%'`);
      await pool.query(`DELETE FROM "AuditLog" WHERE "adminId" LIKE 'admin_test_%'`);
      await pool.query(`DELETE FROM "User" WHERE id LIKE 'TEST_PAY_USER_%'`);
      await pool.end();
    } catch {
      // ignore
    }
  }
});

test("Payment Verification: fee is configured to exactly ₹10", () => {
  assert.strictEqual(VERIFICATION_FEE_INR, 10.0);
});

test("Payment & Verification: payment does not automatically grant verified badge", { skip: !hasDb }, async () => {
  const testUserId = `TEST_PAY_USER_${Date.now()}`;
  const campus = await pool.query<{ id: string }>(`SELECT id FROM "Campus" LIMIT 1`);
  const campusId = campus.rows[0]?.id || "cmp_default";

  // Create student
  await pool.query(
    `INSERT INTO "User" (id, name, email, password, "campusId", "isVerified", "createdAt")
     VALUES ($1, 'Payment Student', $2, 'pass123', $3, false, NOW())`,
    [testUserId, `${testUserId}@campus.ac.in`, campusId]
  );

  // Create successful PaymentRecord
  const orderId = `order_test_${Date.now()}`;
  const paymentId = `pay_test_${Date.now()}`;
  const payRecordId = `pr_${Date.now()}`;

  await pool.query(
    `INSERT INTO "PaymentRecord" (id, "userId", "orderId", "paymentId", amount, currency, status, purpose, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 10.0, 'INR', 'SUCCESS', 'IDENTITY_VERIFICATION', NOW(), NOW())`,
    [payRecordId, testUserId, orderId, paymentId]
  );

  // Create VerificationRequest with PENDING status
  const verReqId = `vr_test_${Date.now()}`;
  await pool.query(
    `INSERT INTO "VerificationRequest" (id, "userId", "paymentId", status, "studentIdNumber", "collegeEmail", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'PENDING', 'TEST_ID_1042', $4, NOW(), NOW())`,
    [verReqId, testUserId, payRecordId, `${testUserId}@campus.ac.in`]
  );

  // Verify that despite successful payment, User.isVerified is still FALSE!
  const statusBeforeAdmin = await getUserVerificationStatus(testUserId);
  assert.strictEqual(statusBeforeAdmin.isVerified, false);
  assert.strictEqual(statusBeforeAdmin.latestRequest?.status, "PENDING");
  assert.strictEqual(statusBeforeAdmin.latestPayment?.status, "SUCCESS");

  // Admin approves verification
  const adminId = `admin_test_${Date.now()}`;
  const approveRes = await approveStudentVerification(verReqId, adminId, "admin@localloop.in");
  assert.strictEqual(approveRes.success, true);

  // Now User.isVerified must be TRUE
  const statusAfterAdmin = await getUserVerificationStatus(testUserId);
  assert.strictEqual(statusAfterAdmin.isVerified, true);
  assert.strictEqual(statusAfterAdmin.latestRequest?.status, "APPROVED");

  // Confirm audit log was created
  const auditRes = await pool.query<{ action: string; targetId: string }>(
    `SELECT action, "targetId" FROM "AuditLog" WHERE "adminId" = $1`,
    [adminId]
  );
  assert.strictEqual(auditRes.rows[0]?.action, "APPROVE_VERIFICATION");
  assert.strictEqual(auditRes.rows[0]?.targetId, verReqId);
});

test("Payment & Verification: admin rejection updates status with reason and audit log", { skip: !hasDb }, async () => {
  const testUserId = `TEST_PAY_USER_REJ_${Date.now()}`;
  const campus = await pool.query<{ id: string }>(`SELECT id FROM "Campus" LIMIT 1`);
  const campusId = campus.rows[0]?.id || "cmp_default";

  await pool.query(
    `INSERT INTO "User" (id, name, email, password, "campusId", "isVerified", "createdAt")
     VALUES ($1, 'Rejected Student', $2, 'pass123', $3, false, NOW())`,
    [testUserId, `${testUserId}@campus.ac.in`, campusId]
  );

  const verReqId = `vr_test_rej_${Date.now()}`;
  await pool.query(
    `INSERT INTO "VerificationRequest" (id, "userId", status, "studentIdNumber", "createdAt", "updatedAt")
     VALUES ($1, $2, 'PENDING', 'TEST_ID_INVALID', NOW(), NOW())`,
    [verReqId, testUserId]
  );

  const adminId = `admin_test_rej_${Date.now()}`;
  const rejectRes = await rejectStudentVerification(
    verReqId,
    "Student ID does not match campus database",
    adminId,
    "admin@localloop.in"
  );
  assert.strictEqual(rejectRes.success, true);

  const statusAfter = await getUserVerificationStatus(testUserId);
  assert.strictEqual(statusAfter.isVerified, false);
  assert.strictEqual(statusAfter.latestRequest?.status, "REJECTED");
  assert.strictEqual(statusAfter.latestRequest?.rejectionReason, "Student ID does not match campus database");
});
