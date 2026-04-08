---
phase: 02-conversation-chat-ui
verified: 2026-03-31T21:00:00Z
status: passed
score: 20/20 must-haves verified
human_verification:
  - test: "Open app in browser and verify entry screen renders with blue-purple gradient, 3 pill rows with scrolling, and suggestion buttons"
    expected: "Inviting entry screen with greeting text, scrolling prompt pills with sparkle icons and gradient fade, 4 suggestion buttons, and soft gradient background"
    why_human: "CSS gradient, mask-image fade, and visual layout cannot be verified programmatically"
  - test: "Type a message or click a prompt pill and confirm the transition to chat panel"
    expected: "App smoothly transitions from entry screen to chat panel (duration-500 CSS transition); chat panel shows the user message right-aligned in blue"
    why_human: "CSS transition animation and visual alignment require runtime browser rendering"
  - test: "Send a message and observe AI streaming response with typing indicator"
    expected: "Typing indicator (3 bouncing dots) appears immediately on submit, disappears when first AI token arrives, AI response streams token-by-token"
    why_human: "Streaming UX, timing of typing indicator appearance/disappearance, and token-by-token rendering require live OpenAI API call and browser observation"
  - test: "Verify contextual pills update as conversation progresses through goal/background/constraints phases"
    expected: "Pills initially show career exploration options, shift to experience prompts after goal is set, then time prompts after background is given"
    why_human: "Pill evolution depends on AI model behavior and dynamic metadata extraction at runtime"
  - test: "Scroll up in message list, then send a new message — confirm auto-scroll does NOT fire when scrolled up but DOES fire when near bottom"
    expected: "When scrolled up: new messages appear but view does not jump. When near bottom: view auto-scrolls to new messages."
    why_human: "IntersectionObserver behavior with scroll position requires live browser interaction"
---

# Phase 02: Conversation Chat UI Verification Report

**Phase Goal:** Learners can open the app, see an inviting entry screen, start a conversation, and have the AI iteratively gather their career goals, background, and constraints through natural chat
**Verified:** 2026-03-31T21:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

#### Plan 02-01: API and Types Foundation

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/chat accepts messages array and returns SSE stream with AI text tokens | VERIFIED | `src/app/api/chat/route.ts` exports POST handler using `createUIMessageStream` + `streamText` + `createUIMessageStreamResponse`; `npm run build` registers `ƒ /api/chat` as a dynamic route |
| 2 | AI response stream includes structured metadata (gathered_info, ready_for_plan, suggested_pills) | VERIFIED | Three-tier extraction: (1) `report_conversation_state` tool call, (2) inline JSON regex from text, (3) hardcoded default state — all write `data-conversation-state` data part via `writer.write()` |
| 3 | System prompt drives AI to gather career goal, background, and constraints iteratively | VERIFIED | `src/lib/prompts/system-prompt.ts` `buildSystemPrompt()` includes priority order: career goal, background/experience, constraints; readiness criteria; "ask one question at a time" guideline |
| 4 | System prompt instructs AI to provide contextual suggested_pills that evolve with conversation phase | VERIFIED | System prompt has 4 pill phases: before goal, after goal/before background, after background/before constraints, when ready_for_plan is true |
| 5 | Layout uses Source Sans 3 font instead of Geist default | VERIFIED | `src/app/layout.tsx` imports `Source_Sans_3` from `next/font/google` with `variable: '--font-source-sans'`; body uses `font-sans` |

#### Plan 02-02: Entry Screen

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | Entry screen shows centered greeting text with personalized message | VERIFIED | `src/components/entry/entry-screen.tsx` renders `h1` "Hello! I can recommend courses that fit your goals." and `p` "What do you want to learn and for what role?" centered in `max-w-[700px]` container |
| 7 | Chat input box is centered below greeting with placeholder "I want to learn..." | VERIFIED | `ChatInput` rendered inside `<div className="mt-6 w-full">` with default `placeholder="I want to learn..."` |
| 8 | Three rows of horizontally scrolling prompt pills are visible with AI sparkle icons | VERIFIED | 3 `PromptPillRow` instances with `ROW_1_PILLS` (4 items), `ROW_2_PILLS` (5 items), `ROW_3_PILLS` (4 items); `PromptPill` imports `SparkleIcon` from `shared/sparkle-icon.tsx` |
| 9 | Prompt pill rows have gradient fade at edges | VERIFIED | `PromptPillRow` applies `maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'` and `WebkitMaskImage` inline style |
| 10 | Row of suggestion buttons appears below input | VERIFIED | `SuggestionButtons` renders 4 buttons: "Create a learning plan", "Find a new career", "Develop in-demand skills", "Advance my career" — each with `SparkleIcon` |
| 11 | Background has soft blue-purple gradient | VERIFIED | Outer `div` has `style={{ background: "linear-gradient(90deg, #fff 0%, rgba(53,135,252,0.1) 33%, rgba(164,154,255,0.05) 67%, #fff 100%)" }}` |
| 12 | Clicking a prompt pill or suggestion button calls the onSend callback with the pill/button text | VERIFIED | `PromptPill.onClick={() => onSelect(pill)}`, `SuggestionButtons.onClick={() => onSelect(text)}`, both wired through `EntryScreen.onSend` prop |

#### Plan 02-03: Chat Panel and App Shell

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 13 | User messages appear right-aligned, AI messages appear left-aligned | VERIFIED | `MessageBubble` uses `clsx("flex", isUser ? "justify-end" : "justify-start")` and `isUser ? "bg-[#0056d2] text-white" : "bg-[#f2f5fa] text-gray-900"` |
| 14 | AI responses stream token-by-token as they arrive | VERIFIED | `useChat` from `@ai-sdk/react` handles streaming; route uses `streamText` + `writer.merge(result.toUIMessageStream())` |
| 15 | Typing indicator shows immediately on submit and hides when first token arrives | VERIFIED | `MessageList` renders `{status === 'submitted' && <TypingIndicator />}` — `submitted` is pre-stream state; disappears when status transitions to `streaming` |
| 16 | Message list auto-scrolls to latest message but stops when user scrolls up | VERIFIED | `MessageList` uses `IntersectionObserver` on sentinel div; `isNearBottom` state guards `scrollIntoView` in effect watching `[messages.length, status, isNearBottom]` |
| 17 | Error state shows inline error message with retry button | VERIFIED | `MessageList` renders `bg-red-50 border-red-200` card with "Something went wrong. Please try again." and "Try again" button calling `onRetry` prop |
| 18 | AI messages render markdown (bold, bullets, headers) | VERIFIED | `MessageBubble` imports `ReactMarkdown`; AI text parts rendered as `<div className="prose prose-sm max-w-none"><ReactMarkdown>{cleanText}</ReactMarkdown></div>` |
| 19 | Contextual prompt pills update based on AI suggested_pills metadata | VERIFIED | `AppShell.onData` callback extracts `suggested_pills` from `data-conversation-state` data part; fallback `useEffect` parses inline JSON from last assistant message text |
| 20 | App transitions from entry screen to chat panel on first message | VERIFIED | `AppShell.handleSend`: `if (phase === 'entry') setPhase('chatting')`; JSX renders `EntryScreen` when `phase === 'entry'`, `ChatPanel` otherwise; transition uses `duration-500 ease-out` |

**Score:** 20/20 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/types.ts` | AppPhase, GatheredInfo, ConversationStateData, ChatUIMessage | VERIFIED | All 4 types exported; `ChatUIMessage = UIMessage<never, { 'conversation-state': ConversationStateData }>` |
| `src/lib/prompts/system-prompt.ts` | buildSystemPrompt function | VERIFIED | 70-line substantive function with role, guidelines, readiness criteria, pill phases, response format |
| `src/lib/prompts/schemas.ts` | gatheredInfoSchema, conversationStateSchema | VERIFIED | Both Zod schemas exported with correct shape; inferred types also exported |
| `src/app/api/chat/route.ts` | POST handler with streaming | VERIFIED | Exports `POST` async function and `runtime = 'nodejs'`; 94 lines with three-tier metadata extraction |
| `src/components/shared/sparkle-icon.tsx` | SparkleIcon component | VERIFIED | Wraps lucide-react `Sparkles` at 16x16 with className prop |
| `src/components/entry/entry-screen.tsx` | Full entry screen layout | VERIFIED | 73 lines; imports ChatInput, PromptPillRow, SuggestionButtons; 3 pill arrays hardcoded |
| `src/components/entry/prompt-pill-row.tsx` | Horizontal scroll with gradient | VERIFIED | mask-image fade via inline style; scrollbar-hide class; maps PromptPill children |
| `src/components/entry/prompt-pill.tsx` | Individual pill with sparkle | VERIFIED | Imports SparkleIcon; h-8 button with rounded-full styling |
| `src/components/entry/suggestion-buttons.tsx` | 4 suggestion buttons | VERIFIED | SUGGESTIONS const with all 4 required strings; SparkleIcon on each |
| `src/components/chat/chat-input.tsx` | Auto-resize textarea with send | VERIFIED | `field-sizing: content`; Enter/Shift+Enter handling; Send + Mic icons; disabled state |
| `src/components/chat/message-bubble.tsx` | Role-based message rendering | VERIFIED | Renders message.parts (not message.content); ReactMarkdown for AI; JSON metadata stripped |
| `src/components/chat/message-list.tsx` | Auto-scroll with override | VERIFIED | IntersectionObserver + isNearBottom guard; TypingIndicator on submitted; error card with retry |
| `src/components/chat/typing-indicator.tsx` | 3 animated dots | VERIFIED | 3 spans with animate-bounce and staggered animationDelay (0, 150, 300ms) |
| `src/components/chat/contextual-pills.tsx` | Dynamic pills from AI metadata | VERIFIED | Returns null when empty; SparkleIcon; disabled state with pointer-events-none |
| `src/components/chat/chat-panel.tsx` | Composed chat panel | VERIFIED | Imports MessageList, ChatInput, ContextualPills; passes isBusy to disabled props |
| `src/components/app-shell.tsx` | State machine orchestrator | VERIFIED | useChat from @ai-sdk/react; onData callback; phase state; handleSend/handleRetry; CSS transition |
| `src/app/page.tsx` | AppShell entry point | VERIFIED | Server component importing and rendering `<AppShell />` — 5 lines |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/chat/route.ts` | `src/lib/prompts/system-prompt.ts` | import buildSystemPrompt | WIRED | `import { buildSystemPrompt } from "@/lib/prompts/system-prompt"` at line 12; called in `streamText({ system: buildSystemPrompt() })` |
| `src/app/api/chat/route.ts` | `src/lib/config.ts` | import getConfig | WIRED | `import { getConfig } from "@/lib/config"` at line 11; called as `const config = getConfig()` in POST handler |
| `src/app/api/chat/route.ts` | `ai` | streamText, createUIMessageStream | WIRED | `import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, tool } from "ai"` at line 3 |
| `src/components/app-shell.tsx` | `@ai-sdk/react` | useChat hook | WIRED | `import { useChat } from "@ai-sdk/react"` at line 3; used at line 42 |
| `src/components/app-shell.tsx` | `/api/chat` | useChat default endpoint | WIRED | `useChat` called without explicit `api` option; confirmed `ai` package defaults `api = "/api/chat"` at dist/index.js line 12798 — functionally equivalent to explicit `api: '/api/chat'` |
| `src/components/app-shell.tsx` | `src/components/entry/entry-screen.tsx` | import EntryScreen | WIRED | `import { EntryScreen } from "@/components/entry/entry-screen"` at line 13; rendered when `phase === 'entry'` |
| `src/components/app-shell.tsx` | `src/components/chat/chat-panel.tsx` | import ChatPanel | WIRED | `import { ChatPanel } from "@/components/chat/chat-panel"` at line 14; rendered when `phase !== 'entry'` |
| `src/components/chat/message-bubble.tsx` | `react-markdown` | ReactMarkdown for AI messages | WIRED | `import ReactMarkdown from "react-markdown"` at line 4; used in AI message rendering with prose classes |
| `src/components/entry/prompt-pill.tsx` | `src/components/shared/sparkle-icon.tsx` | import SparkleIcon | WIRED | `import { SparkleIcon } from "@/components/shared/sparkle-icon"` at line 3; rendered in pill button |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `AppShell` — `suggestedPills` | `suggestedPills` state | `onData` callback from `useChat` receiving `data-conversation-state` data part written by `/api/chat` route | Yes — populated from live AI response metadata | FLOWING |
| `AppShell` — `messages` | `messages` from `useChat` | `useChat` streams messages from `/api/chat` endpoint | Yes — streamed from OpenAI via `streamText` | FLOWING |
| `MessageBubble` — `message.parts` | `parts` array on `ChatUIMessage` | AI SDK v6 UIMessage format populated by streaming route | Yes — text parts from streaming tokens | FLOWING |
| `ContextualPills` — `pills` prop | `suggestedPills` in AppShell | Extracted from `data-conversation-state` data part (primary) or inline JSON regex (fallback) | Yes — AI-generated contextual suggestions | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compilation | `npx tsc --noEmit` | No output (zero errors) | PASS |
| Next.js build | `npm run build` | Build succeeded; `/api/chat` registered as dynamic route | PASS |
| All phase commits present | `git log --oneline` | All 6 commits verified: ddc7f05, f84845d, f618629, bdf33cf, c41587c, 6e558c1 | PASS |
| AI SDK dependencies installed | `node -e "require('./package.json').dependencies"` | ai@^6.0.142, @ai-sdk/react@^3.0.144, @ai-sdk/openai@^3.0.49, react-markdown@^10.1.0, lucide-react@^1.7.0 | PASS |
| Live API endpoint (requires server) | curl POST /api/chat | SKIPPED — server not running; TypeScript + build are primary verification | SKIP |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CHAT-01 | 02-02 | Chat input with auto-resize textarea, submit button, placeholder | SATISFIED | `chat-input.tsx` has `field-sizing: content`, Send button, `placeholder="I want to learn..."` |
| CHAT-02 | 02-03 | User (right-aligned) vs AI (left-aligned) message distinction | SATISFIED | `MessageBubble` uses `justify-end`/`justify-start` and blue/gray backgrounds — NOTE: REQUIREMENTS.md still shows `[ ]` (see note below) |
| CHAT-03 | 02-01 | Streaming text response rendered token-by-token | SATISFIED | `streamText` + `writer.merge(result.toUIMessageStream())` in route; `useChat` handles streaming on client |
| CHAT-04 | 02-01 | Typing indicator shown immediately on submit, hidden when first token arrives | SATISFIED | `{status === 'submitted' && <TypingIndicator />}` — transitions away when status changes to 'streaming' |
| CHAT-05 | 02-03 | Auto-scroll to latest message with manual override | SATISFIED | `IntersectionObserver` guards scroll with `isNearBottom` state — NOTE: REQUIREMENTS.md still shows `[ ]` (see note below) |
| CHAT-06 | 02-01 | Error handling with inline error message and "Try again" button | SATISFIED | `MessageList` renders error card with "Something went wrong" and "Try again" button calling `onRetry` |
| CHAT-07 | 02-01 | Markdown rendering in AI messages | SATISFIED | `ReactMarkdown` with `prose prose-sm` applied to all AI text parts |
| ENTRY-01 | 02-02 | Centered greeting with personalized text | SATISFIED | Greeting h1+p in `text-center` container with exact text from requirement |
| ENTRY-02 | 02-02 | Chat input centered below greeting | SATISFIED | `<ChatInput onSend={onSend} />` in `mt-6 w-full` div below greeting |
| ENTRY-03 | 02-02 | Three rows of scrolling prompt pills with sparkle icon and edge-fade gradient | SATISFIED | 3 `PromptPillRow` instances; each has mask-image gradient fade; `PromptPill` has `SparkleIcon` |
| ENTRY-04 | 02-02 | Row of suggestion buttons | SATISFIED | `SuggestionButtons` with all 4 required texts and SparkleIcon |
| ENTRY-05 | 02-02 | Soft blue-purple gradient background | SATISFIED | `linear-gradient(90deg, #fff 0%, rgba(53,135,252,0.1) 33%, rgba(164,154,255,0.05) 67%, #fff 100%)` |
| CONV-01 | 02-01 | System prompt drives iterative conversation | SATISFIED | `buildSystemPrompt()` with "ask one focused question at a time", priority order, readiness criteria |
| CONV-02 | 02-01 | AI gathers career goal as first priority | SATISFIED | System prompt priority #1: "Career goal — What role, skills, domain, or general direction" |
| CONV-03 | 02-01 | AI gathers background/experience | SATISFIED | System prompt priority #2: "Background/experience — Their current role, education, transferable skills" |
| CONV-04 | 02-01 | AI gathers constraints | SATISFIED | System prompt priority #3: "Constraints — Target timeline and weekly availability" |
| CONV-05 | 02-01 | Iterative follow-up questions until enough context | SATISFIED | `ready_for_plan: false` by default; readiness criteria require all three items before plan is ready |
| CONV-06 | 02-01 | Contextual prompt pills evolve based on conversation phase | SATISFIED | System prompt has 4 pill phases; `AppShell` updates `suggestedPills` from AI metadata via `onData`; `ContextualPills` renders them |

**Note on CHAT-02 and CHAT-05:** REQUIREMENTS.md traceability table still marks both as "Pending" and their checkboxes as `[ ]`. The actual implementations in `message-bubble.tsx` and `message-list.tsx` fully satisfy these requirements. This is a documentation inconsistency — the requirements are implemented but the tracking document was not updated.

---

### Anti-Patterns Found

No blocking anti-patterns found. Scan results:

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| All scanned `.tsx`/`.ts` files | No TODO/FIXME/placeholder stubs | — | Clean |
| `chat-input.tsx` | `placeholder` as HTML attribute name (not a stub) | Info | Expected — it is the textarea placeholder prop, not a code stub |
| `message-bubble.tsx` | `return null` for non-text parts | Info | Correct behavior — data parts are intentionally not rendered |
| `contextual-pills.tsx` | `return null` when empty array | Info | Correct behavior — guards against empty renders |

No hardcoded empty data flowing to rendering. All state variables that drive rendering (`messages`, `suggestedPills`, `gatheredInfo`) are populated from real AI streaming responses.

---

### Human Verification Required

### 1. Entry Screen Visual Layout

**Test:** Open `http://localhost:3000` in a browser
**Expected:** Full-screen blue-purple gradient background with centered greeting, chat input with mic icon, 3 rows of scrolling pills with sparkle icons and gradient fade at edges, 4 suggestion buttons below
**Why human:** CSS gradient rendering, mask-image edge fade, and scrollbar hiding require browser visual inspection

### 2. Entry-to-Chat Transition Animation

**Test:** Click any prompt pill or type and submit a message on the entry screen
**Expected:** Smooth 500ms CSS transition from centered full-screen entry view to column-layout chat panel; user message appears right-aligned in blue immediately
**Why human:** CSS transition timing and visual smoothness require browser observation

### 3. Streaming AI Response with Typing Indicator

**Test:** With `OPENAI_API_KEY` set in `.env.local`, start a conversation and observe the AI response
**Expected:** Three bouncing dots appear immediately after submit, disappear when first AI token arrives, response streams character-by-character
**Why human:** Streaming UX timing and typing indicator lifecycle require live API call and browser observation

### 4. Contextual Pills Evolution

**Test:** Have a multi-turn conversation: (1) state career goal, (2) provide background, (3) provide constraints
**Expected:** Pills shift from career exploration options ("I want to switch to data science") to experience prompts ("I have 3 years in marketing") to time prompts ("5 hours per week") to action prompts ("Generate my learning plan") as conversation progresses
**Why human:** Pill evolution depends on AI model behavior generating appropriate `suggested_pills` metadata

### 5. Auto-Scroll Manual Override

**Test:** Generate enough messages to make the list scrollable, scroll up to a past message, then send a new message
**Expected:** When scrolled up, the view stays at the current scroll position. When scroll position is near the bottom, the view auto-scrolls to the new message.
**Why human:** IntersectionObserver behavior with actual scroll interaction requires browser testing

---

### Gaps Summary

No gaps found. All 20 must-have truths are verified across all three plans. All 17 required artifacts exist, are substantive, and are correctly wired. All 9 key links are active. Data flows from OpenAI through the route handler's streaming infrastructure to the AppShell and into the component tree via `useChat`.

**One documentation inconsistency** (not a code gap): REQUIREMENTS.md marks CHAT-02 and CHAT-05 as `[ ]` Pending, but both are fully implemented in `message-bubble.tsx` and `message-list.tsx` respectively. The requirements tracking should be updated to `[x]` Complete.

**One plan deviation** (not a gap): `AppShell` uses `useChat` without explicit `api: '/api/chat'` option. The `ai` package defaults `api` to `"/api/chat"` — the behavior is identical to the plan's specified pattern. Confirmed by inspecting `node_modules/ai/dist/index.js` line 12798.

---

_Verified: 2026-03-31T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
