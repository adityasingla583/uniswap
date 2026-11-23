export default function MyListingsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-48 rounded-lg shimmer-box" />
          <div className="h-4 w-60 rounded-md shimmer-box" />
        </div>
        <div className="h-10 w-32 rounded-xl shimmer-box" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs space-y-3">
            <div className="aspect-[16/9] w-full shimmer-box" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 rounded-md shimmer-box" />
              <div className="h-6 w-24 rounded-lg shimmer-box" />
              <div className="pt-2 flex gap-2 border-t border-border">
                <div className="h-9 flex-1 rounded-lg shimmer-box" />
                <div className="h-9 w-9 rounded-lg shimmer-box shrink-0" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
