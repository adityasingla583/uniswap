export default function RegisterLoading() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center py-12 px-4 animate-in fade-in-50 duration-200">
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <div className="h-4 w-28 rounded-md shimmer-box" />
        <div className="h-4 w-14 rounded-md shimmer-box" />
      </div>

      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-12 w-12 rounded-xl shimmer-box" />
          <div className="h-7 w-40 rounded-lg shimmer-box" />
          <div className="h-4 w-64 rounded-md shimmer-box" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3.5 w-20 rounded-md shimmer-box" />
            <div className="h-10 w-full rounded-lg shimmer-box" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded-md shimmer-box" />
            <div className="h-10 w-full rounded-lg shimmer-box" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded-md shimmer-box" />
            <div className="h-10 w-full rounded-lg shimmer-box" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded-md shimmer-box" />
            <div className="h-10 w-full rounded-lg shimmer-box" />
          </div>
          <div className="h-11 w-full rounded-xl shimmer-box mt-4" />
        </div>
      </div>
    </div>
  );
}
