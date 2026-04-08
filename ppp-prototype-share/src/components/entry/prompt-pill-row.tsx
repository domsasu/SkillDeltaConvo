"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PromptPill } from "@/components/entry/prompt-pill";

const SCROLL_SPEED_PX_PER_MS = 0.01; // 10px per second — matches production
const DEFAULT_SCROLL_DURATION_MS = 200_000;
const FADE_WIDTH_PX = 48;

interface PromptPillRowProps {
  pills: string[];
  onSelect: (text: string) => void;
  direction?: "left" | "right";
  isPaused?: boolean;
}

export function PromptPillRow({
  pills,
  onSelect,
  direction = "left",
  isPaused: externalPaused = false,
}: PromptPillRowProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [durationMs, setDurationMs] = useState(DEFAULT_SCROLL_DURATION_MS);
  const stripRef = useRef<HTMLDivElement>(null);

  // Measure strip width post-render and derive animation duration from target speed
  useEffect(() => {
    if (!stripRef.current) return;
    const oneLoopWidth = stripRef.current.scrollWidth / 2;
    setDurationMs(oneLoopWidth / SCROLL_SPEED_PX_PER_MS);
  }, [pills]);

  const isPaused = externalPaused || isSelected;

  const handlePillClick = useCallback(
    (pill: string) => {
      setIsSelected(true);
      onSelect(pill);
    },
    [onSelect]
  );

  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage: `linear-gradient(to right, transparent 0px, black ${FADE_WIDTH_PX}px, black calc(100% - ${FADE_WIDTH_PX}px), transparent 100%)`,
        WebkitMaskImage: `linear-gradient(to right, transparent 0px, black ${FADE_WIDTH_PX}px, black calc(100% - ${FADE_WIDTH_PX}px), transparent 100%)`,
      }}
    >
      <div
        ref={stripRef}
        className="flex w-max gap-3"
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden",
          animationName: `scroll-${direction}`,
          animationDuration: `${durationMs}ms`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {/* Duplicate pills for seamless loop */}
        {[...pills, ...pills].map((pill, i) => (
          <PromptPill
            key={`${pill}-${i}`}
            text={pill}
            onClick={() => handlePillClick(pill)}
          />
        ))}
      </div>
    </div>
  );
}
