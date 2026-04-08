"use client";

import { SparkleIcon } from "@/components/shared/sparkle-icon";

interface PromptPillProps {
  text: string;
  onClick: () => void;
}

export function PromptPill({ text, onClick }: PromptPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap border border-[#dae1ed] bg-white py-1 pl-2.5 pr-3 text-sm transition-colors hover:bg-[#f2f5fa]"
      style={{ borderRadius: "20px" }}
    >
      <SparkleIcon className="h-4 w-4 text-[#0056d2]" />
      {text}
    </button>
  );
}
