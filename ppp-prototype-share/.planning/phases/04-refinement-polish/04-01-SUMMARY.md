---
phase: 04-refinement-polish
plan: 01
subsystem: ai, ui
tags: [openai, system-prompt, refinement, state-machine, streaming]

# Dependency graph
requires:
  - phase: 03-plan-generation-display
    provides: "Plan generation pipeline (search_courses + build_learning_plan tools, plan data parts, phase state machine)"
  - phase: 03.1-ux-polish
    provides: "StructuredPillData rendering, contextual pills, chat panel layout"
provides:
  - "System prompt refinement instructions (broad, removal, alternatives, pills)"
  - "Refinement-aware phase guards allowing chat and pill updates in plan_generated"
  - "Plan context injection in handleSend for refinement messages"
  - "Route handler emitting conversation state (refinement pills) after plan updates"
  - "PlanUpdatedIndicator data part type registration"
affects: [04-02-refinement-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Refinement-aware phase guard: plan_generated allows pill updates but blocks phase transitions"
    - "Plan context injection: [Current Plan] prefix with milestone/course summary for AI refinement context"
    - "Unconditional conversation state emission for tool and inline-json sources; default state still gated by planEmitted"

key-files:
  created: []
  modified:
    - src/lib/prompts/system-prompt.ts
    - src/app/api/chat/route.ts
    - src/components/app-shell.tsx
    - src/lib/types.ts
    - src/components/chat/chat-panel.tsx

key-decisions:
  - "Unconditional emission of conversation state from tool/inline-json sources; only default state suppressed during plan generation"
  - "Plan context injection uses milestone names + course names (not full plan JSON) to stay within token limits"
  - "Refinement pills: 2 common + 2 context-aware, type single, per system prompt instructions"

patterns-established:
  - "Refinement-aware phase guard: specific plan_generated branch vs blanket planStates block"
  - "Message prefix convention: [Current Plan] for context, [REMOVE] for removal actions"

requirements-completed: [REFN-01, REFN-04]

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 04 Plan 01: Refinement AI Layer Summary

**System prompt refinement instructions + refinement-aware phase guards enabling plan chat, pill updates, and plan context injection in plan_generated phase**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T14:30:43Z
- **Completed:** 2026-04-06T14:33:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended system prompt with ~45-line Plan Refinement section covering broad refinements, course removal, explore alternatives, and refinement pill generation
- Modified phase guards to allow pill updates and chat interaction in plan_generated without regressing phase
- Injected current plan context (milestone names + course names) into refinement messages via [Current Plan] prefix
- Enabled route handler to emit conversation state (refinement pills) unconditionally after plan updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend system prompt with refinement instructions and modify route handler** - `990bd9a` (feat)
2. **Task 2: Modify AppShell phase guards and handleSend for refinement chat** - `6c94316` (feat)

## Files Created/Modified
- `src/lib/prompts/system-prompt.ts` - Added Plan Refinement section (~45 lines) with broad, removal, alternatives, and pills instructions
- `src/app/api/chat/route.ts` - Removed !planEmitted guard from tool and inline-json conversation state emission
- `src/components/app-shell.tsx` - Refinement-aware phase guards, plan context injection in handleSend
- `src/lib/types.ts` - Added plan-updated data part type to ChatUIMessage
- `src/components/chat/chat-panel.tsx` - Refinement placeholder "Ask about selected courses..." for chat input

## Decisions Made
- Unconditional emission of conversation state from tool/inline-json sources ensures refinement pills reach the client after plan updates; default state emission still gated by planEmitted to avoid noise during initial plan generation
- Plan context injection uses concise milestone/course summary rather than full JSON to stay within token limits

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Refinement AI layer is complete: system prompt has instructions, phase guards allow interaction, route handler delivers pills
- Ready for 04-02 (refinement UI interactions: course removal, explore alternatives, plan update rendering)

---
*Phase: 04-refinement-polish*
*Completed: 2026-04-06*
