# Domain Pitfalls

**Domain:** Conversational AI learning plan prototype (Next.js 15 + OpenAI + Coursera GraphQL + AWS Amplify)
**Researched:** 2026-03-31
**Confidence:** MEDIUM-HIGH (based on reference prototype analysis, known platform behaviors, and direct codebase evidence)

## Critical Pitfalls

Mistakes that cause rewrites, missed deadlines, or broken user testing sessions.

---

### Pitfall 1: OpenAI Structured Output Silently Truncates or Refuses on Complex Schemas

**What goes wrong:** When using `response_format` with `json_schema` (or Zod via `zodResponseFormat`), the model may return partial JSON, hit `max_tokens` mid-object, or refuse to fill required fields with fabricated data. The reference prototype already uses Zod schemas with tight `.min()/.max()` constraints (e.g., `z.string().min(12).max(120)`); exceeding these bounds in the AI response causes silent validation failures.

**Why it happens:** Complex nested schemas (milestones > courses > skills) push the model to produce long outputs. Token limits truncate mid-JSON. Tight Zod length constraints add another failure surface the model does not see.

**Consequences:** Plan generation returns null or throws a parse error. The UI shows a blank plan or a cryptic error. User testing session is ruined.

**Prevention:**
- Set `max_tokens` generously (4096+) for plan generation calls -- this is the single most common cause of truncated structured output.
- Use Zod schemas with relaxed `.max()` bounds during development; tighten after observing real outputs.
- Always wrap structured output parsing in a try-catch with a fallback: if parsing fails, return a mock plan and log the raw response for debugging.
- Test with long career goals that produce 4-milestone, 12+ course plans to stress-test token limits.

**Detection:** Plan generation returns `null`, API response has `finish_reason: "length"` instead of `"stop"`, or Zod validation throws.

**Phase:** Phase 1 (AI integration). Validate structured output reliability before building any UI around it.

---

### Pitfall 2: Coursera GraphQL Proxy Returns 403/CORS Errors from Browser

**What goes wrong:** The Coursera GraphQL endpoint (`https://www.coursera.org/graphql-gateway`) does not set CORS headers for arbitrary origins. Calling it directly from the browser will fail. Even server-side calls may get 403s if the User-Agent or request pattern looks unusual.

**Why it happens:** Coursera's gateway is designed for first-party apps. It may enforce origin, user-agent, or cookie-based auth checks. The reference prototype avoids this entirely by proxying through its own Node.js server (see `CourseraDiscoveryClient` using server-side `fetch`).

**Consequences:** Course search returns no results. The plan shows zero courses. Without mock fallback, the entire app is broken.

**Prevention:**
- NEVER call Coursera GraphQL from client-side code. Always proxy through Next.js API routes (Route Handlers in App Router: `app/api/search/route.ts`).
- Set a realistic `User-Agent` header on server-side requests (the reference prototype uses `coursera-agentic-discovery-gateway/0.1`).
- Implement mock data fallback from day one. The mock should return realistic `ProductHit` objects so UI development is never blocked by API issues.
- Add timeout handling (the reference uses 15s with `AbortController`) -- the gateway can be slow under load.

**Detection:** Browser console shows CORS errors. Server logs show 403 status from the GraphQL endpoint.

**Phase:** Phase 1 (data layer). Establish the proxy + mock fallback pattern before any course display work.

---

### Pitfall 3: Next.js App Router Client vs. Server Component Boundary Mismanagement

**What goes wrong:** Developers put `useState`, `useEffect`, or event handlers in Server Components (the default in App Router), causing build errors. Or they mark entire page trees as `"use client"` to avoid thinking about it, losing SSR benefits and breaking environment variable access (`process.env` secrets are not available in client components).

**Why it happens:** App Router defaults every component to Server Component. This is the opposite of Pages Router mental model. The boundary is viral -- once a component is `"use client"`, everything it imports is also client. Developers unfamiliar with this model scatter `"use client"` directives reactively.

**Consequences:** Build failures during Amplify deployment. Leaked API keys if `OPENAI_API_KEY` is accessed in a client component. Broken interactivity if chat input is accidentally server-rendered.

**Prevention:**
- Establish a clear component architecture on day one:
  - **Server Components:** Layout, page shell, initial data fetching, API key access.
  - **Client Components:** Chat panel, plan panel (interactive), entry screen input, anything with `useState`/`useEffect`.
- Create a `components/client/` directory for all `"use client"` components. Import them into server component pages.
- NEVER reference `process.env.OPENAI_API_KEY` or any secret in a file that has `"use client"`. API calls with secrets go in Route Handlers (`app/api/`) or Server Actions.
- The chat UI, plan panel, and state transitions are ALL client components. The page layout and data-fetching wrapper can be server components.

**Detection:** Build error: "useState is not allowed in Server Components." Or: environment variable is `undefined` in browser.

**Phase:** Phase 1 (project setup). Define the component boundary map before writing any components.

---

### Pitfall 4: AWS Amplify Standalone Mode Deployment Fails Silently

**What goes wrong:** Next.js App Router on Amplify requires `output: "standalone"` in `next.config.js`. Without it, Amplify deploys a static export that cannot run API routes or server components. Even with `standalone`, Amplify may fail to detect the Next.js version, use wrong build settings, or timeout during build.

**Why it happens:** Amplify's Next.js support has version-specific behaviors. Next.js 15 requires Amplify Hosting Gen 2 (compute backend). Older Amplify configurations default to static hosting, which silently strips all server-side functionality.

**Consequences:** Deployed app shows 404 for all API routes. OpenAI calls fail (no server to run them). Site appears to "work" for static pages but all dynamic features are broken. User testing with a broken deployment wastes the session.

**Prevention:**
- `next.config.ts` must include `output: "standalone"` from the start.
- Verify Amplify app is configured for "SSR" (not "SSG" or "SPA") in the Amplify console.
- Set Amplify build settings explicitly in `amplify.yml`:
  ```yaml
  version: 1
  frontend:
    phases:
      preBuild:
        commands:
          - npm ci
      build:
        commands:
          - npm run build
    artifacts:
      baseDirectory: .next
      files:
        - '**/*'
    cache:
      paths:
        - node_modules/**/*
        - .next/cache/**/*
  ```
- Deploy early (Phase 1) and verify API routes work in the deployed environment. Do not wait until the day before user testing.
- Set environment variables (OPENAI_API_KEY, etc.) in Amplify console, not in `.env` files committed to the repo.

**Detection:** API routes return 404 in deployed app. Amplify build logs show "static export" or missing server artifacts. Check Amplify console > App settings > Build settings to confirm SSR mode.

**Phase:** Phase 1 (infrastructure). Deploy a hello-world Next.js app to Amplify in the first day to validate the pipeline.

---

### Pitfall 5: Chat State Explosion from Uncontrolled Conversation History

**What goes wrong:** Each OpenAI API call includes the full conversation history in the `messages` array. As the conversation grows (10+ turns), token usage explodes, responses slow down, and costs spike. The model also starts contradicting earlier statements because the context window is overloaded.

**Why it happens:** Conversational apps naively append every message to a single array. The reference prototype's 6-agent orchestration mitigates this by using structured intent extraction (currentRole, targetRole, desiredSkills, constraints) rather than raw chat history -- but a naive reimplementation will miss this.

**Consequences:** 30-second response times after 8+ turns. $0.50+ per conversation in API costs. Model hallucinates courses or contradicts earlier plan. Token limit errors crash the conversation.

**Prevention:**
- Follow the reference prototype's pattern: extract structured intent (role, skills, constraints) from the conversation and pass THAT to the plan generation call -- not the raw chat history.
- Keep a rolling window of last 6-8 messages for conversational context, plus a system message with the extracted structured state.
- Use `gpt-4.1-mini` for conversational turns (cheap, fast) and `gpt-4o` only for plan generation (quality matters more there).
- Add token counting before each API call. If messages exceed 3000 tokens, summarize older turns.

**Detection:** Response latency > 10 seconds. Token usage per call > 4000 input tokens after 5+ turns. Check the `usage` field in OpenAI API responses.

**Phase:** Phase 2 (conversation flow). Design the state extraction pattern before building the conversation loop.

---

### Pitfall 6: Streaming Creates an Unmaintainable Frankenstein of Partial UI Updates

**What goes wrong:** Teams implement OpenAI streaming (`stream: true`) for the chat to show tokens appearing in real-time. But then plan generation also needs streaming, and partial JSON cannot be rendered as plan cards. They end up with two rendering paths (streamed text + structured plan), complex state management for in-flight messages, and race conditions when the user sends a new message while a response is still streaming.

**Why it happens:** Streaming looks impressive in demos. Product stakeholders request it. But structured output (JSON plans) and streaming are fundamentally at odds -- you cannot render a plan card from 40% of a JSON object.

**Consequences:** Complex state machine for message lifecycle (pending, streaming, complete, error). Race conditions corrupt conversation state. Partial plan rendering bugs. The reference prototype notably does NOT use streaming at all -- it returns complete responses.

**Prevention:**
- For a prototype with a 2-week timeline, do NOT implement streaming. The reference prototype proves it is unnecessary.
- Show a loading state ("Generating your plan...") with a progress indicator instead. This is simpler and sufficient for user testing.
- If streaming is absolutely required for chat messages (not plans), isolate it completely: stream chat text responses, but use non-streaming calls for plan generation.
- Never attempt to stream structured JSON output. Use `response_format: { type: "json_schema" }` which requires non-streaming.

**Detection:** State management code has `isStreaming`, `partialContent`, `streamBuffer` flags. Multiple re-render cycles per message. Race condition bugs.

**Phase:** Phase 2 (chat UI). Decide streaming vs. non-streaming before building the message rendering pipeline. Recommendation: skip streaming entirely.

---

## Moderate Pitfalls

---

### Pitfall 7: Single-Page State Transitions Break Browser Navigation

**What goes wrong:** The project uses a single page with state transitions (entry screen -> split view). Users click the browser back button expecting to return to the entry screen, but instead they leave the app entirely. Or they refresh and lose the entire conversation + plan.

**Prevention:**
- Use `window.history.pushState` or Next.js `useRouter` shallow routing to create virtual history entries at each transition point (entry -> conversation -> plan view).
- Store critical state (conversation messages, extracted intent, current plan) in `sessionStorage` so a page refresh does not reset everything.
- Add a beforeunload handler during active conversations to warn users about losing progress.

**Detection:** Users report "I clicked back and lost my plan." Browser back button exits the app.

**Phase:** Phase 2 (UI shell). Implement virtual history entries when building state transitions.

---

### Pitfall 8: OpenAI Returns Courses That Do Not Exist on Coursera

**What goes wrong:** The LLM fabricates course names that sound plausible but do not match any real Coursera product. The plan shows "Introduction to Machine Learning with Python" but no such course exists. Clicking the link leads to a 404.

**Why it happens:** The LLM generates course names from training data. Even with retrieval from the GraphQL API, the LLM may hallucinate names that are "close but not exact" to real courses.

**Prevention:**
- NEVER let the LLM generate course names or IDs. The reference prototype's architecture is correct: use the LLM to determine search queries and skill requirements, then use the Coursera GraphQL API to retrieve REAL courses, and populate the plan with actual API results.
- The LLM decides the plan STRUCTURE (milestones, skills per milestone, search queries). The GraphQL API provides the actual COURSES.
- Validate every course URL before displaying it. If the API returns a `url` field, construct links as `https://www.coursera.org${url}` rather than trusting LLM-generated URLs.

**Detection:** Course cards link to 404 pages. Course names do not match any Coursera catalog entry. Spot-check 3-5 courses in a generated plan by searching coursera.org.

**Phase:** Phase 2 (plan generation). This is an architecture decision that must be made before implementing plan assembly.

---

### Pitfall 9: Plan Refinement Regenerates Everything Instead of Patching

**What goes wrong:** When a user says "remove the Python course" or "make it shorter," the system regenerates the entire plan from scratch. The new plan may be completely different from what the user was refining, causing confusion and distrust.

**Why it happens:** It is far simpler to regenerate than to implement plan diffing. But users experience regeneration as "the AI forgot what we agreed on."

**Prevention:**
- Pass the current plan state (course IDs, milestone structure) back to the LLM as context for refinement requests.
- For simple operations (delete a course, swap a course), implement them as direct state mutations without an LLM call at all. The project spec already lists "delete a course (P0)" and "explore alternatives (P0)" as P0 UX interactions.
- For LLM-driven refinement (e.g., "make it shorter"), include the current plan in the system prompt with instructions to modify minimally.

**Detection:** Users say "that's not what I had before" after a refinement. Plan diff between before/after refinement shows >50% course changes for a minor request.

**Phase:** Phase 3 (plan refinement). Design the refinement strategy before implementing it.

---

### Pitfall 10: Prompt Pills Are Static and Feel Robotic

**What goes wrong:** Prompt pills (suggestion buttons) show the same options regardless of conversation state. After the user has already shared their career goal, pills still say "What career should I explore?" The experience feels like a FAQ chatbot, not a personalized conversation.

**Why it happens:** Dynamic pill generation requires tracking conversation state and generating context-appropriate suggestions. Static pills are faster to implement. Teams defer dynamic pills and never get back to them.

**Prevention:**
- Define pill sets per conversation stage (the project spec already requires this: "prompt pills that adapt to conversation context").
- Map pills to conversation state: pre-goal pills, post-goal/pre-plan pills, post-plan refinement pills.
- At minimum, have 3 pill sets: entry (career exploration prompts), mid-conversation (constraint prompts like "Finish in 6 months"), post-plan (refinement prompts like "Make it shorter", "Add more hands-on projects").
- Do NOT use LLM calls to generate pills in real-time; this adds latency. Predefine pill templates and select based on state.

**Detection:** Same pills visible at different conversation stages. User testing reveals learners ignoring pills after the first interaction.

**Phase:** Phase 2-3 (chat UI + refinement). Define pill state machine during chat UI implementation.

---

### Pitfall 11: GraphQL Response Shape Changes Break the App Without Warning

**What goes wrong:** The Coursera `graphql-gateway` is an internal API, not a public contract. Field names, nesting, or available filters may change without notice. The app silently returns empty results or crashes on unexpected nulls.

**Prevention:**
- Add defensive null checks at every level of the GraphQL response (the reference client already does this: `data?.SearchResult?.search?.[0] ?? null`).
- Create a typed interface for the expected response shape and validate responses against it. Log warnings when fields are missing.
- The mock data fallback is not just for development -- it is a production safety net. If the real API returns unexpected data, fall back to mocks and log an alert.
- Pin the known-working query shapes from the reference prototype's `queries.js`.

**Detection:** Plan generation returns plans with missing course names, null skills, or empty duration fields. Monitor for null values in rendered course cards.

**Phase:** Phase 1 (data layer). Build the typed response validation when implementing the GraphQL proxy.

---

### Pitfall 12: Environment Variable Mismatch Between Local and Amplify

**What goes wrong:** App works locally but fails on Amplify because environment variables are named differently, missing from the Amplify console, or prefixed incorrectly. Next.js requires `NEXT_PUBLIC_` prefix for client-side env vars, but secrets like `OPENAI_API_KEY` must NOT have this prefix.

**Prevention:**
- Create an `.env.example` file listing ALL required variables with comments explaining which are server-only vs. client-accessible.
- Server-only: `OPENAI_API_KEY`, `COURSERA_GRAPHQL_ENDPOINT`
- Client-accessible (if any): `NEXT_PUBLIC_*` prefix only for non-sensitive config.
- Validate all required env vars at startup with a clear error message: `throw new Error("OPENAI_API_KEY is required")`.
- Add env vars to Amplify console immediately after first deployment, not as an afterthought.

**Detection:** App crashes on deployed Amplify with `undefined` errors. API routes return 500 with "API key missing" errors.

**Phase:** Phase 1 (infrastructure). Set up env validation in the first deployment.

---

## Minor Pitfalls

---

### Pitfall 13: Chat Input UX Allows Sending Empty or Oversized Messages

**What goes wrong:** Users hit Enter on an empty input, sending a blank message that confuses the LLM. Or they paste a 5000-word resume, causing token overflow.

**Prevention:**
- Disable send button when input is empty or whitespace-only.
- Set a character limit (500-1000 chars) on the chat input with a visual counter.
- Trim and sanitize input before sending to the API.

**Phase:** Phase 2 (chat UI). Quick validation during input component implementation.

---

### Pitfall 14: Loading States Are Absent, Making the App Feel Broken

**What goes wrong:** OpenAI calls take 3-15 seconds. Without loading indicators, users click the send button again (causing duplicate requests) or assume the app has crashed.

**Prevention:**
- Show a typing indicator (animated dots or "Thinking...") immediately when the user sends a message.
- Disable the send button during processing.
- For plan generation (longer), show a staged progress indicator: "Understanding your goals..." -> "Searching for courses..." -> "Building your plan...".
- Set a 30-second timeout with a friendly error: "This is taking longer than expected. Please try again."

**Phase:** Phase 2 (chat UI). Build loading states alongside the message sending flow, not as an afterthought.

---

### Pitfall 15: Font and Design Token Drift from Figma

**What goes wrong:** The Figma design uses Source Sans 3, specific colors (#0056d2 primary blue, #dae1ed borders), and exact spacing. Developers use system fonts or slightly-off colors. The prototype looks "off" during user testing but nobody can explain why.

**Prevention:**
- Import Source Sans 3 from Google Fonts in the root layout.
- Define design tokens as CSS custom properties in a single file (`globals.css`) matching the Figma spec exactly.
- Use the design tokens from PROJECT.md: primary blue `#0056d2`, border `#dae1ed`, neutral bg `#f2f5fa`, pill radius `48px`, card radius `8px`.

**Phase:** Phase 1 (project setup). Set up design tokens during initial styling configuration.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Project setup / Amplify deployment | Standalone mode misconfiguration (Pitfall 4) | Deploy hello-world on day one, verify API routes work |
| Project setup / component architecture | Client vs. server boundary confusion (Pitfall 3) | Define boundary map before writing components |
| Data layer / GraphQL integration | CORS errors from browser-side calls (Pitfall 2) | Always proxy through Route Handlers |
| Data layer / GraphQL integration | Response shape breaks (Pitfall 11) | Mock fallback + typed validation from day one |
| AI integration / structured output | Truncated JSON from token limits (Pitfall 1) | Set generous max_tokens, test with large plans |
| Conversation flow / state management | Chat history token explosion (Pitfall 5) | Extract structured intent, rolling message window |
| Chat UI / streaming decision | Streaming complexity (Pitfall 6) | Skip streaming; use loading indicators instead |
| Chat UI / state transitions | Browser back button breaks (Pitfall 7) | Virtual history entries with pushState |
| Plan generation | LLM hallucinating courses (Pitfall 8) | LLM picks structure, API picks courses |
| Plan refinement | Full regeneration frustration (Pitfall 9) | Direct mutations for P0 ops; constrained LLM refinement |
| Plan refinement / chat UX | Static prompt pills (Pitfall 10) | State-aware pill sets per conversation stage |
| Deployment / operations | Env var mismatch (Pitfall 12) | .env.example + startup validation + Amplify console setup |

## Sources

- Reference prototype analysis: `/Users/dajiboye/base/coursera/PPP Figma/PPP/` (server.mjs, gateway/coursera/client.js, gateway/agent/planner.js, docs/system-deep-dive.md)
- Project spec: `/Users/dajiboye/base/coursera/ppp-prototype/.planning/PROJECT.md`
- Next.js App Router documentation (training data -- MEDIUM confidence on App Router specifics)
- AWS Amplify + Next.js hosting documentation (training data -- MEDIUM confidence, verify against current Amplify docs)
- OpenAI structured output documentation (training data -- HIGH confidence, well-established API pattern)
