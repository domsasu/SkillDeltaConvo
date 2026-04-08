"use client";

import { useState, useCallback } from "react";
import type { StructuredPillData } from "@/lib/types";
import clsx from "clsx";

interface StructuredChoiceCardProps {
  data: StructuredPillData;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function StructuredChoiceCard({
  data,
  onSend,
  disabled,
}: StructuredChoiceCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(),
  );
  const [freeformText, setFreeformText] = useState("");
  const [visible, setVisible] = useState(true);
  const [removed, setRemoved] = useState(false);

  const isMulti = data.type === "multi";
  // Last option is treated as the "Other" / freeform option
  const mainOptions = data.options.slice(0, -1);
  const otherLabel = data.options[data.options.length - 1] ?? "Something else";

  const hasSelection = selectedOptions.size > 0 || freeformText.trim() !== "";

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const handleToggleOption = useCallback(
    (option: string) => {
      if (isMulti) {
        setSelectedOptions((prev) => {
          const next = new Set(prev);
          if (next.has(option)) next.delete(option);
          else next.add(option);
          return next;
        });
      } else {
        // Single choice: select and immediately send
        onSend(option);
        setVisible(false);
      }
    },
    [isMulti, onSend],
  );

  const handleSave = useCallback(() => {
    const parts: string[] = [...selectedOptions];
    if (freeformText.trim()) parts.push(freeformText.trim());
    if (parts.length === 0) return;
    onSend(parts.join(", "));
    setVisible(false);
  }, [selectedOptions, freeformText, onSend]);

  const handleSkip = useCallback(() => {
    onSend("Skip for now");
    setVisible(false);
  }, [onSend]);

  const handleTransitionEnd = useCallback(() => {
    if (!visible) setRemoved(true);
  }, [visible]);

  if (removed) return null;

  return (
    <div
      className={clsx(
        "flex min-h-0 flex-1 flex-col transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0",
      )}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="flex max-h-full flex-col rounded-2xl border border-[#dae1ed] bg-white shadow-[0px_4px_7.4px_1px_rgba(0,0,0,0.1)]">
        {/* Header */}
        <div className="shrink-0 px-4 pt-5">
          {data.question && (
            <p className="text-base font-semibold leading-5 tracking-tight text-[#0f1114]">
              {data.question}
            </p>
          )}
        </div>

        {/* Scrollable options list */}
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col">
            {mainOptions.map((option, idx) => {
              const isSelected = selectedOptions.has(option);

              if (isMulti) {
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => handleToggleOption(option)}
                    disabled={disabled}
                    className="flex w-full cursor-pointer items-center gap-2 border-b border-[#dae1ed] px-2 py-3 text-left"
                  >
                    <span
                      className={clsx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors duration-100",
                        isSelected
                          ? "border-[#0056d2] bg-[#0056d2]"
                          : "border-[#8495b0]",
                      )}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-base text-[#0f1114]">{option}</span>
                  </button>
                );
              }

              // Single choice — numbered badge
              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => handleToggleOption(option)}
                  disabled={disabled}
                  className={clsx(
                    "flex w-full cursor-pointer items-center gap-2 border-b border-[#dae1ed] px-2 py-3 text-left transition-colors duration-100",
                    isSelected && "bg-[#f2f5fa]",
                  )}
                >
                  <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded bg-[#f2f5fa] text-xs font-semibold text-[#0f1114]">
                    {idx + 1}
                  </span>
                  <span className="text-base text-[#0f1114]">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* "Other" / freeform row — pinned below scroll area */}
        <div className="shrink-0 border-b border-[#dae1ed] px-4">
          <div className="flex items-center gap-2 px-2 py-3">
            {isMulti ? (
              <>
                <span
                  className={clsx(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors duration-100",
                    freeformText.trim()
                      ? "border-[#0056d2] bg-[#0056d2]"
                      : "border-[#8495b0]",
                  )}
                >
                  {freeformText.trim() && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="text"
                  value={freeformText}
                  onChange={(e) => setFreeformText(e.target.value)}
                  placeholder={otherLabel}
                  disabled={disabled}
                  className="flex-1 bg-transparent text-base text-[#0f1114] placeholder-[#5b6780] focus:outline-none"
                />
              </>
            ) : (
              <>
                <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded bg-[#f2f5fa]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10.9866 5.48355C11.6314 4.83882 12.6767 4.83882 13.3214 5.48355L14.5165 6.67859C15.1612 7.32331 15.1612 8.36862 14.5165 9.01335L8.69099 14.8388C8.58779 14.942 8.44781 15 8.30186 15H5.55031C5.24638 15 5 14.7536 5 14.4497V11.6981C5 11.5522 5.05798 11.4122 5.16118 11.309L10.9866 5.48355ZM12.5432 6.2618C12.3283 6.04689 11.9798 6.04689 11.7649 6.2618L11.2814 6.74535L13.2547 8.71864L13.7382 8.2351C13.9531 8.02019 13.9531 7.67175 13.7382 7.45684L12.5432 6.2618ZM12.4764 9.4969L10.5031 7.5236L6.10062 11.9261V13.8994H8.07391L12.4764 9.4969Z" fill="#6D7C99"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={freeformText}
                  onChange={(e) => setFreeformText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && freeformText.trim()) {
                      onSend(freeformText.trim());
                      setVisible(false);
                    }
                  }}
                  placeholder={otherLabel}
                  disabled={disabled}
                  className="flex-1 bg-transparent text-base text-[#0f1114] placeholder-[#5b6780] focus:outline-none"
                />
              </>
            )}
          </div>
        </div>

        {/* Bottom action row — always visible */}
        <div className="flex shrink-0 items-center justify-between px-4 py-5">
          <button
            type="button"
            onClick={handleSkip}
            disabled={disabled}
            className="cursor-pointer text-sm font-semibold text-[#0056d2] hover:underline"
          >
            Skip For Now
          </button>
          {isMulti && (
            <button
              type="button"
              onClick={handleSave}
              disabled={disabled || !hasSelection}
              className={clsx(
                "cursor-pointer rounded-md bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white transition-colors",
                hasSelection && !disabled
                  ? "hover:bg-[#0048b0]"
                  : "opacity-50 cursor-not-allowed",
              )}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
