# Roadmap: PPP Prototype

## Overview

This prototype delivers a conversational AI experience where Coursera Plus learners explore career goals through natural conversation and receive a personalized, milestone-structured learning plan of real Coursera courses. The build progresses from infrastructure validation through conversational UI, plan generation and display, to plan refinement -- each phase delivering a verifiable capability that unblocks the next. Target: user testing by April 15, 2026.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffolding, deployment pipeline, data layer with mock fallback
- [x] **Phase 2: Conversation & Chat UI** - Entry screen, chat interface, and AI conversation flow for gathering learner context
- [x] **Phase 3: Plan Generation & Display** - AI-generated learning plans with milestone structure displayed in split-view layout
- [x] **Phase 3.1: UX Polish** - Sparkle SVGs, loading screen, progressive plan module, structured pills, concise LLM responses (completed 2026-04-01)
- [ ] **Phase 4: Refinement & Polish** - Plan refinement via conversation and direct manipulation, final user testing readiness

## Phase Details

### Phase 1: Foundation
**Goal**: Development environment and data infrastructure are validated end-to-end, from local dev to deployed Amplify, with working Coursera course data access
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Next.js 15 app with TypeScript and Tailwind CSS runs locally and builds without errors
  2. App is deployed to AWS Amplify and serves pages with working API routes (not just static)
  3. A Route Handler can query Coursera Search GraphQL and return C+ course results
  4. When the GraphQL endpoint is unavailable, mock course data is returned transparently
  5. Environment variables for OpenAI key, model, and GraphQL endpoint are configured and validated at startup
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 15 project, Amplify config, env var validation
- [x] 01-02-PLAN.md — GraphQL client, mock data fallback, API route handlers

### Phase 2: Conversation & Chat UI
**Goal**: Learners can open the app, see an inviting entry screen, start a conversation, and have the AI iteratively gather their career goals, background, and constraints through natural chat
**Depends on**: Phase 1
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04, ENTRY-05, CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, CONV-06
**Success Criteria** (what must be TRUE):
  1. User sees a welcoming entry screen with greeting, centered chat input, scrolling prompt pills, and suggestion buttons
  2. User can type a message (or tap a prompt pill) and receive a streaming AI response with typing indicator
  3. AI asks follow-up questions to iteratively gather career goal, background/experience, and time constraints before generating a plan
  4. Prompt pills adapt to the conversation phase (goal-setting pills at start, different pills after context is gathered)
  5. Chat handles errors gracefully with inline retry, renders markdown in AI messages, and auto-scrolls to latest message
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — AI SDK dependencies, shared types, system prompt, streaming chat API route
- [x] 02-02-PLAN.md — Entry screen with greeting, prompt pills, suggestion buttons, chat input
- [x] 02-03-PLAN.md — Chat panel, message rendering, app shell state machine, entry-to-chat wiring

**UI hint**: yes

### Phase 3: Plan Generation & Display
**Goal**: Once the AI has gathered enough context, it generates a personalized learning plan of real Coursera courses organized into milestones, displayed in a split-view layout alongside the ongoing conversation
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, DISP-01, DISP-02, DISP-03, DISP-04, DISP-05, DISP-06
**Success Criteria** (what must be TRUE):
  1. After sufficient conversation, a learning plan appears with courses organized into milestones (foundation, core, applied, advanced)
  2. Plan uses real Coursera courses from the Search API filtered to C+ catalog, with structured output validated by Zod schema
  3. Layout transitions from full-width entry/chat to split view: plan panel on left with summary header, milestone sections, and course cards; chat panel on right
  4. Each course card shows name, partner, duration, difficulty, and skills tags, and links to the coursera.org course page in a new tab
  5. Duration estimates are shown for each course, each milestone, and the overall plan
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Plan types, Zod schemas, search tool, system prompt extension, route handler with multi-step tool calling
- [x] 03-02-PLAN.md — Plan display components: PlanView, MilestoneSection, PlanCourseCard, PlanSummaryBar, ActivityBadge, PlanLoadingSkeleton
- [x] 03-03-PLAN.md — Wiring: AppShell state machine, LihpPage content swap, LearningPlanBanner data binding, end-to-end verification

**UI hint**: yes

### Phase 3.1: UX Polish (INSERTED)
**Goal**: Polish the conversation and plan UX with updated sparkle SVGs, loading screen, progressive learning plan module, structured multi/single-choice pills, and concise LLM responses
**Depends on**: Phase 3
**Requirements**: UXP-01, UXP-02, UXP-03, UXP-04, UXP-05
**Success Criteria** (what must be TRUE):
  1. Sparkle icons use the brand SVGs (brand_open for headers, brand_default for pills/plan module)
  2. A skeleton loading screen shows between entry and LIHP (min 200ms, until first AI token)
  3. Progressive learning plan module updates as conversation gathers goal → skills → timeline, transitioning to full banner when plan is generated
  4. Chat pills support structured multichoice (checkboxes, pagination) and single-choice (numbered radio) formats from AI metadata
  5. LLM responses are concise (2-3 sentences per turn)
**Plans**: 3 plans

Plans:
- [x] 03.1-01-PLAN.md — Brand sparkle SVGs, structured pill schemas, concise system prompt, CSS keyframe
- [x] 03.1-02-PLAN.md — Loading screen skeleton, progressive learning plan module, AppShell/LihpPage wiring
- [x] 03.1-03-PLAN.md — Structured multi/single-choice pill cards, visual stub menus and Start button

**UI hint**: yes

### Phase 4: Refinement & Polish
**Goal**: Learners can refine their plan through conversation or direct interaction until it fits their needs, completing the prototype for user testing
**Depends on**: Phase 3.1
**Requirements**: REFN-01, REFN-02, REFN-03, REFN-04
**Success Criteria** (what must be TRUE):
  1. User can ask the AI to adjust the plan (change goals, shorten timeline, add/remove topics) and the plan regenerates accordingly
  2. User can delete a course from the plan by clicking an X on the course card
  3. User can explore 2-3 alternative courses for any course in the plan
  4. Refinement prompt pills appear after plan generation ("Finish in 6 months", "Add portfolio project", "Include interview prep")
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — System prompt refinement section, phase guard modification for refinement chat, route handler conversation state emission, plan context injection
- [x] 04-02-PLAN.md — CourseEditMenu action wiring, ShimmerPlaceholder, callback threading from AppShell to course cards, pendingRemovals state

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 3.1 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-31 |
| 2. Conversation & Chat UI | 3/3 | Complete | 2026-03-31 |
| 3. Plan Generation & Display | 3/3 | Complete | 2026-04-01 |
| 3.1. UX Polish | 3/3 | Complete   | 2026-04-01 |
| 4. Refinement & Polish | 0/2 | Not started | - |
