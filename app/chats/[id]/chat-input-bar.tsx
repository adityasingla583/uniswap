"use client";

import React, { memo } from "react";
import { useChatInput } from "@/hooks/use-chat-input";
import { Send, Sparkles, Loader2 } from "lucide-react";

const DEFAULT_QUICK_PROMPTS = [
  "Is this still available?",
  "Can we meet at the campus library?",
  "What time works best for you today?",
  "Can you share more details on the condition?",
];

interface ChatInputBarProps {
  onSendMessage: (content: string) => Promise<void> | void;
  disabled?: boolean;
  quickPrompts?: string[];
  placeholder?: string;
}

/**
 * Isolated ChatInputBar component.
 * Uses `useChatInput` hook to contain input state locally,
 * preventing keystroke-driven re-renders of the parent chat page and message list.
 */
export const ChatInputBar = memo(function ChatInputBar({
  onSendMessage,
  disabled = false,
  quickPrompts = DEFAULT_QUICK_PROMPTS,
  placeholder = "Type a message (press Enter to send)...",
}: ChatInputBarProps) {
  const {
    inputText,
    setInputText,
    isSending,
    inputRef,
    handleSend,
    handleKeyDown,
    insertQuickPrompt,
  } = useChatInput({
    onSendMessage,
    disabled,
  });

  return (
    <div className="shrink-0 bg-surface border-t border-border">
      {/* ── Quick Prompt Chips ── */}
      {quickPrompts && quickPrompts.length > 0 && (
        <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Sparkles className="h-3 w-3 text-amber-500 shrink-0 ml-1" />
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isSending || disabled}
              onClick={() => insertQuickPrompt(prompt)}
              className="whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Box & Send Button ── */}
      <div className="p-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isSending || disabled}
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
});
