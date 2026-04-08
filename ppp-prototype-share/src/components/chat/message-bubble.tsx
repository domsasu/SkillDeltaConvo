"use client";

import type { ChatUIMessage } from "@/lib/types";
import ReactMarkdown from "react-markdown";

// Match fenced ```json { ... } ``` OR unfenced trailing { "gathered_info": ... } block
const fencedJsonRegex = /\n*```json\s*\{[\s\S]*?\}\s*```\s*$/;
const unfencedJsonRegex = /\n+\{\s*\n?\s*"gathered_info"[\s\S]*$/;
// Match unfenced trailing { "type": "single"|"multi", ... } structured pill block
const unfencedPillJsonRegex = /\n+\{\s*\n?\s*"type"\s*:\s*"(single|multi)"[\s\S]*$/;
// Match trailing JSON array of strings like ["option1", "option2"]
const trailingArrayRegex = /\n+\[[\s\n]*"[^"]*"[\s\S]*\]\s*$/;
// Match any trailing JSON object block (catches all metadata)
const trailingJsonObjectRegex = /\n+\{\s*\n?\s*"(suggested_pills|ready_for_plan|type)"[\s\S]*$/;
// Match trailing plain-text option lists: a question line followed by short option lines
// e.g. "What roles interest you?\nData Analyst\nData Scientist\n..."
const trailingOptionsListRegex = /\n+(?:Here are [^\n]*:?\n|)?(?:[A-Z][^\n]{0,60}\?\n)(?:[^\n]{1,60}\n?){2,}\s*$/;
// Match trailing numbered/bulleted option lists
// e.g. "1. Data Analyst\n2. Data Scientist\n..." or "- Data Analyst\n- Data Scientist"
const trailingNumberedListRegex = /\n+(?:\d+[\.\)]\s+[^\n]+\n?){2,}\s*$/;
const trailingBulletedListRegex = /\n+(?:[-•]\s+[^\n]+\n?){2,}\s*$/;

function stripMetadataBlock(text: string): string {
  let cleaned = text
    .replace(fencedJsonRegex, "")
    .replace(unfencedJsonRegex, "")
    .replace(unfencedPillJsonRegex, "")
    .replace(trailingArrayRegex, "")
    .replace(trailingJsonObjectRegex, "");

  // Strip plain-text option lists (question + options the AI wrote inline)
  cleaned = cleaned
    .replace(trailingOptionsListRegex, "")
    .replace(trailingNumberedListRegex, "")
    .replace(trailingBulletedListRegex, "");

  return cleaned.trimEnd();
}

function MessageActions() {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      {/* Thumbs up */}
      <button className="text-[#5b6780] hover:text-[#0f1114] p-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4.5 7v6.5h-2a1 1 0 01-1-1V8a1 1 0 011-1h2zm0 0l2.5-4.5c.83 0 1.5.67 1.5 1.5v2h4.17a1 1 0 01.98 1.2l-1 5a1 1 0 01-.98.8H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Thumbs down */}
      <button className="text-[#5b6780] hover:text-[#0f1114] p-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.5 9V2.5h2a1 1 0 011 1V8a1 1 0 01-1 1h-2zm0 0L9 13.5c-.83 0-1.5-.67-1.5-1.5v-2H3.33a1 1 0 01-.98-1.2l1-5a1 1 0 01.98-.8H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Copy */}
      <button className="text-[#5b6780] hover:text-[#0f1114] p-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3 10.5V3.5A1.5 1.5 0 014.5 2h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      {/* Refresh */}
      <button className="text-[#5b6780] hover:text-[#0f1114] p-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2.5 8a5.5 5.5 0 019.37-3.9M13.5 8a5.5 5.5 0 01-9.37 3.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M12.5 2v3h-3M3.5 14v-3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* More */}
      <button className="text-[#5b6780] hover:text-[#0056d2] p-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="8" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="13" cy="8" r="1.2" />
        </svg>
      </button>
    </div>
  );
}

export function MessageBubble({ message, activePillQuestion }: { message: ChatUIMessage; activePillQuestion?: string }) {
  const isUser = message.role === "user";

  if (isUser) {
    // Hide system-triggered messages
    const textContent = message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("");
    if (textContent.trim() === "Generate my learning plan") return null;

    // [EXPLORE] messages — show as a system notification, not a user bubble
    const exploreMatch = textContent.match(/^\[EXPLORE\] Explore alternatives for "(.+?)" in "(.+?)"/);
    if (exploreMatch) {
      return (
        <div className="flex items-center gap-2 py-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M2.5 8a5.5 5.5 0 019.37-3.9M13.5 8a5.5 5.5 0 01-9.37 3.9" stroke="#0056d2" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M12.5 2v3h-3M3.5 14v-3h3" stroke="#0056d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm text-[#5b6780]">
            Exploring alternatives for <strong className="text-[#0f1114]">{exploreMatch[1]}</strong>
          </span>
        </div>
      );
    }

    // Strip system prefixes from displayed text
    let displayText = textContent;
    const currentPlanMatch = displayText.match(/^\[Current Plan\]\n[\s\S]*\n\n([\s\S]+)$/);
    if (currentPlanMatch) {
      displayText = currentPlanMatch[1];
    }
    const removeMatch = displayText.match(/^\[REMOVE\] Remove "(.+?)" from "(.+?)"/);
    if (removeMatch) {
      displayText = `Removed ${removeMatch[1]} from ${removeMatch[2]}`;
    }

    return (
      <div className="flex justify-end">
        <div className="rounded-2xl bg-[#f0f6ff] px-4 py-3 text-sm text-[#0f1114]">
          {displayText}
        </div>
      </div>
    );
  }

  // For multi-step tool calling, the AI produces multiple text parts in one message.
  // Only show the last non-empty text part to avoid back-to-back blocks.
  const textParts = message.parts
    .map((part, i) => ({ part, index: i }))
    .filter(({ part }) => part.type === "text")
    .map(({ part, index }) => ({
      index,
      text: part.type === "text" ? stripMetadataBlock(part.text) : "",
    }))
    .filter(({ text }) => text.length > 0);

  const lastTextPart = textParts.length > 0 ? textParts[textParts.length - 1] : null;

  if (!lastTextPart) return null;

  // When pills are active, strip the trailing question sentence from the message
  // to avoid duplication with the choice card. Keep the acknowledgment portion.
  // If nothing remains, hide the bubble entirely.
  let displayText = lastTextPart.text;
  if (activePillQuestion) {
    // Remove the last sentence ending with "?" — handles all separator styles
    // (period, semicolon, dash, or standalone question)
    const stripped = displayText
      .replace(/[.;,—–\-]?\s*[A-Z][^.!?]*\?\s*$/, "")
      .replace(/[;,—–\-]\s*$/, "") // clean trailing separators
      .trimEnd();
    displayText = stripped || "";
    if (!displayText) return null;
  }

  return (
    <div className="text-[#0f1114]">
      <div
        className="prose max-w-none text-[#0f1114] prose-headings:text-[#0f1114] prose-strong:text-[#0f1114] prose-p:text-[#0f1114] prose-li:text-[#0f1114] prose-p:leading-relaxed prose-li:leading-relaxed prose-ul:my-2 prose-p:my-2"
      >
        <ReactMarkdown>{displayText}</ReactMarkdown>
      </div>
      <MessageActions />
    </div>
  );
}
