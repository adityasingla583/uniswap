import { SkeletonCard } from "./components/listing-grid";

export default function FeedLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Campus Banner Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg shimmer-box shrink-0" />
          <div className="h-5 w-48 sm:w-64 rounded-md shimmer-box" />
        </div>
        <div className="h-3.5 w-full max-w-md rounded-md shimmer-box" />
      </div>

      {/* Filter and Category Chips Skeleton */}
      <div className="space-y-3">
        {/* Radius Toggle Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="h-8 w-36 rounded-xl shimmer-box shrink-0" />
          <div className="h-8 w-20 rounded-xl shimmer-box shrink-0" />
          <div className="h-8 w-20 rounded-xl shimmer-box shrink-0" />
          <div className="h-8 w-20 rounded-xl shimmer-box shrink-0" />
          <div className="h-8 w-20 rounded-xl shimmer-box shrink-0" />
        </div>

        {/* Category Chips Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="h-8 w-24 rounded-full shimmer-box shrink-0" />
          <div className="h-8 w-28 rounded-full shimmer-box shrink-0" />
          <div className="h-8 w-32 rounded-full shimmer-box shrink-0" />
          <div className="h-8 w-24 rounded-full shimmer-box shrink-0" />
          <div className="h-8 w-36 rounded-full shimmer-box shrink-0" />
          <div className="h-8 w-28 rounded-full shimmer-box shrink-0" />
          <div className="h-8 w-20 rounded-full shimmer-box shrink-0" />
        </div>
      </div>

      {/* Results Header Skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="h-4 w-44 rounded-md shimmer-box" />
      </div>

      {/* Grid of 8 Animated Shimmer Listing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
