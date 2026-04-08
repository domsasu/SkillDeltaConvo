"use client";

import { useState, useRef, useCallback } from "react";
import { Plus } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M9.25033 6.875L5.57928 10.546C5.42942 10.6959 5.2538 10.7708 5.05241 10.7708C4.85102 10.7708 4.6706 10.6944 4.51116 10.5417C4.36505 10.3889 4.29199 10.2118 4.29199 10.0104C4.29199 9.80903 4.36713 9.63326 4.51741 9.48313L9.47762 4.52917C9.55276 4.45417 9.63414 4.39931 9.72178 4.36458C9.80942 4.32986 9.90338 4.3125 10.0037 4.3125C10.1038 4.3125 10.1978 4.32986 10.2855 4.36458C10.3732 4.39931 10.4517 4.45139 10.5212 4.52083L15.4795 9.47917C15.6323 9.63194 15.7087 9.80556 15.7087 10C15.7087 10.1944 15.6356 10.3681 15.4895 10.5208C15.33 10.6736 15.1485 10.75 14.9447 10.75C14.7411 10.75 14.5652 10.6736 14.417 10.5208L10.7503 6.875V15.2504C10.7503 15.4628 10.6789 15.6408 10.536 15.7846C10.393 15.9282 10.216 16 10.0047 16C9.79345 16 9.61491 15.9282 9.46908 15.7846C9.32324 15.6408 9.25033 15.4628 9.25033 15.2504V6.875Z" fill="white"/>
    </svg>
  );
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "I want to learn...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isEmpty = value.trim().length === 0;

  return (
    <div className="flex min-h-[88px] flex-col rounded-2xl border border-[#dae1ed] bg-white px-4 pt-3 pb-3 focus-within:ring-2 focus-within:ring-[#0056d2]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="max-h-36 min-h-[2.5rem] flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        style={{ fieldSizing: "content" } as React.CSSProperties}
      />
      <div className="flex items-center justify-between">
        <Plus className="h-5 w-5 text-[#0f1114]" />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isEmpty || disabled}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#0056d2] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
