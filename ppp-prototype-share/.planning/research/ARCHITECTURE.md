# Architecture Patterns

**Domain:** Conversational AI learning plan builder (Next.js 15 App Router)
**Researched:** 2026-03-31

## Recommended Architecture

Single-page application with progressive state transitions, server-side AI orchestration, and a split-view layout. The app lives on one route (`/`) with three visual states managed by client-side state, not URL routing.

```
                        +---------------------------+
                        |      Next.js App Router    |
                        |         (page.tsx)         |
                        +---------------------------+
                        |   AppShell (layout state)  |
                        |   [entry | split | complete]|
                        +---------------------------+
                               /              \
                    +-----------+          +-----------+
                    | PlanPanel |          | ChatPanel |
                    | (left)    |          | (right)   |
                    +-----------+          +-----------+
                         |                      |
                         |         +------------+----------+
                         |         |                       |
                    +---------+  +-----------+   +-----------------+
                    | Plan    |  | Message   |   | PromptPills     |
                    | Store   |  | Stream    |   | (contextual)    |
                    +---------+  +-----------+   +-----------------+
                         \            |
                          \           v
                    +----------------------------------+
                    |     API Route: /api/chat         |
                    |  (OpenAI streaming orchestrator)  |
                    +----------------------------------+
                           /                  \
              +-----------+                    +-----------+
              | OpenAI    |                    | Coursera  |
              | GPT-4o    |                    | GraphQL   |
              | (stream)  |                    | Proxy     |
              +-----------+                    +-----------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **AppShell** | Layout state machine (entry/split/complete), CSS transitions between states | PlanPanel, ChatPanel, ConversationStore |
| **ChatPanel** | Message list, input composer, prompt pills, streaming message display | API route via fetch, ConversationStore |
| **PlanPanel** | Plan display with milestones, course cards, summary header, plan actions (delete course, explore alternatives) | PlanStore, ChatPanel (via shared store) |
| **ConversationStore** | Conversation history, app phase, user context (goals, background, constraints) | ChatPanel, API route (sent as context) |
| **PlanStore** | Current plan state: milestones, courses, metadata, plan summary | PlanPanel, API route (plan mutations) |
| **API Route `/api/chat`** | OpenAI orchestration: system prompt, conversation context, tool calls for course search, structured plan output | OpenAI API, Coursera GraphQL proxy |
| **API Route `/api/courses`** | GraphQL proxy to Coursera Search endpoint, C+ filtering, response normalization | Coursera GraphQL gateway |
| **Mock Data Layer** | Fallback course data for development when GraphQL is unavailable | API routes (conditional) |

### Data Flow

**Conversation Flow (user sends message):**

```
1. User types message or clicks prompt pill
2. ChatPanel appends user message to ConversationStore
3. ChatPanel POSTs to /api/chat with:
   - Full conversation history
   - Current plan state (if any)
   - Current app phase
4. /api/chat sends to OpenAI with:
   - System prompt (phase-aware)
   - Conversation history
   - Available tools: search_courses, generate_plan, refine_plan
5. OpenAI streams response back:
   - Text tokens → streamed to ChatPanel in real-time
   - Tool calls → executed server-side (course search, plan generation)
   - Structured data → plan updates sent as final message metadata
6. ChatPanel displays streamed text
7. If plan data returned → PlanStore updated → PlanPanel re-renders
8. If phase transition triggered → AppShell transitions layout
```

**Course Search Flow (server-side tool call):**

```
1. OpenAI issues search_courses tool call with query + filters
2. /api/chat handler calls /api/courses internally (or direct function call)
3. /api/courses sends SEARCH_QUERY to Coursera GraphQL gateway
4. Response filtered: isPartOfCourseraPlus === true
5. Normalized course objects returned to OpenAI as tool result
6. OpenAI incorporates courses into plan generation
```

**Plan Mutation Flow (user deletes course via UX):**

```
1. User clicks delete on course card in PlanPanel
2. PlanStore removes course, marks plan as modified
3. ChatPanel receives "plan modified" event
4. Automatic message sent to /api/chat: "User removed [course name] from [milestone]"
5. AI suggests replacement or acknowledges removal
```

## State Architecture

### Application Phase State Machine

Use a single `useReducer` at the AppShell level. Three phases, one direction (with refinement loops within split/complete):

```
entry ──────> building ──────> complete
  |              |                |
  |              +── refine ──+  +── refine ──+
  |              |            |  |            |
  |              +<───────────+  +<───────────+
  |
  (first meaningful AI response triggers transition)
```

```typescript
type AppPhase = 'entry' | 'building' | 'complete';

type AppState = {
  phase: AppPhase;
  conversation: Message[];
  plan: LearningPlan | null;
  userContext: UserContext;
  promptPills: PromptPill[];
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    planUpdate?: LearningPlan;
    phaseTransition?: AppPhase;
    suggestedPills?: PromptPill[];
  };
};
```

### Why useReducer + Context, Not zustand/jotai

For a prototype with a two-week timeline, external state libraries add setup overhead with no payoff. The state shape is a single conversation + plan tree. `useReducer` with React Context covers this cleanly. If the prototype were production-bound, zustand would be the right choice for its devtools and middleware.

### State Slicing Strategy

Two React contexts to avoid unnecessary re-renders:

1. **ConversationContext** -- messages, phase, user context, prompt pills. ChatPanel subscribes.
2. **PlanContext** -- plan object, plan mutations. PlanPanel subscribes.

AppShell provides both contexts. The `/api/chat` response handler dispatches to both.

## Component Architecture

### File Structure

```
src/
  app/
    layout.tsx              # Root layout, fonts, global styles
    page.tsx                # Single page, renders AppShell
    api/
      chat/
        route.ts            # POST handler: OpenAI streaming orchestrator
      courses/
        route.ts            # POST handler: Coursera GraphQL proxy
  components/
    app-shell.tsx           # Layout state machine, phase transitions
    chat/
      chat-panel.tsx        # Right panel: messages + input
      message-list.tsx      # Scrollable message list
      message-bubble.tsx    # Individual message (user or AI)
      chat-input.tsx        # Composer with submit
      prompt-pills.tsx      # Scrollable pill suggestions
      streaming-text.tsx    # Renders tokens as they arrive
    plan/
      plan-panel.tsx        # Left panel: plan display
      plan-header.tsx       # Summary: role, skills, timeline, hours/week
      milestone-section.tsx # Milestone group (foundation, core, applied, advanced)
      course-card.tsx       # Individual course with actions
      plan-skeleton.tsx     # Loading state while plan builds
    shared/
      sparkle-icon.tsx      # AI indicator icon
      scroll-fade.tsx       # Gradient fade for horizontal scroll containers
  lib/
    openai.ts               # OpenAI client config + streaming helpers
    coursera-client.ts      # GraphQL client (port from existing prototype)
    prompts.ts              # System prompts per phase
    tools.ts                # OpenAI tool definitions (search_courses, etc.)
    types.ts                # Shared TypeScript types
    mock-data.ts            # Fallback course/plan data
  hooks/
    use-conversation.ts     # ConversationContext hook
    use-plan.ts             # PlanContext hook
    use-chat-stream.ts      # Streaming fetch + token accumulation
  contexts/
    conversation-context.tsx
    plan-context.tsx
```

### Server vs Client Component Split

| Component | Rendering | Why |
|-----------|-----------|-----|
| `layout.tsx` | Server | Static shell, fonts, metadata |
| `page.tsx` | Server | Entry point, no interactivity |
| `app-shell.tsx` | Client (`'use client'`) | State machine, layout transitions |
| `chat-panel.tsx` | Client | Real-time streaming, user input |
| `plan-panel.tsx` | Client | Reactive to plan state changes |
| `message-bubble.tsx` | Client | Part of chat panel tree |
| `course-card.tsx` | Client | Interactive (delete, explore alternatives) |
| All API routes | Server | Node.js runtime, secrets safe |

Nearly the entire UI is client-rendered because this is an interactive, stateful application. The server components are only the outermost layout shell. This is the correct pattern for a chat-based app -- do not fight it by trying to make interactive components server-rendered.

## API Route Design

### POST /api/chat

The central orchestrator. Receives conversation state, streams AI responses back.

```typescript
// Simplified flow
export async function POST(request: Request) {
  const { messages, plan, phase, userContext } = await request.json();

  const systemPrompt = buildSystemPrompt(phase, userContext, plan);
  const tools = getToolDefinitions(); // search_courses, generate_plan

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    tools,
    stream: true,
  });

  // Return ReadableStream that:
  // 1. Forwards text tokens as SSE
  // 2. Executes tool calls server-side
  // 3. Appends plan data as final SSE event
  return new Response(transformStream(stream), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

**Key design decisions:**

- **Stream text, buffer tool calls.** Text tokens stream to the client immediately for perceived speed. Tool calls (course search) execute server-side and their results feed back into the OpenAI conversation without the client seeing intermediate steps.
- **Phase-aware system prompts.** The system prompt changes based on `phase`: in `entry`, the AI gathers context; in `building`, it generates/refines plans; in `complete`, it handles refinement requests.
- **Plan as structured output.** Use OpenAI's `response_format` or tool call returns to get plan data as structured JSON, not parsed from prose. The existing prototype already uses `zodResponseFormat` -- carry this pattern forward.

### POST /api/courses

Thin GraphQL proxy. Keeps API keys and endpoint details server-side.

```typescript
export async function POST(request: Request) {
  const { query, filters } = await request.json();

  const variables = {
    requests: [{
      query,
      indexName: 'prod_all_launched_products_term_optimization',
      limit: filters?.limit ?? 10,
      // C+ filter applied here
    }],
  };

  const response = await fetch(COURSERA_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: SEARCH_QUERY, variables }),
  });

  const data = await response.json();
  const courses = extractAndFilterCourses(data); // isPartOfCourseraPlus
  return Response.json({ courses });
}
```

## OpenAI Integration Pattern

### Streaming Architecture

Use the OpenAI Node SDK's native streaming with `ReadableStream` for the App Router response. Do NOT use the Vercel AI SDK (`ai` package) -- it adds abstraction overhead and its API changes frequently. The OpenAI SDK's streaming is stable and sufficient for this prototype.

```typescript
// lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Client-side: use-chat-stream.ts
function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const sendMessage = async (messages: Message[]) => {
    setIsStreaming(true);
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, plan, phase }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // Parse SSE events, accumulate text, detect plan data
      handleChunk(chunk);
    }
    setIsStreaming(false);
  };
}
```

### Tool Call Strategy

Define two tools for OpenAI function calling:

1. **`search_courses`** -- searches Coursera catalog. Called by AI when it needs course data for plan generation.
2. **`generate_plan`** -- structures the plan output. Forces the AI to return plan data in a known schema rather than embedding it in prose.

Tool calls execute server-side in the streaming handler. The client never sees tool call internals -- it only receives the final streamed text and plan data.

### Prompt Architecture

Three system prompts, one per phase:

| Phase | System Prompt Focus | AI Behavior |
|-------|---------------------|-------------|
| `entry` | Gather career goals, background, constraints. Be conversational. Ask clarifying questions. | Interviewer mode. 2-4 exchanges before suggesting a plan. |
| `building` | Generate personalized plan using tool calls. Explain choices. Offer refinement. | Plan builder mode. Uses search_courses tool, returns structured plan. |
| `complete` | Handle refinement requests. Adjust plan based on feedback. | Advisor mode. Responds to "make it shorter", "add more AI courses", etc. |

The existing prototype's prompt structure (discovery -> recommendations -> refinement -> learning-plan) maps well to these three phases, simplified for the new UI paradigm.

## Patterns to Follow

### Pattern 1: SSE for Streaming AI Responses

**What:** Server-Sent Events from the API route to the client for real-time token streaming.
**When:** Every chat interaction.
**Why:** SSE is the standard pattern for server-to-client streaming in HTTP. Simpler than WebSockets for unidirectional streaming. Works natively with App Router's `Response` API.

```typescript
// Custom SSE protocol
// Text tokens:     data: {"type":"token","content":"Hello"}
// Plan update:     data: {"type":"plan","data":{...planObject}}
// Phase change:    data: {"type":"phase","phase":"building"}
// Prompt pills:    data: {"type":"pills","pills":[...]}
// Done:            data: {"type":"done"}
```

### Pattern 2: Optimistic UI for Plan Mutations

**What:** When user deletes a course, remove it from the UI immediately before AI confirmation.
**When:** Direct plan manipulation (delete course, reorder).
**Why:** Makes the UI feel responsive. The AI confirmation/replacement happens asynchronously.

### Pattern 3: Phase-Driven Layout Transitions

**What:** CSS transitions between layout states driven by the phase state machine.
**When:** Phase changes from `entry` to `building` (biggest visual shift).
**Why:** The entry screen is a single centered column. The split view is a two-panel layout. Use CSS Grid with `grid-template-columns` that transitions from `1fr` to `1fr 1fr` (or similar ratio) with a CSS transition on the grid property.

```typescript
// app-shell.tsx
<div className={cn(
  'grid h-screen transition-all duration-500',
  phase === 'entry' && 'grid-cols-1',
  phase !== 'entry' && 'grid-cols-[1fr_420px]'  // plan stretches, chat fixed width
)}>
  {phase !== 'entry' && <PlanPanel />}
  <ChatPanel />
</div>
```

### Pattern 4: Conversation Context Window Management

**What:** Send only recent messages + a summary to OpenAI, not the entire history.
**When:** Conversations exceed ~15 messages.
**Why:** Token limits and cost. The system prompt + plan state + full history can exceed context windows quickly.

Strategy: Always send the system prompt, current plan state, last 10 messages, and a compressed summary of earlier messages.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Vercel AI SDK for a Prototype

**What:** Using the `ai` npm package (Vercel AI SDK) for chat streaming.
**Why bad:** Adds a dependency with its own abstractions, hooks (`useChat`), and opinions about state management. Its API changes between minor versions. For a two-week prototype, the abstraction cost exceeds the benefit. Direct OpenAI SDK streaming is simpler and more controllable.
**Instead:** Use the OpenAI Node SDK directly with `fetch` + `ReadableStream` on the client.

### Anti-Pattern 2: Multiple Routes for State Transitions

**What:** Using `/entry`, `/building`, `/complete` as separate pages.
**Why bad:** Breaks the continuous conversation experience. Page transitions lose client state. The Figma design shows a single-page evolution, not navigation.
**Instead:** Single page with CSS layout transitions driven by state.

### Anti-Pattern 3: Client-Side OpenAI Calls

**What:** Calling OpenAI directly from the browser.
**Why bad:** Exposes API key. Cannot execute tool calls (course search) without exposing Coursera endpoint. No server-side rate limiting.
**Instead:** All AI calls go through `/api/chat` route handler.

### Anti-Pattern 4: Parsing Plan Data from AI Prose

**What:** Letting the AI describe the plan in natural language and parsing it client-side.
**Why bad:** Fragile. AI output varies. Regex/parsing breaks constantly.
**Instead:** Use structured output (Zod schemas with `zodResponseFormat` or OpenAI tool calls) to get plan data as typed JSON. The existing prototype already does this well.

### Anti-Pattern 5: Complex Agent Orchestration for the Prototype

**What:** Replicating the existing prototype's 6-agent pipeline (reformulation, decomposition, skill, prompt-chain, discovery, inverted-retrieval agents).
**Why bad:** The existing agent pipeline is optimized for course discovery quality but is complex to port and debug. For a user testing prototype, a simpler approach works: let GPT-4o handle query reformulation internally via its tool call to `search_courses`, and do 2-3 search calls per plan generation instead of running 6 parallel agents.
**Instead:** Single AI conversation with tool calls. If course quality is insufficient, add a lightweight search-and-rerank step, not the full agent pipeline.

## Scalability Considerations

Not a primary concern for a prototype, but noted for awareness:

| Concern | Prototype (10 testers) | If Scaled (10K users) |
|---------|----------------------|----------------------|
| **OpenAI rate limits** | No issue | Need queuing, rate limiting per user |
| **Coursera GraphQL load** | No issue | Need caching layer, request batching |
| **State persistence** | In-memory (browser) | Need database (conversations, plans) |
| **Streaming connections** | No issue | Need connection pooling, edge functions |
| **Cost** | ~$5-20 for testing | Need model selection strategy (gpt-4.1-mini for simple, gpt-4o for plan gen) |

## Build Order (Dependencies)

Components should be built in this order based on dependencies:

```
Phase 1: Foundation
  types.ts → mock-data.ts → coursera-client.ts
  (Types first, then data layer)

Phase 2: API Layer
  /api/courses (GraphQL proxy, testable with mock data)
  /api/chat (OpenAI streaming, testable with simple prompts)
  (API routes depend on types + data layer)

Phase 3: State + Layout
  conversation-context.tsx + plan-context.tsx
  app-shell.tsx (layout state machine)
  (State containers depend on types)

Phase 4: Chat UI
  chat-input.tsx → message-bubble.tsx → message-list.tsx → chat-panel.tsx
  use-chat-stream.ts (streaming hook)
  prompt-pills.tsx
  (Chat UI depends on state + API layer)

Phase 5: Plan UI
  course-card.tsx → milestone-section.tsx → plan-header.tsx → plan-panel.tsx
  plan-skeleton.tsx
  (Plan UI depends on state + plan data)

Phase 6: Integration + Polish
  Phase transitions (entry → building → complete)
  Prompt pill adaptation
  Plan mutation flows (delete course, explore alternatives)
  Error states, loading states
```

**Critical path:** Types -> API routes -> State -> Chat UI -> Plan UI -> Integration. The chat UI and plan UI can be built in parallel once state containers exist.

## Sources

- Existing PPP prototype: `/Users/dajiboye/base/coursera/PPP Figma/PPP/` -- server.mjs, gateway/agent/, gateway/coursera/
- Project requirements: `.planning/PROJECT.md`
- Next.js 15 App Router patterns: based on training data knowledge of App Router conventions (MEDIUM confidence -- verify streaming patterns against current Next.js docs during implementation)
- OpenAI Node SDK streaming: based on training data knowledge of OpenAI SDK v4+ (MEDIUM confidence -- verify `stream: true` API during implementation)
