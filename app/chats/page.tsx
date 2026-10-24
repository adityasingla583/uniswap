import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUserConversationsList } from "@/server/chat-actions";
import { getSession } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { MessageCircle, ArrowLeft, Home, School, Clock, PackageOpen, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Messages & Chats | Local Loop",
  description: "Direct campus conversations with buyers and sellers",
};

export default async function ChatsInboxPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const conversations = await getUserConversationsList();

  function formatTime(dateVal: Date | string) {
    const d = new Date(dateVal);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Campus Chats
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Direct messages with campus buyers and sellers
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-surface/50 space-y-4">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">No conversations yet</h3>
            <p className="text-xs text-muted-foreground">
              When you contact a seller on an item or someone messages you about your listing, your WhatsApp-style chats will appear here.
            </p>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              Browse Campus Listings
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chats/${conv.id}`}
              className="p-4 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    {conv.otherParticipant.name.charAt(0)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-surface" />
                </div>

                {/* Details */}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {conv.otherParticipant.name}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-500/10 text-emerald-600">
                      {conv.otherParticipant.campus?.name}
                    </span>
                  </div>

                  {conv.listing && (
                    <p className="text-xs font-medium text-primary line-clamp-1">
                      {conv.listing.title} ({formatPrice(conv.listing.price)})
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {conv.lastMessage ? conv.lastMessage.content : "No messages yet"}
                  </p>
                </div>
              </div>

              {/* Time & Unread Status */}
              <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(conv.updatedAt)}
                </span>
                {conv.isUnread && (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
