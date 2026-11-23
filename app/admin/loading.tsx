export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-6 w-36 rounded-lg shimmer-box" />

      {/* Header Banner Skeleton */}
      <div className="h-28 rounded-3xl shimmer-box" />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl shimmer-box" />
        ))}
      </div>

      {/* Queue Card Skeleton */}
      <div className="h-96 rounded-3xl shimmer-box" />
    </div>
  );
}
