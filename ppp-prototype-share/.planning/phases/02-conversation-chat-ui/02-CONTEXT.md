# Phase 2: Conversation & Chat UI - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Entry screen with greeting/prompt pills, streaming chat interface, and AI conversation flow that iteratively gathers learner career goals, background, and constraints. This phase delivers the full chat experience — from landing to having enough context to generate a plan. Plan generation itself is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Streaming Architecture
- **D-01:** Use Server-Sent Events (SSE) from Next.js Route Handlers for AI response streaming. Amplify does NOT support Next.js edge streaming, but SSE from standard compute Route Handlers works.
- **D-02:** Use Vercel AI SDK (`ai` package) with `useChat` hook for client-side chat state and SSE handling. Server-side uses `streamText` from `@ai-sdk/openai`.

### Chat State Management
- **D-03:** Hybrid conversation state — AI manages flow naturally but returns structured metadata (`gathered_info`, `ready_for_plan`, `suggested_pills`) alongside chat text. Frontend uses metadata to update UI state (prompt pills, transition triggers).
- **D-04:** Plan state (separate from chat) managed via React Context + useReducer. No external state library needed for prototype scope.
- **D-05:** Chat message state managed by AI SDK's `useChat` hook (handles messages array, streaming state, error state).

### Entry → Chat Transition
- **D-06:** CSS transition on same component — no route change. Greeting fades up, chat panel slides in. Single-page state machine: `entry` → `chatting` → `ready_for_plan`. CSS grid/flexbox animation.

### Prompt Design
- **D-07:** Structured system prompt with clear phases (goal → background → constraints) and specific question templates per phase. Predictable and testable for user testing.
- **D-08:** AI decides readiness based on information quality, not fixed turn count. Could be 1 turn (if user gives a detailed prompt pill like "Start my career as an engineer") or 5 turns (if user is exploratory). System prompt defines what "enough context" means.
- **D-09:** AI returns structured metadata alongside each message: `{ gathered_info: { goal?, background?, constraints? }, ready_for_plan: boolean, suggested_pills: string[] }`. This drives UI state transitions and contextual pill updates.

### Claude's Discretion
- Exact CSS animation timing and easing for entry → chat transition
- Typing indicator implementation (dots, shimmer, or text pulse)
- Auto-scroll behavior details (threshold, smooth vs instant)
- Markdown rendering library choice (react-markdown, marked, or similar)
- Error retry UX details (inline button style, message preservation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Figma Design
- Entry screen Figma node `2630:19360` in file `09QwwupjILrMRIxItWOBhN` — greeting, chat input, 3 rows scrolling prompt pills with AI sparkle icons, suggestion buttons, blue-purple gradient background
- Split view Figma node `2613:74583` — plan left + chat right with CoachPanel
- Design tokens captured in `.planning/PROJECT.md` § Design Context

### Existing Code (Phase 1)
- `src/lib/config.ts` — Zod-validated env vars (OpenAI key, model, endpoint)
- `src/lib/coursera-client.ts` — GraphQL client singleton
- `src/app/api/courses/search/route.ts` — Search API route with mock fallback

### Reference Implementations
- `/Users/dajiboye/base/coursera/PPP Figma/PPP/server.mjs` lines 230-297 — Existing system prompt and stage guides (reference for prompt structure, NOT to be ported directly)
- `/Users/dajiboye/base/coursera/PPP Figma/PPP/server.mjs` lines 151-225 — Zod schemas for structured output (reference for metadata shape)

### Research
- `.planning/research/STACK.md` — AI SDK recommendation, Tailwind approach
- `.planning/research/FEATURES.md` — Table stakes chat features, prompt pill patterns
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow
- `.planning/research/PITFALLS.md` — Streaming pitfalls, state management warnings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/config.ts` — Config module with OPENAI_API_KEY, OPENAI_MODEL, COURSERA_GRAPHQL_ENDPOINT validated at startup
- `src/app/globals.css` — Tailwind CSS base setup
- `src/app/layout.tsx` — Root layout with Source Sans 3 font

### Established Patterns
- Zod for runtime validation (env vars in Phase 1, extend to AI structured output)
- Server-side only API access (Route Handlers, no client-side fetch to external APIs)
- TypeScript strict mode throughout

### Integration Points
- New `/api/chat` Route Handler for OpenAI streaming
- New components in `src/components/` (ChatPanel, EntryScreen, PromptPill, MessageBubble)
- App state context provider wrapping `src/app/layout.tsx`

</code_context>

<specifics>
## Specific Ideas

- Entry screen prompt pills from Figma: 3 horizontally scrolling rows with gradient fade at edges. Row 1: career change pills ("I want to switch careers into technology", "Figma for UI/UX designers"). Row 2: skill pills ("AI tools", "SQL for data analysts"). Row 3: mixed ("Python for building apps", "Help me decide"). Plus a row of suggestion buttons ("Create a learning plan", "Find a new career", etc.)
- AI sparkle icon (status/AIGenerateBranded from Coursera design system) on all prompt pills and suggestion buttons
- Chat input matches Figma: bordered box with "I want to learn..." placeholder, + icon (toolbar), microphone icon (decorative only), send button
- Soft blue-purple gradient background on entry screen: `linear-gradient(90deg, #fff 0%, rgba(53,135,252,0.1) 33%, rgba(164,154,255,0.05) 67%, #fff 100%)`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-conversation-chat-ui*
*Context gathered: 2026-03-31*
