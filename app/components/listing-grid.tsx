import { Suspense } from "react";

export function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* Image Skeleton with Shimmer */}
      <div className="relative aspect-[4/3] w-full shimmer-box">
        {/* Placeholder tag pill */}
        <div className="absolute top-2 left-2 h-5 w-16 rounded-md bg-surface/60 backdrop-blur-xs" />
      </div>

      {/* Card Content Skeleton */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Title Lines */}
        <div className="space-y-1.5">
          <div className="h-4 w-4/5 rounded-md shimmer-box" />
          <div className="h-4 w-1/2 rounded-md shimmer-box" />
        </div>

        {/* Price Badge */}
        <div className="h-6 w-24 rounded-lg shimmer-box mt-1" />

        {/* Campus & Distance Badge */}
        <div className="mt-auto pt-2 flex items-center gap-2">
          <div className="h-4 w-4 rounded-full shimmer-box shrink-0" />
          <div className="h-3.5 w-32 rounded-md shimmer-box" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ListingGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

export function ListingGridWithSuspense({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ListingGridSkeleton />}>
      {children}
    </Suspense>
  );
}
