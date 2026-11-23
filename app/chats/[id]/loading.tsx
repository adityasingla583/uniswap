export default function ChatRoomLoading() {
  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-xs overflow-hidden animate-in fade-in-50 duration-200">
      {/* Chat Top Bar */}
      <div className="h-16 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg shimmer-box shrink-0" />
          <div className="h-10 w-10 rounded-full shimmer-box shrink-0" />
          <div className="space-y-1">
            <div className="h-4 w-28 rounded-md shimmer-box" />
            <div className="h-3 w-40 rounded-md shimmer-box" />
          </div>
        </div>
        <div className="h-10 w-24 rounded-lg shimmer-box shrink-0" />
      </div>

      {/* Item summary banner */}
      <div className="p-3 bg-muted/40 border-b border-border flex items-center gap-3">
        <div className="h-11 w-11 rounded-lg shimmer-box shrink-0" />
        <div className="space-y-1 flex-1">
          <div className="h-3.5 w-48 rounded-md shimmer-box" />
          <div className="h-4 w-20 rounded-md shimmer-box" />
        </div>
      </div>

      {/* Message Bubbles Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Incoming message from seller (Left) */}
        <div className="flex items-start gap-2 max-w-[75%]">
          <div className="h-14 w-52 rounded-2xl rounded-tl-xs shimmer-box" />
        </div>

        {/* Outgoing message from buyer (Right) */}
        <div className="flex justify-end">
          <div className="h-12 w-64 rounded-2xl rounded-tr-xs shimmer-box bg-primary/20" />
        </div>

        {/* Incoming message (Left) */}
        <div className="flex items-start gap-2 max-w-[75%]">
          <div className="h-16 w-72 rounded-2xl rounded-tl-xs shimmer-box" />
        </div>

        {/* Outgoing message (Right) */}
        <div className="flex justify-end">
          <div className="h-12 w-48 rounded-2xl rounded-tr-xs shimmer-box bg-primary/20" />
        </div>
      </div>

      {/* Bottom Message Input Bar */}
      <div className="p-3 border-t border-border bg-surface flex items-center gap-2 shrink-0">
        <div className="h-11 flex-1 rounded-xl shimmer-box" />
        <div className="h-11 w-11 rounded-xl shimmer-box shrink-0" />
      </div>
    </div>
  );
}
