import { SkeletonCard } from "../components/listing-grid";

export default function FavoritesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-48 rounded-lg shimmer-box" />
          <div className="h-4 w-64 rounded-md shimmer-box" />
        </div>
        <div className="h-8 w-20 rounded-lg shimmer-box" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
