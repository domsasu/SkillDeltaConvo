---
phase: 03-plan-generation-display
plan: 01
subsystem: api
tags: [openai, ai-sdk, zod, tool-calling, streaming, graphql]

# Dependency graph
requires:
  - phase: 02-ai-chat-core
    provides: chat route with streamText, conversation state tool, system prompt, coursera client
  - phase: 01-foundation
    provides: CourseraDiscoveryClient, mock data, coursera types
provides:
  - LearningPlan/PlanMilestone/PlanCourse Zod schemas and TypeScript types
  - search_courses AI SDK tool with C+ filter and mock fallback
  - build_learning_plan AI SDK tool that assembles plan from search results
  - Extended system prompt with plan generation flow instructions
  - Multi-step tool calling in chat route (stopWhen stepCountIs(6))
  - data-learning-plan data part emission to client
  - Extended AppPhase with plan_generating, plan_generated, viewing_plan states
affects: [03-02-plan-display-ui, 04-plan-refinement]

# Tech tracking
tech-stack:
  added: []
  patterns: [multi-step-tool-calling, search-results-cache-across-steps, data-part-emission]

key-files:
  created:
    - src/lib/plan-types.ts
    - src/lib/prompts/plan-schemas.ts
    - src/lib/tools/search-courses.ts
  modified:
    - src/lib/types.ts
    - src/lib/prompts/system-prompt.ts
    - src/app/api/chat/route.ts

key-decisions:
  - "searchResultsCache Map accumulates courses across multi-step tool calls for build_learning_plan lookup by courseId"
  - "stopWhen(stepCountIs(6)) allows 3-4 search calls + 1 build + 1 final text response"
  - "Plan schema validation via safeParse before emitting data part -- graceful degradation on failure"

patterns-established:
  - "Multi-step tool calling: tools that accumulate state across steps via closure-scoped cache"
  - "Tool wrapping: searchCoursesWithCache wraps searchCoursesTool to add side effects without modifying original"
  - "Plan data flow: AI searches -> cache -> build tool assembles -> schema validates -> data part emits"

requirements-completed: [PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06]

# Metrics
duration: 4min
completed: 2026-04-01
---

# Phase 03 Plan 01: Plan Generation Backend Summary

**Multi-step AI tool calling pipeline: search_courses queries C+ catalog, build_learning_plan assembles milestone-based plans with Zod validation, delivered to client via data-learning-plan data part**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-01T15:30:24Z
- **Completed:** 2026-04-01T15:34:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Plan type system with Zod schemas for LearningPlan, PlanMilestone, PlanCourse validation
- search_courses AI SDK tool with C+ catalog filter and mock data fallback
- build_learning_plan tool that maps courseIds to cached search results and assembles full plan structure
- System prompt extended with detailed plan generation flow (milestone patterns, duration calculation, course selection guidelines)
- Chat route upgraded to multi-step tool calling with stopWhen(stepCountIs(6)) and plan data part emission

## Task Commits

Each task was committed atomically:

1. **Task 1: Create plan types, Zod schemas, and search_courses tool** - `bf47038` (feat)
2. **Task 2: Extend system prompt and update chat route** - `fa225f1` (feat)

## Files Created/Modified
- `src/lib/plan-types.ts` - LearningPlan, PlanMilestone, PlanCourse Zod schemas and inferred types
- `src/lib/prompts/plan-schemas.ts` - BuildPlanInput Zod schema for AI tool input
- `src/lib/tools/search-courses.ts` - search_courses tool with C+ filter and mock fallback
- `src/lib/types.ts` - Extended AppPhase with plan lifecycle states, ChatUIMessage with learning-plan data part
- `src/lib/prompts/system-prompt.ts` - Plan generation instructions (milestone patterns, duration calc, course selection)
- `src/app/api/chat/route.ts` - Multi-step tool calling with searchResultsCache, build_learning_plan, stopWhen, data part emission

## Decisions Made
- Used closure-scoped Map for searchResultsCache rather than global state -- ensures isolation per request
- Wrapped searchCoursesTool with cache-populating wrapper instead of modifying the original tool -- keeps tool reusable
- stopWhen(stepCountIs(6)) provides headroom for 3-4 searches + build + final text without runaway loops
- Plan schema validation via safeParse before data part emission -- if validation fails, error is logged but AI text response still reaches client
- Skip default conversation state emission when plan was generated (plan flow may not call report_conversation_state)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed tool definition field name: parameters -> inputSchema**
- **Found during:** Task 1
- **Issue:** Plan specified `parameters` field for tool definition but AI SDK v6 uses `inputSchema`
- **Fix:** Changed to `inputSchema` matching existing codebase pattern
- **Files modified:** src/lib/tools/search-courses.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** bf47038 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed type predicate and field names in route handler**
- **Found during:** Task 2
- **Issue:** Plan referenced `result.result` and `result.args` but AI SDK v6 StepResult uses `output` and `input` fields
- **Fix:** Changed to `toolResult.output` and `toolResult.input` matching AI SDK v6 types
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** fa225f1 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the deviations noted above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan generation backend is complete and ready for UI display (03-02)
- Client needs to handle data-learning-plan data parts from useChat
- AppPhase states (plan_generating, plan_generated, viewing_plan) are ready for UI state transitions

## Self-Check: PASSED

All 7 files verified present. Both task commits (bf47038, fa225f1) verified in git log.

---
*Phase: 03-plan-generation-display*
*Completed: 2026-04-01*
