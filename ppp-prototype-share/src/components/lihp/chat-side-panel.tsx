"use client";

import type { ChatStatus } from "ai";
import type { AppPhase, ChatUIMessage, StructuredPillData } from "@/lib/types";
import { SparkleIcon } from "@/components/shared/sparkle-icon";
import { ChatPanel } from "@/components/chat/chat-panel";

interface ChatSidePanelProps {
  messages: ChatUIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  suggestedPills: StructuredPillData;
  phase?: AppPhase;
  isRefining?: boolean;
  planIndicators?: Map<number, "created" | "rebuilt" | "swapped">;
  stripQuestions?: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
}

export function ChatSidePanel({
  messages,
  status,
  error,
  suggestedPills,
  phase,
  isRefining,
  planIndicators,
  stripQuestions,
  onSend,
  onRetry,
}: ChatSidePanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[#dae1ed] px-4 py-3">
        <SparkleIcon className="h-5 w-5" />
        <div className="flex items-center gap-3">
          {/* Settings gear */}
          <button className="text-[#5b6780] hover:text-[#0f1114]">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16.167 10a6.19 6.19 0 01-.059.833l1.817 1.425a.433.433 0 01.1.55l-1.717 2.975a.433.433 0 01-.525.184l-2.142-.858a6.167 6.167 0 01-1.441.833l-.325 2.275a.417.417 0 01-.417.358h-3.433a.425.425 0 01-.417-.358L7.283 15.95a6.5 6.5 0 01-1.441-.833l-2.142.858a.42.42 0 01-.525-.184L1.458 12.808a.425.425 0 01.1-.55l1.817-1.425A6.317 6.317 0 013.317 10c0-.283.025-.558.058-.833L1.558 7.742a.433.433 0 01-.1-.55l1.717-2.975a.433.433 0 01.525-.184l2.142.859A6.167 6.167 0 017.283 4.05l.325-2.275A.425.425 0 018.025 1.417h3.433c.209 0 .384.15.417.358l.325 2.275c.534.217 1.017.5 1.442.834l2.141-.859a.42.42 0 01.525.184l1.717 2.975a.425.425 0 01-.1.55l-1.817 1.425c.034.275.059.55.059.833z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          {/* Close X */}
          <button className="text-[#5b6780] hover:text-[#0f1114]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel
          messages={messages}
          status={status}
          error={error}
          suggestedPills={suggestedPills}
          phase={phase}
          isRefining={isRefining}
          planIndicators={planIndicators}
          stripQuestions={stripQuestions}
          onSend={onSend}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}
