"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendMessageAsync, fetchMessagesAsync } from "@/server/chat-actions";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  CheckCheck,
  MapPin,
  Clock,
  Sparkles,
  School,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type Message = {
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
  otherParticipant: {
    id: string;
    name: string;
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

const QUICK_PROMPTS = [
  "Is this still available?",
  "Can we meet at the campus library?",
  "What time works best for you today?",
  "Can you share more details on the condition?",
];

export function WhatsAppChatView({
  conversationId,
  initialMessages,
  currentUserId,
  otherParticipant,
  listing,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  // Asynchronous background polling for new incoming messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchMessagesAsync(conversationId);
        if (res.success && res.messages) {
          setMessages(res.messages);
        }
      } catch (err) {
        // Silent fail on background poll
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId]);

  async function handleSend(textToSend?: string) {
    const content = (textToSend || inputText).trim();
    if (!content || isSending) return;

    setInputText("");
    setIsSending(true);

    // Optimistic UI message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: currentUserId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const res = await sendMessageAsync(conversationId, content);
      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function formatTime(dateVal: Date | string) {
    const d = new Date(dateVal);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-[82vh] max-w-4xl mx-auto rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
      {/* ── WhatsApp Style Chat Header ── */}
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
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Verified Student
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <School className="h-3 w-3" />
              {otherParticipant.campus?.name}
              {otherParticipant.dormZone ? ` · ${otherParticipant.dormZone}` : ""}
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-primary hover:underline hidden sm:block"
        >
          Home Feed
        </Link>
      </div>

      {/* ── Listing Snapshot Context Ribbon ── */}
      {listing && (
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
      )}

      {/* ── Chat Messages Scroll Pane (WhatsApp Wallpaper feel) ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {/* Campus Safety Banner */}
        <div className="max-w-md mx-auto my-2 p-2.5 rounded-xl bg-surface/80 border border-border text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5 shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Campus P2P Chat. Arrange meetups in safe public spots like the campus library or student center.
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
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
                    {otherParticipant.name}
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
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Prompt Chips ── */}
      <div className="bg-surface/90 border-t border-border px-3 pt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <Sparkles className="h-3 w-3 text-amber-500 shrink-0 ml-1" />
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            className="whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* ── WhatsApp Style Bottom Input Bar ── */}
      <div className="bg-surface p-3 border-t border-border flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message (press Enter to send asynchronously)..."
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isSending}
          className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-40 shrink-0 shadow-sm"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
