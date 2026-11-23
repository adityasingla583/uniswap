"use server";

import { prisma, pool } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/sms";
import { registerSchema } from "@/lib/validations";
import { sendSmsOtp } from "@/lib/sms";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Initiates SMS-based Phone Verification for onboarding
 * Strictly enforces Anti-Sybil (one-account-per-phone-number) policy
 */
export async function requestPhoneOtp(
  phone: string,
  emailCheck?: string
) {
  const norm = normalizePhoneNumber(phone);
  if (!norm.isValid || !norm.cleanPhone) {
    return { error: norm.error || "Please enter a valid 10-digit mobile number." };
  }

  // 1. Strict Anti-Sybil Check: Ensure no other user already owns this phone number
  let existingPhoneUser: { id: string; email: string } | null = null;
  try {
    existingPhoneUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: norm.cleanPhone },
          { phone: norm.e164Phone },
        ],
      },
      select: { id: true, email: true },
    });
  } catch {
    // Direct Postgres fallback if dev server has not restarted memory cache
    const res = await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM "User" WHERE phone = $1 OR phone = $2 LIMIT 1`,
      [norm.cleanPhone, norm.e164Phone]
    );
    existingPhoneUser = res.rows[0] || null;
  }

  if (existingPhoneUser) {
    return {
      error:
        "This mobile number is already linked to another campus account. To prevent Sybil accounts and maintain marketplace trust, each student is strictly limited to one account per phone number.",
    };
  }

  // 2. Also check if the college email is already taken
  if (emailCheck) {
    const normalizedEmail = emailCheck.trim().toLowerCase();
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingEmail) {
      return {
        error: "An account with this college email already exists. Please sign in instead.",
      };
    }
  }

  // 3. Generate 6-Digit OTP code
  const code = generate6DigitOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store new Phone OTP (with direct DB resilience)
  try {
    await prisma.phoneOtpToken.deleteMany({
      where: { phone: norm.cleanPhone },
    });
    await prisma.phoneOtpToken.create({
      data: {
        phone: norm.cleanPhone,
        code,
        expiresAt,
      },
    });
  } catch {
    await pool.query(`DELETE FROM "PhoneOtpToken" WHERE phone = $1`, [norm.cleanPhone]);
    const tokenId = `potp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await pool.query(
      `INSERT INTO "PhoneOtpToken" (id, phone, code, "expiresAt", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
      [tokenId, norm.cleanPhone, code, expiresAt]
    );
  }

  // 4. Send SMS
  const smsResult = await sendSmsOtp({
    phone: norm.cleanPhone,
    code,
    purpose: "Anti-Sybil Phone Verification",
  });

  if (!smsResult.success) {
    return { error: smsResult.error || "Failed to dispatch SMS code. Please try again." };
  }

  return {
    success: true,
    cleanPhone: norm.cleanPhone,
    formattedPhone: norm.formatted,
    devCode: smsResult.devCode,
    message: `A 6-digit SMS verification code has been dispatched to ${norm.formatted}.`,
  };
}

/**
 * Completes Student Onboarding after SMS-based Phone Verification
 * Commits the unique phone number with phoneVerified: true
 */
export async function registerWithPhoneVerification(
  formData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    campusId: string;
    dormZone?: string;
  },
  code: string
) {
  const normPhone = normalizePhoneNumber(formData.phone);
  if (!normPhone.isValid || !normPhone.cleanPhone) {
    return { error: normPhone.error || "Invalid mobile number." };
  }

  const trimmedCode = code.trim();
  if (!trimmedCode || trimmedCode.length !== 6) {
    return { error: "Please enter the 6-digit SMS verification code." };
  }

  // 1. Verify SMS OTP in PhoneOtpToken table
  let otpRecord: { id: string } | null = null;
  try {
    otpRecord = await prisma.phoneOtpToken.findFirst({
      where: {
        phone: normPhone.cleanPhone,
        code: trimmedCode,
        expiresAt: { gt: new Date() },
      },
    });
  } catch {
    const res = await pool.query<{ id: string }>(
      `SELECT id FROM "PhoneOtpToken" WHERE phone = $1 AND code = $2 AND "expiresAt" > NOW() LIMIT 1`,
      [normPhone.cleanPhone, trimmedCode]
    );
    otpRecord = res.rows[0] || null;
  }

  if (!otpRecord) {
    return { error: "Invalid or expired SMS code. Please request a new verification code." };
  }

  // 2. Validate input schema
  const normalizedEmail = formData.email.trim().toLowerCase();
  const parsed = registerSchema.safeParse({
    name: formData.name,
    email: normalizedEmail,
    phone: normPhone.cleanPhone,
    password: formData.password,
    campusId: formData.campusId,
    dormZone: formData.dormZone || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed." };
  }

  // 3. Concurrency check for Anti-Sybil One-Account-Per-Phone policy
  let existingPhone: { id: string } | null = null;
  try {
    existingPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normPhone.cleanPhone },
          { phone: normPhone.e164Phone },
        ],
      },
    });
  } catch {
    const res = await pool.query<{ id: string }>(
      `SELECT id FROM "User" WHERE phone = $1 OR phone = $2 LIMIT 1`,
      [normPhone.cleanPhone, normPhone.e164Phone]
    );
    existingPhone = res.rows[0] || null;
  }

  if (existingPhone) {
    return {
      error:
        "This mobile number is already registered to an account. Strictly one account per mobile number.",
    };
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingEmail) {
    return { error: "An account with this university email already exists." };
  }

  // 4. Create verified user account
  const hashedPassword = await hash(parsed.data.password, 12);
  const isAdmin = normalizedEmail === "adityasingla03583@gmail.com";
  let newUserId = "";

  try {
    const newUser = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: normalizedEmail,
        phone: normPhone.cleanPhone,
        phoneVerified: true,
        emailVerified: true,
        isAdmin,
        password: hashedPassword,
        campusId: parsed.data.campusId,
        dormZone: parsed.data.dormZone,
      },
    });
    newUserId = newUser.id;
  } catch {
    newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await pool.query(
      `INSERT INTO "User" (id, name, email, phone, "phoneVerified", "emailVerified", "isAdmin", password, "campusId", "dormZone", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, true, $5, $6, $7, $8, NOW(), NOW())`,
      [
        newUserId,
        parsed.data.name,
        normalizedEmail,
        normPhone.cleanPhone,
        isAdmin,
        hashedPassword,
        parsed.data.campusId,
        parsed.data.dormZone || null,
      ]
    );
  }

  // 5. Delete used OTP token
  try {
    await prisma.phoneOtpToken.deleteMany({
      where: { phone: normPhone.cleanPhone },
    });
  } catch {
    await pool.query(`DELETE FROM "PhoneOtpToken" WHERE phone = $1`, [normPhone.cleanPhone]);
  }

  // 6. Establish session cookie
  await createSession(newUserId);
  redirect("/");
}
