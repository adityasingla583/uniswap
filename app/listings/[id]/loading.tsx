export default function ListingDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
      {/* Back & Home links skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded-md shimmer-box" />
        <div className="h-7 w-16 rounded-lg shimmer-box" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Skeleton */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full rounded-2xl border border-border shimmer-box" />
        </div>

        {/* Right Column: Listing Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            {/* Category tag & Date */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 rounded-full shimmer-box" />
              <div className="h-4 w-20 rounded-md shimmer-box" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="h-7 w-full rounded-md shimmer-box" />
              <div className="h-7 w-3/4 rounded-md shimmer-box" />
            </div>

            {/* Price */}
            <div className="h-9 w-32 rounded-lg shimmer-box" />

            {/* Description */}
            <div className="pt-2 space-y-2 border-t border-border">
              <div className="h-4 w-full rounded-md shimmer-box" />
              <div className="h-4 w-5/6 rounded-md shimmer-box" />
              <div className="h-4 w-2/3 rounded-md shimmer-box" />
            </div>

            {/* Action buttons (WhatsApp Chat & Favorite) */}
            <div className="pt-4 flex gap-3 border-t border-border">
              <div className="h-12 flex-1 rounded-xl shimmer-box" />
              <div className="h-12 w-12 rounded-xl shimmer-box shrink-0" />
            </div>
          </div>

          {/* Seller / Campus Location Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full shimmer-box shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-28 rounded-md shimmer-box" />
                <div className="h-3 w-40 rounded-md shimmer-box" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
