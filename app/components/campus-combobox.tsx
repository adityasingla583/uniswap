"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { School, Search, ChevronDown, Check, X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestCampusModal } from "./request-campus-modal";

type Campus = { id: string; name: string };

export function CampusCombobox({
  campuses,
  value = "",
  onChange,
  showAllOption = false,
  placeholder = "Select your institute...",
  name = "campusId",
  className,
}: {
  campuses: Campus[];
  value?: string;
  onChange?: (campusId: string) => void;
  showAllOption?: boolean;
  placeholder?: string;
  name?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCampus = campuses.find((c) => c.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredCampuses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return campuses;

    // Check for common acronyms and expansions
    const isSearchingIIIT = term.includes("iiit") || term.includes("information technology");
    const isSearchingNIT = term.includes("nit") || term.includes("national institute");
    const isSearchingIIT = term.includes("iit") || term.includes("indian institute of technology");

    return campuses.filter((c) => {
      const lowerName = c.name.toLowerCase();
      if (lowerName.includes(term)) return true;

      if (isSearchingIIIT && (lowerName.includes("iiit") || lowerName.includes("information technology"))) {
        // Also check if city or location part matches
        const remainder = term.replace("iiit", "").replace("indian institute of information technology", "").trim();
        if (!remainder || lowerName.includes(remainder)) return true;
      }

      if (isSearchingNIT && (lowerName.includes("nit") || lowerName.includes("national institute of technology"))) {
        const remainder = term.replace("nit", "").replace("national institute of technology", "").trim();
        if (!remainder || lowerName.includes(remainder)) return true;
      }

      if (isSearchingIIT && (lowerName.includes("iit") || lowerName.includes("indian institute of technology"))) {
        const remainder = term.replace("iit", "").replace("indian institute of technology", "").trim();
        if (!remainder || lowerName.includes(remainder)) return true;
      }

      return false;
    });
  }, [campuses, searchTerm]);

  function handleSelect(id: string) {
    if (onChange) {
      onChange(id);
    }
    setIsOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    handleSelect("");
  }

  function handleOpenRequestModal(e: React.MouseEvent) {
    e.stopPropagation();
    setIsOpen(false);
    setIsRequestModalOpen(true);
  }

  return (
    <>
      <div ref={dropdownRef} className={cn("relative w-full", className)}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 text-left",
            isOpen && "border-primary ring-2 ring-primary/40"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <School className="h-4 w-4 text-primary shrink-0" />
            <span className={cn("truncate", !selectedCampus && "text-muted-foreground")}>
              {selectedCampus ? selectedCampus.name : placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedCampus && (
              <span
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear campus"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180 text-foreground"
              )}
            />
          </div>
        </button>

        {/* Hidden input for HTML form submissions */}
        <input type="hidden" name={name} value={value} />

        {/* Popover Dropdown with Search */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[280px] sm:min-w-[360px] max-w-md rounded-xl border border-border bg-card p-2 shadow-2xl animate-in fade-in-0 zoom-in-95">
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search IIIT, IIT, NIT, GFTI (230+ campuses)..."
                className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* List Options */}
            <div className="max-h-60 overflow-y-auto space-y-0.5 text-xs scrollbar-thin">
              {showAllOption && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors font-medium",
                    !value
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span>All Campuses across India</span>
                  {!value && <Check className="h-3.5 w-3.5" />}
                </button>
              )}

              {filteredCampuses.length === 0 ? (
                <div className="py-4 px-2 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    No matching institutes found for &quot;{searchTerm}&quot;
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenRequestModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Request to add this campus
                  </button>
                </div>
              ) : (
                filteredCampuses.map((c) => {
                  const isSelected = c.id === value;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelect(c.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors",
                        isSelected
                          ? "bg-primary text-white font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span className="truncate pr-2">{c.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Add Campus CTA */}
            <div className="pt-2 mt-2 border-t border-border flex items-center justify-between px-1">
              <span className="text-[11px] text-muted-foreground">
                Can&apos;t find your campus?
              </span>
              <button
                type="button"
                onClick={handleOpenRequestModal}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <PlusCircle className="h-3 w-3" />
                Add / Request Campus
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <RequestCampusModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        prefillName={searchTerm}
      />
    </>
  );
}

export function UrlCampusCombobox({
  campuses,
  placeholder = "All Campuses",
  className,
}: {
  campuses: Campus[];
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCampusId = searchParams.get("campusId") || "";

  function handleChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("campusId", id);
    } else {
      params.delete("campusId");
      params.delete("mode");
      params.delete("radius");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <CampusCombobox
      campuses={campuses}
      value={currentCampusId}
      onChange={handleChange}
      showAllOption={true}
      placeholder={placeholder}
      className={className}
    />
  );
}
