"use client";

import { useState, useRef, useCallback } from "react";

export interface UseChatInputOptions {
  onSendMessage: (content: string) => Promise<void> | void;
  disabled?: boolean;
}

export interface UseChatInputReturn {
  inputText: string;
  setInputText: (value: string) => void;
  isSending: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleSend: (textOverride?: string) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  insertQuickPrompt: (prompt: string) => Promise<void>;
}

/**
 * Custom hook to isolate and manage chat input state.
 * Prevents unnecessary re-renders of the parent chat view and message list on every keystroke.
 */
export function useChatInput({
  onSendMessage,
  disabled = false,
}: UseChatInputOptions): UseChatInputReturn {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const content = (typeof textOverride === "string" ? textOverride : inputText).trim();
      if (!content || isSending || disabled) return;

      // Clear input immediately so user can continue interacting
      setInputText("");
      setIsSending(true);

      try {
        await onSendMessage(content);
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setIsSending(false);
        // Regain focus after send
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    },
    [inputText, isSending, disabled, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const insertQuickPrompt = useCallback(
    async (prompt: string) => {
      await handleSend(prompt);
    },
    [handleSend]
  );

  return {
    inputText,
    setInputText,
    isSending,
    inputRef,
    handleSend,
    handleKeyDown,
    insertQuickPrompt,
  };
}
