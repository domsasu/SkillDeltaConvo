---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [next.js, typescript, tailwind, amplify, zod, env-validation]

# Dependency graph
requires: []
provides:
  - "Next.js 15 App Router project with TypeScript and Tailwind CSS v4"
  - "AWS Amplify deployment config with standalone output mode"
  - "Zod-validated environment configuration (OPENAI_API_KEY, OPENAI_MODEL, COURSERA_GRAPHQL_ENDPOINT)"
  - ".env.example documenting all required/optional env vars"
affects: [01-02, 02-chat, 03-plan-generation]

# Tech tracking
tech-stack:
  added: [next.js 15, react 19, typescript, tailwind-css-v4, zod, clsx, eslint]
  patterns: [amplify-standalone-output, zod-env-validation-at-startup, app-router-src-dir]

key-files:
  created:
    - package.json
    - next.config.ts
    - amplify.yml
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/lib/config.ts
    - .env.example
    - tsconfig.json
    - .gitignore
  modified: []

key-decisions:
  - "Downgraded from Next.js 16 (latest) to 15.x to match project constraints"
  - "Used remotePatterns for image optimization instead of images.unoptimized per research findings"

patterns-established:
  - "Zod env validation: all env vars validated at module load via envSchema.parse(); no process.env access elsewhere"
  - "Amplify config: standalone output mode with .next artifacts and node_modules/cache caching"

requirements-completed: [INFRA-01, INFRA-02, INFRA-05]

# Metrics
duration: 5min
completed: 2026-03-31
---

# Phase 01 Plan 01: Project Scaffolding Summary

**Next.js 15 project with Tailwind CSS v4, Amplify standalone deployment config, and Zod-validated env configuration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-31T17:02:00Z
- **Completed:** 2026-03-31T17:07:00Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Next.js 15 App Router project scaffolded with TypeScript, Tailwind CSS v4, ESLint, Zod, and clsx
- Amplify deployment config with standalone output mode for SSR support
- Zod-validated environment configuration module exporting typed config object with fail-fast validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project with TypeScript, Tailwind CSS, and Amplify config** - `c466700` (feat)
2. **Task 2: Create Zod-validated environment configuration module** - `b9d3235` (feat)

## Files Created/Modified
- `package.json` - Next.js 15 project with TypeScript, Tailwind CSS, Zod, clsx
- `next.config.ts` - Standalone output mode for Amplify SSR with coursera.org image remotePatterns
- `amplify.yml` - Amplify build config: npm ci, npm run build, .next artifacts
- `src/app/layout.tsx` - Root layout with Geist fonts and global CSS
- `src/app/page.tsx` - Simple placeholder confirming app is running
- `src/lib/config.ts` - Zod-validated environment config exporting typed config and AppConfig type
- `.env.example` - Documents OPENAI_API_KEY (required), OPENAI_MODEL, COURSERA_GRAPHQL_ENDPOINT (optional with defaults)
- `.gitignore` - Excludes .env*.local, node_modules, .next, build artifacts
- `tsconfig.json` - TypeScript config with @/* import alias
- `eslint.config.mjs` - ESLint flat config with Next.js rules
- `postcss.config.mjs` - PostCSS config for Tailwind CSS v4

## Decisions Made
- Downgraded from Next.js 16.2.1 (create-next-app latest) to Next.js 15.x to match the project constraint "Next.js 15 (App Router, TypeScript)"
- Used `images.remotePatterns` instead of `images.unoptimized: true` per research finding that Amplify compute now supports Sharp-based image optimization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded in temp directory due to existing files**
- **Found during:** Task 1 (create-next-app scaffold)
- **Issue:** create-next-app refused to run in the project directory because .planning/ and CLAUDE.md already existed
- **Fix:** Scaffolded in /tmp/ppp-scaffold and used rsync to copy files, preserving existing .planning/ and CLAUDE.md
- **Files modified:** None extra
- **Verification:** All scaffolded files present, npm run build succeeds

**2. [Rule 1 - Bug] Downgraded Next.js 16 to 15**
- **Found during:** Task 1 (post-scaffold version check)
- **Issue:** create-next-app@latest installed Next.js 16.2.1 but project constraint requires Next.js 15
- **Fix:** Ran `npm install next@15 react@19 react-dom@19` and `npm install --save-dev eslint-config-next@15`
- **Files modified:** package.json, package-lock.json
- **Verification:** package.json shows next ^15.5.14, build succeeds

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required. .env.local is pre-configured with placeholder values.

## Next Phase Readiness
- Project builds and is ready for Plan 02 (GraphQL client, mock data, API routes)
- Amplify deployment can be configured via AWS console by connecting the GitHub repo
- Streaming limitation on Amplify flagged for Phase 2 planning

## Self-Check: PASSED

All created files verified present. Both task commits (c466700, b9d3235) verified in git log. No stubs detected.

---
*Phase: 01-foundation*
*Completed: 2026-03-31*
