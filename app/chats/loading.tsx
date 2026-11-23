export default function ChatsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-44 rounded-lg shimmer-box" />
          <div className="h-4 w-64 rounded-md shimmer-box" />
        </div>
        <div className="h-8 w-20 rounded-lg shimmer-box" />
      </div>

      {/* List of Chat Conversations */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-3 sm:gap-4">
            {/* User Avatar */}
            <div className="h-12 w-12 rounded-full shimmer-box shrink-0" />

            {/* Conversation Snippet */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded-md shimmer-box" />
                <div className="h-3 w-14 rounded-md shimmer-box" />
              </div>
              <div className="h-3.5 w-3/4 rounded-md shimmer-box" />
            </div>

            {/* Listing Thumbnail */}
            <div className="h-12 w-12 rounded-xl shimmer-box shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
