# PPP Prototype — Personalized Progressive Pathways

## What This Is

A standalone conversational AI prototype where Coursera Plus learners explore career goals, share their background and constraints, and receive a personalized learning plan — a curated sequence of real Coursera courses organized into milestones. Built for rapid user testing (target: April 15, 2026), not production reuse.

## Core Value

Learners can turn vague career aspirations into a concrete, personalized course plan through natural conversation — and refine it until it fits.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Entry screen with greeting, chat input, and scrolling prompt pills
- [ ] Conversational AI that iteratively gathers career goals, background, and constraints (duration/availability)
- [ ] Transition from entry screen to split view as conversation progresses
- [ ] Plan generation: personalized course sequence organized into milestones (foundation, core, applied, advanced)
- [ ] Plan displayed in left panel with milestone sections, course cards, skills, and duration estimates
- [ ] Chat panel on right side with AI messages and contextual prompt pills for refinement
- [ ] Plan refinement via conversation (adjust goals, background, constraints to regenerate)
- [ ] Plan refinement via UX interactions: delete a course (P0), explore alternative courses (P0)
- [ ] Course data sourced from Coursera Search GraphQL endpoint (with mock data fallback)
- [ ] Duration estimates for each course, milestone, and overall plan
- [ ] Prompt pills/suggestions that adapt to conversation context (e.g., "Finish in 6 months", "Add portfolio project")
- [ ] Fresh system prompt engineering: conversational prompt that gathers goals/background/constraints, generates contextual prompt pills, and produces structured plan output
- [ ] Simulated C+ experience: recommend only C+ catalog courses
- [ ] Course cards link to XDP (coursera.org course page) in new tab
- [ ] Plan summary header showing: target role, key skills, timeline, hours/week

### Out of Scope

- Logged-out view and XDP in-app view — not needed for prototype (per doc)
- User authentication / account system — standalone prototype, no login
- Saving/persisting plans across sessions — prototype scope
- Mobile responsiveness — desktop-only for user testing
- Auto-enrollment in courses — prototype stops when learner confirms plan
- Hands-on learning identification (P1) — deferred beyond prototype P0
- Fine-grained conversational editing e.g. "remove the second course of the first milestone" (P2) — deferred
- Edit milestone content via UX (P1) — deferred beyond prototype P0
- Production-grade code / reusability — doc explicitly says "vibe coded" is acceptable

## Context

### Product Context
- PPP is a major Coursera initiative to increase C+ learner retention through personalized learning plans
- Prototype is the first validation step before MVP (June 2026)
- Hypotheses to validate: (1) learners want hyperpersonalized plans, (2) conversation is effective for capturing context, (3) we can build quality plans at scale
- User testing sessions planned with Learner Research team

### Prompt Engineering Context
- Fresh system prompts (not porting existing PPP Figma prompts)
- Existing PPP Figma prototype (`PPP Figma/PPP/server.mjs`) has working reference patterns:
  - Stage-based conversation flow (discovery → recommendations → refinement → learning-plan)
  - Pathway state: currentRole, targetRole, desiredSkills, constraints, missingFields
  - OpenAI structured output via Zod schemas (`zodResponseFormat`)
  - Stage-specific guidance strings that tell the LLM what each screen needs
  - UI content generation (titles, bullets, role options, filter chips, composer prefills)
- Our prototype needs 3 prompt concerns:
  1. **Conversation prompt** — Drives iterative chat to gather career goals, background, constraints; generates contextual prompt pills for user
  2. **Plan generation prompt** — Takes gathered context + real course data from Search API → produces milestone-based learning plan
  3. **Refinement prompt** — Handles plan adjustments when learner requests changes via chat or UX actions

### Technical Context
- Existing prototype reference: `PPP Figma/PPP/` — Node.js app with working Coursera GraphQL client, 6-agent orchestration for course discovery, OpenAI integration
- GraphQL queries available in `PPP Figma/PPP/gateway/coursera/queries.js` — SEARCH_QUERY, RECOMMEND_QUERY_PROMPTS, DISCOVERY_COLLECTIONS, PRODUCT_DETAIL
- Coursera Search endpoint: `https://www.coursera.org/graphql-gateway` (or `/graphql`)
- Search returns: ProductHit with id, name, url, imageUrl, productType, partners, skills, duration, productDifficultyLevel, isPartOfCourseraPlus
- Reference repo for Next.js + Amplify patterns: `webedx-spark/prototypes-tools-sandbox` — Next.js 15, App Router, standalone output, cookie-based auth, GraphQL proxy

### Design Context
- Figma: Conversational Discovery 2026 file
  - Entry screen: `node-id=2630-19360` — greeting, chat input, 3 rows of scrolling prompt pills with edge-fade gradient, suggestion buttons
  - Split view: `node-id=2613-74583` — plan overview (left) + chat panel (right) with CoachPanel component
  - Full plan view: `node-id=2613-75657` — complete plan with milestones, course cards, progress bars, AI comments
  - Full plan view (alt): `node-id=2589-135062` — detailed view with Coursera nav, chat history, milestone sections
- Design tokens: Source Sans 3 font, primary blue #0056d2, border #dae1ed, neutral bg #f2f5fa, pill radius 48px, card radius 8px
- Prompt pills: white bg, light border, AI sparkle icon, 32px height, horizontal scroll with gradient fade at edges
- Suggestion buttons: white bg, light border, rounded 8px, AI sparkle icon

## Constraints

- **Tech stack**: Next.js 15 (App Router, TypeScript), deployed on AWS Amplify (standalone output mode)
- **AI provider**: OpenAI API (GPT-4o or gpt-4.1-mini)
- **Timeline**: User testing by April 15, 2026 — speed over polish
- **Course data**: Real Coursera courses via Search GraphQL endpoint, with mock fallback for development
- **Catalog**: C+ catalog only (isPartOfCourseraPlus filter)
- **Reusability**: Not required — prototype can use throwaway solutions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 + AWS Amplify | Matches reference repo pattern, fast to deploy | — Pending |
| OpenAI API for conversation | Team already using it in existing PPP prototype | — Pending |
| Start with mock data + real GraphQL | De-risk by having mock fallback, integrate real data when ready | — Pending |
| Split view layout (plan left, chat right) | Matches Figma design, shows plan building progressively | — Pending |
| Generic milestones (foundation, core, applied, advanced) | Simplest option for prototype; user testing will validate if LLM-generated milestones are needed | — Pending |
| Fresh system prompts (not porting existing) | New prompts optimized for streaming chat UX; existing PPP Figma prompts are screen-payload based, not conversational | — Pending |
| Single page with state transitions | Entry → split view is same page evolving, not separate routes | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after initialization*
