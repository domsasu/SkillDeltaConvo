"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatStatus } from "ai";
import type { AppPhase, ChatUIMessage, StructuredPillData } from "@/lib/types";
import { MessageList } from "@/components/chat/message-list";
import { ContextualPills } from "@/components/chat/contextual-pills";
import { ChatInput } from "@/components/chat/chat-input";

interface ChatPanelProps {
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

export function ChatPanel({
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
}: ChatPanelProps) {
  const isBusy = status === "submitted" || status === "streaming";
  const hasPills = suggestedPills.options.length > 0;
  const [pillsDismissed, setPillsDismissed] = useState(false);
  const prevPillsRef = useRef(suggestedPills);

  // Reset dismissed state when new pills arrive
  useEffect(() => {
    if (prevPillsRef.current !== suggestedPills) {
      setPillsDismissed(false);
      prevPillsRef.current = suggestedPills;
    }
  }, [suggestedPills]);

  const showPills = hasPills && !pillsDismissed;

  return (
    <div className="flex h-full flex-col">
      {/* Messages area — takes remaining space, shrinks when choice card needs room */}
      <div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden px-2">
        <MessageList
          messages={messages}
          status={status}
          error={error}
          phase={phase}
          isRefining={isRefining}
          planIndicators={planIndicators}
          hasPills={showPills}
          stripQuestions={stripQuestions}
          activePillQuestion={stripQuestions && showPills ? suggestedPills.question : undefined}
          onRetry={onRetry}
        />
      </div>

      {/* Bottom bar: choice card when options available, otherwise chat input */}
      <div className={showPills
        ? "flex min-h-0 max-h-[65%] shrink flex-col border-t border-[#dae1ed] px-2 py-3"
        : "shrink-0 border-t border-[#dae1ed] px-2 py-3"
      }>
        {showPills ? (
          <ContextualPills
            pills={suggestedPills}
            onSelect={onSend}
            onDismiss={() => setPillsDismissed(true)}
            disabled={isBusy}
          />
        ) : (
          <ChatInput
            onSend={onSend}
            disabled={isBusy}
            placeholder={phase === "plan_generated" ? "Ask about selected courses..." : undefined}
          />
        )}
      </div>
    </div>
  );
}
