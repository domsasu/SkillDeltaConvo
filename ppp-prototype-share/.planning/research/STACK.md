# Technology Stack

**Project:** PPP Prototype -- Personalized Progressive Pathways
**Researched:** 2026-03-31

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | ^15.2 | Full-stack React framework | Mandated by project constraints; matches Coursera reference repo (`prototypes-tools-sandbox`); App Router provides server components and Route Handlers for API proxy; `output: "standalone"` required for AWS Amplify deployment |
| TypeScript | ^5.7 | Type safety | Catch schema mismatches between OpenAI structured output, GraphQL responses, and UI state at compile time; essential when juggling conversation state + plan data |
| React | ^19.0 | UI library | Ships with Next.js 15; React 19 provides `useActionState`, `useOptimistic` for form/streaming UX; Server Components reduce client bundle |

**Confidence:** HIGH -- Next.js 15 with App Router is stable and well-documented. Versions confirmed via existing Coursera reference patterns.

### AI / LLM Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel AI SDK (`ai`) | ^4.2 | Streaming chat abstraction | Provides `streamText`, `streamObject`, `generateObject` with built-in SSE streaming, automatic React hooks (`useChat`), and structured output via Zod schemas. Eliminates hand-rolling streaming, token-by-token rendering, and abort handling. The `useChat` hook manages conversation state, loading indicators, and error recovery out of the box |
| `@ai-sdk/openai` | ^1.3 | OpenAI provider for AI SDK | Official provider adapter -- connects AI SDK to OpenAI API with full support for `gpt-4o`, `gpt-4.1-mini`, structured outputs, and tool calling |
| `openai` | ^6.33 | Direct OpenAI SDK (fallback) | Already used in existing PPP prototype for structured JSON generation. Keep as direct dependency for non-streaming operations (e.g., batch plan generation, structured JSON responses where AI SDK overhead is unnecessary). Confirmed version from existing prototype's `node_modules` |
| Zod | ^4.3 | Schema validation | Define structured output schemas for OpenAI responses (plan shape, conversation state). AI SDK uses Zod natively for `streamObject`/`generateObject`. Version 4.x confirmed in existing prototype |

**Confidence:** MEDIUM -- AI SDK v4.x is the current major version based on training data (released late 2024/early 2025). The `@ai-sdk/openai` package split happened in AI SDK v3+. Versions should be verified with `npm view` at install time, but the architecture (AI SDK + OpenAI provider) is the established standard pattern.

**Why AI SDK over raw OpenAI SDK for chat:**
The existing prototype uses raw `fetch` against the OpenAI Chat Completions API (see `gateway/agent/llm.js`). This works for server-side JSON generation but gives you nothing for the chat UI: no streaming token display, no abort handling, no conversation state management, no automatic retry. The AI SDK provides all of this with `useChat` on the client and `streamText` on the server, connected via a single Route Handler. For a 2-week prototype with a streaming chat interface, this saves days of boilerplate.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^4.0 | Utility-first styling | Fastest way to implement Figma designs pixel-for-pixel; v4 has CSS-first configuration (no `tailwind.config.js`), native container queries, and ships with Next.js 15's `create-next-app`. For a prototype with tight timeline, utility classes eliminate the CSS file organization problem entirely |
| CSS Modules | (built-in) | Component-scoped overrides | Use sparingly for complex animations or cases where Tailwind is awkward. Built into Next.js, zero config |

**Confidence:** HIGH -- Tailwind v4 shipped stable in early 2025. Next.js 15 `create-next-app` offers Tailwind as a first-class option.

**What NOT to use:**
- **shadcn/ui or Radix UI** -- Adds component abstraction layer that slows down matching exact Figma designs. The PPP UI has very specific design tokens (pill radius 48px, card radius 8px, specific colors). Custom Tailwind components will match Figma faster than adapting a component library.
- **Chakra UI / MUI** -- Heavy runtime, opinionated theming that fights custom designs. Overkill for a prototype.
- **Styled Components / Emotion** -- CSS-in-JS has fallen out of favor with React Server Components (SSR hydration issues). Tailwind is the standard for Next.js App Router projects.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | ^5.0 | Client-side state for plan + UI | Lightweight (1KB), no boilerplate, works perfectly with React 19 and Server Components. Two stores: (1) `usePlanStore` for the learning plan data model (milestones, courses, refinements), (2) `useUIStore` for view transitions (entry -> split view), panel state. Zustand over Context because the plan store has complex update logic (delete course, swap course, reorder milestones) that would be painful with useReducer |
| AI SDK `useChat` | (included in `ai`) | Conversation state | Manages message history, streaming state, loading indicators, abort. Do NOT duplicate this in Zustand -- let `useChat` own conversation, let Zustand own plan data |

**Confidence:** HIGH -- Zustand v5 is the current stable release, fully compatible with React 19.

**What NOT to use:**
- **Redux / Redux Toolkit** -- Massive overkill for a prototype with 2 stores. Boilerplate-heavy.
- **Jotai / Recoil** -- Atomic state is great for forms but adds indirection for the plan data model where you want a single coherent store.
- **React Context alone** -- Fine for theme/auth, but causes unnecessary re-renders when plan data changes frequently during streaming plan generation.

### Data Fetching / GraphQL

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native `fetch` | (built-in) | GraphQL requests to Coursera | The existing prototype already has a working `CourseraDiscoveryClient` using native fetch. Port this to a Next.js server-side utility. No GraphQL client library needed -- we send raw queries with string templates (already defined in `queries.js`). Adding Apollo or urql would be over-engineering for 4 known queries |

**Confidence:** HIGH -- Existing working pattern in prototype. GraphQL queries are already written and tested.

**Architecture note:** All Coursera GraphQL calls MUST go through a Next.js Route Handler (`/api/coursera/...`) that acts as a server-side proxy. This avoids CORS issues (Coursera's GraphQL gateway does not allow browser origins) and keeps the endpoint abstracted from the client.

### Infrastructure / Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| AWS Amplify | Gen 2 | Hosting + CI/CD | Mandated by project constraints; matches Coursera reference repo. Amplify Gen 2 supports Next.js App Router with `output: "standalone"`. Provides automatic preview deployments for PR branches |
| `next.config.ts` settings | -- | Amplify compatibility | `output: "standalone"` is REQUIRED. Also set `images.unoptimized: true` (Amplify does not support Next.js Image Optimization out of the box) |

**Confidence:** MEDIUM -- Amplify Gen 2 + Next.js 15 standalone is the documented pattern. Some edge cases with middleware and ISR may require workarounds. The reference repo (`prototypes-tools-sandbox`) should be consulted for known Amplify-specific configurations.

**What NOT to use:**
- **Vercel** -- Would be the path of least resistance for Next.js, but Amplify is mandated.
- **Docker / ECS** -- Over-engineering for a prototype.
- **Amplify Gen 1** -- Legacy, does not support App Router properly.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `clsx` | ^2.1 | Conditional CSS class merging | Combining Tailwind classes conditionally (e.g., active states on prompt pills, entry vs split view layouts) |
| `nanoid` | ^5.1 | ID generation | Unique IDs for messages, milestones, courses in the plan. Lightweight, URL-safe |
| `react-markdown` | ^9.0 | Markdown rendering in chat | AI responses may contain markdown formatting (bold, lists, headers). Render safely without `dangerouslySetInnerHTML` |
| `lucide-react` | ^0.475 | Icons | Lightweight icon library for UI elements (sparkle icon for AI, arrows, close buttons). Tree-shakeable |
| `framer-motion` | ^12.0 | Animations | Smooth transitions for entry -> split view, plan card additions/removals, streaming text appearance. Use sparingly for key transitions only |

**Confidence:** LOW for exact versions -- these are common libraries where the latest stable should work. Pin exact versions at `npm install` time.

### Dev Dependencies

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| ESLint | ^9.0 | Linting | Ships with `create-next-app`. Use flat config (ESLint v9+) |
| `eslint-config-next` | ^15.2 | Next.js lint rules | Catches common Next.js mistakes (missing `alt` on images, incorrect `next/link` usage) |
| Prettier | ^3.5 | Code formatting | Consistent formatting, no debates. Use with `prettier-plugin-tailwindcss` for automatic Tailwind class sorting |
| `prettier-plugin-tailwindcss` | ^0.6 | Tailwind class ordering | Sorts utility classes in a consistent order, makes diffs cleaner |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| AI Integration | Vercel AI SDK | Raw OpenAI SDK only | Raw SDK requires hand-rolling streaming, SSE parsing, conversation state, abort handling, error recovery. AI SDK provides all of this. For server-only JSON generation, keep using OpenAI SDK directly |
| AI Integration | Vercel AI SDK | LangChain.js | LangChain adds massive dependency surface, complex abstractions (chains, agents, memory). This prototype has a simple flow: conversation -> structured output -> plan. AI SDK is purpose-built for this |
| Styling | Tailwind CSS | shadcn/ui | shadcn components are opinionated about spacing, colors, and interaction patterns. PPP has specific Figma designs that would fight shadcn defaults. Custom Tailwind is faster for pixel-matching |
| State | Zustand | Redux Toolkit | 10x more boilerplate for the same result. Prototype does not need Redux DevTools, middleware, or normalized state |
| State | Zustand | React Context + useReducer | Works for simple state but causes full subtree re-renders. Plan refinements (delete course, reorder) would trigger unnecessary re-renders of the entire chat panel |
| GraphQL | Native fetch | Apollo Client | Apollo adds 40KB+ to client bundle, requires provider setup, cache configuration. We have 4 queries, all server-side. Native fetch in Route Handlers is simpler and sufficient |
| Icons | lucide-react | react-icons | lucide-react is fully tree-shakeable and has consistent stroke-based design. react-icons bundles multiple icon sets and is harder to tree-shake |
| Animations | framer-motion | CSS transitions only | CSS transitions work for simple opacity/transform but are painful for layout animations (entry -> split view), exit animations, and staggered list animations on plan cards |

## Installation

```bash
# Initialize project
npx create-next-app@latest ppp-prototype --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Core AI dependencies
npm install ai @ai-sdk/openai openai zod

# State management
npm install zustand

# UI utilities
npm install clsx nanoid react-markdown lucide-react framer-motion

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss
```

## Key Configuration

### next.config.ts (Amplify compatibility)
```typescript
const nextConfig = {
  output: "standalone",       // REQUIRED for Amplify
  images: {
    unoptimized: true,        // Amplify does not support Image Optimization
  },
};
```

### Environment Variables
```bash
# .env.local
OPENAI_API_KEY=sk-...                          # OpenAI API key
OPENAI_MODEL=gpt-4.1-mini                      # or gpt-4o for higher quality
COURSERA_GRAPHQL_ENDPOINT=https://www.coursera.org/graphql-gateway
```

### AI SDK Route Handler Pattern
```typescript
// app/api/chat/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: "...",
    messages,
  });
  return result.toDataStreamResponse();
}
```

### Client Chat Hook Pattern
```typescript
// In a client component
import { useChat } from "ai/react";

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: "/api/chat",
});
```

## Model Selection

| Model | Cost | Latency | Quality | Use When |
|-------|------|---------|---------|----------|
| `gpt-4.1-mini` | Low | ~1-2s first token | Good for conversation | Default for chat responses and plan generation. Existing prototype already uses this |
| `gpt-4o` | Higher | ~2-3s first token | Best overall | If plan quality from 4.1-mini is insufficient during user testing. Easy swap via env var |

**Recommendation:** Start with `gpt-4.1-mini` (matches existing prototype), switch to `gpt-4o` if plan quality is poor. Make model configurable via environment variable so it can be changed without code changes.

## Sources

- Existing PPP prototype at `PPP Figma/PPP/` -- OpenAI v6.33.0, Zod v4.3.6, `gpt-4.1-mini` model, working GraphQL client and queries (HIGH confidence, verified from local `node_modules`)
- Project constraints from `.planning/PROJECT.md` -- Next.js 15, App Router, TypeScript, AWS Amplify, OpenAI API (HIGH confidence, mandated)
- Vercel AI SDK architecture (useChat + streamText + Route Handlers) -- based on training data knowledge of AI SDK v3/v4 patterns (MEDIUM confidence, verify exact API at install time)
- Tailwind CSS v4 -- based on training data knowledge of the v4 release in early 2025 (MEDIUM confidence)
- Zustand v5 -- based on training data knowledge of the v5 release (MEDIUM confidence)
- AWS Amplify Gen 2 + Next.js standalone output -- based on training data and reference repo mention in PROJECT.md (MEDIUM confidence, verify Amplify-specific config from reference repo)
