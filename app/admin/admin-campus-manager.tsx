"use client";

import { useState, useTransition } from "react";
import { approveCampusRequest, rejectCampusRequest, submitCampusRequest } from "@/server/campus-actions";
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
} from "lucide-react";

type CampusRequest = {
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
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function AdminCampusManager({
  initialPending,
  initialRecent,
}: {
  initialPending: CampusRequest[];
  initialRecent: CampusRequest[];
}) {
  const [pending, setPending] = useState<CampusRequest[]>(initialPending);
  const [recent, setRecent] = useState<CampusRequest[]>(initialRecent);
  const [activeTab, setActiveTab] = useState<"PENDING" | "RECENT" | "MANUAL_ADD">("PENDING");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  // For editing coordinates or name inline before approving
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editDomain, setEditDomain] = useState("");

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Direct manual add state
  const [manualName, setManualName] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualDomain, setManualDomain] = useState("");

  function startEdit(req: CampusRequest) {
    setEditingId(req.id);
    setEditName(req.name);
    setEditLat(req.latitude.toString());
    setEditLng(req.longitude.toString());
    setEditDomain(req.domain || "");
  }

  function handleApprove(req: CampusRequest) {
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
            }
          : undefined;

      const res = await approveCampusRequest(req.id, overrides);
      if (res.error) {
        setActionError(res.error);
      } else if (res.success) {
        setActionSuccess(res.message || "Institute confirmed and activated successfully!");
        setPending((prev) => prev.filter((p) => p.id !== req.id));
        setRecent((prev) => [
          {
            ...req,
            status: "APPROVED",
            name: overrides?.name || req.name,
            latitude: overrides?.latitude ?? req.latitude,
            longitude: overrides?.longitude ?? req.longitude,
            updatedAt: new Date(),
          },
          ...prev,
        ]);
        setEditingId(null);
      }
    });
  }

  function handleRejectSubmit() {
    if (!rejectingId) return;
    setActionError("");
    setActionSuccess("");

    startTransition(async () => {
      const res = await rejectCampusRequest(rejectingId, rejectReason);
      if (res.error) {
        setActionError(res.error);
      } else if (res.success) {
        setActionSuccess("Campus request marked as rejected.");
        const req = pending.find((p) => p.id === rejectingId);
        setPending((prev) => prev.filter((p) => p.id !== rejectingId));
        if (req) {
          setRecent((prev) => [
            { ...req, status: "REJECTED", rejectionReason: rejectReason, updatedAt: new Date() },
            ...prev,
          ]);
        }
        setRejectingId(null);
        setRejectReason("");
      }
    });
  }

  function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!manualName.trim()) {
      setActionError("Please provide an institute name.");
      return;
    }

    startTransition(async () => {
      const lat = manualLat ? parseFloat(manualLat) : 20.5937;
      const lng = manualLng ? parseFloat(manualLng) : 78.9629;

      const submitRes = await submitCampusRequest({
        name: manualName,
        city: manualCity,
        state: manualState,
        latitude: lat,
        longitude: lng,
        domain: manualDomain,
        requesterName: "Platform Admin",
      });

      if (submitRes.error) {
        setActionError(submitRes.error);
        return;
      }

      if (submitRes.requestId) {
        const approveRes = await approveCampusRequest(submitRes.requestId);
        if (approveRes.error) {
          setActionError(approveRes.error);
        } else {
          setActionSuccess(`"${manualName}" has been directly created and activated!`);
          setManualName("");
          setManualCity("");
          setManualState("");
          setManualLat("");
          setManualLng("");
          setManualDomain("");
          setActiveTab("RECENT");
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast Alerts */}
      {actionError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="text-red-500 hover:opacity-80">
            ×
          </button>
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 hover:opacity-80">
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "PENDING"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>Pending Approvals</span>
          {pending.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "PENDING" ? "bg-white text-primary" : "bg-red-600 text-white"
              }`}
            >
              {pending.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("RECENT")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "RECENT"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Recent History ({recent.length})
        </button>

        <button
          onClick={() => setActiveTab("MANUAL_ADD")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "MANUAL_ADD"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Direct Add Campus
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === "PENDING" && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border bg-surface/50 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">All Clear! No Pending Requests</h4>
              <p className="text-xs text-muted-foreground">
                When students request an unlisted institute at registration, the notification will appear here for your confirmation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pending.map((req) => {
                const isEditing = editingId === req.id;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${req.latitude},${req.longitude}`;

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/20">
                            Awaiting Confirmation
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Institute Name"
                              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                step="any"
                                value={editLat}
                                onChange={(e) => setEditLat(e.target.value)}
                                placeholder="Latitude"
                                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground"
                              />
                              <input
                                type="number"
                                step="any"
                                value={editLng}
                                onChange={(e) => setEditLng(e.target.value)}
                                placeholder="Longitude"
                                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground"
                              />
                              <input
                                type="text"
                                value={editDomain}
                                onChange={(e) => setEditDomain(e.target.value)}
                                placeholder="domain (e.g. dtu.ac.in)"
                                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground"
                              />
                            </div>
                          </div>
                        ) : (
                          <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                            <School className="h-4 w-4 text-primary shrink-0" />
                            {req.name}
                          </h4>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                          {(req.city || req.state) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              {[req.city, req.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            title="Verify location on Google Maps"
                          >
                            <span>Coords: {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {req.domain && (
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              {req.domain}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                          >
                            Cancel Edit
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(req)}
                            className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setRejectingId(req.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApprove(req)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-xs"
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Confirm & Activate
                        </button>
                      </div>
                    </div>

                    {/* Requester Context */}
                    {(req.requesterName || req.requesterEmail || req.note) && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1">
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                          {req.requesterName && (
                            <span className="font-semibold text-foreground flex items-center gap-1">
                              <User className="h-3 w-3 text-primary" />
                              Requested by: {req.requesterName}
                            </span>
                          )}
                          {req.requesterEmail && (
                            <a
                              href={`mailto:${req.requesterEmail}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Mail className="h-3 w-3" />
                              {req.requesterEmail}
                            </a>
                          )}
                        </div>
                        {req.note && (
                          <p className="text-[11px] text-muted-foreground italic pt-0.5">
                            Note: &quot;{req.note}&quot;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Recent History */}
      {activeTab === "RECENT" && (
        <div className="space-y-3">
          {recent.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No recent requests processed yet.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
              {recent.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{req.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      {[req.city, req.state].filter(Boolean).join(", ")} · {new Date(req.updatedAt).toLocaleDateString()}
                    </p>
                    {req.rejectionReason && (
                      <p className="text-red-500 text-[11px]">Reason: {req.rejectionReason}</p>
                    )}
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    Coords: {req.latitude.toFixed(2)}, {req.longitude.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Direct Manual Add Campus */}
      {activeTab === "MANUAL_ADD" && (
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 max-w-xl">
          <div>
            <h4 className="text-sm font-bold text-foreground">Directly Add & Activate Institute</h4>
            <p className="text-xs text-muted-foreground">
              As an owner/admin, you can directly register any Indian campus into the database. It will immediately appear in the marketplace search and registration comboboxes.
            </p>
          </div>

          <form onSubmit={handleManualAdd} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Institute Full Name *</label>
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Indian Institute of Information Technology (IIIT) Dharwad"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">City</label>
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="e.g. Dharwad"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">State</label>
                <input
                  type="text"
                  value={manualState}
                  onChange={(e) => setManualState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  placeholder="e.g. 15.3929"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="e.g. 75.0253"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Domain / Website (Optional)</label>
              <input
                type="text"
                value={manualDomain}
                onChange={(e) => setManualDomain(e.target.value)}
                placeholder="e.g. iiitdwd.ac.in"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create & Activate Campus
            </button>
          </form>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-foreground">Reject Campus Request?</h4>
            <p className="text-xs text-muted-foreground">
              Provide a brief explanation for rejecting this request (e.g. invalid name, duplicate, or unverified coordinates).
            </p>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate campus or invalid institute details..."
              className="w-full rounded-lg border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleRejectSubmit}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 transition-colors"
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
