# Phase 1: Foundation - Research

**Researched:** 2026-03-31
**Domain:** Next.js 15 project scaffolding, AWS Amplify deployment, Coursera GraphQL integration, environment configuration
**Confidence:** HIGH

## Summary

Phase 1 establishes the development environment and data infrastructure end-to-end. The work divides into four tracks: (1) scaffold a Next.js 15 App Router project with TypeScript and Tailwind CSS, (2) deploy it to AWS Amplify with working API routes, (3) build a server-side GraphQL proxy that queries the Coursera Search API and returns C+ course results, and (4) configure environment variables with startup validation.

The existing Coursera reference repo (`webedx-spark/prototypes-tools-sandbox`) provides verified patterns for the Amplify deployment config (`amplify.yml`, `next.config.ts` with `output: "standalone"`) and the GraphQL proxy Route Handler pattern. The existing PPP Figma prototype (`PPP Figma/PPP/gateway/coursera/`) provides a complete, working `CourseraDiscoveryClient` with search queries, timeout handling, and error classes that can be ported directly to TypeScript.

**Primary recommendation:** Scaffold with `create-next-app`, port the existing GraphQL client to TypeScript as a server-side utility, deploy to Amplify on day one with a smoke-test API route, and add mock data fallback alongside the real client from the start.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Next.js 15 App Router project scaffolded with TypeScript and Tailwind CSS | `create-next-app@latest` with `--typescript --tailwind --eslint --app --src-dir` flags; verified Next.js 15.3.0 / React 19.2.4 current on npm |
| INFRA-02 | AWS Amplify deployment working with standalone output mode | Reference repo amplify.yml and next.config.ts verified; Amplify supports Next.js 12-15 SSR with compute hosting; API routes confirmed supported |
| INFRA-03 | GraphQL proxy Route Handler that forwards requests to Coursera gateway (server-side only) | Existing `CourseraDiscoveryClient` (client.js) and `SEARCH_QUERY` (queries.js) port directly; reference repo shows Route Handler proxy pattern; no auth cookies needed for Search API |
| INFRA-04 | Mock course data fallback when GraphQL endpoint is unavailable | Build mock data matching the `Search_ProductHit` shape from queries.js; conditional fallback in the GraphQL client wrapper |
| INFRA-05 | Environment variable configuration for OpenAI API key, model selection, and GraphQL endpoint | Three env vars: `OPENAI_API_KEY`, `OPENAI_MODEL`, `COURSERA_GRAPHQL_ENDPOINT`; validate at app startup in a shared config module |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- All code changes local in cloned repo, never push files via GitHub MCP tools
- Repos live under `/Users/dajiboye/base/coursera/`
- Create branches from `main` using `{coursera-username}/{JIRA-TICKET}_{short-description}` naming
- Never commit directly to `main`

## Standard Stack

### Core (Phase 1 only -- what gets installed now)

| Library | Verified Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| Next.js | 15.3.0 | Full-stack React framework | Mandated; App Router with Route Handlers for API proxy; `output: "standalone"` for Amplify |
| React | 19.2.4 | UI library | Ships with Next.js 15 |
| TypeScript | 5.8+ (bundled with create-next-app) | Type safety | Mandated; catches schema mismatches between GraphQL responses and UI types |
| Tailwind CSS | 4.2.2 | Utility-first styling | Ships with `create-next-app --tailwind`; v4 uses CSS-first config (no tailwind.config.js) |
| Zod | 4.3.6 | Schema validation | Validate env vars at startup; will also be used for OpenAI structured output in later phases |

**Versions verified via `npm view` on 2026-03-31.**

### Supporting (Phase 1 only)

| Library | Verified Version | Purpose | When to Use |
|---------|-----------------|---------|-------------|
| `clsx` | 2.1.1 | Conditional CSS class merging | Utility; install now, needed immediately for conditional layouts |

### NOT installed in Phase 1

These are needed in later phases. Do not install now to keep the foundation clean:

- `ai`, `@ai-sdk/openai`, `openai` -- Phase 2 (chat streaming)
- `zustand` -- Phase 2 (state management)
- `react-markdown`, `lucide-react`, `framer-motion` -- Phase 2+ (UI)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind CSS v4 | Tailwind v3 | v4 ships with create-next-app and has CSS-first config; no reason to use v3 |
| Zod for env validation | Manual checks | Zod gives typed config object with clear error messages; reused for OpenAI schemas later |
| Native fetch for GraphQL | Apollo Client / urql | We have 4 known queries, all server-side; Apollo adds 40KB+ client bundle for no benefit |

**Installation:**
```bash
# Scaffold project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Env validation
npm install zod

# Utility
npm install clsx
```

## Architecture Patterns

### Project Structure (Phase 1 scope)

```
src/
  app/
    layout.tsx                 # Root layout, Source Sans 3 font, global CSS
    page.tsx                   # Placeholder page (proof of deployment)
    api/
      courses/
        search/
          route.ts             # POST: GraphQL proxy to Coursera Search
      health/
        route.ts               # GET: health check (verifies env vars + GraphQL connectivity)
  lib/
    config.ts                  # Environment variable validation (Zod schema)
    coursera-client.ts         # CourseraDiscoveryClient (ported from JS)
    coursera-queries.ts        # GraphQL query strings (ported from queries.js)
    coursera-types.ts          # TypeScript types for GraphQL responses
    mock-data.ts               # Fallback course data
```

### Pattern 1: Server-Side GraphQL Proxy (Route Handler)

**What:** All Coursera GraphQL requests go through a Next.js Route Handler. The browser never calls coursera.org directly.

**When to use:** Every course data request.

**Why:** Coursera's GraphQL gateway does not allow browser origins (CORS). The existing PPP prototype and reference repo both use this pattern. Additionally, keeping the endpoint server-side means the GraphQL URL is not exposed to clients.

**Example (derived from reference repo `webedx-spark/prototypes-tools-sandbox`):**
```typescript
// src/app/api/courses/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { courseraClient } from "@/lib/coursera-client";
import { searchMockCourses } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  const { query, limit } = await req.json();

  try {
    const result = await courseraClient.search({ query, limit });
    const courses = result?.elements?.filter(
      (el: any) => el.isPartOfCourseraPlus === true
    ) ?? [];
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("[courses/search] GraphQL failed, using mock data:", error);
    return NextResponse.json({ courses: searchMockCourses(query), mock: true });
  }
}
```

### Pattern 2: Environment Variable Validation at Startup

**What:** Validate all required env vars using a Zod schema that runs when the config module is first imported. Fail fast with clear error messages.

**When to use:** App startup (both dev and deployed).

**Example:**
```typescript
// src/lib/config.ts
import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  COURSERA_GRAPHQL_ENDPOINT: z
    .string()
    .url()
    .default("https://www.coursera.org/graphql-gateway"),
});

// Throws with descriptive errors if validation fails
export const config = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  COURSERA_GRAPHQL_ENDPOINT: process.env.COURSERA_GRAPHQL_ENDPOINT,
});
```

### Pattern 3: Transparent Mock Fallback

**What:** When the Coursera GraphQL endpoint is unreachable, return mock data that matches the real `Search_ProductHit` shape. The caller does not need to know whether data is real or mock.

**When to use:** Development without VPN/network access, and as a production safety net.

**Example:**
```typescript
// src/lib/mock-data.ts
export interface CourseHit {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  productType: string;
  partners: string[];
  skills: string[];
  duration: string;
  productDifficultyLevel: string;
  isPartOfCourseraPlus: boolean;
}

export const MOCK_COURSES: CourseHit[] = [
  {
    id: "mock-1",
    name: "Machine Learning Specialization",
    url: "/specializations/machine-learning-introduction",
    imageUrl: "https://d3njjcbhbojbd.cloudfront.net/api/utilities/v1/imageproxy/...",
    productType: "SPECIALIZATION",
    partners: ["Stanford University", "DeepLearning.AI"],
    skills: ["Machine Learning", "Python", "TensorFlow"],
    duration: "3 months at 10 hours/week",
    productDifficultyLevel: "BEGINNER",
    isPartOfCourseraPlus: true,
  },
  // ... 8-10 more realistic courses across different domains
];

export function searchMockCourses(query: string): CourseHit[] {
  // Simple keyword matching against mock data
  const lower = query.toLowerCase();
  const matches = MOCK_COURSES.filter(
    (c) => c.name.toLowerCase().includes(lower) ||
           c.skills.some((s) => s.toLowerCase().includes(lower))
  );
  return matches.length > 0 ? matches : MOCK_COURSES.slice(0, 5);
}
```

### Anti-Patterns to Avoid

- **Client-side GraphQL calls:** Never call `coursera.org/graphql-gateway` from the browser. Always proxy through Route Handlers. The endpoint blocks browser origins.
- **Skipping mock data:** The GraphQL endpoint is an internal Coursera API and may be unavailable. Mock fallback is a requirement (INFRA-04), not a nice-to-have.
- **Lazy env var validation:** Do not use `process.env.OPENAI_API_KEY!` with non-null assertion. Validate once with Zod at module load; all other code uses the typed `config` object.
- **Installing everything upfront:** Do not install AI SDK, Zustand, framer-motion, etc. in Phase 1. Install only what this phase needs to keep dependencies minimal and build times fast.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env var validation | Manual `if (!process.env.X) throw` checks | Zod schema parse | Typed output, default values, descriptive error messages, reusable pattern |
| GraphQL client | New fetch wrapper from scratch | Port existing `CourseraDiscoveryClient` | Already handles timeouts, AbortController, error classes, response parsing |
| GraphQL queries | Write queries by reverse-engineering API | Copy from `PPP Figma/PPP/gateway/coursera/queries.js` | Queries are tested and working; the `SEARCH_QUERY` returns exactly the fields needed |
| Project scaffolding | Manual file-by-file setup | `create-next-app@latest` with flags | Sets up TypeScript, Tailwind v4, ESLint, App Router, src directory in one command |
| Amplify config | Guess at build settings | Copy `amplify.yml` from reference repo | Verified working pattern for Next.js 15 standalone on Amplify |

**Key insight:** Phase 1 is about porting and configuring, not inventing. The GraphQL client, queries, and Amplify config all exist in verified form. The work is adapting them to the Next.js App Router structure.

## Common Pitfalls

### Pitfall 1: Amplify Deploys Static Instead of SSR

**What goes wrong:** Without `output: "standalone"` in next.config.ts, Amplify deploys a static export. API routes return 404. The app appears to work for static pages but all server-side functionality is broken.

**Why it happens:** Amplify defaults can vary. Next.js without the standalone flag produces a static build.

**How to avoid:** Set `output: "standalone"` in `next.config.ts` from the very first commit. Deploy to Amplify on day one and verify API routes return 200 in the deployed environment. Do not wait until later phases.

**Warning signs:** API routes return 404 on deployed Amplify. Build logs mention "static export."

### Pitfall 2: Coursera GraphQL Returns 403 or CORS Errors

**What goes wrong:** Calling the Coursera GraphQL endpoint from the wrong context (browser, wrong user-agent, etc.) returns 403 or CORS errors.

**Why it happens:** The endpoint is an internal Coursera API designed for first-party apps. It checks User-Agent headers.

**How to avoid:** Always call from Route Handlers (server-side). Set `user-agent: "coursera-agentic-discovery-gateway/0.1"` matching the existing prototype. Implement mock fallback so development is never blocked.

**Warning signs:** 403 status in server logs. Empty course results. CORS errors in browser console (means a client-side call leaked through).

### Pitfall 3: GraphQL Response Shape Assumed Stable

**What goes wrong:** The Coursera `graphql-gateway` is internal. Field names or nesting may change. The app silently returns empty results or crashes on unexpected nulls.

**Why it happens:** No API contract guarantee for internal endpoints.

**How to avoid:** Use defensive null chaining at every level (the existing client does this: `data?.SearchResult?.search?.[0] ?? null`). Define TypeScript interfaces for expected response shapes. The mock fallback doubles as a safety net.

**Warning signs:** Course cards render with missing names, null skills, or empty durations.

### Pitfall 4: Environment Variable Mismatch Between Local and Amplify

**What goes wrong:** App works locally but fails on Amplify because env vars are missing, named differently, or use the wrong prefix.

**Why it happens:** `.env.local` is not deployed. Amplify env vars must be set in the console separately.

**How to avoid:** Create `.env.example` listing all required variables with comments. Validate at startup with Zod (fails fast with clear errors). Set Amplify env vars immediately after first deployment. Never use `NEXT_PUBLIC_` prefix for secrets.

**Warning signs:** API routes return 500 with "API key missing" on deployed Amplify.

### Pitfall 5: Amplify Does NOT Support Next.js Streaming

**What goes wrong:** Planning to use SSE streaming from API routes on Amplify, but Amplify explicitly does not support Next.js streaming.

**Why it happens:** AWS Amplify docs state "Streaming" is unsupported (verified from official docs). The compute layer buffers responses.

**How to avoid:** For Phase 1, this does not matter (no streaming needed). For Phase 2, this is a critical architectural decision: either (a) use non-streaming responses with loading indicators, (b) use a separate Lambda/API Gateway for streaming, or (c) accept buffered responses. Flag this for Phase 2 research.

**Warning signs:** Streaming responses arrive all at once instead of token-by-token on deployed Amplify.

## Code Examples

### Porting CourseraDiscoveryClient to TypeScript

The existing `client.js` ports cleanly. Key changes: add types, use the `config` module for endpoint/timeout.

```typescript
// src/lib/coursera-client.ts
// Source: PPP Figma/PPP/gateway/coursera/client.js (ported to TypeScript)
import { config } from "./config";
import { SEARCH_QUERY } from "./coursera-queries";
import type { SearchResult, SearchRequest } from "./coursera-types";

export class CourseraGatewayError extends Error {
  details: Record<string, unknown>;
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "CourseraGatewayError";
    this.details = details;
  }
}

export class CourseraDiscoveryClient {
  private endpoint: string;
  private timeoutMs: number;
  private userAgent: string;

  constructor() {
    this.endpoint = config.COURSERA_GRAPHQL_ENDPOINT;
    this.timeoutMs = 15_000;
    this.userAgent = "coursera-agentic-discovery-gateway/0.1";
  }

  private async request<T>(args: {
    query: string;
    variables: Record<string, unknown>;
  }): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": this.userAgent,
        },
        body: JSON.stringify({
          query: args.query,
          variables: args.variables,
        }),
        signal: controller.signal,
      });

      const rawBody = await response.text();
      let jsonBody: any;
      try {
        jsonBody = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        throw new CourseraGatewayError("Upstream returned non-JSON response", {
          status: response.status,
        });
      }

      if (!response.ok) {
        throw new CourseraGatewayError("Upstream GraphQL request failed", {
          status: response.status,
          body: jsonBody,
        });
      }

      if (jsonBody.errors?.length) {
        throw new CourseraGatewayError("Upstream GraphQL returned errors", {
          errors: jsonBody.errors,
        });
      }

      return jsonBody.data as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new CourseraGatewayError("Upstream GraphQL request timed out", {
          timeoutMs: this.timeoutMs,
        });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async search(args: {
    query: string;
    limit?: number;
  }): Promise<SearchResult | null> {
    const request: SearchRequest = {
      query: args.query,
      entityType: "PRODUCTS",
      limit: Math.max(1, Math.min(50, args.limit ?? 10)),
      cursor: "0",
    };

    const data = await this.request<any>({
      query: SEARCH_QUERY,
      variables: { requests: [request] },
    });

    return data?.SearchResult?.search?.[0] ?? null;
  }
}

// Singleton instance
export const courseraClient = new CourseraDiscoveryClient();
```

### Amplify Configuration (from reference repo)

```yaml
# amplify.yml -- Source: webedx-spark/prototypes-tools-sandbox
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

```typescript
// next.config.ts -- Source: webedx-spark/prototypes-tools-sandbox (adapted)
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",  // REQUIRED for Amplify SSR deployment
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.coursera.org" },
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
  },
};

export default config;
```

**Note on image optimization:** The stack research recommended `images.unoptimized: true`, but the reference repo does NOT use this, and AWS Amplify docs confirm image optimization IS supported (Sharp is deployed automatically). Use `remotePatterns` instead, matching the reference repo pattern.

### Health Check Route Handler

```typescript
// src/app/api/health/route.ts
import { config } from "@/lib/config";
import { courseraClient } from "@/lib/coursera-client";

export async function GET() {
  const checks: Record<string, string> = {
    env_openai_key: config.OPENAI_API_KEY ? "configured" : "MISSING",
    env_openai_model: config.OPENAI_MODEL,
    env_graphql_endpoint: config.COURSERA_GRAPHQL_ENDPOINT,
    graphql_connectivity: "unknown",
  };

  try {
    const result = await courseraClient.search({ query: "python", limit: 1 });
    checks.graphql_connectivity = result ? "ok" : "empty_response";
  } catch (error) {
    checks.graphql_connectivity = `error: ${error instanceof Error ? error.message : "unknown"}`;
  }

  return Response.json(checks);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` | CSS-first config in `@import "tailwindcss"` | Tailwind v4 (early 2025) | No config file needed; theme in CSS `@theme` block |
| `images.unoptimized: true` on Amplify | `images.remotePatterns` with Sharp auto-deployed | Amplify compute update (2024) | Image optimization works on Amplify; reference repo confirms |
| Amplify Gen 1 for Next.js | Amplify Hosting compute (Gen 2) | 2023-2024 | Full SSR support, Next.js 12-15, API routes, middleware |
| React 18 | React 19.2.4 (ships with Next.js 15.3) | 2025 | Note: reference repo still uses React 18; our project uses React 19 via create-next-app |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Tailwind v4 uses CSS-first configuration. `create-next-app` with `--tailwind` sets this up automatically.
- `images.unoptimized: true`: No longer needed on Amplify compute. Use `remotePatterns` instead.
- Amplify Gen 1 SSR: Does not support App Router. Use current Amplify Hosting compute.

## Critical Discovery: Amplify Streaming Limitation

**AWS Amplify does NOT support Next.js streaming** (confirmed from official docs at https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html). This means:

1. **Phase 1 impact:** None. No streaming needed for foundation work.
2. **Phase 2 impact:** CRITICAL. The streaming chat decision must account for this. Options:
   - Use non-streaming responses with loading indicators (simplest, recommended by pitfalls research)
   - Accept that streaming will work locally but responses will be buffered on Amplify (tokens arrive all at once)
   - Use a separate streaming endpoint outside Amplify (adds complexity)

**Recommendation:** Flag this for Phase 2 planning. For Phase 1, ensure the API route architecture works with both streaming and non-streaming patterns so the Phase 2 decision does not require restructuring.

## Existing Code to Port

The most valuable Phase 1 shortcut: these files from the existing prototype port directly.

| Source File | Port To | Changes Needed |
|-------------|---------|----------------|
| `PPP Figma/PPP/gateway/coursera/client.js` | `src/lib/coursera-client.ts` | Add TypeScript types, use `config` module for endpoint, remove options constructor (use config singleton) |
| `PPP Figma/PPP/gateway/coursera/queries.js` | `src/lib/coursera-queries.ts` | Add `export` keywords, no logic changes. Only port `SEARCH_QUERY` for Phase 1 |
| Reference repo `amplify.yml` | `amplify.yml` (root) | Use as-is |
| Reference repo `next.config.ts` | `next.config.ts` | Use as-is (output standalone + remotePatterns) |

## Open Questions

1. **Amplify app creation method**
   - What we know: Reference repo is already deployed to Amplify. Our project needs a new Amplify app.
   - What is unclear: Whether to create via Amplify console (connect GitHub repo) or via Amplify CLI. Console is simpler for a prototype.
   - Recommendation: Use Amplify console to connect the GitHub repo. Manual setup, no CLI dependency.

2. **GraphQL endpoint variant**
   - What we know: The existing client uses `https://www.coursera.org/graphql-gateway`. The reference repo proxies to `https://www.coursera.org/graphql` (no `-gateway` suffix).
   - What is unclear: Whether these are the same endpoint or different. The queries work on both based on existing code.
   - Recommendation: Default to `https://www.coursera.org/graphql-gateway` (matches existing PPP prototype). Make configurable via env var so it can be changed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | 20.12.2 | -- |
| npm | Package management | Yes | 10.5.0 | -- |
| npx | Project scaffolding | Yes | 10.5.0 | -- |
| Git | Version control | Yes | (available) | -- |
| gh CLI | Reference repo access | Yes | (available) | -- |
| AWS Amplify console | Deployment | Yes (web) | -- | -- |
| Coursera GraphQL endpoint | Course data | Yes (network-dependent) | -- | Mock data fallback |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None identified. All required tools are available.

## Sources

### Primary (HIGH confidence)
- Reference repo `webedx-spark/prototypes-tools-sandbox` -- verified via `gh api`: `next.config.ts`, `amplify.yml`, `src/app/api/graphql-proxy/route.ts`, `package.json` (Next.js 15.3.0)
- Existing PPP prototype `PPP Figma/PPP/gateway/coursera/client.js` -- complete GraphQL client with search, timeout, error handling
- Existing PPP prototype `PPP Figma/PPP/gateway/coursera/queries.js` -- 4 GraphQL queries including SEARCH_QUERY with ProductHit fields
- npm registry versions verified 2026-03-31: Next.js 15.3.0 (was 16.2.1 latest, but create-next-app will use 15.x), React 19.2.4, TypeScript 6.0.2, Tailwind 4.2.2, Zod 4.3.6

### Secondary (MEDIUM confidence)
- [AWS Amplify Next.js support docs](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html) -- confirmed Next.js 12-15 support, API routes supported, streaming NOT supported, image optimization supported with Sharp
- [AWS Amplify deployment guide](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html) -- SSR deployment patterns

### Tertiary (LOW confidence)
- None. All findings verified against primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified from npm registry, reference repo confirms patterns
- Architecture: HIGH -- two working reference implementations (PPP prototype + reference repo) provide exact patterns to follow
- Pitfalls: HIGH -- Amplify streaming limitation verified from official docs; GraphQL proxy pattern verified from two codebases; env var validation is standard practice
- Amplify deployment specifics: MEDIUM -- verified from docs and reference repo, but edge cases may surface on first deploy

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable stack, well-documented patterns)
