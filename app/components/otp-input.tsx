"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  onEnterPress?: () => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  onEnterPress,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus) {
      // Focus immediately and reinforce after DOM animation / mount
      const focusFirstBox = () => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
          inputRefs.current[0].select();
        }
      };

      focusFirstBox();
      const t1 = setTimeout(focusFirstBox, 40);
      const t2 = setTimeout(focusFirstBox, 120);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [autoFocus]);

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const rawChar = e.target.value;
    // Extract only digits
    const cleanChar = rawChar.replace(/\D/g, "");

    if (!cleanChar) {
      // User emptied the box
      const newDigits = [...digits];
      newDigits[index] = "";
      const newCode = newDigits.join("");
      onChange(newCode);
      return;
    }

    // If user typed multiple digits or single digit
    const char = cleanChar[cleanChar.length - 1]; // take the latest typed digit
    const newDigits = [...digits];
    newDigits[index] = char;
    const newCode = newDigits.join("");
    onChange(newCode);

    // Auto-advance to next box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all boxes filled, trigger onComplete
    if (newCode.length === length && !newDigits.includes("")) {
      if (onComplete) {
        onComplete(newCode);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current box is already empty; move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (onEnterPress) {
        onEnterPress();
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const cleanDigits = pastedData.replace(/\D/g, "").slice(0, length);

    if (cleanDigits) {
      onChange(cleanDigits);
      const nextFocusIndex = Math.min(cleanDigits.length, length - 1);
      inputRefs.current[nextFocusIndex]?.focus();

      if (cleanDigits.length === length && onComplete) {
        onComplete(cleanDigits);
      }
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
      {Array.from({ length }).map((_, index) => {
        const digit = digits[index] || "";
        const isFilled = !!digit;
        const isCurrentFocus =
          value.length === index || (value.length === length && index === length - 1);

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus={autoFocus && index === 0}
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-150 outline-none select-none",
              "bg-surface text-foreground",
              hasError
                ? "border-red-500 ring-2 ring-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400"
                : isFilled
                ? "border-primary/80 ring-1 ring-primary/30 bg-primary/5 text-primary font-extrabold"
                : "border-border hover:border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/30",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        );
      })}
    </div>
  );
}
