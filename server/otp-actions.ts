"use server";

import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { sendOtpEmail } from "@/lib/mail";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOtp(email: string, purpose: "LOGIN" | "REGISTER" = "LOGIN") {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (purpose === "LOGIN" && !existingUser) {
    return { error: "No account found with this email. Please register first." };
  }

  if (purpose === "REGISTER" && existingUser) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  // Generate 6-digit code
  const code = generate6DigitOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Clean old tokens for this email
  await prisma.otpToken.deleteMany({
    where: { email: normalizedEmail },
  });

  // Store new OTP
  await prisma.otpToken.create({
    data: {
      email: normalizedEmail,
      code,
      expiresAt,
    },
  });

  // Send email via Nodemailer
  const mailResult = await sendOtpEmail({
    to: normalizedEmail,
    code,
    purpose: purpose === "LOGIN" ? "Sign In" : "Campus Registration",
  });

  if (!mailResult.success) {
    return {
      error:
        mailResult.error || "Failed to send verification email. Please try again.",
    };
  }

  return {
    success: true,
    email: normalizedEmail,
    message: "A 6-digit verification code has been sent to your email.",
  };
}

export async function loginWithEmailOtp(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!trimmedCode || trimmedCode.length !== 6) {
    return { error: "Please enter a valid 6-digit verification code." };
  }

  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      email: normalizedEmail,
      code: trimmedCode,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpRecord) {
    return { error: "Invalid or expired verification code. Please request a new one." };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { error: "Account not found." };
  }

  // Consume OTP
  await prisma.otpToken.delete({ where: { id: otpRecord.id } });

  // Update emailVerified
  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  await createSession(user.id);
  redirect("/");
}

export async function registerWithEmailOtp(
  formData: {
    name: string;
    email: string;
    password: string;
    campusId: string;
    dormZone?: string;
  },
  code: string
) {
  const normalizedEmail = formData.email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!trimmedCode || trimmedCode.length !== 6) {
    return { error: "Please enter the 6-digit code sent to your email." };
  }

  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      email: normalizedEmail,
      code: trimmedCode,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpRecord) {
    return { error: "Invalid or expired verification code." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.name,
    email: normalizedEmail,
    password: formData.password,
    campusId: formData.campusId,
    dormZone: formData.dormZone || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  const newUser = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: normalizedEmail,
      password: hashedPassword,
      campusId: parsed.data.campusId,
      dormZone: parsed.data.dormZone,
      emailVerified: true,
    },
  });

  // Consume OTP
  await prisma.otpToken.delete({ where: { id: otpRecord.id } });

  await createSession(newUser.id);
  redirect("/");
}
