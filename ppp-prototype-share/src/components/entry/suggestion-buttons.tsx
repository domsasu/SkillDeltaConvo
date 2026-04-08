"use client";

import { SparkleIcon } from "@/components/shared/sparkle-icon";

const SUGGESTIONS = [
  "Create a learning plan",
  "Find a new career",
  "Develop in-demand skills",
  "Advance my career",
] as const;

interface SuggestionButtonsProps {
  onSelect: (text: string) => void;
}

export function SuggestionButtons({ onSelect }: SuggestionButtonsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className="flex items-center gap-2 rounded-lg border border-[#dae1ed] bg-white px-4 py-2.5 text-sm transition-colors hover:bg-[#f2f5fa]"
        >
          <SparkleIcon className="h-4 w-4 text-[#0056d2]" />
          {text}
        </button>
      ))}
    </div>
  );
}
