"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Book, Sofa, Cpu, Shirt, Gift, MoreHorizontal, MapPin } from "lucide-react";

const categories = [
  { value: "", label: "All", icon: null },
  { value: "BOOKS", label: "Books", icon: Book },
  { value: "FURNITURE", label: "Furniture", icon: Sofa },
  { value: "ELECTRONICS", label: "Electronics", icon: Cpu },
  { value: "CLOTHING", label: "Clothing", icon: Shirt },
  { value: "FREE", label: "Free", icon: Gift },
  { value: "OTHER", label: "Other", icon: MoreHorizontal },
];

const radiusOptions = [
  { value: "exact", label: "My Campus" },
  { value: "5", label: "5 km" },
  { value: "15", label: "15 km" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "";
  const currentMode = searchParams.get("mode") || "exact";
  const currentRadius = searchParams.get("radius") || "10";
  const hasCampus = !!searchParams.get("campusId");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // If switching to radius mode, ensure mode is set
    if (key === "radius" && value !== "exact") {
      params.set("mode", "radius");
      params.set("radius", value);
    } else if (key === "radius" && value === "exact") {
      params.set("mode", "exact");
      params.delete("radius");
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-3">
      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.value;
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => updateFilter("category", cat.value)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "bg-chip text-chip-foreground hover:bg-chip-hover"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Radius Toggle */}
      {hasCampus && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          {radiusOptions.map((opt) => {
            const isActive =
              (opt.value === "exact" && currentMode === "exact") ||
              (opt.value !== "exact" &&
                currentMode === "radius" &&
                currentRadius === opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => updateFilter("radius", opt.value)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-chip text-chip-foreground hover:bg-chip-hover"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {isPending && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
