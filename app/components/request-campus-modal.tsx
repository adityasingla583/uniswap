"use client";

import { useState, useTransition } from "react";
import { submitCampusRequest } from "@/server/campus-actions";
import {
  School,
  MapPin,
  Globe,
  Mail,
  User,
  Phone,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

interface RequestCampusModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillName?: string;
}

export function RequestCampusModal({
  isOpen,
  onClose,
  prefillName = "",
}: RequestCampusModalProps) {
  const [name, setName] = useState(prefillName);
  const [website, setWebsite] = useState("");
  const [institutionType, setInstitutionType] = useState("COLLEGE_UNIVERSITY");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [domain, setDomain] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [note, setNote] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter the official name of the institute.");
      return;
    }

    startTransition(async () => {
      const lat = customLat ? parseFloat(customLat) : undefined;
      const lng = customLng ? parseFloat(customLng) : undefined;

      const res = await submitCampusRequest({
        name,
        website,
        institutionType,
        city,
        state,
        domain,
        latitude: lat,
        longitude: lng,
        requesterName,
        requesterEmail,
        requesterPhone,
        note,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.success) {
        setSuccessMessage(res.message || "Request submitted successfully!");
        setTimeout(() => {
          // Reset and close after a short delay
          setName("");
          setWebsite("");
          setCity("");
          setState("");
          setDomain("");
          setNote("");
        }, 3000);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Request / Add Your Campus
              </h3>
              <p className="text-xs text-muted-foreground">
                Can&apos;t find your institute? Propose it for platform admin confirmation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {successMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Request Received!
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Campus Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Institute / University Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BITS Pilani, Goa Campus or DTU Delhi"
                  className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Official Website */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Official Website (e.g. https://iiitkota.ac.in)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://iiitkota.ac.in"
                  className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Sancoale / Vasco"
                    className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Goa, Maharashtra"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* College Domain */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Official Website or Email Domain (Optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. goa.bits-pilani.ac.in or dtu.ac.in"
                  className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Optional Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Latitude (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="e.g. 15.3911"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Longitude (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  placeholder="e.g. 73.8783"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Requester Details */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2.5">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3 w-3 text-primary" /> Your Contact Info (To notify you once approved)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="Your College Email"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Additional Note (Optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Nearby landmarks, campus gates, or batch strength..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Submit Campus Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
