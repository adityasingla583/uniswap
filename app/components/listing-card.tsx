"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useOptimistic, useTransition } from "react";
import { toggleFavorite } from "@/server/actions";

type ListingCardProps = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  campusName: string;
  pickupSpot: string;
  category: string;
  status: string;
  distanceKm?: number | null;
  isFavorited: boolean;
  isLoggedIn: boolean;
};

const categoryColors: Record<string, string> = {
  BOOKS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CYCLES_VEHICLES: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ELECTRONICS: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  DORM_FURNITURE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  FURNITURE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  APPLIANCES: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  CLOTHING: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  SPORTS_FITNESS: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  STATIONERY_LAB: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  SERVICES_TICKETS: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  FREE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
};

function formatCategory(cat: string) {
  const map: Record<string, string> = {
    BOOKS: "Books",
    CYCLES_VEHICLES: "Cycles & Helmets",
    ELECTRONICS: "Electronics",
    DORM_FURNITURE: "Dorm Furniture",
    FURNITURE: "Furniture",
    APPLIANCES: "Appliances",
    CLOTHING: "Clothing",
    SPORTS_FITNESS: "Sports & Fitness",
    STATIONERY_LAB: "Stationery & Lab",
    SERVICES_TICKETS: "Cabs & Passes",
    FREE: "Free",
    OTHER: "Other",
  };
  return map[cat] || cat;
}

export function ListingCard({
  id,
  title,
  price,
  imageUrl,
  campusName,
  pickupSpot,
  category,
  status,
  distanceKm,
  isFavorited,
  isLoggedIn,
}: ListingCardProps) {
  const [optimisticFav, setOptimisticFav] = useOptimistic(isFavorited);
  const [isPending, startTransition] = useTransition();

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;
    startTransition(async () => {
      setOptimisticFav(!optimisticFav);
      await toggleFavorite(id);
    });
  }

  const isSold = status === "SOLD";
  const isReserved = status === "RESERVED";

  return (
    <Link
      href={`/listings/${id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        isSold && "opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Status Badge */}
        {(isSold || isReserved) && (
          <div
            className={cn(
              "absolute top-2 left-2 rounded-full px-2.5 py-1 text-xs font-semibold",
              isSold
                ? "bg-red-500 text-white"
                : "bg-yellow-500 text-white"
            )}
          >
            {status}
          </div>
        )}
        {/* Category Badge */}
        <div
          className={cn(
            "absolute top-2 right-2 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm shadow-sm",
            categoryColors[category] || categoryColors.OTHER
          )}
        >
          {formatCategory(category)}
        </div>
        {/* Favorite Button */}
        {isLoggedIn && (
          <button
            onClick={handleFavorite}
            disabled={isPending}
            className={cn(
              "absolute bottom-2 right-2 rounded-full p-2 transition-all",
              optimisticFav
                ? "bg-red-500 text-white shadow-lg"
                : "bg-white/80 text-gray-600 hover:bg-white backdrop-blur-sm"
            )}
          >
            <Heart
              className={cn("h-4 w-4", optimisticFav && "fill-current")}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
          {title}
        </h3>
        <p className="text-lg font-bold text-primary mb-2">
          {formatPrice(price)}
        </p>
        <div className="mt-auto pt-2 space-y-1.5 text-xs">
          {distanceKm != null ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {distanceKm < 0.5 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  On Your Campus
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary border border-primary/20 text-[11px]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {distanceKm.toFixed(1)} km away ({campusName})
                </span>
              )}
              <span className="text-muted-foreground truncate">· {pickupSpot}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{campusName} · {pickupSpot}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
