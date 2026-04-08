# Project Research Summary

**Project:** PPP Prototype -- Personalized Progressive Pathways
**Domain:** Conversational AI learning plan builder (chat-first, split-view, real Coursera catalog)
**Researched:** 2026-03-31
**Confidence:** MEDIUM (stack and pitfalls are HIGH-confidence from verified reference prototype; AI SDK versions and Amplify behavior are MEDIUM)

## Executive Summary

PPP is a single-page conversational AI application where a user chats with a GPT-powered assistant to build a personalized, milestone-structured Coursera learning plan. The app starts as a full-width chat interface (entry screen with prompt pills), then transitions into a two-panel split view -- plan on the left, chat on the right -- once enough context is gathered. This is not a form-based wizard; the conversation IS the onboarding. The prototype must validate whether this conversational paradigm can replace traditional search-and-filter for learning path discovery.

The recommended approach is a Next.js 15 App Router project using the Vercel AI SDK for streaming chat and Zustand for plan state -- except that the ARCHITECTURE.md research directly contradicts the STACK.md recommendation on streaming: ARCHITECTURE.md (grounded in the reference prototype's proven non-streaming pattern) recommends skipping the AI SDK `useChat` abstraction and using direct OpenAI SDK streaming with a custom SSE handler instead. **Recommendation: follow ARCHITECTURE.md's guidance.** Use the Vercel AI SDK only as a fallback convenience if the custom streaming implementation proves time-consuming; for a 2-week prototype, the reference prototype's approach (structured non-streaming responses + loading indicators for plan generation, optional token streaming for conversational turns) is faster to ship. All Coursera GraphQL calls must be server-proxied through Next.js Route Handlers; this is a hard constraint with no exception.

The primary risks are: (1) AWS Amplify misconfiguration silently breaking all API routes, (2) OpenAI structured output truncation producing null plans at user testing time, (3) the client-vs-server component boundary causing build failures or secret exposure if not established upfront. All three risks are preventable by doing infra and data-layer validation in Phase 1 before any UI work. The reference prototype in `PPP Figma/PPP/` is the single highest-confidence source -- its patterns for GraphQL proxying, structured plan generation with Zod schemas, and conversation-to-plan flow are the gold standard and should be ported rather than reimplemented from scratch.

## Key Findings

### Recommended Stack

The stack is constrained by the project mandate (Next.js 15, TypeScript, AWS Amplify) and by the existing reference prototype (OpenAI v6.33, Zod v4.3, `gpt-4.1-mini`). The only open decisions are styling and state management. Research recommends Tailwind CSS v4 (utility-first, no config file, fastest for matching Figma designs without a component library) and Zustand v5 (lightweight, two-store model: `usePlanStore` and `useConversationStore`). The key tension noted above -- AI SDK `useChat` vs. direct OpenAI streaming -- should be resolved in favor of direct OpenAI SDK for plan generation and optional AI SDK for conversational streaming only.

**Core technologies:**
- **Next.js 15 (App Router)**: Full-stack framework, mandatory -- server components for layout, Route Handlers for AI proxy and GraphQL proxy
- **TypeScript 5.7**: Type safety across OpenAI structured outputs, GraphQL responses, and UI state -- essential given the 3-way data integration
- **OpenAI SDK v6.33 + Zod v4.3**: Structured plan generation via `zodResponseFormat` -- already battle-tested in reference prototype
- **Vercel AI SDK v4.2 (optional for streaming)**: `streamText` + SSE for conversational turns; skip `useChat` and manage conversation state in Zustand instead
- **Tailwind CSS v4**: Utility-first styling matched to Figma design tokens (pill radius 48px, card radius 8px, primary blue `#0056d2`)
- **Zustand v5**: Two stores -- `usePlanStore` (milestones, courses, mutations) and `useConversationStore` (messages, phase, user context, prompt pills)
- **AWS Amplify Gen 2**: Mandatory hosting with `output: "standalone"` in `next.config.ts` required from day one

**Do not use:** shadcn/ui (fights the Figma design), Apollo Client (40KB+ for 4 server-side queries), Redux (10x boilerplate), Amplify Gen 1 (no App Router support), LangChain.js (massive dependency surface for a simple flow).

### Expected Features

The feature set is well-defined by the Figma designs and project spec. The critical dependency chain is: chat input and message rendering -> AI conversation flow -> plan generation -> plan display -> entry-to-split-view transition -> plan refinement. Everything flows from this sequence.

**Must have (P0 table stakes):**
- Streaming/loading chat with typing indicator -- without this the app feels frozen during 5-10s plan generation
- Entry screen with horizontally-scrolling prompt pill rows -- reduces blank-page anxiety, sets the product's intent
- Conversational goal / background / constraint gathering (3-4 turns before plan generation)
- Four-milestone plan structure (Foundation, Core, Applied, Advanced) with real Coursera courses
- Split-view layout: plan panel (~55-60% width) left, chat panel (~40-45%) right, each independently scrollable
- Plan summary header (target role, timeline, hours/week, key skills)
- Conversational plan refinement ("make it shorter", "add Python", "remove testing courses")
- Delete course via click (direct manipulation complement to conversational refinement)
- Contextual prompt pills that evolve with conversation stage (entry pills, post-plan refinement pills)
- Error handling with inline retry -- API failures during user testing sessions are catastrophic

**Should have (differentiators, P1):**
- Explore alternative courses (per PROJECT.md P0, but higher complexity; include if schedule permits)
- Smooth animated entry-to-split-view transition (CSS grid column transition)
- Markdown rendering in AI messages (react-markdown)
- Skills tags on course cards (limit to 3-4)
- Plan overview stats aggregated from course metadata

**Defer (P2+):**
- Voice input, session persistence, mobile responsiveness, fine-grained conversational editing, milestone reordering, multi-language support, user accounts

### Architecture Approach

The app is a single-page application on one route (`/`) with three CSS-driven layout states (entry, building, complete) managed by a phase state machine at the AppShell level. State never lives in the URL for mid-flow transitions. There are two React contexts (ConversationContext and PlanContext) to avoid unnecessary re-renders. All AI calls and all Coursera GraphQL calls go through Next.js Route Handlers -- there are no direct browser-to-external-API calls. The `/api/chat` route is the central orchestrator: it receives conversation history + current plan + phase, builds a phase-aware system prompt, calls OpenAI with tool definitions (`search_courses`, `generate_plan`), executes tool calls server-side (course search via `/api/courses`), and returns structured plan data + streaming text to the client. The LLM determines plan structure and search queries; the Coursera GraphQL API provides the actual courses -- the LLM must never generate course names directly.

**Major components:**
1. **AppShell** -- layout state machine (entry/building/complete), CSS grid transitions, provides both React contexts
2. **ChatPanel** -- message list, streaming text display, chat input composer, prompt pills; all client-rendered
3. **PlanPanel** -- plan summary header, milestone sections, course cards with delete and explore-alternatives; all client-rendered
4. **`/api/chat` Route Handler** -- OpenAI orchestrator with phase-aware prompts and tool call execution
5. **`/api/courses` Route Handler** -- Coursera GraphQL proxy with C+ filtering and mock fallback
6. **ConversationStore / PlanStore** -- Zustand stores managing respective state slices

Build order from ARCHITECTURE.md (dependencies respected): Types -> Data layer (mock + GraphQL proxy) -> API routes -> State + AppShell -> Chat UI -> Plan UI -> Integration and polish.

### Critical Pitfalls

1. **Amplify standalone misconfiguration** -- `output: "standalone"` must be in `next.config.ts` on day one; deploy a hello-world app to Amplify in Phase 1 and verify API routes work before building any UI
2. **OpenAI structured output truncation** -- set `max_tokens` to 4096+ for plan generation; always wrap Zod parsing in try-catch with mock plan fallback; test with large 12+ course plans early
3. **Client-side Coursera GraphQL calls** -- CORS errors will break the entire app; proxy ALL calls through Route Handlers; implement mock data fallback on day one so UI development is never blocked
4. **Client vs. server component boundary confusion** -- define the component boundary map before writing any components; `OPENAI_API_KEY` must never appear in any file with `"use client"`; all interactive components are client-rendered
5. **LLM hallucinating course names** -- the LLM must never generate course names; it generates search queries and plan structure, the GraphQL API provides actual courses; validate every course URL from the API response
6. **Chat history token explosion** -- extract structured intent (role, skills, constraints) from conversation and pass THAT to plan generation, not raw history; keep rolling window of 6-8 messages; use `gpt-4.1-mini` for conversational turns, reserve higher-quality models for plan generation

## Implications for Roadmap

Based on research, the dependencies and pitfall warnings point clearly to a 4-phase structure. Infra and data layer must be validated before any UI work. Chat UI and Plan UI can be built in parallel once state containers exist.

### Phase 1: Foundation -- Infra, Data Layer, Types

**Rationale:** Pitfalls 1 (Amplify), 2 (GraphQL CORS), 3 (client boundary), 4 (env vars), 11 (GraphQL response shape), and 12 (env mismatch) all need to be defused before building UI. A broken deployment or missing mock data blocks everything downstream.
**Delivers:** Working Next.js 15 project deployed to Amplify with API routes confirmed functional; Coursera GraphQL proxy with C+ filtering and mock fallback; TypeScript types for the entire data model; design tokens (fonts, colors, spacing) configured; `.env.example` and startup env validation.
**Addresses:** Anti-features avoided (no auth, no persistence), deployment confidence, development unblocked by mock data.
**Avoids:** Pitfall 3 (client boundary -- establish map here), Pitfall 4 (Amplify standalone), Pitfall 2 (CORS -- proxy from the start), Pitfall 12 (env setup).

### Phase 2: AI Conversation Core

**Rationale:** The AI integration is the highest-risk piece of prototype logic. Structured output reliability (Pitfall 1), chat history management (Pitfall 5), and the streaming-vs-non-streaming decision (Pitfall 6) must be resolved before building UI around them.
**Delivers:** `/api/chat` route with phase-aware system prompts and tool calling; structured plan generation via Zod schemas with generous `max_tokens`; conversation context extraction (role, skills, constraints); decision on streaming pattern (recommendation: loading indicators for plan generation, optional streaming for conversational turns); prompt phase state machine.
**Uses:** OpenAI SDK v6.33, Zod v4.3 (ported from reference prototype), `gpt-4.1-mini`.
**Avoids:** Pitfall 1 (structured output truncation -- tested here), Pitfall 5 (token explosion -- context extraction implemented here), Pitfall 6 (streaming complexity -- decision made here), Pitfall 8 (LLM course hallucination -- architecture enforced here).

### Phase 3: Chat UI and Plan Display

**Rationale:** With API routes and state architecture established, Chat UI and Plan UI can be built with confidence. The entry screen, prompt pills, split-view layout, and course cards are all well-defined in Figma. This phase delivers the core testable prototype.
**Delivers:** Entry screen with scrolling prompt pills; AppShell with phase-driven CSS grid transition; ChatPanel (message list, streaming/loading display, chat input, contextual prompt pills); PlanPanel (plan summary header, milestone sections, course cards with delete action, plan skeleton loading state).
**Implements:** AppShell, ChatPanel, PlanPanel, ConversationStore, PlanStore.
**Avoids:** Pitfall 7 (browser back -- virtual history entries), Pitfall 10 (static pills -- state-aware pill sets), Pitfall 13 (empty/oversized input validation), Pitfall 14 (loading states), Pitfall 15 (Figma design token drift).

### Phase 4: Refinement, Polish, and Integration

**Rationale:** Conversational refinement and explore-alternatives are higher-complexity features that depend on Phase 3 being stable. Plan mutation flows (delete course triggering AI acknowledgement, constrained LLM refinement) and final UX polish complete the user testing artifact.
**Delivers:** Conversational plan refinement with current-plan-in-context (not full regeneration); explore alternative courses (popover or drawer with 2-3 alternatives from GraphQL); optimistic UI for course deletion; smooth animated entry-to-split-view transition (framer-motion or CSS); markdown rendering in chat; skills tags on cards; end-to-end error handling and retry flows.
**Avoids:** Pitfall 9 (full regeneration -- constrained refinement with plan state in context).

### Phase Ordering Rationale

- **Infra before UI** is non-negotiable: Amplify deployment failures and GraphQL CORS errors cannot be diagnosed after the UI is built; they corrupt development confidence for the rest of the sprint.
- **AI core before chat UI** because the streaming decision and structured output reliability directly shape how the ChatPanel and PlanPanel are implemented. Building UI first and retrofitting the AI integration causes rewrites.
- **Chat and Plan UI together in Phase 3** because they share state containers (ConversationStore, PlanStore) and the AppShell transition depends on both being ready.
- **Refinement in Phase 4** because it is additive -- the Phase 3 artifact is already a demonstrable prototype; Phase 4 makes it robust for user testing.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (AI conversation core):** Verify current Vercel AI SDK v4.x API for `streamText` + tool call handling in App Router Route Handlers -- the SDK's streaming API changed between v3 and v4; check current docs before implementation.
- **Phase 1 (Amplify):** Verify exact Amplify Gen 2 build configuration for Next.js 15 App Router -- reference the `prototypes-tools-sandbox` repo for known-working `amplify.yml` and build settings before deploying.

Phases with standard patterns (skip deeper research):
- **Phase 3 (Chat UI and Plan UI):** Well-established React patterns; Figma designs provide spec; reference prototype provides conversation flow logic.
- **Phase 4 (Refinement polish):** framer-motion animations and react-markdown are stable, well-documented libraries; the refinement strategy is clearly defined in PITFALLS.md and FEATURES.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core mandated stack (Next.js, TypeScript, OpenAI, Zod) is HIGH from verified reference prototype; Vercel AI SDK exact API is MEDIUM (verify version at install time); Amplify Gen 2 + Next.js 15 is MEDIUM (verify from reference repo) |
| Features | HIGH | Figma designs exist, project spec has P0/P1/P2 priorities, reference prototype validates conversation flow; competitive landscape is MEDIUM but doesn't affect build decisions |
| Architecture | MEDIUM-HIGH | Reference prototype provides direct evidence for data flow patterns; Next.js App Router streaming patterns are MEDIUM (verify SSE + tool call API during implementation) |
| Pitfalls | HIGH | Most pitfalls are derived from direct reference prototype analysis and known platform constraints (CORS, Amplify, OpenAI token limits); highly actionable |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Streaming decision:** STACK.md and ARCHITECTURE.md contradict each other on whether to use Vercel AI SDK `useChat`. Resolve this in Phase 2 by spiking both approaches against the actual Amplify deployment. Recommended starting position: skip `useChat`, use direct OpenAI SDK with custom SSE, as the reference prototype does.
- **Amplify-specific configuration:** The exact `amplify.yml` build settings for Next.js 15 standalone mode should be copied from the `prototypes-tools-sandbox` reference repo before the first deploy, not inferred from documentation.
- **Course search quality:** The reference prototype uses a 6-agent parallel search pipeline for course quality. This prototype replaces it with 2-3 OpenAI tool calls to `search_courses`. Course quality may be lower. Plan to do a quality spot-check during Phase 2 and add a lightweight rerank step if needed.
- **Explore alternatives UX:** PROJECT.md lists this as P0, FEATURES.md lists it as higher complexity. Confirm the UI pattern (popover vs. drawer) and the API query pattern (same skill/difficulty, different course) during Phase 4 planning.

## Sources

### Primary (HIGH confidence)
- Reference prototype: `/Users/dajiboye/base/coursera/PPP Figma/PPP/` -- OpenAI v6.33, Zod v4.3, working GraphQL client, conversation flow, system prompts, agent pipeline
- Project spec: `/Users/dajiboye/base/coursera/ppp-prototype/.planning/PROJECT.md` -- mandatory stack, P0/P1/P2 priorities, design tokens, Figma node IDs

### Secondary (MEDIUM confidence)
- Next.js 15 App Router patterns (training data) -- component boundary conventions, Route Handler streaming
- Vercel AI SDK v4.x (training data) -- `streamText`, `useChat`, `@ai-sdk/openai` provider split
- AWS Amplify Gen 2 + Next.js standalone (training data + PROJECT.md reference repo mention)
- Tailwind CSS v4, Zustand v5 (training data, stable releases as of early 2025)

### Tertiary (LOW confidence)
- Competitive landscape (ChatGPT, LinkedIn Learning, Pluralsight Iris) -- training data as of early 2025; product states may have changed
- Exact npm package versions (lucide-react, framer-motion, react-markdown) -- verify at install time

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
