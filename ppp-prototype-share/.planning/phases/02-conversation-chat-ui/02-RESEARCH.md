# Phase 2: Conversation & Chat UI - Research

**Researched:** 2026-03-31
**Domain:** Streaming chat UI with Vercel AI SDK v6, Next.js 15 App Router, OpenAI integration
**Confidence:** HIGH

## Summary

Phase 2 builds the complete chat experience: entry screen with prompt pills, streaming AI conversation, and the conversation flow that gathers learner career goals, background, and constraints. The key technical decisions are locked: Vercel AI SDK with useChat + streamText, SSE from Route Handlers, hybrid conversation state with structured metadata alongside text, React Context + useReducer for plan state, and CSS transition for entry-to-chat.

**Critical finding:** The Vercel AI SDK is now at **v6.0.142** (not v4.x as assumed in earlier research). The API has changed significantly -- `useChat` now uses `UIMessage` (not `Message`), `sendMessage()` replaces `handleSubmit`, `toUIMessageStreamResponse()` replaces `toDataStreamResponse()`, and messages use a `parts` array instead of a `content` string. The `@ai-sdk/react` package (v3.0.144) is now a separate peer dependency. All code patterns in this research reflect the v6 API.

**Primary recommendation:** Use AI SDK v6's data parts system to implement the hybrid metadata pattern (D-09). Define custom data part types for `gathered_info`, `ready_for_plan`, and `suggested_pills`, and stream them alongside text using `createUIMessageStream` with `writer.write()`. This is the first-class v6 pattern for exactly this use case.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Server-Sent Events (SSE) from Next.js Route Handlers for AI response streaming. Amplify does NOT support Next.js edge streaming, but SSE from standard compute Route Handlers works.
- **D-02:** Use Vercel AI SDK (`ai` package) with `useChat` hook for client-side chat state and SSE handling. Server-side uses `streamText` from `@ai-sdk/openai`.
- **D-03:** Hybrid conversation state -- AI manages flow naturally but returns structured metadata (`gathered_info`, `ready_for_plan`, `suggested_pills`) alongside chat text. Frontend uses metadata to update UI state (prompt pills, transition triggers).
- **D-04:** Plan state (separate from chat) managed via React Context + useReducer. No external state library needed for prototype scope.
- **D-05:** Chat message state managed by AI SDK's `useChat` hook (handles messages array, streaming state, error state).
- **D-06:** CSS transition on same component -- no route change. Greeting fades up, chat panel slides in. Single-page state machine: `entry` -> `chatting` -> `ready_for_plan`. CSS grid/flexbox animation.
- **D-07:** Structured system prompt with clear phases (goal -> background -> constraints) and specific question templates per phase. Predictable and testable for user testing.
- **D-08:** AI decides readiness based on information quality, not fixed turn count. Could be 1 turn (if user gives a detailed prompt pill like "Start my career as an engineer") or 5 turns (if user is exploratory). System prompt defines what "enough context" means.
- **D-09:** AI returns structured metadata alongside each message: `{ gathered_info: { goal?, background?, constraints? }, ready_for_plan: boolean, suggested_pills: string[] }`. This drives UI state transitions and contextual pill updates.

### Claude's Discretion
- Exact CSS animation timing and easing for entry -> chat transition
- Typing indicator implementation (dots, shimmer, or text pulse)
- Auto-scroll behavior details (threshold, smooth vs instant)
- Markdown rendering library choice (react-markdown, marked, or similar)
- Error retry UX details (inline button style, message preservation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-01 | Chat input with auto-resize textarea, submit button, placeholder text | AI SDK v6 useChat `sendMessage()` + standard textarea with resize handler |
| CHAT-02 | Message history with user (right) / AI (left) distinction | UIMessage `parts` array rendering with role-based styling |
| CHAT-03 | Streaming text response rendered token-by-token | AI SDK v6 streamText + toUIMessageStreamResponse SSE streaming |
| CHAT-04 | Typing indicator shown on submit, hidden on first token | useChat `status` field: 'submitted' -> 'streaming' transition |
| CHAT-05 | Auto-scroll with manual override on scroll-up | Standard scroll container with intersection observer pattern |
| CHAT-06 | Error handling with inline error and retry button | useChat `status: 'error'` + `error` object + message preservation |
| CHAT-07 | Markdown rendering in AI messages | react-markdown v10 for safe rendering |
| ENTRY-01 | Centered greeting with personalized text | Static server-rendered greeting, CSS transition to chat state |
| ENTRY-02 | Chat input centered below greeting | Same ChatInput component, repositioned via CSS grid |
| ENTRY-03 | Three rows scrolling prompt pills with AI sparkle and edge fade | Horizontal scroll containers with CSS mask-image gradient |
| ENTRY-04 | Suggestion buttons row | Static button row with click -> sendMessage integration |
| ENTRY-05 | Soft blue-purple gradient background | CSS linear-gradient from CONTEXT.md specifics section |
| CONV-01 | System prompt for iterative conversation | Structured system prompt with phase-aware guidance |
| CONV-02 | AI gathers career goal first | System prompt priority ordering + gathered_info.goal tracking |
| CONV-03 | AI gathers background/experience | System prompt second priority + gathered_info.background |
| CONV-04 | AI gathers constraints (duration, availability) | System prompt third priority + gathered_info.constraints |
| CONV-05 | Iterative conversation until enough context | ready_for_plan boolean in metadata data part |
| CONV-06 | Contextual prompt pills that evolve | suggested_pills data part updated per AI response |

</phase_requirements>

## Standard Stack

### Core (New for Phase 2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.0.142 | AI SDK core: streamText, UIMessage, convertToModelMessages, createUIMessageStream | v6 is current stable; provides streaming, data parts, message metadata, SSE protocol out of the box |
| `@ai-sdk/react` | ^3.0.144 | useChat hook (separate package in v6) | Manages chat state, streaming status, error handling, message array |
| `@ai-sdk/openai` | ^3.0.49 | OpenAI provider adapter | Connects AI SDK to OpenAI API for gpt-4.1-mini / gpt-4o |
| `react-markdown` | ^10.1.0 | Markdown rendering in AI messages | Safe markdown rendering without dangerouslySetInnerHTML; v10 is current |

### Already Installed (Phase 1)

| Library | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.5.14 | App Router framework |
| `react` / `react-dom` | ^19.2.4 | UI library |
| `zod` | ^4.3.6 | Schema validation (reuse for data part types) |
| `clsx` | ^2.1.1 | Conditional class merging |
| `tailwindcss` | ^4 | Styling |

### Discretionary Additions

| Library | Version | Purpose | Recommendation |
|---------|---------|---------|----------------|
| `lucide-react` | ^1.7.0 | Icons (sparkle, send, microphone, etc.) | USE -- tree-shakeable, consistent design |
| `nanoid` | ^5.1 | ID generation for messages if needed | SKIP -- AI SDK generates message IDs |

### Not Needed

| Library | Why Skip |
|---------|----------|
| `zustand` | D-04 locks plan state to React Context + useReducer; AI SDK useChat owns chat state |
| `framer-motion` | D-06 locks transitions to CSS; prototype timeline favors CSS grid transitions over animation library |
| `openai` (direct SDK) | AI SDK v6 wraps OpenAI completely via @ai-sdk/openai; no direct SDK needed for Phase 2 |

**Installation:**
```bash
npm install ai @ai-sdk/react @ai-sdk/openai react-markdown lucide-react
```

## Architecture Patterns

### Project Structure (Phase 2 Additions)

```
src/
  app/
    page.tsx                    # Renders AppShell (client component)
    api/
      chat/
        route.ts                # POST: streamText + metadata via createUIMessageStream
      courses/
        search/
          route.ts              # (existing from Phase 1)
  components/
    app-shell.tsx               # 'use client' - state machine: entry | chatting | ready_for_plan
    entry/
      entry-screen.tsx          # Greeting, prompt pills, suggestion buttons
      prompt-pill-row.tsx       # Single horizontally scrolling row with gradient fade
      prompt-pill.tsx           # Individual pill with sparkle icon
      suggestion-buttons.tsx    # Row of suggestion buttons
    chat/
      chat-panel.tsx            # Message list + input + contextual pills
      chat-input.tsx            # Auto-resize textarea + send button
      message-list.tsx          # Scrollable message container with auto-scroll
      message-bubble.tsx        # Single message: user or AI, renders parts
      typing-indicator.tsx      # Animated dots shown during 'submitted' status
      contextual-pills.tsx      # Dynamic pills from AI suggested_pills
    shared/
      sparkle-icon.tsx          # AI sparkle SVG (from Coursera design system ref)
  lib/
    config.ts                   # (existing)
    coursera-client.ts          # (existing)
    prompts/
      system-prompt.ts          # Conversation system prompt with phase guidance
      schemas.ts                # Zod schemas for gathered_info metadata
    types.ts                    # Shared types: AppPhase, GatheredInfo, ConversationMetadata
  contexts/
    plan-context.tsx            # React Context + useReducer for plan state (D-04)
```

### Pattern 1: AI SDK v6 Chat Route Handler with Data Parts

**What:** Use `createUIMessageStream` to stream text AND structured metadata to the client.
**When:** Every chat interaction -- the route handler streams AI text tokens and writes data parts for `gathered_info`, `ready_for_plan`, and `suggested_pills`.

```typescript
// app/api/chat/route.ts
import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { buildSystemPrompt } from '@/lib/prompts/system-prompt';
import type { ChatUIMessage } from '@/lib/types';

export async function POST(req: Request) {
  const { messages }: { messages: ChatUIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: ({ writer }) => {
      const result = streamText({
        model: openai('gpt-4.1-mini'),
        system: buildSystemPrompt(),
        messages: modelMessages,
        onFinish({ text }) {
          // Parse structured metadata from the AI response
          // (extracted from a JSON block in the response, or via tool call)
          const metadata = extractMetadata(text);

          writer.write({
            type: 'data-conversation-state',
            id: `state-${Date.now()}`,
            data: {
              gathered_info: metadata.gathered_info,
              ready_for_plan: metadata.ready_for_plan,
              suggested_pills: metadata.suggested_pills,
            },
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

### Pattern 2: useChat with Custom Data Part Types

**What:** Type-safe data parts for conversation metadata on the client.
**When:** Client reads AI responses and updates UI state based on metadata.

```typescript
// lib/types.ts
import type { UIMessage } from 'ai';

export type AppPhase = 'entry' | 'chatting' | 'ready_for_plan';

export type GatheredInfo = {
  goal?: string;
  background?: string;
  constraints?: string;
};

export type ConversationStateData = {
  gathered_info: GatheredInfo;
  ready_for_plan: boolean;
  suggested_pills: string[];
};

export type ChatUIMessage = UIMessage<
  never,
  { 'conversation-state': ConversationStateData }
>;
```

```typescript
// In app-shell.tsx (client component)
import { useChat } from '@ai-sdk/react';
import type { ChatUIMessage } from '@/lib/types';

const { messages, sendMessage, status, error } = useChat<ChatUIMessage>({
  api: '/api/chat',
  onData(dataPart) {
    if (dataPart.type === 'data-conversation-state') {
      // Update plan context with gathered info
      if (dataPart.data.ready_for_plan) {
        setPhase('ready_for_plan');
      }
      setSuggestedPills(dataPart.data.suggested_pills);
    }
  },
});
```

### Pattern 3: Entry-to-Chat CSS Grid Transition (D-06)

**What:** Single component with CSS grid that transitions from entry layout to chat layout.
**When:** User sends first message or clicks a prompt pill.

```typescript
// app-shell.tsx
<div className={clsx(
  'grid h-screen transition-all duration-500 ease-out',
  phase === 'entry' && 'place-items-center grid-rows-[1fr]',
  phase !== 'entry' && 'grid-rows-[1fr_auto]',
)}>
  {phase === 'entry' && <EntryScreen onSend={handleFirstMessage} />}
  {phase !== 'entry' && <ChatPanel messages={messages} />}
</div>
```

**Recommendation for timing/easing (discretion):** `duration-500` with `ease-out` provides a smooth, non-jarring transition. Entry greeting fades with `opacity` transition (300ms), chat panel slides up from below with `translate-y` (500ms).

### Pattern 4: Structured System Prompt with Metadata Instruction

**What:** System prompt instructs the AI to include a JSON metadata block at the end of each response.
**When:** Every AI response must include structured metadata for UI state updates.

The simplest pattern for a prototype: instruct the AI via system prompt to end each response with a fenced JSON block that the server parses before forwarding text to the client.

```typescript
// lib/prompts/system-prompt.ts
export function buildSystemPrompt(): string {
  return `You are a learning plan assistant for Coursera Plus learners.

Your goal is to gather enough context to create a personalized learning plan.
Gather information in this priority order:
1. Career goal (role, skills, domain, or vague direction)
2. Background/experience (current role, transferable skills)
3. Constraints (target duration, hours per week)

## Conversation Guidelines
- Be warm, conversational, and encouraging
- Ask one focused question at a time
- If the user gives detailed context upfront, skip unnecessary questions
- Acknowledge what the user shared before asking the next question

## Readiness
Set ready_for_plan to true when you have:
- A clear career goal or learning direction
- At least a basic sense of their background
- Duration/availability info OR reasonable defaults to suggest

## Response Format
After your conversational text, include a metadata block:
\`\`\`json
{
  "gathered_info": {
    "goal": "string or null",
    "background": "string or null",
    "constraints": "string or null"
  },
  "ready_for_plan": false,
  "suggested_pills": ["pill text 1", "pill text 2", "pill text 3"]
}
\`\`\`

IMPORTANT: The suggested_pills should be contextual to the current conversation state.
- Before goal is gathered: career exploration prompts
- After goal, before background: experience-related prompts
- After background: constraint-related prompts ("5 hours per week", "Finish in 6 months")
- When ready_for_plan is true: refinement prompts ("Generate my plan", "Add more detail first")
`;
}
```

### Anti-Patterns to Avoid

- **Do NOT use `toDataStreamResponse()`** -- this is the deprecated v4 method. Use `toUIMessageStreamResponse()` or `createUIMessageStreamResponse()` in v6.
- **Do NOT import useChat from `'ai/react'`** -- v6 uses `'@ai-sdk/react'` as a separate package.
- **Do NOT access `message.content`** -- v6 UIMessage uses `message.parts` array. Each part has a `type` (e.g., `'text'`, `'data-*'`).
- **Do NOT use `handleSubmit` / `handleInputChange`** -- v6 useChat uses `sendMessage({ text: '...' })` and manages its own input state externally.
- **Do NOT duplicate chat state in React Context** -- useChat owns messages, status, and error. Plan state (gathered_info accumulation, phase transitions) goes in the separate plan context.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE streaming protocol | Custom ReadableStream + TextDecoder + SSE parser | AI SDK `createUIMessageStream` + `toUIMessageStreamResponse` | AI SDK handles SSE framing, reconnection, keep-alive, and client-side parsing |
| Chat message state | Custom useState array + streaming buffer + error state | AI SDK `useChat` hook | Manages messages, streaming status ('submitted'/'streaming'/'ready'/'error'), abort, and retry |
| Token-by-token rendering | Manual chunk accumulation + partial text state | AI SDK UIMessage `parts` with `status: 'streaming'` | Parts update reactively as tokens arrive |
| Markdown sanitization | dangerouslySetInnerHTML + DOMPurify | `react-markdown` v10 | Safe by default, supports remark/rehype plugins |
| Auto-resize textarea | Manual scrollHeight calculation | CSS `field-sizing: content` (modern browsers) or 3-line resize handler | CSS solution works in Chrome/Safari; fallback is minimal JS |

## Common Pitfalls

### Pitfall 1: Using AI SDK v4 API Patterns (Stale Documentation)
**What goes wrong:** Earlier project research and many online tutorials show v4 patterns: `import { useChat } from 'ai/react'`, `message.content`, `handleSubmit`, `toDataStreamResponse()`. These will not work with v6.
**Why it happens:** AI SDK jumped from v4 to v5 to v6 rapidly in 2025-2026. Training data and cached tutorials are stale.
**How to avoid:** Use ONLY the v6 patterns documented in this research. Key differences: `@ai-sdk/react` import, `UIMessage` type, `parts` array, `sendMessage()`, `toUIMessageStreamResponse()`, `createUIMessageStream`.
**Warning signs:** Import errors from `'ai/react'`, TypeScript errors on `message.content`, runtime errors from `toDataStreamResponse`.

### Pitfall 2: Metadata JSON Block Not Parsed from AI Response
**What goes wrong:** The system prompt instructs the AI to include a JSON metadata block, but the server doesn't strip it before streaming text to the client. Users see raw JSON in the chat.
**Why it happens:** The metadata extraction must happen in the `onFinish` callback of `streamText`, and the JSON block must be stripped from the visible text before it reaches the client.
**How to avoid:** In `onFinish`, regex-extract the JSON block from `text`, parse it, write it as a data part. Ensure the text streamed to the client either (a) doesn't include the JSON block (tricky with streaming), or (b) use a tool call instead of inline JSON for metadata extraction.
**Better approach:** Use an AI SDK tool definition for metadata. Define a `report_conversation_state` tool that the AI calls alongside its text response. The tool result becomes a data part automatically, and no text parsing is needed.

### Pitfall 3: Chat State Explosion from Full History
**What goes wrong:** Every API call sends the full conversation history. After 8+ turns, token usage spikes and responses slow down.
**Why it happens:** useChat sends all messages by default.
**How to avoid:** Use the `prepareSendMessagesRequest` callback in useChat to trim messages to the last 8 exchanges plus extracted structured state. Or use `convertToModelMessages` on the server side with a sliding window.
**Warning signs:** Response latency > 10s after 5+ turns.

### Pitfall 4: Entry Screen Prompt Pills Not Scrolling Smoothly
**What goes wrong:** Horizontal scroll containers jank or don't show gradient fade at edges. Touch scrolling doesn't work.
**How to avoid:** Use `overflow-x-auto` with `scroll-snap-type: x mandatory` for snapping. Apply `mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent)` for edge fade. Add `-webkit-overflow-scrolling: touch` for mobile (though prototype is desktop-only).

### Pitfall 5: Auto-Scroll Fights User Scroll-Up
**What goes wrong:** User scrolls up to review earlier messages, but new streaming tokens keep yanking them back to the bottom.
**How to avoid:** Track whether user is near the bottom (within ~100px). Only auto-scroll if they are. Use an IntersectionObserver on a sentinel element at the bottom of the message list. When sentinel is visible, auto-scroll is active. When user scrolls up and sentinel leaves viewport, auto-scroll pauses.

### Pitfall 6: Source Sans 3 Font Not Applied
**What goes wrong:** Layout uses Geist font (create-next-app default). Figma designs use Source Sans 3. Prototype looks "off" in testing.
**How to avoid:** Replace Geist imports in `layout.tsx` with Source Sans 3 from `next/font/google`. Update CSS custom properties.

## Code Examples

### Complete Chat Route Handler (v6)

```typescript
// app/api/chat/route.ts
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  tool,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getConfig } from '@/lib/config';
import { buildSystemPrompt } from '@/lib/prompts/system-prompt';
import type { ChatUIMessage } from '@/lib/types';

const conversationStateTool = tool({
  description: 'Report the current conversation state after each response',
  inputSchema: z.object({
    gathered_info: z.object({
      goal: z.string().nullable(),
      background: z.string().nullable(),
      constraints: z.string().nullable(),
    }),
    ready_for_plan: z.boolean(),
    suggested_pills: z.array(z.string()).min(2).max(5),
  }),
  // No execute -- client handles the tool result as metadata
});

export async function POST(req: Request) {
  const config = getConfig();
  const { messages }: { messages: ChatUIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: ({ writer }) => {
      const result = streamText({
        model: openai(config.OPENAI_MODEL),
        system: buildSystemPrompt(),
        messages: modelMessages,
        tools: { report_state: conversationStateTool },
        onFinish({ toolCalls }) {
          const stateCall = toolCalls.find(tc => tc.toolName === 'report_state');
          if (stateCall) {
            writer.write({
              type: 'data-conversation-state',
              id: `state-${Date.now()}`,
              data: stateCall.args as ConversationStateData,
            });
          }
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

### Complete Client Chat Component (v6)

```typescript
// components/app-shell.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useCallback } from 'react';
import type { ChatUIMessage, AppPhase, ConversationStateData } from '@/lib/types';
import { EntryScreen } from '@/components/entry/entry-screen';
import { ChatPanel } from '@/components/chat/chat-panel';
import clsx from 'clsx';

export function AppShell() {
  const [phase, setPhase] = useState<AppPhase>('entry');
  const [suggestedPills, setSuggestedPills] = useState<string[]>([]);
  const [gatheredInfo, setGatheredInfo] = useState<ConversationStateData['gathered_info']>({});

  const { messages, sendMessage, status, error } = useChat<ChatUIMessage>({
    api: '/api/chat',
    onData(dataPart) {
      if (dataPart.type === 'data-conversation-state') {
        const { gathered_info, ready_for_plan, suggested_pills } = dataPart.data;
        setGatheredInfo(gathered_info);
        setSuggestedPills(suggested_pills);
        if (ready_for_plan) {
          setPhase('ready_for_plan');
        }
      }
    },
  });

  const handleSend = useCallback((text: string) => {
    if (phase === 'entry') setPhase('chatting');
    sendMessage({ text });
  }, [phase, sendMessage]);

  return (
    <div className={clsx(
      'h-screen transition-all duration-500 ease-out',
      phase === 'entry' && 'flex items-center justify-center',
      phase !== 'entry' && 'flex flex-col',
    )}>
      {phase === 'entry' ? (
        <EntryScreen onSend={handleSend} />
      ) : (
        <ChatPanel
          messages={messages}
          status={status}
          error={error}
          suggestedPills={suggestedPills}
          onSend={handleSend}
        />
      )}
    </div>
  );
}
```

### Message Bubble with Parts Rendering (v6)

```typescript
// components/chat/message-bubble.tsx
'use client';

import type { ChatUIMessage } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

export function MessageBubble({ message }: { message: ChatUIMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isUser ? 'bg-[#0056d2] text-white' : 'bg-[#f2f5fa] text-foreground',
      )}>
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return isUser ? (
              <p key={i}>{part.text}</p>
            ) : (
              <ReactMarkdown key={i}>{part.text}</ReactMarkdown>
            );
          }
          // Data parts (conversation-state) are handled by onData, not rendered
          return null;
        })}
      </div>
    </div>
  );
}
```

### Prompt Pill Row with Gradient Fade

```typescript
// components/entry/prompt-pill-row.tsx
'use client';

export function PromptPillRow({
  pills,
  onSelect,
}: {
  pills: string[];
  onSelect: (text: string) => void;
}) {
  return (
    <div className="relative">
      {/* Gradient fade at edges */}
      <div
        className="flex gap-3 overflow-x-auto py-2 px-8 scrollbar-hide"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        {pills.map((pill) => (
          <button
            key={pill}
            onClick={() => onSelect(pill)}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#dae1ed] bg-white px-4 py-2 text-sm hover:bg-[#f2f5fa] transition-colors"
          >
            <SparkleIcon className="h-4 w-4 text-[#0056d2]" />
            {pill}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach (v4) | Current Approach (v6) | When Changed | Impact |
|---|---|---|---|
| `import { useChat } from 'ai/react'` | `import { useChat } from '@ai-sdk/react'` | AI SDK v5 (2025) | Separate package, must install `@ai-sdk/react` |
| `message.content` string | `message.parts` array of typed parts | AI SDK v5 (2025) | Must iterate parts and filter by type |
| `handleSubmit(e)` + `handleInputChange` | `sendMessage({ text })` | AI SDK v5 (2025) | Hook no longer manages input state |
| `toDataStreamResponse()` | `toUIMessageStreamResponse()` or `createUIMessageStreamResponse()` | AI SDK v5 (2025) | New streaming protocol with SSE |
| `Message` type | `UIMessage` type with generic params | AI SDK v5 (2025) | Supports typed metadata and data parts |
| Annotations for custom data | Data parts with `writer.write()` | AI SDK v5 (2025) | First-class typed streaming data |
| `isLoading` boolean | `status: 'submitted' \| 'streaming' \| 'ready' \| 'error'` | AI SDK v5 (2025) | More granular state for UX |

**Deprecated/outdated patterns from earlier research:**
- ARCHITECTURE.md recommends raw OpenAI SDK with custom SSE -- **superseded by D-02** (locked decision to use AI SDK)
- ARCHITECTURE.md references `useReducer` with two contexts for chat + plan -- **partially superseded**: useChat owns chat state (D-05), only plan state needs Context+useReducer (D-04)
- PITFALLS.md Pitfall 6 suggests skipping streaming entirely -- **overridden by D-01** (SSE streaming is a locked decision)
- STACK.md recommends Zustand -- **overridden by D-04** (React Context + useReducer for plan state)

## Open Questions

1. **Tool call vs inline JSON for metadata extraction**
   - What we know: Both patterns work. Tool calls are cleaner (no text parsing), inline JSON is simpler to prompt for.
   - What's unclear: Whether gpt-4.1-mini reliably calls a tool alongside generating conversational text in the same response.
   - Recommendation: Start with the tool call approach. If gpt-4.1-mini doesn't reliably call the tool, fall back to inline JSON with regex extraction in `onFinish`.

2. **AI SDK v6 `convertToModelMessages` with custom data parts**
   - What we know: `convertToModelMessages` strips UI-specific parts and creates a model-friendly array.
   - What's unclear: Whether custom data parts in message history cause issues when converted back to model messages.
   - Recommendation: Test early. If problematic, filter out data parts before conversion.

3. **Font replacement: Source Sans 3 vs Geist**
   - What we know: Figma uses Source Sans 3. Current layout.tsx uses Geist (create-next-app default).
   - Recommendation: Replace in layout.tsx using `next/font/google` import for Source_Sans_3. This is a Phase 2 task since it affects the entry screen appearance.

## Sources

### Primary (HIGH confidence)
- [AI SDK v6 Getting Started - Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) -- complete route handler + useChat pattern
- [AI SDK UI: Streaming Custom Data](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data) -- data parts, writer.write, transient vs persistent
- [AI SDK Core: streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) -- toUIMessageStreamResponse, messageMetadata, tools
- [AI SDK UI: useChat reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) -- sendMessage, status, onData, UIMessage
- npm registry: `ai@6.0.142`, `@ai-sdk/react@3.0.144`, `@ai-sdk/openai@3.0.49` -- verified 2026-03-31
- npm registry: `react-markdown@10.1.0`, `lucide-react@1.7.0` -- verified 2026-03-31

### Secondary (MEDIUM confidence)
- [AI SDK 5 blog post](https://vercel.com/blog/ai-sdk-5) -- UIMessage vs ModelMessage, breaking changes from v4
- [AI SDK 6 blog post](https://vercel.com/blog/ai-sdk-6) -- agents, tool improvements, MCP support
- [AI SDK Stream Protocol docs](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) -- SSE format details

### Tertiary (LOW confidence)
- Reference prototype `server.mjs` system prompt and Zod schemas -- useful for prompt structure reference but NOT to be ported directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- npm versions verified, API patterns confirmed from official docs
- Architecture: HIGH -- AI SDK v6 data parts pattern maps directly to D-09 metadata requirement
- Pitfalls: HIGH -- v4-to-v6 migration is the primary risk; documented with specific API differences

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (AI SDK is fast-moving; verify minor version compatibility at install time)
