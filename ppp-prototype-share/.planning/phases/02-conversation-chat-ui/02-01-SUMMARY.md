---
phase: 02-conversation-chat-ui
plan: 01
subsystem: api
tags: [ai-sdk, openai, streaming, sse, zod, system-prompt, lucide-react]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "config.ts (getConfig with OPENAI_API_KEY, OPENAI_MODEL), coursera-types.ts, Next.js scaffold"
provides:
  - "POST /api/chat streaming endpoint with AI text + conversation metadata"
  - "Shared types: AppPhase, GatheredInfo, ConversationStateData, ChatUIMessage"
  - "Zod schemas for conversation state validation"
  - "System prompt with iterative goal/background/constraints gathering"
  - "SparkleIcon component for AI indicators"
  - "Source Sans 3 font in layout"
affects: [02-02-entry-screen, 02-03-chat-panel, 03-plan-generation]

# Tech tracking
tech-stack:
  added: [ai@6.0, "@ai-sdk/react@3.0", "@ai-sdk/openai@3.0", react-markdown@10, lucide-react@1.7]
  patterns: [ai-sdk-v6-data-parts, createUIMessageStream-pattern, dual-metadata-extraction]

key-files:
  created:
    - src/lib/types.ts
    - src/lib/prompts/schemas.ts
    - src/lib/prompts/system-prompt.ts
    - src/app/api/chat/route.ts
    - src/components/shared/sparkle-icon.tsx
  modified:
    - package.json
    - package-lock.json
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "Used AI SDK v6 data parts (writer.write) for streaming conversation metadata alongside text"
  - "Dual metadata extraction: tool call primary, inline JSON regex fallback, default state final fallback"
  - "Used inputSchema property (not parameters) to match AI SDK v6 tool() API"
  - "Source Sans 3 font replaces Geist default per Figma design tokens"

patterns-established:
  - "AI SDK v6 route handler: createUIMessageStream + streamText + createUIMessageStreamResponse"
  - "Conversation state as typed data part: 'data-conversation-state' with ConversationStateData"
  - "System prompt ends-with-JSON-block pattern for metadata extraction fallback"

requirements-completed: [CHAT-03, CHAT-04, CHAT-06, CHAT-07, CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, CONV-06]

# Metrics
duration: 19min
completed: 2026-03-31
---

# Phase 02 Plan 01: API & Types Foundation Summary

**AI SDK v6 streaming chat endpoint with dual metadata extraction (tool call + inline JSON), shared type contracts, and iterative system prompt for career goal gathering**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-31T19:28:10Z
- **Completed:** 2026-03-31T19:47:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Installed AI SDK v6 (ai, @ai-sdk/react, @ai-sdk/openai) plus react-markdown and lucide-react
- Created shared type contracts (AppPhase, GatheredInfo, ConversationStateData, ChatUIMessage) consumed by Plans 02 and 03
- Built streaming POST /api/chat endpoint with three-tier metadata extraction: tool call, inline JSON regex, default fallback
- System prompt drives iterative conversation flow gathering career goal, background, and constraints with contextual suggested pills

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create types, schemas, sparkle icon, fix layout font** - `ddc7f05` (feat)
2. **Task 2: Create system prompt and streaming chat API route handler** - `f84845d` (feat)

## Files Created/Modified
- `src/lib/types.ts` - Shared type definitions: AppPhase, GatheredInfo, ConversationStateData, ChatUIMessage
- `src/lib/prompts/schemas.ts` - Zod schemas for gathered_info and conversation_state validation
- `src/lib/prompts/system-prompt.ts` - buildSystemPrompt() with iterative career context gathering
- `src/app/api/chat/route.ts` - POST handler: streamText + data parts via createUIMessageStream
- `src/components/shared/sparkle-icon.tsx` - SparkleIcon wrapper around lucide-react Sparkles
- `src/app/layout.tsx` - Source Sans 3 font, PPP branding metadata
- `src/app/globals.css` - Updated font-sans CSS variable to source-sans
- `package.json` - Added ai, @ai-sdk/react, @ai-sdk/openai, react-markdown, lucide-react

## Decisions Made
- Used AI SDK v6 `tool()` with `inputSchema` (not `parameters`) matching actual v6 API surface
- Implemented three-tier metadata extraction: (1) tool call result, (2) inline JSON regex from response text, (3) hardcoded default state -- ensures UI always gets metadata regardless of model behavior
- Used `convertToModelMessages` (async in v6) to handle UIMessage -> ModelMessage conversion
- Tool call property is `input` not `args` in v6's TypedToolCall type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed convertToModelMessages async call**
- **Found during:** Task 2 (chat route handler)
- **Issue:** AI SDK v6 `convertToModelMessages` returns `Promise<ModelMessage[]>`, not `ModelMessage[]` synchronously. Plan examples showed synchronous usage.
- **Fix:** Added `await` before the call
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** f84845d (Task 2 commit)

**2. [Rule 1 - Bug] Fixed tool call property name from args to input**
- **Found during:** Task 2 (chat route handler)
- **Issue:** Plan and research examples used `stateCall.args` but AI SDK v6's `TypedToolCall` uses `input` property
- **Fix:** Changed `stateCall.args` to `stateCall.input`
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** f84845d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs from stale API assumptions in plan)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope change.

## Issues Encountered
None beyond the API surface mismatches documented as deviations.

## User Setup Required
None - no external service configuration required. OPENAI_API_KEY must be set in .env.local (already required from Phase 1).

## Known Stubs
None - all files provide complete functionality. The chat endpoint streams real AI responses when OPENAI_API_KEY is configured.

## Next Phase Readiness
- Type contracts ready for Plan 02 (entry screen) and Plan 03 (chat panel) to consume
- `/api/chat` endpoint ready to accept messages from useChat hook on the client
- SparkleIcon and Source Sans 3 font ready for UI components

## Self-Check: PASSED

All 5 created files verified present. Both task commits (ddc7f05, f84845d) verified in git log.

---
*Phase: 02-conversation-chat-ui*
*Completed: 2026-03-31*
