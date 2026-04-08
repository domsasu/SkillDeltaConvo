---
phase: 04-refinement-polish
plan: 02
subsystem: ui
tags: [react, callbacks, shimmer, refinement, direct-manipulation]

# Dependency graph
requires:
  - phase: 04-refinement-polish
    plan: 01
    provides: "Refinement AI layer (system prompt, phase guards, plan context injection, handleSend)"
provides:
  - "CourseEditMenu Remove/Explore alternatives wired to programmatic chat messages"
  - "ShimmerPlaceholder component for pending course removals"
  - "pendingRemovals state management in AppShell (set on remove, cleared on plan update)"
  - "Full callback chain: AppShell -> LihpPage -> ProgressivePlanModule -> LearningPlanBanner -> MilestoneCard -> ExpandedCourseRow -> CourseEditMenu"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop-drilling refinement callbacks through 4-level component tree (AppShell -> LihpPage -> ProgressivePlanModule -> LearningPlanBanner)"
    - "pendingRemovals Set<string> pattern: add courseId on remove, clear all on plan update"
    - "ShimmerPlaceholder as conditional render replacement for pending course rows"

key-files:
  created: []
  modified:
    - src/components/app-shell.tsx
    - src/components/lihp/lihp-page.tsx
    - src/components/lihp/progressive-plan-module.tsx
    - src/components/lihp/learning-plan-banner.tsx

key-decisions:
  - "pendingRemovals cleared entirely on any plan update (not per-course) for simplicity"
  - "ShimmerPlaceholder uses inline style for gradient/animation to match existing pattern in progressive-plan-module.tsx"

patterns-established:
  - "Refinement callback threading: typed callbacks flow from AppShell through component tree to CourseEditMenu"
  - "Conditional shimmer: isPending prop triggers ShimmerPlaceholder instead of course row"

requirements-completed: [REFN-02, REFN-03, REFN-04]

# Metrics
duration: 2min
completed: 2026-04-06
---

# Phase 04 Plan 02: Refinement UI Interactions Summary

**CourseEditMenu Remove/Explore alternatives wired to shimmer placeholders and programmatic chat messages via 4-level callback chain**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T14:34:51Z
- **Completed:** 2026-04-06T14:37:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Wired CourseEditMenu Remove button to trigger shimmer placeholder + [REMOVE] chat message to AI
- Wired CourseEditMenu Explore alternatives button to trigger "Explore alternatives for..." chat message
- Added ShimmerPlaceholder component (68px, shimmer animation, accessible with role="status" and aria-label)
- Threaded pendingRemovals state and refinement callbacks from AppShell through LihpPage, ProgressivePlanModule, LearningPlanBanner, MilestoneCard, to ExpandedCourseRow
- pendingRemovals cleared automatically when new plan arrives from AI

## Task Commits

Each task was committed atomically:

1. **Task 1: Add pendingRemovals state and refinement callbacks to AppShell, thread through LihpPage and ProgressivePlanModule** - `0f0f6df` (feat)
2. **Task 2: Wire CourseEditMenu actions and add ShimmerPlaceholder to LearningPlanBanner** - `5797ff0` (feat)

## Files Created/Modified
- `src/components/app-shell.tsx` - Added pendingRemovals state, handleRemoveCourse/handleExploreAlternatives callbacks, cleared pendingRemovals on plan update, passed new props to LihpPage
- `src/components/lihp/lihp-page.tsx` - Extended LihpPageProps with refinement props, threaded to ProgressivePlanModule
- `src/components/lihp/progressive-plan-module.tsx` - Extended ProgressivePlanModuleProps with refinement props, threaded to LearningPlanBanner
- `src/components/lihp/learning-plan-banner.tsx` - Added ShimmerPlaceholder component, wired CourseEditMenu buttons, extended ExpandedCourseRow/MilestoneCard/LearningPlanBanner with refinement props

## Decisions Made
- pendingRemovals cleared entirely (new Set()) on any plan update rather than removing individual courseIds -- simpler and correct since AI sends a full replacement plan
- ShimmerPlaceholder uses inline style for gradient/animation matching the existing shimmer pattern in progressive-plan-module.tsx

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 04 (refinement-polish) is now complete: AI refinement layer (Plan 01) + UI interaction wiring (Plan 02)
- Full refinement flow operational: Remove course -> shimmer -> AI replacement -> plan update; Explore alternatives -> chat message -> AI response -> plan update

---
*Phase: 04-refinement-polish*
*Completed: 2026-04-06*
