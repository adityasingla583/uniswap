"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendMessageAsync, fetchMessagesAsync } from "@/server/chat-actions";
import { formatPrice } from "@/lib/utils";
import { ChatInputBar } from "./chat-input-bar";
import {
  ArrowLeft,
  CheckCheck,
  MapPin,
  School,
  ShieldCheck,
  RotateCw,
  Zap,
  Sparkles,
  AlertCircle,
  X,
} from "lucide-react";

export type Message = {
  id: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date | string;
  sender?: { id: string; name: string };
};

type ChatProps = {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  initialQuota?: {
    isPremium: boolean;
    used: number;
    limit: number;
    remaining: number;
    date: string;
  };
  otherParticipant: {
    id: string;
    name: string;
    isVerified?: boolean;
    campus?: { name: string } | null;
    dormZone?: string | null;
  };
  listing: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    pickupSpot: string;
    campus?: { name: string };
  } | null;
};

function formatTime(dateVal: Date | string) {
  const d = new Date(dateVal);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * 1. Memoized Individual Message Bubble.
 * React will skip re-rendering existing bubbles when new messages are added.
 */
const ChatBubble = memo(function ChatBubble({
  msg,
  isMe,
  otherName,
}: {
  msg: Message;
  isMe: boolean;
  otherName: string;
}) {
  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-1`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-sm relative space-y-1 ${
          isMe
            ? "bg-emerald-600 text-white rounded-br-none"
            : "bg-surface text-foreground border border-border/80 rounded-bl-none"
        }`}
      >
        {!isMe && (
          <p className="text-[11px] font-bold text-primary pb-0.5">
            {otherName}
          </p>
        )}

        <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
          {msg.content}
        </p>

        <div
          className={`flex items-center justify-end gap-1 text-[10px] ${
            isMe ? "text-emerald-100" : "text-muted-foreground"
          }`}
        >
          <span>{formatTime(msg.createdAt)}</span>
          {isMe && (
            <CheckCheck
              className={`h-3.5 w-3.5 ${
                msg.read ? "text-cyan-200" : "text-emerald-200"
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * 2. Memoized Campus Safety Banner.
 * Never re-renders.
 */
const CampusSafetyBanner = memo(function CampusSafetyBanner() {
  return (
    <div className="max-w-md mx-auto my-2 p-2.5 rounded-xl bg-surface/80 border border-border text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5 shadow-xs">
      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
      <span>
        Campus P2P Chat. Arrange meetups in safe public spots like the campus library or student center.
      </span>
    </div>
  );
});

/**
 * 3. Memoized Header Component.
 * Does NOT re-render when messages change.
 */
const ChatHeader = memo(function ChatHeader({
  otherParticipant,
  isRefreshing,
  onRefresh,
}: {
  otherParticipant: ChatProps["otherParticipant"];
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Link
          href="/chats"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Back to All Chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {otherParticipant.name.charAt(0)}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-surface" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              {otherParticipant.name}
            </h2>
            {otherParticipant.isVerified ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="h-3 w-3 fill-blue-500/20" />
                Verified Student
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                Campus Student
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <School className="h-3 w-3" />
            {otherParticipant.campus?.name}
            {otherParticipant.dormZone ? ` · ${otherParticipant.dormZone}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Refresh messages"
        >
          <RotateCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`}
          />
        </button>
        <Link
          href="/"
          className="text-xs font-semibold text-primary hover:underline hidden sm:block"
        >
          Home Feed
        </Link>
      </div>
    </div>
  );
});

/**
 * 4. Memoized Listing Context Ribbon.
 * Does NOT re-render when messages change.
 */
const ListingRibbon = memo(function ListingRibbon({
  listing,
}: {
  listing: ChatProps["listing"];
}) {
  if (!listing) return null;

  return (
    <div className="bg-muted/40 border-b border-border/80 px-4 py-2 flex items-center justify-between text-xs shrink-0">
      <Link
        href={`/listings/${listing.id}`}
        className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity"
      >
        <div className="relative h-9 w-9 rounded-md overflow-hidden bg-muted shrink-0 border border-border">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="36px"
          />
        </div>
        <div>
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {listing.title}
          </p>
          <p className="font-bold text-primary">
            {formatPrice(listing.price)}
          </p>
        </div>
      </Link>

      <div className="text-muted-foreground flex items-center gap-1 text-[11px] shrink-0 pl-2">
        <MapPin className="h-3 w-3 text-primary shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">
          {listing.pickupSpot}
        </span>
      </div>
    </div>
  );
});

/**
 * 5. Isolated Messages Area.
 * Only the message bubbles inside this pane update when a message is added or received.
 */
const ChatMessagesArea = memo(function ChatMessagesArea({
  messages,
  currentUserId,
  otherName,
}: {
  messages: Message[];
  currentUserId: string;
  otherName: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
      <CampusSafetyBanner />
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          msg={msg}
          isMe={msg.senderId === currentUserId}
          otherName={otherName}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

/**
 * Main WhatsApp Chat View container.
 * Sub-components (ChatHeader, ListingRibbon, ChatInputBar) are all memoized,
 * so sending/receiving messages ONLY updates the message bubbles inside ChatMessagesArea!
 */
export function WhatsAppChatView({
  conversationId,
  initialMessages,
  currentUserId,
  initialQuota,
  otherParticipant,
  listing,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quota, setQuota] = useState(
    initialQuota || {
      isPremium: false,
      used: 0,
      limit: 100,
      remaining: 100,
      date: "",
    }
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const latestMessageIdRef = useRef<string | undefined>(
    initialMessages[initialMessages.length - 1]?.id
  );

  useEffect(() => {
    latestMessageIdRef.current = messages[messages.length - 1]?.id;
  }, [messages]);

  const syncLatestMessages = useCallback(async () => {
    try {
      const lastId = latestMessageIdRef.current;
      const res = await fetchMessagesAsync(conversationId, lastId);
      if (res.success && res.messages && !res.notModified) {
        setMessages((prev) => {
          const lastPrev = prev[prev.length - 1];
          const lastIncoming = res.messages[res.messages.length - 1];
          if (
            prev.length === res.messages.length &&
            lastPrev?.id === lastIncoming?.id
          ) {
            return prev;
          }
          return res.messages;
        });
      }
    } catch {
      // Silent on background fetch
    }
  }, [conversationId]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await syncLatestMessages();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [syncLatestMessages]);

  // Tab visibility & focus-aware sync:
  useEffect(() => {
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        syncLatestMessages();
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        syncLatestMessages();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [syncLatestMessages]);

  // Send message callback:
  // Optimistically appends the new message into messages list.
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!quota.isPremium && quota.remaining <= 0) {
        setQuotaError("You have reached your daily limit of 100 messages. Upgrade to Premium for unlimited messaging.");
        setShowUpgradeModal(true);
        return;
      }

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        senderId: currentUserId,
        content,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await sendMessageAsync(conversationId, content);
        if (res.error === "DAILY_LIMIT_REACHED") {
          // Revert optimistic message
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setQuotaError(res.message || "Daily message limit reached (100 messages/day). Upgrade to Premium for unlimited messaging.");
          if (res.quota) {
            setQuota(res.quota);
          }
          setShowUpgradeModal(true);
          return;
        }

        if (res.success && res.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? res.message : m))
          );
          if (res.quota) {
            setQuota(res.quota);
          }
          setQuotaError(null);
        }
      } catch (err) {
        console.error("Failed to send message:", err);
      }
    },
    [conversationId, currentUserId, quota]
  );

  const isLimitReached = !quota.isPremium && quota.remaining <= 0;

  return (
    <div className="flex flex-col h-[82vh] max-w-4xl mx-auto rounded-2xl border border-border bg-card shadow-lg overflow-hidden relative">
      {/* ── Chat Header (Memoized - won't re-render on new messages) ── */}
      <ChatHeader
        otherParticipant={otherParticipant}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
      />

      {/* ── Listing Ribbon (Memoized - won't re-render on new messages) ── */}
      <ListingRibbon listing={listing} />

      {/* ── Messages Feed (Only this area renders the new message bubble) ── */}
      <ChatMessagesArea
        messages={messages}
        currentUserId={currentUserId}
        otherName={otherParticipant.name}
      />

      {/* ── Freemium Quota Bar ── */}
      <div className="bg-surface/90 border-t border-border px-4 py-1.5 flex items-center justify-between text-xs text-muted-foreground shrink-0">
        {quota.isPremium ? (
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Member: Unlimited messaging active
          </span>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isLimitReached ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span>
                Daily Quota: <strong className="text-foreground">{quota.used}</strong> / {quota.limit} used{" "}
                <span className={isLimitReached ? "text-rose-500 font-bold" : "text-muted-foreground"}>
                  ({quota.remaining} remaining today)
                </span>
              </span>
            </div>

            <Link
              href="/profile#premium"
              className="font-bold text-primary hover:underline flex items-center gap-1 text-[11px] bg-primary/10 px-2 py-0.5 rounded-full"
            >
              <Zap className="h-3 w-3" />
              <span>Get Unlimited</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── Limit Reached Banner ── */}
      {isLimitReached && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/60 p-3 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Daily free limit of 100 messages reached. Counter resets at midnight.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="px-3 py-1 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors shrink-0 shadow-xs"
          >
            Upgrade to Premium
          </button>
        </div>
      )}

      {/* ── Bottom Input Bar ── */}
      <ChatInputBar
        onSendMessage={handleSendMessage}
        disabled={isLimitReached}
        placeholder={
          isLimitReached
            ? "Daily limit reached (100/100). Upgrade to Premium to send more messages..."
            : "Type a message (press Enter to send)..."
        }
      />

      {/* ── Upgrade to Premium Modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Upgrade to Local Loop Premium</h3>
                <p className="text-xs text-muted-foreground">Unlock unlimited campus messaging</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/30 p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Unlimited 1-on-1 Negotiations & Chats</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Priority Campus Buyer/Seller Notifications</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Verified Buyer Credibility Badge</span>
              </div>
            </div>

            {quotaError && (
              <p className="text-xs text-rose-500 font-medium bg-rose-500/10 p-2 rounded-lg">
                {quotaError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xl font-extrabold text-foreground">₹49</span>
                <span className="text-xs text-muted-foreground"> / month</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Maybe Later
                </button>
                <Link
                  href="/profile#premium"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Go to Upgrade
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
