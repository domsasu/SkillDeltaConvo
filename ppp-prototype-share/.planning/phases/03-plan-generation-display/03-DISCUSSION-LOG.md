# Phase 3: Plan Generation & Display - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 03-plan-generation-display
**Areas discussed:** Plan generation flow, Plan data structure, Split-view layout, Course card details

---

## Plan Generation Flow

### Q1: How should plan generation work when the AI decides it has enough context?

| Option | Description | Selected |
|--------|-------------|----------|
| Two-step: search then generate | AI signals ready_for_plan → backend fetches courses → second AI call organizes into plan | |
| AI generates plan with tool calling | AI uses tool call to search courses mid-conversation, generates plan inline | ✓ |
| Separate plan endpoint | Frontend calls /api/plan with gathered_info, separate from chat | |

**User's choice:** AI generates plan with tool calling
**Notes:** Single streaming response with search and plan generation.

### Q2: Should the AI search courses once or multiple times?

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple searches per milestone | 3-4 targeted queries per milestone area | ✓ |
| Single broad search | One combined query | |
| You decide | Claude picks best approach | |

**User's choice:** Multiple searches per milestone
**Notes:** More relevant results per milestone area.

### Q3: What should the user see during plan generation?

| Option | Description | Selected |
|--------|-------------|----------|
| AI narrates in chat while plan builds | Streaming message + plan populates simultaneously | |
| Loading state then reveal | Skeleton state, then full plan at once | ✓ |
| You decide | Claude picks best UX | |

**User's choice:** Loading state then reveal

---

## Plan Data Structure

### Q1: How should milestones be organized?

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 4 tiers | Foundation → Core Skills → Applied → Advanced | |
| AI decides count and names | 2-5 milestones with custom names | ✓ |
| 3 fixed tiers | Foundation → Core → Portfolio/Capstone | |

**User's choice:** AI decides milestone count and names with goal-type guardrails
**Notes:** Michelle's guardrails: Career change → Foundations (with PC/S12N), Core Skills, Job Prep. Skill improvement → milestone per skill. AI has flexibility but follows these patterns.

### Q2: How many courses per milestone?

| Option | Description | Selected |
|--------|-------------|----------|
| 2-4 courses per milestone | Total ~8-16 courses | |
| 1-3 courses per milestone | Total ~4-9 courses | |
| You decide | Claude sets reasonable defaults | ✓ |

**User's choice:** You decide

### Q3: Should the plan include PCs and Specializations?

| Option | Description | Selected |
|--------|-------------|----------|
| Courses + PCs/Specializations | Include PCs for career change foundations | ✓ |
| Individual courses only | Simpler data model | |
| You decide | Claude picks based on API data | |

**User's choice:** Courses + PCs/Specializations

---

## Split-view Layout

### Q1: How should the layout change when the plan is ready?

| Option | Description | Selected |
|--------|-------------|----------|
| Replace LIHP main content with plan | Plan replaces trending/skills sections | |
| New split-view layout (65/35) | Completely new layout | |
| You decide | Claude picks best approach | |

**User's choice:** Other — Keep existing LIHP with learning plan summary module. Hide module when no plan, show loading during generation, show module when ready. Build separate full plan view for "View full plan" CTA.

### Q2: Plan summary module on LIHP?

| Option | Description | Selected |
|--------|-------------|----------|
| Role + skills + duration + CTA | Compact card with key info | |
| Milestone overview + CTA | Progress-style milestone overview | |
| You decide | Claude designs based on Figma | |

**User's choice:** Other — Should look like the existing mock banner with real data instead of mock data.

### Q3: Full plan view — new route or replace content?

| Option | Description | Selected |
|--------|-------------|----------|
| Replace LIHP main content | Swap left panel, chat stays right, back to home returns | ✓ |
| New route (/plan) | Navigate to /plan route | |
| You decide | Claude picks simplest approach | |

**User's choice:** Replace LIHP main content
**Notes:** User shared Figma screenshot of full plan view showing milestones, course cards, chat panel on right.

---

## Course Card Details

### Q1: Match Figma or simplify?

**User's choice:** Other — Simplify by ignoring expand chevron or making it static. Use thumbnails from search endpoint. Mock activity badges. Keep rest as close as possible to the screenshot.

### Q2: Course cards link to XDP?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, open XDP in new tab | Click course name opens coursera.org | ✓ |
| No linking for prototype | Display-only cards | |
| You decide | Claude implements if straightforward | |

**User's choice:** Yes, open XDP in new tab

### Q3: Duration estimates?

| Option | Description | Selected |
|--------|-------------|----------|
| AI estimates from course data | Calculate total hours, derive timeline from hours/week | ✓ |
| Display raw course durations only | Show each course's duration as-is | |
| You decide | Claude picks based on API data | |

**User's choice:** AI estimates from course data

---

## Claude's Discretion

- Zod schema shape for plan structured output
- Search tool result filtering/ranking
- Loading skeleton design
- "Start learning plan" CTA behavior
- Milestone section visual design details
- Courses per milestone defaults

## Deferred Ideas

- Expand/collapse on course cards
- "Start learning plan" auto-enrollment
- Refinement prompt pills functionality (Phase 4)
