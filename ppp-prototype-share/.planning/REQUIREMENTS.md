# Requirements: PPP Prototype

**Defined:** 2026-03-31
**Core Value:** Learners can turn vague career aspirations into a concrete, personalized course plan through natural conversation

## v1 Requirements

Requirements for prototype user testing (target: April 15, 2026). Each maps to roadmap phases.

### Foundation & Infrastructure

- [x] **INFRA-01**: Next.js 15 App Router project scaffolded with TypeScript and Tailwind CSS
- [x] **INFRA-02**: AWS Amplify deployment working with standalone output mode
- [x] **INFRA-03**: GraphQL proxy Route Handler that forwards requests to Coursera gateway (server-side only)
- [x] **INFRA-04**: Mock course data fallback when GraphQL endpoint is unavailable
- [x] **INFRA-05**: Environment variable configuration for OpenAI API key, model selection, and GraphQL endpoint

### Chat UX

- [x] **CHAT-01**: Chat input with auto-resize textarea, submit button, and placeholder text ("I want to learn...")
- [ ] **CHAT-02**: Message history with clear visual distinction between user (right-aligned) and AI (left-aligned) messages
- [x] **CHAT-03**: Streaming text response from OpenAI rendered token-by-token
- [x] **CHAT-04**: Typing/thinking indicator shown immediately on submit, hidden when first token arrives
- [ ] **CHAT-05**: Auto-scroll to latest message with manual override when user scrolls up
- [x] **CHAT-06**: Error handling with inline error message and "Try again" button (no lost messages)
- [x] **CHAT-07**: Markdown rendering in AI messages (bold, bullets, headers)

### Entry Screen

- [x] **ENTRY-01**: Centered greeting with personalized text ("Hello! I can recommend courses that fit your goals. What do you want to learn and for what role?")
- [x] **ENTRY-02**: Chat input box centered below greeting
- [x] **ENTRY-03**: Three rows of horizontally scrolling prompt pills with AI sparkle icon and edge-fade gradient overlay
- [x] **ENTRY-04**: Row of suggestion buttons below input ("Create a learning plan", "Find a new career", "Develop in-demand skills", "Advance my career")
- [x] **ENTRY-05**: Soft blue-purple gradient background

### Conversation Flow

- [x] **CONV-01**: System prompt that drives iterative conversation to gather career goals, background, and constraints
- [x] **CONV-02**: AI gathers career goal (role, skills, domain, or vague direction) as first priority
- [x] **CONV-03**: AI gathers background/experience (transferable skills, current role, past experience)
- [x] **CONV-04**: AI gathers constraints (target duration, availability hours/week)
- [x] **CONV-05**: Conversation is iterative -- AI asks follow-up questions until enough context for plan generation
- [x] **CONV-06**: Contextual prompt pills that evolve based on conversation phase (goal-setting at start, refinement after plan)

### Plan Generation

- [x] **PLAN-01**: Plan generated from gathered context using OpenAI with real course data from Search API
- [x] **PLAN-02**: Plan organized into milestones (foundation, core, applied, advanced)
- [x] **PLAN-03**: Each milestone contains relevant courses with: name, partner, duration, difficulty, skills
- [x] **PLAN-04**: Duration estimates for each course, each milestone, and overall plan
- [x] **PLAN-05**: Only C+ catalog courses recommended (isPartOfCourseraPlus filter)
- [x] **PLAN-06**: Structured output via Zod schema validation for plan data

### Plan Display

- [x] **DISP-01**: Split-view layout: plan panel (left ~65%), chat panel (right ~35%)
- [x] **DISP-02**: Plan summary header showing: target role, key skills, timeline, hours/week
- [x] **DISP-03**: Milestone sections with course cards inside each milestone
- [x] **DISP-04**: Course cards with: name, partner name, estimated hours, difficulty badge, skills tags (3-4 per card)
- [x] **DISP-05**: Course cards link to coursera.org XDP page in new tab
- [x] **DISP-06**: Smooth animated transition from entry screen (full-width) to split view when plan is ready

### Plan Refinement

- [x] **REFN-01**: Conversational refinement -- user can adjust goals, background, constraints via chat to regenerate plan
- [x] **REFN-02**: Delete a course from plan via direct UX interaction (click X on course card)
- [x] **REFN-03**: Explore alternative courses for any course in the plan (show 2-3 alternatives)
- [x] **REFN-04**: Refinement prompt pills ("Finish in 6 months", "Add portfolio project", "Include interview prep")

## v2 Requirements

Deferred to MVP phase. Tracked but not in current prototype scope.

### Enhanced Interactions

- **EINT-01**: Fine-grained conversational editing ("remove the second course of the first milestone")
- **EINT-02**: Edit milestone content/structure via UX (rename, reorder, move courses)
- **EINT-03**: Hands-on learning identification -- easily identify courses with projects, labs, exercises

### Engagement Features

- **ENGM-01**: Save/persist plans across sessions
- **ENGM-02**: Auto-enrollment in first course when plan is confirmed
- **ENGM-03**: Progress tracking and skill experience points
- **ENGM-04**: Plan sharing on social media

### Platform Integration

- **PLAT-01**: Integration with Coursera LIHP (Logged-In Home Page) CTA
- **PLAT-02**: Integration with Conversational Discovery Onboarding
- **PLAT-03**: Mobile-web responsive design

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication / accounts | Prototype for user testing sessions, not real usage |
| Plan persistence across sessions | User testing is single-session; adds backend complexity |
| Mobile responsiveness | Desktop-only for user testing |
| Auto-enrollment in courses | Prototype stops at plan confirmation |
| Voice input | Significant complexity for marginal prototype value |
| Multi-language support | English-only prototype |
| Real-time collaboration / sharing | Single-user, single-session |
| Detailed course previews / syllabus in-app | Link to XDP instead |
| Complex onboarding wizard | Conversation IS the onboarding |
| Production-grade code / reusability | Doc explicitly says throwaway is acceptable |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| CHAT-01 | Phase 2 | Complete |
| CHAT-02 | Phase 2 | Pending |
| CHAT-03 | Phase 2 | Complete |
| CHAT-04 | Phase 2 | Complete |
| CHAT-05 | Phase 2 | Pending |
| CHAT-06 | Phase 2 | Complete |
| CHAT-07 | Phase 2 | Complete |
| ENTRY-01 | Phase 2 | Complete |
| ENTRY-02 | Phase 2 | Complete |
| ENTRY-03 | Phase 2 | Complete |
| ENTRY-04 | Phase 2 | Complete |
| ENTRY-05 | Phase 2 | Complete |
| CONV-01 | Phase 2 | Complete |
| CONV-02 | Phase 2 | Complete |
| CONV-03 | Phase 2 | Complete |
| CONV-04 | Phase 2 | Complete |
| CONV-05 | Phase 2 | Complete |
| CONV-06 | Phase 2 | Complete |
| PLAN-01 | Phase 3 | Complete |
| PLAN-02 | Phase 3 | Complete |
| PLAN-03 | Phase 3 | Complete |
| PLAN-04 | Phase 3 | Complete |
| PLAN-05 | Phase 3 | Complete |
| PLAN-06 | Phase 3 | Complete |
| DISP-01 | Phase 3 | Complete |
| DISP-02 | Phase 3 | Complete |
| DISP-03 | Phase 3 | Complete |
| DISP-04 | Phase 3 | Complete |
| DISP-05 | Phase 3 | Complete |
| DISP-06 | Phase 3 | Complete |
| REFN-01 | Phase 4 | Complete |
| REFN-02 | Phase 4 | Complete |
| REFN-03 | Phase 4 | Complete |
| REFN-04 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*
