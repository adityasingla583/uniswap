"use client";

import { useState, useTransition } from "react";
import {
  createVerificationPaymentOrder,
  verifyPaymentAndSubmitVerification,
} from "@/server/payment-actions";
import { upgradeUserToPremium, UserMessageQuota } from "@/server/freemium-actions";
import { RequestCampusModal } from "@/app/components/request-campus-modal";
import {
  User,
  School,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  PlusCircle,
  Award,
} from "lucide-react";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  premiumUntil: Date | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  campusId: string;
  campusName: string | null;
  dormZone: string | null;
  createdAt: Date;
}

interface VerificationData {
  isVerified: boolean;
  verifiedAt: Date | null;
  latestRequest: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    studentIdNumber: string | null;
    collegeEmail: string | null;
    documentUrl: string | null;
    rejectionReason: string | null;
    createdAt: Date;
  } | null;
  latestPayment: {
    id: string;
    orderId: string;
    paymentId: string | null;
    amount: number;
    status: "PENDING" | "SUCCESS" | "FAILED";
    createdAt: Date;
  } | null;
}

interface CampusRequestSummary {
  id: string;
  name: string;
  status: string;
  website: string | null;
  createdAt: Date;
}

export function ProfileView({
  user,
  quota: initialQuota,
  verification: initialVerification,
  campusRequests,
}: {
  user: ProfileUser;
  quota: UserMessageQuota;
  verification: VerificationData;
  campusRequests: CampusRequestSummary[];
}) {
  const [quota, setQuota] = useState(initialQuota);
  const [verification, setVerification] = useState(initialVerification);
  const [isPending, startTransition] = useTransition();

  // Verification step state
  const [verificationStep, setVerificationStep] = useState<"IDLE" | "DETAILS" | "SUCCESS">("IDLE");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>("");
  const [confirmedPaymentId, setConfirmedPaymentId] = useState<string>("");

  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  // Campus modal
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  // Upgrade to Premium
  async function handleUpgradePremium() {
    setPaymentError("");
    setPaymentSuccess("");

    startTransition(async () => {
      const res = await upgradeUserToPremium(user.id, 30);
      if (res.success) {
        setPaymentSuccess(res.message);
        setQuota({
          isPremium: true,
          used: 0,
          limit: 999999,
          remaining: 999999,
          date: quota.date,
        });
      }
    });
  }

  // Verification Payment Initiation
  function handleInitiateVerification() {
    setPaymentError("");
    setPaymentSuccess("");

    startTransition(async () => {
      const orderRes = await createVerificationPaymentOrder();
      if (orderRes.error) {
        setPaymentError(orderRes.message || orderRes.error);
        return;
      }

      if (orderRes.alreadyPaid && orderRes.orderId) {
        setConfirmedOrderId(orderRes.orderId);
        setConfirmedPaymentId(`pay_reused_${Date.now()}`);
        setVerificationStep("DETAILS");
        setPaymentSuccess("Existing payment found! Please complete your student details below.");
        return;
      }

      if (!orderRes.orderId) {
        setPaymentError("Could not generate verification order.");
        return;
      }

      const orderId = orderRes.orderId;

      // Check if Razorpay script is present
      if (typeof window !== "undefined" && (window as unknown as { Razorpay: unknown }).Razorpay) {
        const RazorpayClass = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
        const rzp = new RazorpayClass({
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: "INR",
          name: "Local Loop Campus",
          description: "One-time Student Identity Verification Fee (₹10)",
          order_id: orderId,
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || "",
          },
          theme: {
            color: "#059669",
          },
          handler: function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            setConfirmedOrderId(response.razorpay_order_id);
            setConfirmedPaymentId(response.razorpay_payment_id);
            setVerificationStep("DETAILS");
            setPaymentSuccess("Payment of ₹10 successful! Please enter your college details to complete verification.");
          },
        });
        rzp.open();
      } else {
        // Development / Sandbox direct simulation mode
        const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setConfirmedOrderId(orderId);
        setConfirmedPaymentId(simPaymentId);
        setVerificationStep("DETAILS");
        setPaymentSuccess("₹10 verification fee initialized! Please submit your student enrollment details below.");
      }
    });
  }

  // Submit Student Details
  function handleSubmitVerificationDetails(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError("");
    setPaymentSuccess("");

    if (!studentIdNumber.trim()) {
      setPaymentError("Please provide your College Student Roll / ID number.");
      return;
    }

    startTransition(async () => {
      const res = await verifyPaymentAndSubmitVerification({
        orderId: confirmedOrderId,
        paymentId: confirmedPaymentId,
        studentIdNumber,
        collegeEmail: collegeEmail || undefined,
        documentUrl: documentUrl || undefined,
      });

      if (res.error) {
        setPaymentError(res.message || res.error);
      } else if (res.success) {
        setVerificationStep("SUCCESS");
        setPaymentSuccess(res.message || "Verification request submitted successfully!");
        setVerification({
          isVerified: false,
          verifiedAt: null,
          latestRequest: {
            id: res.verificationId || "vr_new",
            status: "PENDING",
            studentIdNumber,
            collegeEmail: collegeEmail || null,
            documentUrl: documentUrl || null,
            rejectionReason: null,
            createdAt: new Date(),
          },
          latestPayment: {
            id: "pay_new",
            orderId: confirmedOrderId,
            paymentId: confirmedPaymentId,
            amount: 10,
            status: "SUCCESS",
            createdAt: new Date(),
          },
        });
      }
    });
  }

  const usagePercent = Math.min(100, Math.round((quota.used / quota.limit) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-0">
      {/* ── Page Header & Profile Card ── */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shrink-0 shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-foreground">{user.name}</h1>

                {/* Verified Credibility Badge */}
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5 fill-blue-500/20" />
                    Verified Student
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    Unverified Student
                  </span>
                )}

                {/* Premium Member Badge */}
                {quota.isPremium && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium ✨
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-primary" />
                <span>{user.campusName || "No campus set"}</span>
                {user.dormZone && <span>• Dorm: {user.dormZone}</span>}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground sm:text-right">
            <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
            {user.isAdmin && (
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                ★ Platform Owner / Admin
              </div>
            )}
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{user.phone || "No phone linked"}</span>
            {user.phoneVerified && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                Anti-Sybil SMS Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {paymentError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between">
          <span>{paymentError}</span>
          <button onClick={() => setPaymentError("")} className="font-bold ml-2">×</button>
        </div>
      )}

      {paymentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
          <span>{paymentSuccess}</span>
          <button onClick={() => setPaymentSuccess("")} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* ── MODULE 2: GET VERIFIED (PAID IDENTITY VERIFICATION) ── */}
      <div id="verification" className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Campus Credibility & Student Verification</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Verify your physical campus enrollment with a one-time ₹10 verification request fee to unlock the blue Verified Student badge.
            </p>
          </div>

          {/* Status Badge */}
          {user.isVerified ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Active
            </span>
          ) : verification.latestRequest?.status === "PENDING" ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center gap-1 border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" /> Under Review
            </span>
          ) : verification.latestRequest?.status === "REJECTED" ? (
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 font-bold text-xs flex items-center gap-1 border border-rose-500/20">
              <AlertCircle className="h-3.5 w-3.5" /> Rejected
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground font-semibold text-xs">
              Not Requested
            </span>
          )}
        </div>

        {/* Case A: Already Verified */}
        {user.isVerified ? (
          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
              <Award className="h-5 w-5" />
              <span>You are an officially verified student of {user.campusName}!</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your verified credibility checkmark is active and displayed on all your listings, chat headers, and user profile to guarantee authentic student trades.
            </p>
            {user.verifiedAt && (
              <span className="text-[11px] text-muted-foreground">
                Verified on {new Date(user.verifiedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        ) : verification.latestRequest?.status === "PENDING" ? (
          /* Case B: Pending Review */
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Clock className="h-4 w-4" />
              <span>Verification Under Review by Campus Admin</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your ₹10 verification payment has been confirmed. Our administrative team is verifying your submitted student ID (
              <strong>{verification.latestRequest.studentIdNumber || "On record"}</strong>) and campus affiliation. Your badge will appear as soon as confirmed!
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Submitted: {new Date(verification.latestRequest.createdAt).toLocaleDateString()}</span>
              {verification.latestPayment && (
                <span className="text-emerald-600 font-bold">
                  Payment Status: PAID ₹{verification.latestPayment.amount}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Case C: Rejection Notice or Get Verified Flow */
          <div className="space-y-4">
            {verification.latestRequest?.status === "REJECTED" && (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs space-y-1 text-rose-700 dark:text-rose-300">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Previous Verification Request Rejected
                </span>
                <p>
                  Reason: {verification.latestRequest.rejectionReason || "Details could not be confirmed."}
                </p>
                <p className="text-[11px] opacity-80">You can submit corrected details below.</p>
              </div>
            )}

            {verificationStep === "IDLE" && (
              <div className="p-5 rounded-2xl bg-surface/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Get Verified Campus Badge</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold">
                      One-time ₹10 Fee
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Prevent impersonation and build instant trust with fellow students. Covers manual ID card verification and campus directory cross-checks.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleInitiateVerification}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-xs disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  <span>Pay ₹10 & Request Verification</span>
                </button>
              </div>
            )}

            {/* Step 2: Verification Details Form */}
            {(verificationStep === "DETAILS" || verificationStep === "SUCCESS") && (
              <form onSubmit={handleSubmitVerificationDetails} className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Submit Campus Identity Proof</h3>
                  <span className="text-xs font-semibold text-emerald-600">
                    Payment Confirmed (₹10)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">
                      Student Roll / Enrollment ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentIdNumber}
                      onChange={(e) => setStudentIdNumber(e.target.value)}
                      placeholder="e.g. 2023KUCP1042"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">
                      Official College Email (e.g. @iiitkota.ac.in)
                    </label>
                    <input
                      type="email"
                      value={collegeEmail}
                      onChange={(e) => setCollegeEmail(e.target.value)}
                      placeholder="e.g. student@campus.ac.in"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-foreground">
                      College ID Card Photo Link or Drive URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/... or image link"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setVerificationStep("IDLE")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    <span>Submit Verification for Admin Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── MODULE 1: FREEMIUM MESSAGING & SUBSCRIPTION STATUS ── */}
      <div id="premium" className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Messaging Quota & Premium Tier</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Free student accounts can send up to 100 messages per day. Premium members unlock unlimited negotiations and real-time chat.
            </p>
          </div>

          {quota.isPremium ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs border border-amber-500/20">
              Unlimited ✨
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-muted text-foreground font-bold text-xs">
              Free Tier
            </span>
          )}
        </div>

        {/* Quota Progress Bar */}
        <div className="p-5 rounded-2xl bg-surface/50 border border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">
              Daily Message Usage: {quota.used} / {quota.limit}
            </span>
            <span className={quota.remaining <= 10 && !quota.isPremium ? "text-rose-500 font-bold" : "text-muted-foreground"}>
              {quota.isPremium ? "Unlimited remaining" : `${quota.remaining} remaining today`}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                quota.isPremium
                  ? "bg-amber-500 w-full"
                  : usagePercent >= 90
                  ? "bg-rose-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: quota.isPremium ? "100%" : `${usagePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Counter resets automatically every midnight. Only successfully delivered outgoing messages count towards the daily limit.
          </p>
        </div>

        {/* Premium Upgrade Option */}
        {!quota.isPremium && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-card border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold text-foreground">Local Loop Premium (₹49 / month)</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-md">
                Unlimited 1-on-1 chats, priority campus listing visibility, and higher buyer credibility badge.
              </p>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleUpgradePremium}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-xs disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              <span>Upgrade to Unlimited</span>
            </button>
          </div>
        )}
      </div>

      {/* ── MODULE 3 & 6: MY CAMPUS REGISTRATION REQUESTS ── */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">My Campus Registration Requests</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCampusModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5 text-primary" />
            <span>Register New Campus</span>
          </button>
        </div>

        {campusRequests.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            You haven't requested any custom campus registrations. If your institute is missing from the list, click "Register New Campus" to submit it.
          </p>
        ) : (
          <div className="space-y-2">
            {campusRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl border border-border bg-surface/50 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-foreground">{req.name}</h4>
                  <span className="text-[11px] text-muted-foreground">
                    Submitted {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                    req.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : req.status === "REJECTED"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campus Registration Modal */}
      <RequestCampusModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
      />
    </div>
  );
}
