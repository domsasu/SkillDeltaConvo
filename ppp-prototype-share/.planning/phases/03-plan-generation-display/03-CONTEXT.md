# Phase 3: Plan Generation & Display - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

When the AI has gathered enough learner context (goal, background, constraints), it generates a personalized learning plan of real Coursera C+ courses organized into milestones. The plan is displayed in the existing LIHP layout — first as a summary banner, then as a full plan view with milestone sections and course cards when the user clicks "View full plan". Chat panel stays on the right throughout. This phase delivers plan generation and display only — plan refinement is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Plan Generation Flow
- **D-01:** AI generates the plan using tool calling within the chat stream. When `ready_for_plan` triggers, the AI uses tool calls to search Coursera courses and build the plan inline — no separate endpoint.
- **D-02:** Multiple targeted searches per milestone. The AI calls the search tool 3-4 times with queries specific to each milestone area (e.g., "python fundamentals", "data analysis projects") rather than one broad search.
- **D-03:** Loading state then reveal UX. Show a loading/skeleton state in the plan area while generation happens. Once the full plan is ready, reveal it all at once. No progressive/streaming plan build.
- **D-04:** After plan generation, AI posts a confirmation message in chat (e.g., "Learning plan created") and the learning plan summary banner appears on the LIHP.

### Plan Data Structure
- **D-05:** AI decides milestone count and names with goal-type guardrails in the system prompt:
  - Career change / land new job → milestones like Foundations (with a PC/Specialization), Core Skills, Job Prep
  - Skill improvement → a milestone per skill
  - AI has flexibility on count and naming but follows these patterns
- **D-06:** Courses per milestone: Claude's discretion — set reasonable defaults in the prompt with flexibility for the AI to adjust based on learner constraints and goal complexity.
- **D-07:** Plan includes Professional Certificates and Specializations, not just individual courses. For career change goals, include a PC as the foundation milestone. Search API `productType` field used to distinguish.

### Layout & Navigation
- **D-08:** Learning plan summary banner on LIHP uses the existing `LearningPlanBanner` design populated with real plan data (role, skills, duration, hours/week, milestone overview) instead of mock data. Hidden when no plan exists, shows loading state during generation.
- **D-09:** Full plan view replaces LIHP main content (no route change). Clicking "View full plan" swaps the left panel content from LIHP sections to the full plan view. "← Back to home" returns to LIHP. Same state machine pattern as entry → LIHP.
- **D-10:** Chat panel stays on the right at existing 400px width in both LIHP and full plan view.

### Course Cards (Full Plan View)
- **D-11:** Course cards match the Figma screenshot closely: thumbnail (from Search API `imageUrl`), course name, skills line, partner icon + name, product type (Course/PC/Project), module count or hours. Activity badges (Coding exercise, Role play, etc.) are mocked/hardcoded.
- **D-12:** Expand chevron on course cards is static or omitted — no expand/collapse functionality for the prototype.
- **D-13:** Course name links to Coursera XDP page (coursera.org) in a new tab using the `url` field from Search API.

### Duration Estimates
- **D-14:** AI estimates duration from course data returned by Search API. Calculates total hours, then derives timeline based on learner's stated hours/week availability. Shows per-milestone and total plan estimates (e.g., "3-6 months · ~6 hours/week").

### Claude's Discretion
- Exact Zod schema shape for the plan structured output
- How search tool results are filtered/ranked before selection
- Loading skeleton design for plan generation state
- "Start learning plan" CTA behavior (can be non-functional for prototype)
- Milestone section visual design details (colors, badges like "Core Track")

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design
- Figma full plan view screenshot shared during discussion — milestones with course cards, plan summary header, chat panel on right with refinement pills
- Figma split view node `2613:74583` in file `09QwwupjILrMRIxItWOBhN` — plan left + chat right
- Figma full plan view node `2613:75657` — complete plan with milestones, course cards, progress bars
- Design tokens in `.planning/PROJECT.md` § Design Context

### Existing Code
- `src/components/lihp/learning-plan-banner.tsx` — Current mock banner to be adapted for real data
- `src/components/lihp/lihp-page.tsx` — LIHP layout with main content + aside chat panel
- `src/components/app-shell.tsx` — State machine (entry → chatting → ready_for_plan) and useChat integration
- `src/lib/types.ts` — AppPhase, GatheredInfo, ConversationStateData types
- `src/lib/prompts/schemas.ts` — Existing Zod schemas for conversation state
- `src/lib/coursera-client.ts` — GraphQL client singleton for Search API
- `src/lib/coursera-types.ts` — CourseHit type with all fields (name, url, imageUrl, partners, skills, duration, productDifficultyLevel, isPartOfCourseraPlus, productType)
- `src/app/api/chat/route.ts` — Chat streaming route with tool calling support already wired
- `src/app/api/courses/search/route.ts` — Search API route with mock fallback

### Prior Phase Context
- `.planning/phases/02-conversation-chat-ui/02-CONTEXT.md` — Streaming architecture, chat state management, prompt design decisions

### Research
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow
- `.planning/research/FEATURES.md` — Plan display patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LearningPlanBanner` component — already has the visual layout for plan summary, needs data binding
- `ChatSidePanel` + `ChatPanel` — complete chat panel already working at 400px
- `LihpPage` — flex layout with main content area + aside, can swap main content for full plan view
- `CourseHit` type — maps directly to Search API response, has all fields needed for course cards
- `coursera-client.ts` search method — ready to use for course fetching
- AI SDK tool calling already wired in `route.ts` (`reportConversationState` tool exists as pattern)

### Established Patterns
- State machine in `AppShell` (entry → chatting → ready_for_plan) — extend with plan view states
- Data parts for streaming metadata from AI → frontend
- Zod schemas for structured AI output validation
- Mock data fallback pattern from Phase 1

### Integration Points
- Add new tool(s) to `route.ts` for course search (AI calls search tool during plan generation)
- Add plan data types and Zod schema for plan structured output
- Extend `AppPhase` type with plan view states (e.g., `plan_generated`, `viewing_plan`)
- New components: `PlanView`, `MilestoneSection`, `CourseCard` in `src/components/plan/`
- Connect `LearningPlanBanner` to real plan state instead of hardcoded `showPlan={true}`

</code_context>

<specifics>
## Specific Ideas

- Learning plan summary banner on LIHP should look like the existing mock but with real data from generated plan
- Full plan view matches the Figma screenshot shared: "← Back to home" header, plan title, "Start learning plan" CTA, plan summary bar (role · skills · duration · hours/week), milestone sections with course cards
- Each milestone section has: name, description, skills list, and optionally a badge (e.g., "Core Track")
- Course cards show: thumbnail, name, skills, partner + product type + module count, mocked activity badges
- Chat panel shows "Learning plan created" confirmation after generation, with refinement pills appearing at bottom
- Michelle's guardrails for milestone structure: career change → Foundations (with PC/S12N), Core Skills, Job Prep; skill improvement → milestone per skill

</specifics>

<deferred>
## Deferred Ideas

- Expand/collapse functionality on course cards — Phase 4 or not needed
- "Start learning plan" CTA auto-enrollment — explicitly out of scope
- Refinement prompt pills functionality ("Finish in 6 months", "Add portfolio project") — Phase 4

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-plan-generation-display*
*Context gathered: 2026-04-01*
