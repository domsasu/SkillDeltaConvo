---
phase: 01-foundation
plan: 02
subsystem: api
tags: [graphql, coursera, typescript, next-api-routes, mock-data]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: config module with COURSERA_GRAPHQL_ENDPOINT, OPENAI_API_KEY, OPENAI_MODEL
provides:
  - CourseraDiscoveryClient with search method and GraphQL proxy
  - POST /api/courses/search with C+ filtering and mock fallback
  - GET /api/health with env var and connectivity checks
  - TypeScript types for GraphQL course data (CourseHit, SearchResult, SearchRequest)
  - 10 realistic mock courses with keyword search function
affects: [02-ai-chat, 03-plan-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-side GraphQL proxy via Route Handler, mock data fallback with transparent flag, singleton client pattern]

key-files:
  created:
    - src/lib/coursera-types.ts
    - src/lib/coursera-queries.ts
    - src/lib/mock-data.ts
    - src/lib/coursera-client.ts
    - src/app/api/courses/search/route.ts
    - src/app/api/health/route.ts
  modified: []

key-decisions:
  - "Ported only search() method from JS client for Phase 1 scope (skipped searchProducts, searchSuggestions, recommendQueryPrompts, discoveryCollections, getProductDetailBySlug)"
  - "Stripped SEARCH_QUERY to Search_ProductHit only (removed SuggestionHit, ArticleHit fragments, source, aiSearchMetadata fields)"
  - "Used type assertion (as CourseHit[]) after runtime filter instead of type predicate to satisfy TypeScript strict mode with Partial<CourseHit> element type"

patterns-established:
  - "GraphQL proxy: Route Handler imports singleton client, catches errors, falls back to mock data with mock boolean flag"
  - "Mock fallback: searchMockCourses does case-insensitive keyword matching on name+skills, returns first 5 matches or first 5 courses"
  - "Health check: GET /api/health reports env var status and tests GraphQL connectivity with a lightweight search"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 01 Plan 02: Coursera Data Layer Summary

**GraphQL proxy client ported from JS prototype with TypeScript types, C+ course filtering, mock data fallback, and health check endpoint**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T17:08:57Z
- **Completed:** 2026-03-31T17:11:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Ported CourseraDiscoveryClient from existing JS prototype to TypeScript with AbortController timeout, error classes, and defensive null chaining
- Created POST /api/courses/search that proxies to Coursera GraphQL, filters C+ courses, and falls back to mock data transparently
- Created GET /api/health that reports env var configuration and tests GraphQL connectivity
- Built 10 realistic mock courses spanning data science, web dev, cloud, UX, and project management with keyword search function

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TypeScript types, GraphQL queries, and mock course data** - `e989dab` (feat)
2. **Task 2: Port CourseraDiscoveryClient and create API route handlers** - `2dc0fbf` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/lib/coursera-types.ts` - CourseHit, SearchResult, SearchRequest, SearchPagination interfaces
- `src/lib/coursera-queries.ts` - SEARCH_QUERY GraphQL string (Search_ProductHit only)
- `src/lib/mock-data.ts` - 10 mock CourseHit entries and searchMockCourses function
- `src/lib/coursera-client.ts` - CourseraDiscoveryClient with search method, CourseraGatewayError, singleton export
- `src/app/api/courses/search/route.ts` - POST handler with C+ filtering and mock fallback
- `src/app/api/health/route.ts` - GET handler reporting env vars and GraphQL connectivity

## Decisions Made
- Ported only the `search()` method for Phase 1 scope; other methods (discoveryCollections, getProductDetailBySlug, etc.) deferred
- Stripped SEARCH_QUERY to Search_ProductHit fragment only, removing SuggestionHit and ArticleHit fragments not needed for course search
- Used `as CourseHit[]` type assertion after runtime filter since TypeScript cannot narrow `Partial<CourseHit>` through `.filter()` type predicate when the source type uses `Partial`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type narrowing in search route**
- **Found during:** Task 2 (API route handler creation)
- **Issue:** `(el): el is CourseHit =>` type predicate on `Partial<CourseHit>` array caused TS2322 - TypeScript cannot narrow Partial to full type through filter predicate
- **Fix:** Changed to runtime filter + `as CourseHit[]` type assertion, which is safe because the runtime check ensures all required fields exist on Search_ProductHit elements
- **Files modified:** src/app/api/courses/search/route.ts
- **Verification:** `npm run build` passes cleanly
- **Committed in:** 2dc0fbf (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type assertion change for TypeScript compatibility. No scope creep.

## Issues Encountered
None beyond the type narrowing fix documented above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data sources are wired (GraphQL client to real endpoint, mock data as fallback).

## Next Phase Readiness
- Coursera data layer complete: search endpoint returns real or mock course data
- Types are ready for consumption by plan generation (Phase 3) and UI (Phase 2)
- Health check provides verification for deployment smoke testing

## Self-Check: PASSED

All 6 files verified present. Both task commits (e989dab, 2dc0fbf) verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-31*
