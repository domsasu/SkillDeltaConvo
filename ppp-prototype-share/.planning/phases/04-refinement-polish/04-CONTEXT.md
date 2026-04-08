# Phase 4: Refinement & Polish - Context

**Gathered:** 2026-04-06
**Updated:** 2026-04-06 (aligned with Figma designs)
**Status:** Ready for planning

<domain>
## Phase Boundary

Learners refine their generated learning plan through conversation (broad changes) and direct UI interaction on course cards (delete, explore alternatives) until it fits their needs. Refinement prompt pills guide users toward common adjustments. The prototype reaches user testing readiness.

</domain>

<decisions>
## Implementation Decisions

### Refinement Interaction Model
- **D-01:** Dual interaction model — chat for broad refinements ("make it shorter", "focus more on Python") AND dropdown menus on course cards for direct actions (Remove, Explore alternatives). Per Figma: the dropdown triggers from a pencil/edit icon that appears on hover over a course row.
- **D-02:** Modified plan replaces current plan instantly (same `setPlan()` pattern) with fade-in animation. No diff view or side-by-side comparison. Per Figma: a green checkmark "Updated learning plan" indicator appears in chat after the plan updates.
- **D-03:** AI provides a brief 1-2 sentence summary of what changed after any refinement, with a "Why this recommendation?" section when suggesting alternatives. Per Figma: AI explains its reasoning with bullet points.

### Delete & Alternatives UX
- **D-04:** Both "Remove" and "Explore alternatives" live in the edit dropdown on each course row. Per Figma: dropdown has two items — "Remove" (trash icon) and "Explore alternatives" (refresh icon). Dropdown is white with rounded-xl, shadow, positioned below/above based on viewport.
- **D-05:** After removing a course, a grey shimmer/placeholder row appears in its place while the AI searches for alternatives. AI then suggests a replacement in chat with reasoning. When the AI finds a replacement, the plan auto-updates (placeholder replaced with new course). Per Figma: the slot is visually preserved, not collapsed.
- **D-06:** "Explore alternatives" triggers a **chat-based flow** (NOT inline expansion). User clicks "Explore alternatives" → an "Explore alternatives" pill/message appears in chat → AI responds with a recommended replacement course and reasoning → plan auto-updates with the new course. Per Figma: there are no inline alternative cards in the plan panel.
- **D-07:** REMOVED — no compact alternative cards needed. Alternatives flow entirely through chat with AI explanation.

### Refinement Pills
- **D-08:** Hybrid pills — 2 static pills + 2 AI-generated contextual pills based on the plan. Static pills: "Shorten timeline", "Add hands-on projects". AI pills are context-aware (e.g., if plan is 12 months, suggest "Finish in 6 months").
- **D-09:** Refinement pills appear in the chat panel below the AI's plan summary message. Follows existing pill placement pattern from conversation phase.

### Plan Regeneration Scope
- **D-10:** Full plan regeneration for chat-based refinements (broad changes like goal/timeline adjustments). Reuses existing plan generation flow (search_courses + build_learning_plan tools). Entire plan rebuilds with updated context.
- **D-11:** Current plan summary (milestone names, course names) passed to AI during regeneration so it can preserve what worked while adjusting to new constraints. Lightweight context, not full serialization.
- **D-12:** Remove triggers shimmer placeholder + AI replacement suggestion (server round-trip). Explore alternatives also goes through chat/AI. Both are AI-assisted, not purely client-only. Broad chat refinements trigger full regeneration.

### Claude's Discretion
- Shimmer/placeholder animation style for removed course slots
- How plan summary is serialized for regeneration context (compact format in system prompt or injected as user message)
- "Updated learning plan" indicator implementation (inline in chat or as data part)
- AI message toolbar (thumbs up/down, copy, refresh) — implement if time allows, defer if not

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Figma Designs (CRITICAL — source of truth for UI)
- Figma file `09QwwupjILrMRIxItWOBhN` node `2928:179713` — "Edit plan" screen: shows dropdown menu with Remove + Explore alternatives, chat with course comparison
- Figma file `09QwwupjILrMRIxItWOBhN` node `3013:20807` — "Simmer" screen: shows shimmer placeholder after course removal, "Exploring alternatives" loading state in chat
- Figma file `09QwwupjILrMRIxItWOBhN` node `3013:136485` — "New course" screen: shows AI recommendation with reasoning, "Updated learning plan" confirmation

### Plan Data & Types
- `src/lib/plan-types.ts` — LearningPlan, PlanMilestone, PlanCourse schemas
- `src/lib/types.ts` — AppPhase state machine, GatheredInfo, ChatUIMessage, StructuredPillData

### State & Chat Wiring
- `src/components/app-shell.tsx` — useChat hook, phase state machine, plan state (`setPlan`), data part handlers, `handleSend` callback, auto-trigger logic
- `src/components/lihp/lihp-page.tsx` — Passes `onSend` to ChatSidePanel, `plan` + `onViewPlan` to ProgressivePlanModule
- `src/components/chat/chat-panel.tsx` — Message rendering, pill display, input handling

### Plan Display (existing dropdown + stubs)
- `src/components/lihp/learning-plan-banner.tsx` — **Already has functional CourseEditMenu** (lines 60-80) with "Remove" and "Explore alternatives" buttons but no onClick handlers. ExpandedCourseRow (lines 82-131) has edit icon with menu trigger on hover. MilestoneCard (lines 133-193) with expand/collapse.
- `src/components/plan/plan-course-card.tsx` — Course cards with MoreHorizontal icon stub (line 86). Used by older plan views, may be superseded by banner's ExpandedCourseRow.
- `src/components/plan/milestone-section.tsx` — Milestone sections with MoreHorizontal icon stub

### AI & Route Handler
- `src/app/api/chat/route.ts` — Tool definitions (search_courses, build_learning_plan), data part emission via `writer.write()`, searchResultsCache Map, plan generation flow
- `src/lib/prompts/system-prompt.ts` — System prompt (needs refinement section added). Currently 178 lines covering conversation + plan generation. No refinement instructions exist yet.
- `src/lib/prompts/plan-schemas.ts` — buildPlanInputSchema for plan tool
- `src/lib/prompts/schemas.ts` — conversationStateSchema with suggested_pills

### Existing Patterns
- `src/components/chat/structured-choice-card.tsx` — Structured pills pattern (multi/single choice) for reference on refinement pills
- `src/components/chat/contextual-pills.tsx` — Pill rendering and dismiss behavior

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (high value — already built)
- **CourseEditMenu component** (learning-plan-banner.tsx:60-80) — Fully styled dropdown with "Remove" (trash icon) and "Explore alternatives" (refresh icon). Uses backdrop pattern for dismiss, position-aware (openUp prop). Just needs onClick handlers wired.
- **ExpandedCourseRow component** (learning-plan-banner.tsx:82-131) — Course row with hover-reveal edit icon, menu state management (`menuOpen`), positioned CourseEditMenu. Ready for action handlers.
- **`data-learning-plan` data part pattern** — plan emission from server (`writer.write()`) to client (`onData` → `setPlan()`). Same pattern works for updated plans after refinement.
- **`handleSend` callback** in app-shell.tsx (line 166) — sends text to `/api/chat`. Can be passed down to plan components for programmatic "Explore alternatives for [course]" messages.
- **`searchResultsCache` Map** in route handler — accumulates courses across multi-step tool calls, reusable for refinement searches.
- **`StructuredPillData` type** — supports `type: "single"` with question + options, can carry refinement pill data.

### Key Code Changes Required

**1. Wire CourseEditMenu actions** (`learning-plan-banner.tsx`)
- CourseEditMenu buttons (lines 69-76) have no onClick handlers — need to add:
  - Remove: call a handler that updates plan state (shimmer placeholder) AND sends chat message for AI replacement
  - Explore alternatives: call a handler that sends "Explore alternatives for [course name] in [milestone]" to chat
- CourseEditMenu needs new props: `onRemove`, `onExploreAlternatives`, `courseName`, `milestoneName`
- ExpandedCourseRow needs to accept and pass these callbacks

**2. Thread onSend + setPlan through component tree**
- `LihpPage` → `ProgressivePlanModule` → `LearningPlanBanner` → `MilestoneCard` → `ExpandedCourseRow` → `CourseEditMenu`
- Currently `onSend` stops at ChatSidePanel. Need to also pass it (or a wrapped version) to the plan display side.
- `setPlan` (or a `onRemoveCourse` / `onUpdatePlan` callback) needs to flow from AppShell → LihpPage → ProgressivePlanModule → LearningPlanBanner

**3. Add shimmer/placeholder state for removed courses** (`learning-plan-banner.tsx`)
- When a course is removed, replace its row with a grey shimmer placeholder (per Figma "Simmer" screen)
- Track removed course IDs in component state or plan state
- Placeholder persists until AI sends an updated plan via `data-learning-plan`

**4. Extend system prompt** (`system-prompt.ts`)
- Add a "Plan Refinement" section covering:
  - How to handle "Explore alternatives for [course]" requests (search for alternatives, recommend one with reasoning, call build_learning_plan to update)
  - How to handle "[Course] was removed from [milestone]" messages (search for replacement, recommend with reasoning, update plan)
  - How to handle broad refinement requests ("shorten timeline", "add more Python") — full regeneration
  - Include current plan context in refinement requests (milestone names + course names)
  - "Why this recommendation?" reasoning format with bullet points (per Figma)
  - "Updated learning plan" confirmation text after changes

**5. Allow chat during plan phases** (`app-shell.tsx`)
- Phase guards (lines 83-88) currently block all conversation state updates in plan phases
- Need to allow refinement messages in `plan_generated` phase without resetting gathered info
- May need a `refining` sub-state or flag to distinguish initial plan generation from refinement
- `planTriggerSent` ref needs reset logic so refinement can re-trigger plan generation

**6. Handle updated plan from refinement** (`app-shell.tsx` + `route.ts`)
- Route handler already emits `data-learning-plan` — same data part works for updates
- onData handler (line 105) already calls `setPlan(planData)` — works for replacements
- Need to ensure phase stays `plan_generated` (not transition back to `plan_generating`) during refinement
- Add `data-plan-updated` indicator or emit "Updated learning plan" as a data part

**7. Refinement pills after plan generation** (`system-prompt.ts` + `app-shell.tsx`)
- System prompt needs to emit refinement pills after plan generation (currently pills are suppressed when `ready_for_plan: true`)
- Either: AI sends refinement pills in its Step 7 confirmation message, OR client-side generates static + AI hybrid pills
- Phase guard in onData needs to allow pill updates in `plan_generated` phase (currently blocked)

### Established Patterns
- **Data part emission**: `writer.write({ type: "data-*", data: {...} })` → client `onData()` handler
- **Phase guards**: Plan phases block conversation state resets — need modification for refinement
- **Tool calling**: Multi-step `streamText` with `stopWhen(stepCountIs(6))` for search + build + response
- **Course deduplication**: `usedCourseIds` Set in `build_learning_plan` tool prevents cross-milestone duplicates
- **Dropdown pattern**: CourseEditMenu uses fixed backdrop + absolute positioned menu + z-index layering

### Integration Points
- **Phase state machine** needs refinement-aware logic within `plan_generated` — allow chat + plan updates without re-entering `plan_generating`
- **Component prop threading**: `onSend` and plan mutation callbacks need to reach from AppShell → LihpPage → plan display components (currently only reaches ChatSidePanel)
- **System prompt**: Needs refinement section (~40-50 lines) covering alternatives, removal, and broad refinement flows
- **Route handler**: May need to detect refinement context (plan already exists) and adjust tool calling behavior

</code_context>

<specifics>
## Specific Ideas (from Figma)

- **Shimmer placeholder**: When a course is removed, a grey placeholder row (same height as course row) appears with shimmer animation while AI finds replacement. Per Figma "Simmer" screen.
- **"Exploring alternatives" loading state**: Chat shows a loading indicator with text "Exploring alternatives" while AI searches. Per Figma "Simmer" screen.
- **"Why this recommendation?" format**: AI explains replacement with bold course name, followed by "Why this recommendation?" heading and bullet points. Per Figma "New course" screen.
- **"Updated learning plan" confirmation**: Green checkmark with "Updated learning plan" text appears in chat after plan auto-updates. Per Figma "New course" screen.
- **Chat input placeholder**: "Ask about selected courses..." (per Figma). Currently says something different.
- **AI message toolbar**: Thumbs up/down, copy, clipboard, refresh, more (...) icons below each AI message. Per all three Figma screens. Defer if time is tight.
- **"Compare selected courses"**: Figma "Edit plan" screen shows this as a user action in chat — consider as a stretch goal.

</specifics>

<deferred>
## Deferred Ideas

- AI message toolbar (thumbs up/down, copy, refresh, more) — nice to have but not core refinement
- "Compare selected courses" action — shown in Figma but beyond REFN-01 to REFN-04 scope
- Course expand/collapse chevrons on individual course rows — shown in Figma but not in current requirements
- Voice input (microphone icon in chat input) — shown in Figma, explicitly out of scope
- "+" button in chat input — shown in Figma, purpose unclear, defer

</deferred>

---

*Phase: 04-refinement-polish*
*Context gathered: 2026-04-06*
*Updated: 2026-04-06 — aligned with Figma designs (nodes 2928:179713, 3013:20807, 3013:136485)*
