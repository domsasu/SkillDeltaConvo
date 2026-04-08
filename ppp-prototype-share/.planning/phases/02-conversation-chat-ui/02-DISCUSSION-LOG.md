# Phase 2: Conversation & Chat UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 02-conversation-chat-ui
**Areas discussed:** Streaming, Chat State, Entry → Chat, Prompt Design

---

## Streaming

| Option | Description | Selected |
|--------|-------------|----------|
| SSE from Route Handler | Server-Sent Events via standard Route Handler POST — works on Amplify compute | ✓ |
| No streaming | Standard request/response, show typing indicator then full response | |
| Client polling | Start generation server-side, client polls for chunks | |

**User's choice:** SSE from Route Handler
**Notes:** Amplify doesn't support Next.js edge streaming but SSE from compute Route Handlers works.

### Follow-up: Library Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel AI SDK | useChat hook handles SSE, message state, streaming render | ✓ |
| Direct OpenAI SDK | Roll your own SSE parsing + state | |
| You decide | Claude picks | |

**User's choice:** Vercel AI SDK

---

## Chat State

| Option | Description | Selected |
|--------|-------------|----------|
| LLM-managed | System prompt instructs AI to track state internally | |
| Explicit phases | Frontend tracks conversation phase via state machine | |
| Hybrid | AI manages flow, returns structured metadata alongside text | ✓ |

**User's choice:** Hybrid

### Follow-up: Plan State Store

| Option | Description | Selected |
|--------|-------------|----------|
| React Context | useContext + useReducer, no external deps | ✓ |
| Zustand | Lightweight external store, ~2KB | |
| You decide | Claude picks | |

**User's choice:** React Context

---

## Entry → Chat

| Option | Description | Selected |
|--------|-------------|----------|
| CSS transition | Same component, CSS grid/flexbox transition, greeting fades | ✓ |
| Instant swap | Simple state toggle, no animation | |
| Scroll reveal | Entry stays at top, chat appears below | |

**User's choice:** CSS transition
**Notes:** Single-page state machine, no route change.

---

## Prompt Design

| Option | Description | Selected |
|--------|-------------|----------|
| Structured | Clear phases with specific questions per phase | ✓ |
| Open-ended | AI decides how to gather info naturally | |
| You decide | Claude designs | |

**User's choice:** Structured

### Follow-up: Turn Count

| Option | Description | Selected |
|--------|-------------|----------|
| 2-3 turns | Fast gathering, respects user testing time | |
| 4-6 turns | More thorough, deeper follow-ups | |
| AI decides | Judges readiness based on info quality | ✓ |

**User's choice:** AI decides
**Notes:** Could be 1 turn with detailed prompt pill or 5 with exploratory user.

---

## Claude's Discretion

- CSS animation timing/easing
- Typing indicator implementation
- Auto-scroll behavior
- Markdown rendering library
- Error retry UX details

## Deferred Ideas

None
