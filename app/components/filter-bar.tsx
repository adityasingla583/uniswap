"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  Book,
  Bike,
  Cpu,
  Sofa,
  Zap,
  Shirt,
  Dumbbell,
  Compass,
  Gift,
  Ticket,
  MoreHorizontal,
  MapPin,
  Sparkles,
} from "lucide-react";

export const CATEGORIES_LIST = [
  { value: "", label: "All Items", icon: null },
  { value: "CYCLES_VEHICLES", label: "Cycles & Helmets", icon: Bike },
  { value: "BOOKS", label: "Books & Notes", icon: Book },
  { value: "ELECTRONICS", label: "Electronics & Gadgets", icon: Cpu },
  { value: "DORM_FURNITURE", label: "Dorm & Furniture", icon: Sofa },
  { value: "APPLIANCES", label: "Kettles & Appliances", icon: Zap },
  { value: "CLOTHING", label: "Clothes & Lab Coats", icon: Shirt },
  { value: "SPORTS_FITNESS", label: "Sports & Fitness", icon: Dumbbell },
  { value: "STATIONERY_LAB", label: "Stationery & Drafters", icon: Compass },
  { value: "SERVICES_TICKETS", label: "Cabs & Passes", icon: Ticket },
  { value: "FREE", label: "Free Giveaways", icon: Gift },
  { value: "OTHER", label: "Other Goods", icon: MoreHorizontal },
];

const radiusOptions = [
  { value: "exact", label: "📍 Same Campus Only" },
  { value: "5", label: "Within 5 km" },
  { value: "15", label: "Within 15 km" },
  { value: "25", label: "Within 25 km" },
  { value: "50", label: "Within 50 km" },
];

export function FilterBar({
  userCampusName,
}: {
  userCampusName?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "";
  const currentMode = searchParams.get("mode") || "exact";
  const currentRadius = searchParams.get("radius") || "10";
  const currentQuery = searchParams.get("q") || "";

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
      {/* Category Chips Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
        {CATEGORIES_LIST.map((cat) => {
          const isActive = currentCategory === cat.value;
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateFilter("category", cat.value)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all shrink-0",
                isActive
                  ? "bg-primary text-white shadow-sm ring-1 ring-primary"
                  : "bg-chip text-chip-foreground hover:bg-chip-hover border border-border/40"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Distance Parameter Proximity Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-surface border border-border/60 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs pl-1">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">
            {currentQuery ? (
              <span>Distance for &ldquo;<strong className="text-primary">{currentQuery}</strong>&rdquo;:</span>
            ) : (
              <span>Campus Distance Filter:</span>
            )}
          </span>
          {userCampusName && (
            <span className="text-[11px] text-muted-foreground truncate hidden md:inline">
              (Origin: {userCampusName})
            </span>
          )}
        </div>

        {/* Distance Options */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {radiusOptions.map((opt) => {
            const isActive =
              (opt.value === "exact" && currentMode === "exact") ||
              (opt.value !== "exact" &&
                currentMode === "radius" &&
                currentRadius === opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateFilter("radius", opt.value)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shrink-0",
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {isPending && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
