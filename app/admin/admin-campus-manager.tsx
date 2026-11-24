"use client";

import { useState, useTransition } from "react";
import {
  approveCampusRequest,
  rejectCampusRequest,
  submitCampusRequest,
  mergeCampuses,
  CampusRequestRecord,
  StudentVerificationItem,
  AuditLogItem,
} from "@/server/campus-actions";
import { triggerAiVerificationForRequest } from "@/server/ai-verification";
import {
  approveStudentVerification,
  rejectStudentVerification,
} from "@/server/payment-actions";
import {
  School,
  CheckCircle2,
  XCircle,
  MapPin,
  Globe,
  Mail,
  User,
  Phone,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Plus,
  Search,
  Sparkles,
  ShieldCheck,
  CreditCard,
  History,
  GitMerge,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ActiveCampus = {
  id: string;
  name: string;
  domain: string | null;
  aliases: string[];
  userCount: number;
  listingCount: number;
};

export function AdminCampusManager({
  initialRequests,
  initialVerifications,
  initialAuditLogs,
  initialCampuses,
  adminUser,
}: {
  initialRequests: CampusRequestRecord[];
  initialVerifications: StudentVerificationItem[];
  initialAuditLogs: AuditLogItem[];
  initialCampuses: ActiveCampus[];
  adminUser: { id: string; email: string };
}) {
  const [activeTab, setActiveTab] = useState<
    "CAMPUSES" | "VERIFICATIONS" | "MERGE" | "AUDIT" | "MANUAL_ADD"
  >("CAMPUSES");

  // Requests filter state
  const [requestStatusFilter, setRequestStatusFilter] = useState<
    "ALL" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
  >("ALL");

  const [requests, setRequests] = useState<CampusRequestRecord[]>(initialRequests);
  const [verifications, setVerifications] = useState<StudentVerificationItem[]>(initialVerifications);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [campuses, setCampuses] = useState<ActiveCampus[]>(initialCampuses);

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  // Loading AI per request
  const [runningAiId, setRunningAiId] = useState<string | null>(null);
  const [expandedAiId, setExpandedAiId] = useState<string | null>(null);

  // Edit coordinates inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  // Rejection modal
  const [rejectingCampusId, setRejectingCampusId] = useState<string | null>(null);
  const [rejectCampusReason, setRejectCampusReason] = useState("");

  const [rejectingVerificationId, setRejectingVerificationId] = useState<string | null>(null);
  const [rejectVerificationReason, setRejectVerificationReason] = useState("");

  // Merge campuses state
  const [sourceCampusId, setSourceCampusId] = useState("");
  const [targetCampusId, setTargetCampusId] = useState("");

  // Manual Add state
  const [manualName, setManualName] = useState("");
  const [manualWebsite, setManualWebsite] = useState("");
  const [manualType, setManualType] = useState("COLLEGE_UNIVERSITY");
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualDomain, setManualDomain] = useState("");

  // Filter requests list
  const filteredRequests = requests.filter((r) => {
    if (requestStatusFilter === "ALL") return true;
    return r.status === requestStatusFilter;
  });

  // ── Actions ──────────────────────────────────────────────────

  async function handleRunAiCheck(requestId: string) {
    setRunningAiId(requestId);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await triggerAiVerificationForRequest(requestId);
      if (res.error) {
        setActionError(`AI Verification failed: ${res.error}`);
      } else if (res.success && res.result) {
        setActionSuccess(`AI Check complete: Recommendation is ${res.result.recommendation} (${res.result.confidence}% confidence).`);
        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  aiRecommendation: res.result!.recommendation,
                  aiConfidence: res.result!.confidence,
                  aiReasoning: res.result!.reasoningSummary,
                  aiEvidence: JSON.stringify({
                    supportingEvidence: res.result!.supportingEvidence,
                    riskFactors: res.result!.riskFactors,
                    extractedDetails: res.result!.extractedDetails,
                  }),
                  aiCheckedAt: new Date(),
                  status:
                    r.status === "PENDING" && res.result!.recommendation === "MANUAL_REVIEW"
                      ? "UNDER_REVIEW"
                      : r.status,
                }
              : r
          )
        );
        setExpandedAiId(requestId);
      }
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setRunningAiId(null);
    }
  }

  function handleApproveCampus(req: CampusRequestRecord) {
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      const overrides =
        editingId === req.id
          ? {
              name: editName.trim() || undefined,
              latitude: editLat ? parseFloat(editLat) : undefined,
              longitude: editLng ? parseFloat(editLng) : undefined,
              domain: editDomain.trim() || undefined,
              website: editWebsite.trim() || undefined,
            }
          : undefined;

      const res = await approveCampusRequest(req.id, overrides);
      if (res.error) {
        setActionError(res.error);
      } else if (res.success) {
        setActionSuccess(res.message || "Institute confirmed and activated!");
        setRequests((prev) =>
          prev.map((item) => (item.id === req.id ? { ...item, status: "APPROVED" } : item))
        );
        setEditingId(null);
      }
    });
  }

  function handleRejectCampus() {
    if (!rejectingCampusId) return;
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      const res = await rejectCampusRequest(rejectingCampusId, rejectCampusReason);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess("Campus request marked as rejected.");
        setRequests((prev) =>
          prev.map((item) =>
            item.id === rejectingCampusId
              ? { ...item, status: "REJECTED", rejectionReason: rejectCampusReason }
              : item
          )
        );
        setRejectingCampusId(null);
        setRejectCampusReason("");
      }
    });
  }

  function handleApproveVerification(verificationId: string) {
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      const res = await approveStudentVerification(verificationId, adminUser.id, adminUser.email);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(res.message || "Student identity verified! Credibility badge awarded.");
        setVerifications((prev) =>
          prev.map((item) =>
            item.id === verificationId ? { ...item, status: "APPROVED" } : item
          )
        );
      }
    });
  }

  function handleRejectVerification() {
    if (!rejectingVerificationId) return;
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      const res = await rejectStudentVerification(
        rejectingVerificationId,
        rejectVerificationReason,
        adminUser.id,
        adminUser.email
      );
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess("Student verification request rejected.");
        setVerifications((prev) =>
          prev.map((item) =>
            item.id === rejectingVerificationId
              ? { ...item, status: "REJECTED", rejectionReason: rejectVerificationReason }
              : item
          )
        );
        setRejectingVerificationId(null);
        setRejectVerificationReason("");
      }
    });
  }

  function handleMergeCampuses() {
    if (!sourceCampusId || !targetCampusId) {
      setActionError("Please select both a source duplicate campus and a target canonical campus.");
      return;
    }
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      const res = await mergeCampuses(sourceCampusId, targetCampusId);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(res.message || "Campuses merged successfully!");
        // Update local campuses list
        setCampuses((prev) => prev.filter((c) => c.id !== sourceCampusId));
        setSourceCampusId("");
      }
    });
  }

  function handleManualCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim()) {
      setActionError("Please enter institute name.");
      return;
    }
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      const res = await submitCampusRequest({
        name: manualName,
        website: manualWebsite || undefined,
        institutionType: manualType,
        city: manualCity || undefined,
        state: manualState || undefined,
        domain: manualDomain || undefined,
        latitude: manualLat ? parseFloat(manualLat) : undefined,
        longitude: manualLng ? parseFloat(manualLng) : undefined,
        note: "Directly added by Administrator",
      });

      if (res.error) {
        setActionError(res.error);
      } else if (res.requestId) {
        // Automatically approve it since admin submitted it
        await approveCampusRequest(res.requestId);
        setActionSuccess(`"${manualName}" has been directly registered and activated!`);
        setManualName("");
        setManualWebsite("");
        setManualCity("");
        setManualState("");
        setManualDomain("");
        setActiveTab("CAMPUSES");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Status Alerts ── */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in-0 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="font-bold ml-2">×</button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in-0 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* ── Top Level Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("CAMPUSES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "CAMPUSES"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          <School className="h-4 w-4" />
          <span>Campus Requests</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-background/30 text-[10px]">
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("VERIFICATIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "VERIFICATIONS"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Paid Student Verifications</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-background/30 text-[10px]">
            {verifications.filter((v) => v.status === "PENDING").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("MERGE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "MERGE"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitMerge className="h-4 w-4 text-blue-400" />
          <span>Merge & Aliases</span>
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "AUDIT"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4 text-amber-400" />
          <span>Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab("MANUAL_ADD")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "MANUAL_ADD"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Direct Add Campus</span>
        </button>
      </div>

      {/* ── TAB 1: CAMPUS REQUESTS ── */}
      {activeTab === "CAMPUSES" && (
        <div className="space-y-4">
          {/* Sub-Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            {(["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setRequestStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                  requestStatusFilter === st
                    ? "bg-foreground text-background"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {st.replace("_", " ")} ({requests.filter((r) => st === "ALL" || r.status === st).length})
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border text-muted-foreground space-y-2">
              <School className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-sm font-semibold">No campus requests matching filter "{requestStatusFilter}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const parsedAi = req.aiEvidence ? JSON.parse(req.aiEvidence) : null;
                const isExpanded = expandedAiId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4"
                  >
                    {/* Top Row: Title, Status, and Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{req.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              req.status === "PENDING"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : req.status === "UNDER_REVIEW"
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                : req.status === "APPROVED"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {req.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          {req.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {req.city}{req.state ? `, ${req.state}` : ""}
                            </span>
                          )}
                          {req.website && (
                            <a
                              href={req.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              {req.website}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          {req.institutionType && (
                            <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-semibold">
                              {req.institutionType}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI Verification Badge & Re-run Button */}
                      <div className="flex items-center gap-2">
                        {req.aiRecommendation ? (
                          <div
                            onClick={() => setExpandedAiId(isExpanded ? null : req.id)}
                            className={`cursor-pointer px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                              req.aiRecommendation === "APPROVE"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                : req.aiRecommendation === "MANUAL_REVIEW"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>AI: {req.aiRecommendation.replace("_", " ")}</span>
                            <span className="opacity-75 text-[10px]">({req.aiConfidence}%)</span>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          disabled={runningAiId === req.id}
                          onClick={() => handleRunAiCheck(req.id)}
                          className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {runningAiId === req.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          <span>{req.aiRecommendation ? "Re-run AI" : "Run AI Check"}</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Findings Expandable Drawer */}
                    {isExpanded && req.aiRecommendation && (
                      <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs space-y-3 animate-in fade-in-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            Multi-Point AI Verification Analysis
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            Confidence Score: <strong>{req.aiConfidence}%</strong>
                          </span>
                        </div>

                        {req.aiReasoning && (
                          <p className="text-foreground leading-relaxed bg-surface/60 p-2.5 rounded-lg border border-border/50">
                            {req.aiReasoning}
                          </p>
                        )}

                        {parsedAi?.supportingEvidence && parsedAi.supportingEvidence.length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓ Verified Supporting Evidence:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground pl-1">
                              {parsedAi.supportingEvidence.map((ev: string, idx: number) => (
                                <li key={idx}>{ev}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {parsedAi?.riskFactors && parsedAi.riskFactors.length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-rose-500">
                              ⚠ Detected Risk Factors:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-rose-600 dark:text-rose-400 pl-1">
                              {parsedAi.riskFactors.map((rf: string, idx: number) => (
                                <li key={idx}>{rf}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requester Details */}
                    <div className="rounded-xl bg-surface/50 border border-border p-3 text-xs flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">Submitted by:</span>
                        <span>{req.requesterName || "Anonymous Student"}</span>
                        {req.requesterEmail && <span>({req.requesterEmail})</span>}
                        {req.requesterPhone && <span>• {req.requesterPhone}</span>}
                      </div>
                      <span className="text-[10px]">
                        Submitted {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        {req.status !== "APPROVED" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleApproveCampus(req)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Confirm & Activate</span>
                          </button>
                        )}

                        {req.status !== "REJECTED" && (
                          <button
                            type="button"
                            onClick={() => setRejectingCampusId(req.id)}
                            className="px-3 py-1.5 rounded-xl border border-border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-xs font-semibold text-muted-foreground transition-colors"
                          >
                            Reject Request
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-muted-foreground">
                        Coords: {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PAID STUDENT VERIFICATIONS ── */}
      {activeTab === "VERIFICATIONS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-muted-foreground space-y-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Paid Credibility Verification Queue (₹10 Fee)
            </span>
            <p>
              Students who pay the ₹10 verification fee appear here. Check their official college email, roll number, and campus enrollment before confirming their verified badge.
            </p>
          </div>

          {verifications.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border text-muted-foreground space-y-2">
              <ShieldCheck className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-sm font-semibold">No student verification requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verifications.map((ver) => (
                <div
                  key={ver.id}
                  className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground">{ver.userName}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            ver.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                              : ver.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                          }`}
                        >
                          {ver.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Campus: <strong className="text-foreground">{ver.campusName || "Not set"}</strong> • Email: {ver.userEmail}
                      </p>
                    </div>

                    {/* Payment Badge */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>PAID ₹{ver.paymentAmount || 10}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="rounded-xl bg-surface/60 border border-border p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      Student Roll / ID: <strong className="text-foreground">{ver.studentIdNumber || "Not provided"}</strong>
                    </div>
                    <div>
                      Official College Email: <strong className="text-foreground">{ver.collegeEmail || "Not provided"}</strong>
                    </div>
                    {ver.documentUrl && (
                      <div className="sm:col-span-2">
                        <a
                          href={ver.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Uploaded College ID / Document Proof
                        </a>
                      </div>
                    )}
                    {ver.rejectionReason && (
                      <div className="sm:col-span-2 text-rose-500 font-medium">
                        Rejection Reason: {ver.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {ver.status === "PENDING" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApproveVerification(ver.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Confirm Affiliation & Award Verified Badge</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectingVerificationId(ver.id)}
                        className="px-3 py-1.5 rounded-xl border border-border hover:bg-rose-500/10 hover:text-rose-500 text-xs font-semibold text-muted-foreground transition-colors"
                      >
                        Reject Verification
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: CAMPUS MERGE & ALIASES ── */}
      {activeTab === "MERGE" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground space-y-1">
            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <GitMerge className="h-4 w-4" />
              Campus Duplicate Resolver & Alias Merger
            </span>
            <p>
              Safely merge duplicate institution entries. All student accounts and listings from the source campus are atomically reassigned to the target campus, and the source name is preserved in the target's aliases array.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl border border-border bg-card">
            {/* Source Campus (to remove) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Source Campus (Duplicate to be merged & deleted)
              </label>
              <select
                value={sourceCampusId}
                onChange={(e) => setSourceCampusId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">-- Select duplicate campus to remove --</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.userCount} users, {c.listingCount} listings)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Campus (to keep) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Target Campus (Canonical campus to keep active)
              </label>
              <select
                value={targetCampusId}
                onChange={(e) => setTargetCampusId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">-- Select canonical campus to keep --</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.userCount} users, {c.listingCount} listings)
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="button"
                disabled={isPending || !sourceCampusId || !targetCampusId}
                onClick={handleMergeCampuses}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
                <span>Execute Atomic Campus Merge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: AUDIT TRAIL ── */}
      {activeTab === "AUDIT" && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span className="font-bold text-foreground">Recent Administrative Audit Logs</span>
            <span>{auditLogs.length} events recorded</span>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border font-semibold">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-foreground">{log.adminEmail || log.adminId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-muted font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{log.targetType} ({log.targetId.slice(-6)})</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate" title={log.details || ""}>
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: MANUAL ADD ── */}
      {activeTab === "MANUAL_ADD" && (
        <form onSubmit={handleManualCreate} className="p-6 rounded-2xl border border-border bg-card space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-foreground">Directly Register New Campus</h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Institute Full Name *</label>
            <input
              type="text"
              required
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Indian Institute of Science, Bangalore"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Official Website</label>
              <input
                type="text"
                value={manualWebsite}
                onChange={(e) => setManualWebsite(e.target.value)}
                placeholder="https://iisc.ac.in"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Domain</label>
              <input
                type="text"
                value={manualDomain}
                onChange={(e) => setManualDomain(e.target.value)}
                placeholder="iisc.ac.in"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">City</label>
              <input
                type="text"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                placeholder="Bengaluru"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">State</label>
              <input
                type="text"
                value={manualState}
                onChange={(e) => setManualState(e.target.value)}
                placeholder="Karnataka"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Latitude</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="13.0219"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Longitude</label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="77.5671"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-xs"
          >
            Create & Activate Campus
          </button>
        </form>
      )}

      {/* ── Rejection Reason Modal for Campus ── */}
      {rejectingCampusId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Reject Campus Request</h3>
            <textarea
              rows={3}
              value={rejectCampusReason}
              onChange={(e) => setRejectCampusReason(e.target.value)}
              placeholder="State why this institute request cannot be verified (e.g. invalid website, domain mismatch)..."
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingCampusId(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleRejectCampus}
                className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-colors shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection Reason Modal for Verification ── */}
      {rejectingVerificationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Reject Student Verification</h3>
            <textarea
              rows={3}
              value={rejectVerificationReason}
              onChange={(e) => setRejectVerificationReason(e.target.value)}
              placeholder="Reason for rejecting verification (e.g. invalid student roll number, college ID document blurry)..."
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingVerificationId(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleRejectVerification}
                className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-colors shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
