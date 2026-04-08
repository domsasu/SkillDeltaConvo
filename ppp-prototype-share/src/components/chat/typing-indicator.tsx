"use client";

import clsx from "clsx";

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={clsx("flex justify-start", className)}>
      <div className="inline-flex items-center gap-1 rounded-2xl bg-[#f2f5fa] px-4 py-3">
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
