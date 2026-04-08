# Feature Landscape

**Domain:** Conversational AI learning plan / career path builder
**Researched:** 2026-03-31
**Confidence:** MEDIUM (training data + existing prototype analysis; no live web verification)

## Table Stakes

Features users expect from a conversational AI learning plan builder. Missing any of these and the prototype feels broken or amateurish in user testing.

### Chat UX Fundamentals

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Streaming text response | Every major AI chat product streams token-by-token (ChatGPT, Gemini, Claude, Copilot). Non-streaming feels frozen/broken. | Medium | Use OpenAI streaming API with SSE to the client. Render tokens incrementally. Without this, users will report "the app hangs." |
| Typing/thinking indicator | Users need feedback that the system is working. Standard: animated dots or "thinking..." pulse before first token arrives. | Low | Show immediately on submit, hide when first streamed token arrives. |
| Chat input with submit button | Text input + send icon at minimum. Auto-resize textarea preferred. | Low | Match Figma: input bar pinned to bottom of chat panel. |
| Message history in scroll view | Users scroll back to see what they said and what AI said. Messages persist during session. | Low | Standard chat container with auto-scroll to latest message. Scroll-to-bottom button when user scrolls up. |
| Prompt pills / suggestion chips | Seeded prompts reduce blank-page anxiety and guide first interaction. Contextual suggestions after AI responses guide refinement. | Medium | Entry screen: 3 rows of horizontally scrolling pills (per Figma). In-chat: contextual suggestions that change based on conversation state. |
| Clear visual distinction between user and AI messages | Users must instantly know who said what. | Low | Different alignment (right vs left), different background colors, AI avatar/icon. |
| Error handling with retry | Network failures, API timeouts, rate limits happen. Silent failure is unacceptable. | Low | Show error message inline with "Try again" button. Do not lose the user's last message. |

### Plan Display Fundamentals

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Milestone-based plan structure | Learning plans without structure are just lists. Milestones (Foundation, Core, Applied, Advanced) give a sense of progression and achievability. | Medium | Four fixed stages per PROJECT.md. Each milestone is a collapsible section with courses. |
| Course cards with key metadata | Users need: course name, provider/partner logo, duration estimate, difficulty level, skills covered. Without this, courses are meaningless labels. | Medium | Cards link to XDP in new tab. Show partner name, estimated hours, difficulty badge. Image optional but strongly preferred for visual scanning. |
| Plan summary header | Users need to see at-a-glance: target role, total timeline, hours/week, key skills. This anchors the entire plan. | Low | Sticky or prominent header above milestone sections. |
| Duration estimates | Per-course, per-milestone, and total plan duration. Users need to know time commitment. | Low | Derive from course metadata. Show as "X hours" per course, "Y weeks" per milestone. |
| Course links to real content | Clicking a course must go somewhere real. Dead-end cards destroy trust. | Low | Link to `coursera.org/learn/{slug}` or XDP URL. Open in new tab. |

### Conversation Flow

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Gather career goal | The core purpose. AI must ask what the user wants to achieve. | Low | First conversational turn. Can be seeded via prompt pill or freeform. |
| Gather background/experience | Plan quality depends on knowing where the user is starting from. "Data analyst with 2 years experience" produces a different plan than "complete beginner." | Low | Second conversational turn. AI asks naturally, not as a form. |
| Gather constraints (time/pace) | Users have different availability. A 3-month plan for someone with 5 hrs/week is different from 20 hrs/week. | Low | Third conversational turn or optional refinement. |
| Progressive disclosure (entry to split view) | Start simple (just chat), evolve to show the plan alongside chat. Avoids overwhelming the user upfront. | Medium | Single-page state transition: entry screen (full-width chat) evolves into split view (plan left, chat right) when plan is ready. |

### Plan Refinement

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Conversational plan refinement | "Make it shorter," "Remove Java," "Add more Python" -- users expect to adjust plans by talking. This is the core promise of conversational AI. | High | AI must understand refinement intent, modify the plan, and re-render. The existing prototype already handles this with the gateway planner. |
| Delete a course from plan | Direct manipulation: click X on a course card to remove it. Faster than typing "remove the third course." | Low | P0 per PROJECT.md. Update plan state and re-render. |

## Differentiators

Features that elevate the prototype beyond "just another chatbot." Not expected, but create "wow" moments in user testing.

### Chat UX Polish

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Contextual prompt pills that evolve | Pills change based on conversation state: goal-setting pills at start, refinement pills ("Finish in 6 months", "Add portfolio project") after plan generation. Shows the AI is context-aware. | Medium | Maintain a state machine that maps conversation phase to pill sets. Entry: career goals. Post-plan: refinement actions. |
| Smooth entry-to-split-view transition | Animated transition from full-width entry to split layout. Makes the plan "appear" with intention rather than a jarring layout shift. | Medium | CSS transitions on layout grid columns. Fade-in for plan panel. This is noticeable in user testing -- it signals sophistication. |
| AI sparkle icon on suggestions | Visual cue that suggestions are AI-generated, not static links. Builds trust and novelty. | Low | Per Figma: small sparkle SVG icon on prompt pills and suggestion buttons. |
| Markdown rendering in AI messages | Bold, bullet lists, headers in AI responses. Makes long explanations scannable. | Low | Use a lightweight markdown renderer (e.g., marked or react-markdown). Avoid full HTML injection risks. |
| Scroll-anchored auto-scroll with manual override | Chat auto-scrolls on new messages but stops if user scrolled up to review history. "New message" indicator appears at bottom. | Low | Standard pattern but frequently omitted in prototypes. Users in testing will scroll up to re-read; broken auto-scroll is distracting. |

### Plan Visualization

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Skills tag display on courses | Show colored skill chips on each course card. Lets users visually scan which skills each course covers. | Low | Pull from course metadata `skills` field. Limit to 3-4 tags per card to avoid clutter. |
| Milestone progress indicators | Visual progress (completed/total courses per milestone). Even though prototype has no real progress tracking, showing "0/4 courses" sets the mental model. | Low | Simple "X courses" count per milestone. In prototype, all are "not started." |
| Plan overview stats | Total courses, total estimated hours, estimated completion date, skills covered count. Data-rich summary header. | Low | Aggregate from plan data. Gives users confidence the plan is substantive. |
| Explore alternative courses | For any course in the plan, see 2-3 alternatives. Lets users swap without full regeneration. | High | P0 per PROJECT.md. Requires additional search queries scoped to the same skill/difficulty. Could use a popover or drawer UI. |

### Onboarding and First Experience

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Horizontally scrolling prompt pill rows with gradient fade | Three rows of different prompt categories (career change, skill building, exploration) with edge-fade gradient. Visually rich and inviting. Better than a blank input. | Medium | Per Figma. CSS horizontal scroll with `mask-image` gradient at edges. Pills should feel tactile and clickable. |
| Warm, personalized greeting | AI greeting that sets expectations: "I'll help you build a personalized learning plan. What career goal are you working toward?" Not generic. | Low | Static first message with personality. Sets the conversational tone immediately. |

## Anti-Features

Features to explicitly NOT build for this prototype. Each would consume time without validating the core hypotheses.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User authentication / accounts | Prototype is for user testing sessions, not real usage. Auth adds complexity without validating any hypothesis. | Treat every session as ephemeral. No login, no saved state. |
| Save/persist plans across sessions | User testing sessions are one-shot. Persistence adds backend complexity (database, session management) with zero validation value. | Show plans only during the active session. Mention "save" as a future feature if users ask. |
| Mobile responsiveness | User testing is on desktop. Responsive CSS is a time sink that does not validate the core conversational AI hypothesis. | Build for 1280px+ viewport only. Per PROJECT.md: desktop-only. |
| Auto-enrollment in courses | Prototype should not trigger real Coursera enrollments. The goal is plan creation, not execution. | Link to XDP pages in new tab. Let users manually explore/enroll if they want. |
| Voice input | Microphone icon is in the Figma design reference but voice adds significant complexity (speech-to-text API, permission prompts, mobile considerations) for marginal prototype value. | Text-only input. If time permits, add a non-functional mic icon for visual fidelity to Figma. |
| Fine-grained conversational editing | "Remove the second course of the first milestone" requires sophisticated NLU to map ordinal references to specific plan items. P2 per PROJECT.md. | Support broad refinements ("remove Java courses") and direct manipulation (click X on a course card). Avoid ordinal/positional references. |
| Edit milestone structure via UX | Drag-and-drop reordering, rename milestones, move courses between milestones. P1 per PROJECT.md. | Fixed four-stage milestone structure. Refinement happens via conversation or course deletion. |
| Multi-language support | Prototype is English-only per evaluation criteria. Localization is a massive scope expansion. | English only. All AI prompts, UI copy, and course recommendations in English. |
| Complex onboarding wizard / multi-step form | Forms kill the conversational premise. The whole point is that conversation replaces forms. | Let the conversation itself be the onboarding. Prompt pills guide, but the user types freely. |
| Real-time collaboration / sharing | No user accounts means no sharing. This is a solo experience for user testing. | Single-user, single-session. No share buttons, no export to PDF. |
| Detailed course previews / syllabus in-app | Embedding full course details creates a parallel XDP. Out of scope and distracting from the plan-building flow. | Show essential metadata on cards (name, partner, duration, difficulty, skills). Link to XDP for everything else. |

## Feature Dependencies

```
Prompt pills (entry) --> Conversation flow --> Plan generation --> Plan display
                                                                       |
                                                                       v
                                                               Plan refinement (conversational)
                                                               Plan refinement (direct manipulation: delete course)
                                                               Alternative course exploration

Streaming response --> Typing indicator (indicator shows before streaming starts)

Entry screen --> Split view transition (requires plan generation to trigger)

Course cards --> Course links to XDP
Course cards --> Skills tag display
Course cards --> Alternative course exploration

Plan summary header --> Duration estimates (aggregated from courses)

Contextual prompt pills --> Conversation state tracking (must know which phase user is in)
```

Key dependency chain for MVP:
1. Chat input + message rendering (foundation for everything)
2. AI conversation flow (gathering goal, background, constraints)
3. Plan generation from conversation context
4. Plan display with milestones and course cards
5. Entry-to-split-view transition
6. Plan refinement (conversational + delete course)

## MVP Recommendation

### Must Ship (P0)

Prioritize these for the April 15 user testing deadline:

1. **Streaming chat with typing indicator** -- Table stakes. Without streaming, testers will think the app is broken during the 5-10 second plan generation time.
2. **Entry screen with prompt pills** -- First impression. Scrolling pill rows per Figma reduce blank-page anxiety and demonstrate the product's intent immediately.
3. **Conversational goal/background/constraint gathering** -- Core hypothesis validation. This is what we are testing: can conversation replace forms for learning plan creation?
4. **Plan generation with four-stage milestones** -- The deliverable. Milestones with real Coursera courses, duration estimates, skills, and XDP links.
5. **Split view layout (plan left, chat right)** -- The interaction model. Users see the plan and continue the conversation side by side.
6. **Plan summary header** -- Anchors the plan with target role, timeline, skills, and hours/week.
7. **Conversational refinement** -- "Make it shorter," "Add Python," "Remove testing courses." Core differentiator of conversational vs. form-based planning.
8. **Delete course via click** -- Direct manipulation complement to conversational refinement. Low effort, high usability.
9. **Contextual prompt pills** -- Post-plan pills like "Finish in 6 months" or "Add portfolio project" guide users who do not know what to ask.
10. **Error handling with retry** -- Prototype will hit API failures. Silent failure during user testing is catastrophic.

### Should Ship If Time Permits (P1)

- Explore alternative courses (per PROJECT.md P0, but higher complexity)
- Smooth animated entry-to-split-view transition
- Markdown rendering in AI messages
- Skills tags on course cards
- Plan overview stats

### Defer (P2)

- Voice input
- Fine-grained conversational editing
- Milestone structure editing via UX
- Course preview/syllabus in-app
- Session persistence

## Competitive Landscape (Training Data, MEDIUM Confidence)

Products in this space as of early 2025:

| Product | Approach | Strengths | Gaps |
|---------|----------|-----------|------|
| **Coursera Coach (existing)** | AI assistant within Coursera; helps with in-course questions, not plan building | Deep Coursera integration | Does not create structured learning plans; reactive, not proactive |
| **LinkedIn Learning Path Builder** | Curated paths by editors + AI suggestions | Professional context from LinkedIn profile | Not conversational; paths feel generic; no real-time refinement |
| **Pluralsight Iris** | AI assistant for skill assessment and course recommendations | Skills-first approach with assessments | Assessment-heavy; not conversational; focused on tech skills only |
| **ChatGPT / general LLMs** | Freeform conversation can produce learning plans | Flexible, handles any domain | No real course catalog; plans are aspirational not actionable; no visual plan UI |
| **Stepful, Pathrise, coaching platforms** | Human + AI coaching for career transitions | Personalized human touch | Expensive; not scalable; slow iteration cycle |

PPP's differentiator: **Conversational AI that produces actionable plans backed by real Coursera courses, with visual plan display and iterative refinement** -- combining the flexibility of ChatGPT-style conversation with the specificity of a real course catalog.

## UX Pattern Notes for Implementation

### Streaming

Use Server-Sent Events (SSE) from the Next.js API route. The OpenAI SDK supports streaming natively. On the client, use `EventSource` or `fetch` with a `ReadableStream`. Render tokens into the last AI message bubble as they arrive. This is the single most important UX feature -- it turns a 5-second wait into a 5-second experience of watching the AI "think."

### Prompt Pills

Entry screen pills should be pre-generated (static data), not AI-generated. Categories observed in Figma:
- Career transition: "I want to become a data analyst", "Transition into UX design"
- Skill building: "Learn Python for data science", "Get better at project management"
- Exploration: "What can I learn with Coursera Plus?", "Help me figure out my next step"

Post-plan contextual pills should be dynamically generated or selected from a template set based on plan state:
- Duration adjustment: "Finish in 6 months", "I only have 5 hours per week"
- Scope adjustment: "Add more hands-on projects", "Focus on certifications"
- Content adjustment: "Remove beginner courses", "Add portfolio projects"

### Course Card Design

Essential card elements (per Figma and search API data):
- Course image (from `imageUrl` in search results)
- Course name (truncate to 2 lines)
- Partner name + logo
- Duration ("X hours")
- Difficulty badge (Beginner/Intermediate/Advanced)
- 2-3 skill chips
- C+ badge (all courses should be C+ but visual confirmation builds trust)
- Link to XDP (entire card is clickable, opens new tab)
- Delete button (X icon, top-right corner)

### Split View Layout

Left panel (plan): ~55-60% width. Scrollable independently. Contains plan header + milestone sections.
Right panel (chat): ~40-45% width. Scrollable independently. Contains message history + input bar pinned to bottom.
Divider: subtle border, not a resizable splitter (prototype scope).

## Sources

- Existing PPP prototype: `/Users/dajiboye/base/coursera/PPP Figma/PPP/` (README, flow-summary, system-deep-dive, refinement-evaluation, components.js, app.js)
- Project context: `/Users/dajiboye/base/coursera/ppp-prototype/.planning/PROJECT.md`
- Figma design references cited in PROJECT.md (node IDs for entry screen, split view, full plan view)
- Competitive landscape based on training data (MEDIUM confidence, not verified against current product states)
