"use client";

import { useCallback, useState } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { Header } from "@/components/shared/header";
import { PromptPillRow } from "@/components/entry/prompt-pill-row";

const ROW_1_PILLS = [
  "I want to switch careers into technology",
  "Figma for UI/UX designers",
  "Project Management for managers",
  "Coding practice for beginners",
  "I want to switch careers into technology",
  "Figma for UI/UX designers",
  "Project Management for managers",
];

const ROW_2_PILLS = [
  "AI tools",
  "Public speaking for leaders",
  "AWS for cloud architects",
  "SQL for data analysts",
  "Coding for designers",
  "AI tools",
  "Public speaking for leaders",
  "AWS for cloud architects",
  "SQL for data analysts",
  "Coding for designers",
];

const ROW_3_PILLS = [
  "Language learning for fun",
  "Prompting for designers",
  "Python for building apps",
  "Start my career as an engineer",
  "Help me decide",
  "Language learning for fun",
  "Prompting for designers",
  "Python for building apps",
  "Start my career as an engineer",
  "Help me decide",
];

interface EntryScreenProps {
  onSend: (text: string) => void;
}

export function EntryScreen({ onSend }: EntryScreenProps) {
  const [isPillsHovered, setIsPillsHovered] = useState(false);
  const handlePillsMouseEnter = useCallback(() => setIsPillsHovered(true), []);
  const handlePillsMouseLeave = useCallback(() => setIsPillsHovered(false), []);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div
        className="flex flex-1 items-center justify-center"
        style={{
          background:
            "linear-gradient(90deg, #fff 0%, rgba(53,135,252,0.1) 33%, rgba(164,154,255,0.05) 67%, #fff 100%)",
        }}
      >
        <div className="flex w-full max-w-[746px] flex-col items-center px-4">
          {/* Greeting */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold leading-7 tracking-tight text-[#0f1114]">
              Hello! I can recommend courses that fit your goals.
            </h1>
            <p className="mt-1 text-2xl font-semibold leading-7 tracking-tight text-[#0f1114]">
              What do you want to learn and for what role?
            </p>
          </div>

          {/* Chat Input */}
          <div className="mt-6 w-full">
            <ChatInput onSend={onSend} />
          </div>

          {/* Prompt Pill Rows — wider than input to match Figma */}
          <div
            className="mt-6 w-[calc(100%+300px)] max-w-[1030px] space-y-3"
            onMouseEnter={handlePillsMouseEnter}
            onMouseLeave={handlePillsMouseLeave}
          >
            <PromptPillRow pills={ROW_1_PILLS} onSelect={onSend} direction="left" isPaused={isPillsHovered} />
            <PromptPillRow pills={ROW_2_PILLS} onSelect={onSend} direction="left" isPaused={isPillsHovered} />
            <PromptPillRow pills={ROW_3_PILLS} onSelect={onSend} direction="left" isPaused={isPillsHovered} />
          </div>

        </div>
      </div>
    </div>
  );
}
