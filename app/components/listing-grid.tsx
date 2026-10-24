import { Suspense } from "react";

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-5 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
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
