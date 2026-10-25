"use client";

import Link from "next/link";
import { useState, useTransition, useActionState } from "react";
import { login } from "@/server/actions";
import { requestOtp, loginWithEmailOtp } from "@/server/otp-actions";
import { OtpInput } from "@/app/components/otp-input";
import {
  LogIn,
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Home,
  KeyRound,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"OTP" | "PASSWORD">("OTP");

  // State for Email OTP mode
  const [emailForOtp, setEmailForOtp] = useState("demotests403@gmail.com");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isPendingOtp, startOtpTransition] = useTransition();

  // State for standard Password mode
  const [passwordState, passwordFormAction, isPendingPassword] = useActionState(
    login,
    undefined
  );

  function handleSendOtp() {
    setOtpError("");
    startOtpTransition(async () => {
      const res = await requestOtp(emailForOtp, "LOGIN");
      if (res.error) {
        setOtpError(res.error);
      } else {
        setOtpSent(true);
      }
    });
  }

  function handleVerifyOtp(explicitCode?: string) {
    const codeToVerify = (typeof explicitCode === "string" ? explicitCode : otpCode).trim();
    if (codeToVerify.length !== 6) {
      setOtpError("Please fill all 6 boxes before verifying.");
      return;
    }

    setOtpError("");
    startOtpTransition(async () => {
      const res = await loginWithEmailOtp(emailForOtp, codeToVerify);
      if (res?.error) {
        setOtpError(res.error);
      }
    });
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4">
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
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to Local Loop
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Secure peer-to-peer campus marketplace authentication
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("OTP");
              setOtpError("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              authMode === "OTP"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email OTP (Nodemailer)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("PASSWORD");
              setOtpError("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              authMode === "PASSWORD"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Password
          </button>
        </div>

        {/* ── Mode 1: Email OTP Authentication with Nodemailer ── */}
        {authMode === "OTP" ? (
          <div className="space-y-4">
            {otpError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Registered Campus Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={emailForOtp}
                      onChange={(e) => setEmailForOtp(e.target.value)}
                      required
                      placeholder="student@iitb.ac.in"
                      className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isPendingOtp || !emailForOtp}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isPendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Verification Email...
                    </>
                  ) : (
                    <>
                      Send 6-Digit Email Code
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-foreground">
                      Enter 6-Digit Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-primary hover:underline"
                    >
                      Change Email
                    </button>
                  </div>

                  {/* 6 Individual Digit Boxes */}
                  <OtpInput
                    length={6}
                    value={otpCode}
                    onChange={(val) => {
                      setOtpCode(val);
                      if (otpError) setOtpError("");
                    }}
                    onComplete={(code) => handleVerifyOtp(code)}
                    onEnterPress={() => handleVerifyOtp()}
                    disabled={isPendingOtp}
                    hasError={!!otpError}
                    autoFocus={true}
                  />

                  <p className="text-[11px] text-muted-foreground text-center">
                    Code sent to <strong className="text-foreground">{emailForOtp}</strong>. Valid for 10 minutes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isPendingOtp}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isPendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      Verify Email & Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isPendingOtp}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Didn&apos;t receive code? Resend email
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Mode 2: Standard Password Authentication ── */
          <form action={passwordFormAction} className="space-y-4">
            {passwordState?.error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
                {passwordState.error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Campus Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue="aarav@iitb.ac.in"
                  placeholder="student@iitb.ac.in"
                  className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  name="password"
                  required
                  defaultValue="password123"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPendingPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPendingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In with Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Create an account with Campus Email
          </Link>
        </div>

        <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" /> Active Campus Accounts:
          </p>
          <p>
            Your Verified Email: <code className="text-primary font-mono font-medium">demotests403@gmail.com</code>
          </p>
          <p>
            IIT Bombay: <code className="text-primary font-mono font-medium">aarav@iitb.ac.in</code>
          </p>
          <p>
            IIT Delhi: <code className="text-primary font-mono font-medium">priya@iitd.ac.in</code>
          </p>
          <p className="text-[11px] text-muted-foreground">
            All accounts support password (<code className="font-mono">password123</code>) or live Nodemailer Email OTP!
          </p>
        </div>
      </div>
    </div>
  );
}
