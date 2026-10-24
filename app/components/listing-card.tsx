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
  FURNITURE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ELECTRONICS: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  CLOTHING: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  FREE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
};

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
            "absolute top-2 right-2 rounded-full px-2.5 py-1 text-xs font-semibold",
            categoryColors[category] || categoryColors.OTHER
          )}
        >
          {category}
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
        <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {distanceKm != null ? (
            <span>
              {distanceKm < 0.5
                ? "On Your Campus"
                : `${distanceKm.toFixed(1)} km away`}
              {" · "}
              {pickupSpot}
            </span>
          ) : (
            <span>
              {campusName} · {pickupSpot}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
