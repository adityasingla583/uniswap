"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestOtp, registerWithEmailOtp } from "@/server/otp-actions";
import { OtpInput } from "@/app/components/otp-input";
import {
  UserPlus,
  Lock,
  Mail,
  User,
  Home,
  Loader2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { CampusCombobox } from "@/app/components/campus-combobox";

type Campus = { id: string; name: string };

export function RegisterForm({ campuses }: { campuses: Campus[] }) {
  const [step, setStep] = useState<"DETAILS" | "OTP">("DETAILS");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dormZone, setDormZone] = useState("");
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid university email address.");
      return;
    }
    if (!selectedCampusId) {
      setErrorMessage("Please select your college/institute campus.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const res = await requestOtp(email, "REGISTER");
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setStep("OTP");
      }
    });
  }

  function handleCompleteRegistration(explicitCode?: string) {
    const codeToVerify = (typeof explicitCode === "string" ? explicitCode : otpCode).trim();
    if (codeToVerify.length !== 6) {
      setErrorMessage("Please fill all 6 boxes before completing registration.");
      return;
    }

    setErrorMessage("");
    startTransition(async () => {
      const res = await registerWithEmailOtp(
        {
          name,
          email,
          password,
          campusId: selectedCampusId,
          dormZone: dormZone.trim() || undefined,
        },
        codeToVerify
      );

      if (res?.error) {
        setErrorMessage(res.error);
      }
    });
  }

  function handleResendOtp() {
    setErrorMessage("");
    startTransition(async () => {
      const res = await requestOtp(email, "REGISTER");
      if (res.error) {
        setErrorMessage(res.error);
      }
    });
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center py-12 px-4">
      {/* Home link button */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home Feed
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Join Local Loop
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {step === "DETAILS"
              ? "Sign up with your campus email to buy, sell & exchange locally"
              : `Verify your college email (${email}) to activate account`}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {step === "DETAILS" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                College / University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@iitb.ac.in or college.edu"
                  className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Searchable Institute Combobox (Only shown at registration) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Select Your Indian Institute
              </label>
              <CampusCombobox
                campuses={campuses}
                value={selectedCampusId}
                onChange={setSelectedCampusId}
                placeholder="Search all JoSAA IITs, NITs, IIITs, GFTIs (198+ campuses)..."
              />
              <p className="text-[11px] text-muted-foreground">
                Your campus locks your primary feed to hyper-local items.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Hostel / Dorm Zone (Optional)
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={dormZone}
                  onChange={(e) => setDormZone(e.target.value)}
                  placeholder="e.g. Hostel 14, Kailash, Hall 3, PG North"
                  className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Nodemailer Verification Code...
                </>
              ) : (
                <>
                  Verify Email & Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Email OTP Verification */
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground">
                  Enter 6-Digit Email Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("DETAILS")}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <ArrowLeft className="h-3 w-3" /> Edit Info
                </button>
              </div>

              {/* 6 Individual Digit Boxes */}
              <OtpInput
                length={6}
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val);
                  if (errorMessage) setErrorMessage("");
                }}
                onComplete={(code) => handleCompleteRegistration(code)}
                onEnterPress={() => handleCompleteRegistration()}
                disabled={isPending}
                hasError={!!errorMessage}
                autoFocus={true}
              />

              <p className="text-[11px] text-muted-foreground text-center">
                We sent a 6-digit verification code to{" "}
                <strong className="text-foreground">{email}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCompleteRegistration()}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Verified Account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Didn&apos;t receive code? Resend email
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
