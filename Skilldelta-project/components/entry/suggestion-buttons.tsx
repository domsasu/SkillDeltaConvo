import { SparkleIcon } from "@/components/shared/sparkle-icon";

/** Pill chips aligned with ppp-prototype-share PromptPill + reference screenshot */
export const SUGGESTION_FIND_GAPS_LABEL = "Find gaps for this role" as const;

const SUGGESTIONS = [
  SUGGESTION_FIND_GAPS_LABEL,
  "Create a learning plan",
  "Develop in-demand skills",
] as const;

interface SuggestionButtonsProps {
  onSelect: (text: string) => void;
}

export function SuggestionButtons({ onSelect }: SuggestionButtonsProps) {
  return (
    <div
      className="flex w-full min-w-0 flex-nowrap items-center gap-3 overflow-x-auto pb-[4pt] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Suggested prompts"
    >
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[#dae1ed] bg-white py-1 pl-2.5 pr-3 text-sm leading-none text-[#0f1114] transition-colors hover:bg-[#f2f5fa]"
        >
          <SparkleIcon className="h-4 w-4 shrink-0" />
          {text}
        </button>
      ))}
    </div>
  );
}
