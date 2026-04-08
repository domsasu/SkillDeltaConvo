
import { useState, useEffect, useRef } from "react";
import { StructuredChoiceCard } from "@/components/chat/structured-choice-card";
import type { StructuredPillData } from "@/lib/types";

export function ContextualPills({
  pills,
  onSelect,
  onDismiss,
  disabled,
}: {
  pills: StructuredPillData;
  onSelect: (text: string) => void;
  onDismiss?: () => void;
  disabled?: boolean;
}) {
  const [showCard, setShowCard] = useState(true);
  const prevPillsRef = useRef(pills);

  // Reset showCard when pills changes
  useEffect(() => {
    if (prevPillsRef.current !== pills) {
      setShowCard(true);
      prevPillsRef.current = pills;
    }
  }, [pills]);

  if (!showCard || pills.options.length === 0) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StructuredChoiceCard
        data={pills}
        onSend={(text) => {
          setShowCard(false);
          onDismiss?.();
          onSelect(text);
        }}
        disabled={disabled}
      />
    </div>
  );
}
