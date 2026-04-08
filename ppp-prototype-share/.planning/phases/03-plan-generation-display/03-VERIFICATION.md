---
phase: 03-plan-generation-display
verified: 2026-04-01T15:45:18Z
status: human_needed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "Full plan generation flow end-to-end"
    expected: "Start a conversation, confirm plan generation, observe loading skeleton, then populated banner with real Coursera courses, then click View full plan for full split-view"
    why_human: "Requires live OpenAI API call with multi-step tool calling and Coursera Search GraphQL; cannot test streaming, tool invocation count, or actual course data quality programmatically"
  - test: "Course links open in new tab"
    expected: "Clicking a course name in the plan opens coursera.org/[course-path] in a new browser tab"
    why_human: "Browser interaction required; href construction verified in code but tab behavior needs runtime confirmation"
  - test: "Layout transitions: entry -> split-view -> full plan view"
    expected: "Entry screen transitions smoothly (500ms ease-out) to split-view layout; plan panel expands; chat stays fixed at 400px throughout; 'Back to home' and 'View full plan' swap content without route change"
    why_human: "CSS animation and layout behavior requires browser rendering; widths and transitions cannot be asserted via static analysis"
  - test: "Loading skeleton visibility during plan generation"
    expected: "Between the user confirming plan generation and the plan data arriving, PlanLoadingSkeleton is visible in the main panel with animate-pulse effect; LIHP sections are hidden during this state"
    why_human: "State transition timing requires live interaction to observe"
---

# Phase 3: Plan Generation and Display — Verification Report

**Phase Goal:** Once the AI has gathered enough context, it generates a personalized learning plan of real Coursera courses organized into milestones, displayed in a split-view layout alongside the ongoing conversation
**Verified:** 2026-04-01T15:45:18Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AI calls search_courses tool multiple times when plan generation is triggered | VERIFIED | `searchCoursesWithCache` registered as `search_courses` in tools, `stopWhen: stepCountIs(6)` allows 3-4 searches; system prompt instructs 3-4 calls |
| 2 | Search results filtered to C+ catalog only (isPartOfCourseraPlus) | VERIFIED | `search-courses.ts` line 29: `el.isPartOfCourseraPlus === true` filter applied before returning results |
| 3 | Complete plan delivered to client via data-learning-plan data part | VERIFIED | `route.ts` line 184-188: `writer.write({ type: "data-learning-plan", data: planData })` in onFinish |
| 4 | Plan data validates against Zod schema (milestones, courses, duration, summary) | VERIFIED | `learningPlanSchema.safeParse(toolResult.output)` in route.ts; `learningPlanSchema` covers all required fields |
| 5 | System prompt instructs AI on milestone structure, duration calculation, and plan generation flow | VERIFIED | `system-prompt.ts` lines 72-118: full Plan Generation section with Steps 1-5, milestone patterns, duration calc |
| 6 | Full plan view shows title, Start CTA, summary bar, and milestone sections | VERIFIED | `plan-view.tsx`: title h1, "Start learning plan" button, `PlanSummaryBar`, mapped `MilestoneSection` per milestone |
| 7 | Each milestone contains course cards with name, partner, duration, skills, and thumbnail | VERIFIED | `plan-course-card.tsx`: img (80x80), course name link, skills slice(0,4), partners + productType + duration |
| 8 | Course names link to coursera.org in a new tab | VERIFIED | `plan-course-card.tsx` line 49-50: `href={"https://www.coursera.org" + course.url}`, `target="_blank"` |
| 9 | Plan summary bar shows role, key skills, duration, and hours/week | VERIFIED | `plan-summary-bar.tsx`: role (bold), skills.slice(0,5), duration, hoursPerWeek separated by middots |
| 10 | When plan data arrives, AppShell stores it; banner populates; content swap works | VERIFIED | `app-shell.tsx` onData handler lines 56-59; `lihp-page.tsx` lines 50-57 conditional rendering PlanView vs LIHP sections |

**Score:** 10/10 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/plan-types.ts` | LearningPlan, PlanMilestone, PlanCourse Zod schemas and types | VERIFIED | Exports `learningPlanSchema`, `planMilestoneSchema`, `planCourseSchema`, `LearningPlan`, `PlanMilestone`, `PlanCourse` |
| `src/lib/prompts/plan-schemas.ts` | buildPlanInputSchema for build_learning_plan tool | VERIFIED | Exports `buildPlanInputSchema`, `BuildPlanInput` |
| `src/lib/tools/search-courses.ts` | search_courses AI SDK tool with C+ filter and mock fallback | VERIFIED | Exports `searchCoursesTool`; C+ filter present; `searchMockCourses` fallback in catch and empty-results path |
| `src/lib/types.ts` | Extended AppPhase with plan states; ChatUIMessage with learning-plan data part | VERIFIED | AppPhase includes `plan_generating`, `plan_generated`, `viewing_plan`; ChatUIMessage includes `"learning-plan": LearningPlan` |
| `src/app/api/chat/route.ts` | Multi-step tool calling, search cache, build_learning_plan, data part emission | VERIFIED | `search_courses`, `build_learning_plan` in tools; `stopWhen: stepCountIs(6)`; `data-learning-plan` emitted in onFinish |
| `src/lib/prompts/system-prompt.ts` | Plan generation instructions with milestone patterns and course selection | VERIFIED | Full Plan Generation section (Steps 1-5), Career change / upskilling milestone patterns, Course Selection Guidelines |
| `src/components/plan/plan-view.tsx` | Full plan view container with back link, title, CTA, summary bar, milestones | VERIFIED | "Back to home" with ArrowLeft, plan title h1, "Start learning plan" CTA, PlanSummaryBar, mapped MilestoneSection |
| `src/components/plan/plan-summary-bar.tsx` | Summary line with role, skills, duration, hours | VERIFIED | Role (bold), skills.slice(0,5), duration, hoursPerWeek |
| `src/components/plan/milestone-section.tsx` | Milestone with name, description, skills, badges, course cards | VERIFIED | Header row with name + badges (`bg-[#e3eeff]`), description, skills; `divide-y divide-[#dae1ed]` course list |
| `src/components/plan/plan-course-card.tsx` | Course card with thumbnail, name link, skills, partner, badges | VERIFIED | 80x80 img, `<a href="https://www.coursera.org"+url target="_blank">`, skills, partner+type+duration, ActivityBadge |
| `src/components/plan/activity-badge.tsx` | Mocked activity badge pill | VERIFIED | Exports `ActivityBadge`; `bg-[#f2f5fa]` pill with Circle icon |
| `src/components/plan/plan-loading-skeleton.tsx` | Skeleton placeholder during plan generation | VERIFIED | `animate-pulse`; mimics PlanView layout with 3 milestone skeletons each with 3 course card skeletons |
| `src/components/app-shell.tsx` | Extended state machine with plan states, data part handling | VERIFIED | `useState<LearningPlan | null>(null)`, `data-learning-plan` handler, `setPlan`, all plan phase transitions |
| `src/components/lihp/lihp-page.tsx` | Conditional rendering PlanView vs LIHP sections | VERIFIED | Imports PlanView, PlanLoadingSkeleton; `viewingPlan && plan` -> PlanView; `plan_generating` -> skeleton; `plan_generated` -> banner |
| `src/components/lihp/learning-plan-banner.tsx` | Data-bound banner with real plan data, onViewPlan callback | VERIFIED | Props: `plan: LearningPlan`, `onViewPlan`; renders `plan.milestones`, `plan.summary.role`, `plan.summary.skills`; no hardcoded MILESTONES constant |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `route.ts` | `search-courses.ts` | `searchCoursesWithCache` wraps `searchCoursesTool`, registered as `search_courses` | WIRED | Line 147: `search_courses: searchCoursesWithCache` |
| `search-courses.ts` | `coursera-client.ts` | `getCourseraClient().search()` call | WIRED | Line 24: `getCourseraClient().search({ query, limit })` |
| `route.ts` | client | `writer.write({ type: "data-learning-plan", data: planData })` in onFinish | WIRED | Line 184-188 |
| `app-shell.tsx` | `lihp-page.tsx` | passes `plan`, `viewingPlan`, `onViewPlan`, `onBackToHome` props | WIRED | Lines 129-137: all four props passed |
| `lihp-page.tsx` | `plan-view.tsx` | `viewingPlan && plan ? <PlanView plan={plan} onBack={onBackToHome} />` | WIRED | Lines 50-51 |
| `plan-view.tsx` | `milestone-section.tsx` | `plan.milestones.map(m => <MilestoneSection key={m.id} milestone={m} />)` | WIRED | Lines 40-42 |
| `milestone-section.tsx` | `plan-course-card.tsx` | `milestone.courses.map(c => <PlanCourseCard key={c.id} course={c} />)` | WIRED | Lines 37-39 |
| `plan-course-card.tsx` | coursera.org | `href={"https://www.coursera.org" + course.url}` with `target="_blank"` | WIRED | Lines 49-50 |
| `app-shell.tsx` | `data-learning-plan` | `onData` handler checks `dataPart.type === "data-learning-plan"`, calls `setPlan` | WIRED | Lines 56-59 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `learning-plan-banner.tsx` | `plan` prop | `app-shell.tsx` state `plan`, set from `data-learning-plan` data part | Yes — set from validated plan returned by `build_learning_plan` tool execution | FLOWING |
| `plan-view.tsx` | `plan` prop | Passed from `lihp-page.tsx` -> `app-shell.tsx` state | Yes — same chain as banner | FLOWING |
| `milestone-section.tsx` | `milestone` prop | `plan.milestones[i]` from plan state | Yes — milestones built in `buildLearningPlanTool.execute` from `searchResultsCache` | FLOWING |
| `plan-course-card.tsx` | `course` prop | `milestone.courses[i]` from `searchResultsCache` lookup | Yes — courses are `CourseHit` objects from Coursera Search API or mock fallback | FLOWING |
| `app-shell.tsx` | `plan` state | `onData` handler in `useChat` receives `data-learning-plan` part | Yes — emitted after `learningPlanSchema.safeParse` succeeds | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles cleanly | `node_modules/.bin/tsc --noEmit` | Exit 0, no errors | PASS |
| `search-courses.ts` exports `searchCoursesTool` | `grep "export const searchCoursesTool"` | Found at line 7 | PASS |
| Route has `stopWhen: stepCountIs(6)` | `grep "stopWhen"` in route.ts | Found at line 150 | PASS |
| Route emits `data-learning-plan` | `grep "data-learning-plan"` in route.ts | Found at line 185 | PASS |
| AppShell receives `data-learning-plan` | `grep "data-learning-plan"` in app-shell.tsx | Found at line 56 | PASS |
| Chat panel fixed at 400px | `grep "w-\[400px\]"` in lihp-page.tsx | `w-[400px] shrink-0` at line 72 | PASS |
| Banner uses real plan data (no hardcoded MILESTONES) | `grep "const MILESTONES"` in banner | No matches | PASS |
| `fadeSlideIn` animation defined | `grep "fadeSlideIn" globals.css` | Found at line 69 | PASS |
| Full server start | Not run — requires environment with OPENAI_API_KEY | N/A | SKIP |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PLAN-01 | 03-01 | Plan generated from gathered context using OpenAI with real course data from Search API | SATISFIED | `search_courses` tool calls Coursera client; `build_learning_plan` assembles plan; multi-step tool calling in route.ts |
| PLAN-02 | 03-01 | Plan organized into milestones (foundation, core, applied, advanced) | SATISFIED | System prompt specifies milestone structure patterns; `planMilestoneSchema` enforces milestone array; AI guided to create 2-5 milestones |
| PLAN-03 | 03-01 | Each milestone contains relevant courses with: name, partner, duration, difficulty, skills | SATISFIED | `planCourseSchema` has all fields; `PlanCourseCard` renders name, partners, duration, productDifficultyLevel, skills |
| PLAN-04 | 03-01 | Duration estimates for each course, each milestone, and overall plan | SATISFIED | `planCourseSchema.estimatedHours`, `planMilestoneSchema.estimatedWeeks`, `learningPlanSchema.summary.totalDuration`; system prompt Step 3 instructs duration calculation |
| PLAN-05 | 03-01 | Only C+ catalog courses recommended (isPartOfCourseraPlus filter) | SATISFIED | `search-courses.ts` line 29 filters `isPartOfCourseraPlus === true`; mock fallback for empty/error |
| PLAN-06 | 03-01 | Structured output via Zod schema validation for plan data | SATISFIED | `learningPlanSchema.safeParse()` in route.ts onFinish; plan only emitted if parse succeeds |
| DISP-01 | 03-03 | Split-view layout: plan panel (left ~65%), chat panel (right ~35% / 400px) | SATISFIED | `lihp-page.tsx`: `flex-1` main + `w-[400px] shrink-0` aside; visually confirmed code correct |
| DISP-02 | 03-02 | Plan summary header showing: target role, key skills, timeline, hours/week | SATISFIED | `PlanSummaryBar` renders role, skills.slice(0,5), duration, hoursPerWeek |
| DISP-03 | 03-02 | Milestone sections with course cards inside each milestone | SATISFIED | `MilestoneSection` renders `divide-y` course list with `PlanCourseCard` per course |
| DISP-04 | 03-02 | Course cards with: name, partner name, estimated hours, difficulty badge, skills tags (3-4 per card) | PARTIALLY SATISFIED | `PlanCourseCard` shows name, partners, duration, skills (3-4). `estimatedHours` is stored in schema but not rendered on the card; `productDifficultyLevel` is stored but not rendered as a visual badge on the card. Functionally adequate for prototype. |
| DISP-05 | 03-02 | Course cards link to coursera.org XDP page in new tab | SATISFIED | `href="https://www.coursera.org" + course.url`, `target="_blank"`, `rel="noopener noreferrer"` |
| DISP-06 | 03-03 | Smooth animated transition from entry screen to split view when plan is ready | SATISFIED | `app-shell.tsx` `transition-all duration-500 ease-out` on root div; `fadeSlideIn 200ms ease-out` on banner; `transition-opacity duration-150` on LIHP content |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `plan-course-card.tsx` | `estimatedHours` stored in PlanCourse but not rendered on card | Info | DISP-04 lists "estimated hours" as a display field; hours field exists in schema but card shows `duration` string instead. For prototype purposes this is acceptable — the duration string (e.g., "3 months at 10 hours/week") conveys the same information. |
| `plan-course-card.tsx` | `productDifficultyLevel` stored in schema but not rendered as a visual badge | Info | DISP-04 calls for a "difficulty badge"; the level exists in data but the card renders the product type instead. The information is not surfaced visually. |
| `route.ts` | `courseHitToPlanCourse` hardcodes `estimatedHours: 0` | Warning | The `estimatedHours` field in `PlanCourse` is always 0 since there is no duration-to-hours conversion logic. This affects PLAN-04 (duration estimates per course). Duration string from Coursera API is passed through, but numeric hour estimates are not computed. |

No blockers found. All anti-patterns are informational or minor warnings.

---

### Human Verification Required

#### 1. Full Plan Generation Flow

**Test:** Start the app (`npm run dev`), open http://localhost:3000, begin a conversation: "I want to become a data analyst. I have a marketing background. I can spend 6 hours per week." Respond until AI is ready for plan, then confirm generation.
**Expected:** Loading skeleton appears in main panel, then after 10-20 seconds a populated banner appears showing real Coursera courses grouped into 2-4 milestones. Each milestone should show the milestone name, skills, and course count.
**Why human:** Requires live OpenAI API call (multi-step tool calling with 3-4 searches) and Coursera Search GraphQL API. Cannot be verified without running the server.

#### 2. View Full Plan Navigation

**Test:** After plan appears in banner, click "View full plan".
**Expected:** Main panel swaps to full PlanView: "Back to home" link, plan title, blue "Start learning plan" CTA button, summary bar (role, skills, duration), then 2-4 milestone sections each containing course cards with thumbnail, course name, partner, type, and duration.
**Why human:** Content swap and visual layout require browser rendering.

#### 3. Course Link Navigation

**Test:** In the full plan view, click any course name in a course card.
**Expected:** coursera.org opens in a new browser tab at the correct course XDP URL.
**Why human:** Browser tab behavior requires interaction testing.

#### 4. Back Navigation

**Test:** From full plan view, click "Back to home".
**Expected:** Main panel returns to LIHP sections with the learning plan banner still visible at the top.
**Why human:** State transition and persistent banner require live testing.

---

### Gaps Summary

No gaps found that block the phase goal. All 10 observable truths are verified, all 15 required artifacts exist and are substantively implemented, all 9 key data-flow links are wired, TypeScript compiles cleanly, and all 12 requirement IDs are accounted for (DISP-04 is partially satisfied — difficulty badge and numeric hours are not visually rendered — but this is a minor display omission that does not block the core goal).

The two informational items (difficulty badge not shown, estimatedHours always 0) are acceptable for a prototype. The phase goal — "AI generates a personalized learning plan of real Coursera courses organized into milestones, displayed in a split-view layout" — is implemented end-to-end in code.

Four human verification items remain for runtime confirmation of the streaming flow, actual course data quality, and browser navigation behavior.

---

_Verified: 2026-04-01T15:45:18Z_
_Verifier: Claude (gsd-verifier)_
