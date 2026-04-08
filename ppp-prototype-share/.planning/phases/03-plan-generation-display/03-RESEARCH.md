# Phase 3: Plan Generation & Display - Research

**Researched:** 2026-04-01
**Domain:** AI tool calling, structured output, plan data modeling, split-view layout
**Confidence:** HIGH

## Summary

Phase 3 connects the conversation flow (Phase 2) to real course data from the Coursera Search GraphQL API, producing a personalized learning plan. The core technical challenge is orchestrating multi-step AI tool calls -- the model must search for courses multiple times (once per milestone area), then assemble results into a structured plan. AI SDK v6 handles this natively via `stopWhen: stepCountIs(N)` on `streamText`, where each tool call's result feeds back to the model for the next step.

The display side is straightforward: extend the existing `AppPhase` state machine with plan-related states, swap LIHP main content for a full plan view, and bind real data to the existing `LearningPlanBanner` component. The chat panel stays fixed at 400px on the right throughout.

**Primary recommendation:** Use AI SDK server-side tool execution with `stopWhen: stepCountIs(5)` to let the model call a `search_courses` tool multiple times, then a `build_learning_plan` tool to assemble the final plan. Send the completed plan to the client via a custom data part. Keep plan state in `AppShell` component state (no Zustand yet -- defer to Phase 4 when refinement mutations justify it).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** AI generates the plan using tool calling within the chat stream. When `ready_for_plan` triggers, the AI uses tool calls to search Coursera courses and build the plan inline -- no separate endpoint.
- **D-02:** Multiple targeted searches per milestone. The AI calls the search tool 3-4 times with queries specific to each milestone area (e.g., "python fundamentals", "data analysis projects") rather than one broad search.
- **D-03:** Loading state then reveal UX. Show a loading/skeleton state in the plan area while generation happens. Once the full plan is ready, reveal it all at once. No progressive/streaming plan build.
- **D-04:** After plan generation, AI posts a confirmation message in chat (e.g., "Learning plan created") and the learning plan summary banner appears on the LIHP.
- **D-05:** AI decides milestone count and names with goal-type guardrails in the system prompt: career change -> Foundations (with PC/S12N), Core Skills, Job Prep; skill improvement -> milestone per skill.
- **D-06:** Courses per milestone: Claude's discretion -- set reasonable defaults in the prompt with flexibility for the AI to adjust.
- **D-07:** Plan includes Professional Certificates and Specializations, not just individual courses. Search API `productType` field used to distinguish.
- **D-08:** Learning plan summary banner on LIHP uses the existing `LearningPlanBanner` design populated with real plan data instead of mock data.
- **D-09:** Full plan view replaces LIHP main content (no route change). "View full plan" swaps left panel content. "Back to home" returns to LIHP.
- **D-10:** Chat panel stays on the right at existing 400px width in both LIHP and full plan view.
- **D-11:** Course cards match Figma: thumbnail, course name, skills, partner + product type + modules. Activity badges are mocked/hardcoded.
- **D-12:** Expand chevron on course cards is static or omitted -- no expand/collapse.
- **D-13:** Course name links to Coursera XDP page in a new tab.
- **D-14:** AI estimates duration from course data. Calculates total hours, derives timeline based on learner's hours/week availability.

### Claude's Discretion
- Exact Zod schema shape for the plan structured output
- How search tool results are filtered/ranked before selection
- Loading skeleton design for plan generation state
- "Start learning plan" CTA behavior (can be non-functional for prototype)
- Milestone section visual design details (colors, badges like "Core Track")

### Deferred Ideas (OUT OF SCOPE)
- Expand/collapse functionality on course cards -- Phase 4 or not needed
- "Start learning plan" CTA auto-enrollment -- explicitly out of scope
- Refinement prompt pills functionality ("Finish in 6 months", "Add portfolio project") -- Phase 4

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAN-01 | Plan generated from gathered context using OpenAI with real course data from Search API | AI SDK `streamText` with `stopWhen` + `search_courses` tool calls the existing `CourseraDiscoveryClient.search()` server-side |
| PLAN-02 | Plan organized into milestones (foundation, core, applied, advanced) | Zod schema for `LearningPlan` with `milestones[]` array; system prompt guardrails per D-05 |
| PLAN-03 | Each milestone contains relevant courses with: name, partner, duration, difficulty, skills | `CourseHit` type already has all these fields; plan schema maps them to `PlanCourse` type |
| PLAN-04 | Duration estimates for each course, each milestone, and overall plan | AI calculates from `CourseHit.duration` field + learner's hours/week from `gathered_info.constraints` |
| PLAN-05 | Only C+ catalog courses recommended (isPartOfCourseraPlus filter) | Existing `courses/search/route.ts` already filters `isPartOfCourseraPlus === true`; replicate filter in server-side tool |
| PLAN-06 | Structured output via Zod schema validation for plan data | Zod `learningPlanSchema` validates tool output; AI SDK `tool()` uses `inputSchema` for type-safe validation |
| DISP-01 | Split-view layout: plan panel (left ~65%), chat panel (right ~35%) | Existing LIHP layout already has this structure (`flex-1` main + `w-[400px]` aside); plan view replaces main content |
| DISP-02 | Plan summary header showing: target role, key skills, timeline, hours/week | `PlanSummaryBar` component; data from `LearningPlan.summary` fields |
| DISP-03 | Milestone sections with course cards inside each milestone | `MilestoneSection` + `PlanCourseCard` components per UI-SPEC |
| DISP-04 | Course cards with: name, partner name, estimated hours, difficulty badge, skills tags | `PlanCourseCard` component renders `PlanCourse` data; all fields available from `CourseHit` |
| DISP-05 | Course cards link to coursera.org XDP page in new tab | `<a href={course.url} target="_blank" rel="noopener noreferrer">` on course name |
| DISP-06 | Smooth animated transition from entry screen to split view when plan is ready | Existing entry -> LIHP transition already works; plan banner reveal uses `opacity` + `translateY` (200ms ease-out) |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.0.142 | Streaming chat, tool calling, data parts | Already installed; `streamText` with `stopWhen` handles multi-step tool execution server-side |
| `@ai-sdk/openai` | ^3.0.49 | OpenAI provider | Already installed; connects AI SDK to gpt-4.1-mini |
| `@ai-sdk/react` | ^3.0.144 | `useChat` hook | Already installed; manages conversation state + renders tool call results |
| `zod` | ^4.3.6 | Schema validation | Already installed; defines plan structured output, tool input schemas |
| `clsx` | ^2.1.1 | Conditional classes | Already installed |
| `lucide-react` | ^1.7.0 | Icons | Already installed; ArrowLeft for back, ChevronRight for CTA |
| `react-markdown` | ^10.1.0 | Markdown in chat | Already installed |

### To Install
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zustand` | ^5.0 | Plan state management | **Defer to Phase 4.** Phase 3 can use component state in AppShell for plan data. Zustand becomes valuable when Phase 4 adds delete/swap/reorder mutations. |
| `framer-motion` | ^12.0 | Layout animations | **Defer to Phase 4 or skip.** Phase 3 transitions (banner reveal, content swap) can use CSS transitions. Framer adds value for staggered list animations in refinement. |

### Not Needed
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand (Phase 3) | `useState` in AppShell | Plan state is set once, read by children. No complex mutations yet. Component state is simpler. |
| framer-motion (Phase 3) | CSS `transition` + `opacity`/`transform` | CSS transitions handle the banner reveal and content swap. No staggered list animations needed until refinement. |
| `nanoid` | `crypto.randomUUID()` | Built-in, no dependency. IDs for milestones/courses are generated server-side in the tool. |

## Architecture Patterns

### Recommended Project Structure (new files)
```
src/
├── components/
│   └── plan/
│       ├── plan-view.tsx           # Full plan view container
│       ├── plan-summary-bar.tsx    # Role/skills/duration summary line
│       ├── milestone-section.tsx   # Milestone with course cards
│       ├── plan-course-card.tsx    # Individual course card
│       ├── activity-badge.tsx      # Mocked activity badge pill
│       └── plan-loading-skeleton.tsx # Skeleton during generation
├── lib/
│   ├── plan-types.ts              # LearningPlan, PlanMilestone, PlanCourse types
│   ├── prompts/
│   │   ├── plan-schemas.ts        # Zod schemas for plan structured output
│   │   └── system-prompt.ts       # Extended with plan generation instructions
│   └── tools/
│       ├── search-courses.ts      # search_courses tool definition
│       └── build-plan.ts          # build_learning_plan tool definition (optional)
```

### Pattern 1: Multi-Step Tool Calling with stopWhen

**What:** The AI calls `search_courses` multiple times (once per milestone area), accumulates results, then assembles the plan. AI SDK `stopWhen: stepCountIs(5)` allows up to 5 tool call rounds in one `streamText` invocation.

**When to use:** When the AI needs to make multiple dependent tool calls before producing a final response.

**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
import { streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const searchCourses = tool({
  description: "Search Coursera catalog for courses matching a query. Call this multiple times with different queries for each milestone area.",
  inputSchema: z.object({
    query: z.string().describe("Search query for courses"),
    limit: z.number().default(10).describe("Max results to return"),
  }),
  execute: async ({ query, limit }) => {
    // Server-side: call CourseraDiscoveryClient directly
    const client = getCourseraClient();
    const result = await client.search({ query, limit });
    const courses = (result?.elements ?? [])
      .filter(el => el.__typename === "Search_ProductHit" && el.isPartOfCourseraPlus === true);
    return { query, courses };
  },
});

// In route handler:
const result = streamText({
  model: openai(config.OPENAI_MODEL),
  system: buildSystemPrompt(), // Extended with plan generation instructions
  messages: modelMessages,
  tools: { report_conversation_state: reportConversationState, search_courses: searchCourses },
  stopWhen: stepCountIs(5),
  onFinish({ steps }) {
    // Extract search results from all steps
    // Send plan data to client via data part
  },
});
```

### Pattern 2: Custom Data Parts for Plan Delivery

**What:** After the AI finishes tool calling and assembles the plan, send the structured plan data to the client via `writer.write()` with a custom data part type.

**When to use:** To deliver structured data (the plan) alongside the streaming chat response without mixing it into the text stream.

**Example:**
```typescript
// Source: existing route.ts pattern + https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data
const stream = createUIMessageStream({
  execute: ({ writer }) => {
    const result = streamText({
      // ... config ...
      onFinish({ steps, text }) {
        // Extract plan from the final step's tool call or text
        const planData = extractPlanFromSteps(steps);
        if (planData) {
          writer.write({
            type: "data-learning-plan",
            data: planData,
          });
        }
        // Also extract conversation state as before
      },
    });
    writer.merge(result.toUIMessageStream());
  },
});
```

Client receives via `useChat` `onData`:
```typescript
const { messages, sendMessage, status } = useChat<ChatUIMessage>({
  onData(dataPart) {
    if (dataPart.type === "data-learning-plan") {
      setPlan(dataPart.data as LearningPlan);
      setPhase("plan_generated");
    }
    if (dataPart.type === "data-conversation-state") {
      // existing handling
    }
  },
});
```

### Pattern 3: State Machine Extension

**What:** Extend `AppPhase` from `"entry" | "chatting" | "ready_for_plan"` to include plan lifecycle states.

**When to use:** When `ready_for_plan` triggers, transition through `plan_generating` -> `plan_generated` -> `viewing_plan`.

**Example:**
```typescript
export type AppPhase =
  | "entry"
  | "chatting"
  | "ready_for_plan"
  | "plan_generating"
  | "plan_generated"
  | "viewing_plan";
```

### Pattern 4: Content Swap (no route change)

**What:** LihpPage conditionally renders either LIHP sections or PlanView based on a `viewingPlan` state flag. No Next.js routing involved.

**When to use:** D-09 specifies same-page content swap.

**Example:**
```typescript
// In LihpPage
<main className="flex-1 overflow-y-auto border-r border-[#dae1ed]">
  <div className="px-8 py-6">
    <div className="mx-auto max-w-[860px]">
      {viewingPlan ? (
        <PlanView plan={plan} onBack={() => setViewingPlan(false)} />
      ) : (
        <div className="space-y-8">
          {plan && <LearningPlanBanner plan={plan} onViewPlan={() => setViewingPlan(true)} />}
          <TrendingSection />
          <SkillsSection />
          <CollectionSection />
        </div>
      )}
    </div>
  </div>
</main>
```

### Anti-Patterns to Avoid
- **Streaming plan data progressively:** D-03 says all-at-once reveal. Do NOT stream individual courses or milestones to the UI as they arrive. Buffer the complete plan server-side, then send as one data part.
- **Separate plan generation endpoint:** D-01 says tool calling within the chat stream. Do NOT create a `/api/plan/generate` route.
- **Duplicating chat state in plan store:** Let `useChat` own messages. Plan data is separate -- stored in component state or (Phase 4) Zustand.
- **Client-side course searching:** All search tool execution happens server-side inside the `execute` function. The client never calls `/api/courses/search` directly during plan generation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-step tool orchestration | Custom loop calling OpenAI API multiple times | AI SDK `streamText` + `stopWhen: stepCountIs(5)` | AI SDK handles the tool call -> result -> next call loop automatically, including streaming, error recovery, and step tracking |
| Streaming SSE to client | Manual ReadableStream with SSE encoding | `createUIMessageStream` + `toUIMessageStream()` | Already working in Phase 2; handles message framing, reconnection, abort |
| Tool input validation | Manual JSON parsing | `tool()` with `inputSchema` (Zod) | AI SDK validates tool inputs automatically and provides typed params to `execute` |
| Custom data delivery | Parsing text responses for embedded JSON | `writer.write({ type: "data-*", data })` | Data parts are first-class in AI SDK; client receives via typed `onData` handler |
| Course URL construction | Building URLs from course IDs | Use `url` field from Search API directly | `CourseHit.url` already contains the correct path (e.g., `/professional-certificates/google-data-analytics`) |

## Common Pitfalls

### Pitfall 1: Tool Execution Timeout
**What goes wrong:** Each `search_courses` tool call hits the Coursera GraphQL API. With 3-4 searches, total time can exceed 15-20 seconds if the API is slow.
**Why it happens:** Default `CourseraDiscoveryClient` timeout is 15s per request. Four sequential calls = up to 60s.
**How to avoid:** Reduce per-request timeout to 8s. Add mock fallback in the tool's `execute` function (same pattern as `courses/search/route.ts`). Consider parallel searches if AI SDK supports it (it does -- multiple tool calls in one step execute concurrently).
**Warning signs:** Plan generation takes >15 seconds consistently.

### Pitfall 2: C+ Filter Missing in Tool
**What goes wrong:** The existing `/api/courses/search` route filters `isPartOfCourseraPlus === true`, but the new server-side tool `execute` function might skip this filter.
**Why it happens:** Copy-paste from `CourseraDiscoveryClient.search()` which returns raw results without the C+ filter.
**How to avoid:** Apply `isPartOfCourseraPlus === true` filter inside the tool's `execute` function, matching the existing route handler pattern.
**Warning signs:** Non-C+ courses appear in generated plans.

### Pitfall 3: stopWhen Not Imported or Misconfigured
**What goes wrong:** Without `stopWhen`, the AI gets one tool call then the stream ends. The model can't call search multiple times.
**Why it happens:** `stopWhen` is a newer API (AI SDK v5+). Forgetting it means only one round-trip.
**How to avoid:** Always set `stopWhen: stepCountIs(5)` when multi-step tool calling is needed. Import `stepCountIs` from `"ai"`.
**Warning signs:** Plan only contains courses from one search query.

### Pitfall 4: Data Part Type Mismatch
**What goes wrong:** Client `onData` handler doesn't receive the plan data because the type string doesn't match.
**Why it happens:** Server writes `type: "data-learning-plan"` but client checks for `type: "data-learningPlan"` (different casing/format).
**How to avoid:** Define data part type strings as constants shared between route handler and client. Follow the existing pattern: `"data-conversation-state"` uses kebab-case.
**Warning signs:** Plan generation completes server-side but client never updates.

### Pitfall 5: Plan Schema Too Rigid for AI
**What goes wrong:** Zod schema validation rejects the AI's plan output because of strict constraints (exact field names, required fields the model sometimes omits).
**Why it happens:** LLMs can be inconsistent with structured output, especially with complex nested schemas.
**How to avoid:** Use `.default()` for optional fields. Keep the schema simple -- flat course objects, array of milestones. Test with multiple conversation scenarios. Add a fallback that parses partial plan data.
**Warning signs:** Plan generation frequently fails with Zod validation errors.

### Pitfall 6: Image URLs from Search API
**What goes wrong:** Course card thumbnails fail to load or show broken images.
**Why it happens:** `CourseHit.imageUrl` from the Search API may use CDN URLs that require `remotePatterns` in `next.config.ts`, or the URLs might be relative.
**How to avoid:** Use `<img>` tags (not `next/image`) for course thumbnails to avoid Next.js image optimization issues on Amplify. Or ensure `remotePatterns` covers the CDN domains. The existing config already has `images.unoptimized: true` which should handle this.
**Warning signs:** Broken image icons on course cards.

## Code Examples

### Recommended Zod Schema for Learning Plan

```typescript
// src/lib/plan-types.ts
import { z } from "zod";

export const planCourseSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  imageUrl: z.string().default(""),
  productType: z.string(), // "COURSE", "SPECIALIZATION", "PROFESSIONAL_CERTIFICATE"
  partners: z.array(z.string()),
  skills: z.array(z.string()),
  duration: z.string(),
  productDifficultyLevel: z.string(),
  estimatedHours: z.number().optional(), // AI-calculated
});

export const planMilestoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  badges: z.array(z.string()).default([]), // "Core Track", "Professional Certificate"
  courses: z.array(planCourseSchema),
  estimatedWeeks: z.number().optional(),
});

export const learningPlanSchema = z.object({
  title: z.string(), // e.g., "Data Analyst Learning Plan"
  summary: z.object({
    role: z.string(),
    skills: z.array(z.string()),
    totalDuration: z.string(), // e.g., "3-6 months"
    hoursPerWeek: z.string(), // e.g., "~6 hours/week"
  }),
  milestones: z.array(planMilestoneSchema),
});

export type PlanCourse = z.infer<typeof planCourseSchema>;
export type PlanMilestone = z.infer<typeof planMilestoneSchema>;
export type LearningPlan = z.infer<typeof learningPlanSchema>;
```

### Search Tool Definition

```typescript
// src/lib/tools/search-courses.ts
import { tool } from "ai";
import { z } from "zod";
import { getCourseraClient } from "@/lib/coursera-client";
import { searchMockCourses } from "@/lib/mock-data";
import type { CourseHit } from "@/lib/coursera-types";

export const searchCoursesTool = tool({
  description:
    "Search the Coursera Plus catalog for courses matching a query. " +
    "Call this multiple times with different queries for each milestone area. " +
    "Only returns C+ eligible courses.",
  inputSchema: z.object({
    query: z.string().describe("Search query targeting a specific skill area or topic"),
    limit: z.number().default(8).describe("Max courses to return (default 8)"),
  }),
  execute: async ({ query, limit }): Promise<{ query: string; courses: CourseHit[] }> => {
    try {
      const client = getCourseraClient();
      const result = await client.search({ query, limit });
      const courses = (result?.elements ?? []).filter(
        (el): el is CourseHit =>
          el.__typename === "Search_ProductHit" &&
          el.isPartOfCourseraPlus === true
      );
      return { query, courses };
    } catch (error) {
      console.error("[search_courses] GraphQL failed, using mock:", error);
      return { query, courses: searchMockCourses(query) };
    }
  },
});
```

### Extended Route Handler

```typescript
// Conceptual structure for updated route.ts
import { streamText, stepCountIs, createUIMessageStream, createUIMessageStreamResponse, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { searchCoursesTool } from "@/lib/tools/search-courses";
import type { LearningPlan } from "@/lib/plan-types";

// In POST handler:
const stream = createUIMessageStream({
  execute: ({ writer }) => {
    const result = streamText({
      model: openai(config.OPENAI_MODEL),
      system: buildSystemPrompt(), // Extended with plan instructions
      messages: modelMessages,
      tools: {
        report_conversation_state: reportConversationState,
        search_courses: searchCoursesTool,
      },
      stopWhen: stepCountIs(5),
      onFinish({ steps, text, toolCalls }) {
        // Extract conversation state (existing pattern)
        // ...

        // Extract plan from final text or structured output
        const plan = extractPlanFromResponse(steps, text);
        if (plan) {
          writer.write({
            type: "data-learning-plan",
            data: plan,
          });
        }
      },
    });
    writer.merge(result.toUIMessageStream());
  },
});
```

### ChatUIMessage Type Extension

```typescript
// Updated src/lib/types.ts
import type { UIMessage } from "ai";
import type { LearningPlan } from "@/lib/plan-types";

export type AppPhase =
  | "entry"
  | "chatting"
  | "ready_for_plan"
  | "plan_generating"
  | "plan_generated"
  | "viewing_plan";

export type ChatUIMessage = UIMessage<
  never,
  {
    "conversation-state": ConversationStateData;
    "learning-plan": LearningPlan;
  }
>;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `maxSteps` parameter | `stopWhen: stepCountIs(N)` | AI SDK v5 (late 2025) | `maxSteps` removed from useChat; server-side `stopWhen` replaces it |
| Tool results sent manually | Tool execution in `streamText` with auto-feedback | AI SDK v5+ | Tool results automatically feed back to model for next step |
| Data annotations / metadata | Data parts with typed `onData` handler | AI SDK v5+ | Type-safe custom data streaming replaces ad-hoc metadata |

**Deprecated/outdated:**
- `maxSteps` on `useChat` -- removed in AI SDK v5. Use `stopWhen` on `streamText` server-side.
- Manual tool result injection -- AI SDK auto-feeds tool results back to the model when tools have `execute` functions.

## Open Questions

1. **Plan assembly strategy: AI text parsing vs. structured tool output**
   - What we know: The AI will call `search_courses` multiple times, accumulating course results. It then needs to assemble these into a `LearningPlan`.
   - What's unclear: Should the AI produce the plan as a structured JSON block in its text response (parsed with regex like the existing conversation state), or should there be a `build_learning_plan` tool that the AI calls with structured input?
   - Recommendation: Use a `build_learning_plan` tool with `inputSchema` matching `learningPlanSchema`. This gives Zod validation automatically. The AI calls search tools, then calls `build_learning_plan` with the assembled plan. The tool's `execute` function validates and returns the plan, which gets sent as a data part.

2. **System prompt length with plan instructions**
   - What we know: Current system prompt is ~70 lines. Adding plan generation instructions (milestone guidelines, duration calculation rules, course selection criteria) could double it.
   - What's unclear: Whether gpt-4.1-mini handles a long system prompt well without degrading conversation quality.
   - Recommendation: Add plan instructions as a separate section in the system prompt, clearly delineated. Keep it concise -- focus on milestone patterns (D-05) and duration calculation (D-14). Test with a few scenarios.

3. **When to trigger plan generation**
   - What we know: `ready_for_plan` is already set by the conversation state tool. The AI currently just reports it.
   - What's unclear: Should the AI automatically start searching when `ready_for_plan` becomes true, or should it wait for a user message like "Generate my plan"?
   - Recommendation: The AI should tell the user it's ready, suggest "Generate my learning plan" pill, and start searching when the user confirms. This gives the user agency and avoids surprise long waits. The system prompt should instruct: "When ready_for_plan is true, tell the user you have enough context and offer to generate their plan. When they confirm, call search_courses for each milestone area."

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4
- **AI provider:** OpenAI API (gpt-4.1-mini default, gpt-4o fallback)
- **No shadcn/ui:** Custom Tailwind components only
- **AI SDK:** Vercel AI SDK v6 (`ai` ^6.0.142) for streaming + tool calling
- **State:** AI SDK `useChat` owns conversation; plan data separate
- **Deployment:** AWS Amplify with `output: "standalone"`, `images.unoptimized: true`
- **C+ filter:** `isPartOfCourseraPlus` must be true for all recommended courses
- **Prototype:** Speed over polish, throwaway solutions acceptable

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/app/api/chat/route.ts`, `src/lib/coursera-client.ts`, `src/lib/coursera-types.ts`, `src/components/app-shell.tsx` -- verified current patterns
- [AI SDK Tool Calling docs](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) -- `tool()`, `execute`, `stopWhen`, `stepCountIs` patterns
- [AI SDK streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) -- `stopWhen`, `onFinish` with `steps`, `toUIMessageStream`
- [AI SDK Streaming Custom Data](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data) -- data parts, `writer.write`, `onData` handler
- [Next.js Multi-Step Tool Calling cookbook](https://ai-sdk.dev/cookbook/next/call-tools-multiple-steps) -- full route handler + client pattern

### Secondary (MEDIUM confidence)
- [AI SDK stepCountIs reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/step-count-is) -- confirmed `stepCountIs` as the standard stopping condition
- [AI SDK createUIMessageStream reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/create-ui-message-stream) -- writer.write, merge patterns

### Tertiary (LOW confidence)
- `build_learning_plan` as a separate tool vs. text-based plan extraction -- this is a design choice, not verified against official guidance. Recommend testing both approaches early.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed, versions verified from package.json
- Architecture: HIGH -- patterns follow existing codebase conventions and official AI SDK docs
- Pitfalls: MEDIUM -- based on experience patterns, not all verified against this specific project

**Research date:** 2026-04-01
**Valid until:** 2026-04-15 (prototype deadline; stack is stable)
