
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatStatus } from "ai";
import type { AppPhase, ChatUIMessage } from "@/lib/types";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { SparkleIcon } from "@/components/shared/sparkle-icon";
import { SuggestionButtons } from "@/components/entry/suggestion-buttons";

function PlanGeneratingIndicator() {
  return (
    <div className="flex items-center gap-2 py-2">
      <SparkleIcon className="h-4 w-4 shrink-0" />
      <span
        className="text-sm font-medium text-[#0056d2]"
        style={{ animation: "pulseOpacity 1.5s ease-in-out infinite" }}
      >
        Creating your learning plan...
      </span>
    </div>
  );
}

function PlanUpdatingIndicator() {
  return (
    <div className="flex items-center gap-2 py-2">
      <SparkleIcon className="h-4 w-4 shrink-0" />
      <span
        className="text-sm font-medium text-[#0056d2]"
        style={{ animation: "pulseOpacity 1.5s ease-in-out infinite" }}
      >
        Updating your learning plan...
      </span>
    </div>
  );
}

function PlanCreatedIndicator() {
  return (
    <div className="flex items-center gap-2 py-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <circle cx="8" cy="8" r="7" fill="#0056d2" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium text-[#0056d2]">
        Learning plan created
      </span>
    </div>
  );
}

function PlanUpdatedIndicator() {
  return (
    <div className="flex items-center gap-2 py-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <circle cx="8" cy="8" r="7" fill="#16a34a" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium text-[#16a34a]">
        Updated learning plan
      </span>
    </div>
  );
}

function RecommendationUpdatedIndicator() {
  return (
    <div className="flex items-center gap-2 py-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <circle cx="8" cy="8" r="7" fill="#16a34a" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium text-[#16a34a]">
        Recommendation updated
      </span>
    </div>
  );
}

export function MessageList({
  messages,
  status,
  error,
  phase,
  isRefining,
  planIndicators,
  hasPills,
  stripQuestions,
  activePillQuestion,
  onRetry,
  onQuickPrompt,
  pendingLocalReply,
}: {
  messages: ChatUIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  phase?: AppPhase;
  isRefining?: boolean;
  planIndicators?: Map<number, "created" | "rebuilt" | "swapped">;
  hasPills?: boolean;
  stripQuestions?: boolean;
  activePillQuestion?: string;
  onRetry?: () => void;
  /** Starter prompts: pinned footer below scroll when the thread is empty */
  onQuickPrompt?: (text: string) => void;
  /** Show typing dots (e.g. while a client-side reply is delayed) */
  pendingLocalReply?: boolean;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Track whether the sentinel (bottom of list) is visible
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearBottom(entry.isIntersecting);
      },
      { root: scrollContainerRef.current, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Pin thread to bottom (instant) — avoids smooth-scroll jank with typing indicators and inline widgets
  const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : "";
  useLayoutEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;
    root.scrollTop = root.scrollHeight;
  }, [messages.length, lastMsgId, status, pendingLocalReply]);

  const showStarterPrompts =
    messages.length === 0 &&
    onQuickPrompt &&
    status !== "submitted" &&
    status !== "streaming";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* Scrollable messages only — suggestions sit in footer below */}
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 pt-6"
      >
        <div className="space-y-6">
          {messages.map((msg, idx) => {
            const indicator = planIndicators?.get(idx);
            // Strip the question from the last assistant message when:
            // 1. Pills are showing with an exact question to match, OR
            // 2. stripQuestions is on and this is the last assistant message
            //    (strips proactively during streaming before pills arrive)
            const isLastAssistant = msg.role === "assistant" &&
              !messages.slice(idx + 1).some((m) => m.role === "assistant");
            let pillQ: string | undefined;
            if (isLastAssistant && hasPills && activePillQuestion) {
              pillQ = activePillQuestion;
            } else if (isLastAssistant && stripQuestions && !hasPills &&
              (status === "streaming" || status === "submitted")) {
              // Proactive strip during streaming — prevents flash before pills arrive
              pillQ = "__strip__";
            }

            return (
              <div key={msg.id}>
                {indicator && !isRefining && (
                  indicator === "created" ? <PlanCreatedIndicator /> :
                  indicator === "swapped" ? <RecommendationUpdatedIndicator /> :
                  <PlanUpdatedIndicator />
                )}
                <MessageBubble message={msg} activePillQuestion={pillQ} />
              </div>
            );
          })}

          {/* In-chat loading states */}
          {(status === "submitted" || pendingLocalReply) &&
            phase !== "plan_generating" &&
            !isRefining && <TypingIndicator />}
          {phase === "plan_generating" && <PlanGeneratingIndicator />}
          {isRefining && <PlanUpdatingIndicator />}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                Something went wrong. Please try again.
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-1 cursor-pointer text-sm text-red-600 underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sentinel element for IntersectionObserver */}
        <div ref={sentinelRef} aria-hidden="true" />
      </div>

      {showStarterPrompts && (
        <div className="-mx-2 min-w-0 shrink-0 pl-2 pr-0.5 pb-0.5 pt-3">
          <SuggestionButtons onSelect={onQuickPrompt} />
        </div>
      )}
    </div>
  );
}
