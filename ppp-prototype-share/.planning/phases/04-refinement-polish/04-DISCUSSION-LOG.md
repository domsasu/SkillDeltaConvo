# Phase 4: Refinement & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 04-refinement-polish
**Areas discussed:** Refinement interaction model, Delete & alternatives UX, Refinement pills design, Plan regeneration scope

---

## Refinement Interaction Model

### How should users trigger plan refinements?

| Option | Description | Selected |
|--------|-------------|----------|
| Chat + card menus | Users can ask in chat AND use MoreHorizontal menus on course cards for direct actions. Chat handles broad changes, menus handle course-level actions. | ✓ |
| Chat only | All refinement through conversation. MoreHorizontal icons become decorative. | |
| Card menus only | Direct manipulation on plan cards for all changes. Chat stays informational. | |

**User's choice:** Chat + card menus
**Notes:** Dual model — chat for broad refinements, card menus for direct actions

### When a refinement produces a new plan, how should it replace the current one?

| Option | Description | Selected |
|--------|-------------|----------|
| Instant swap | New plan replaces old immediately with fade-in animation. No comparison needed. | ✓ |
| Diff highlight | Changed milestones/courses highlighted (green border added, strikethrough removed). | |
| Side-by-side | Show old and new plan briefly for comparison before user confirms. | |

**User's choice:** Instant swap
**Notes:** None

### Should the AI acknowledge what changed after a refinement?

| Option | Description | Selected |
|--------|-------------|----------|
| Brief summary | AI says 1-2 sentences about what changed. | ✓ |
| Detailed changelog | AI lists every change. | |
| No summary | AI just says "Here's your updated plan." | |

**User's choice:** Brief summary
**Notes:** None

---

## Delete & Alternatives UX

### How should the delete course action work?

| Option | Description | Selected |
|--------|-------------|----------|
| X icon on hover | X button appears on hover, click removes immediately. | |
| MoreHorizontal menu → Delete | Click existing MoreHorizontal icon to open dropdown with Delete option. | ✓ |
| Swipe / drag to delete | Swipe gesture reveals delete action. | |

**User's choice:** MoreHorizontal menu → Delete
**Notes:** None

### When a course is deleted, what happens?

| Option | Description | Selected |
|--------|-------------|----------|
| Remove course, keep milestone | Course disappears. Empty milestone shows empty state. | |
| Auto-suggest replacement | After deleting, AI automatically suggests 1-2 replacement courses in chat. | ✓ |
| Remove + collapse empty milestone | Course removed. Empty milestone collapses/hides. | |

**User's choice:** Auto-suggest replacement
**Notes:** None

### How should 'explore alternatives' work?

| Option | Description | Selected |
|--------|-------------|----------|
| MoreHorizontal → 'Explore alternatives' | Dropdown option → AI responds in chat with 2-3 alternatives. | |
| Inline expansion | Click triggers 2-3 compact alternative cards below the current course. | ✓ |
| Chat pill trigger | Pill appears in chat, user clicks, AI suggests in conversation. | |

**User's choice:** Inline expansion
**Notes:** None

### What should the inline alternatives look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Compact cards below | 2-3 smaller course cards with Swap button. Keep original option to dismiss. | ✓ |
| Full-size cards below | Same-size cards as original. Consistent but uses more space. | |

**User's choice:** Compact cards with essential info
**Notes:** User specified: "Can we try compact cards but try show necessary information about the course similar to the full size cards" — compact layout but retaining name, partner, duration, skills, product type.

---

## Refinement Pills Design

### Should refinement pills be static or AI-generated?

| Option | Description | Selected |
|--------|-------------|----------|
| AI-generated | AI generates 3-4 contextual pills based on the plan. | |
| Static set | Fixed list always the same regardless of plan. | |
| Hybrid | 2 static + 2 AI-generated contextual pills. | ✓ |

**User's choice:** Hybrid
**Notes:** Static: "Shorten timeline", "Add hands-on projects". AI-generated: context-aware based on plan.

### Where should refinement pills appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Below last AI message in chat | Pills in chat panel below plan summary message. | ✓ |
| Top of plan panel | Row above plan banner in left panel. | |
| Both panels | Pills in chat AND quick actions bar on plan panel. | |

**User's choice:** Below last AI message in chat
**Notes:** Consistent with existing pill placement pattern

---

## Plan Regeneration Scope

### How much should regenerate when user adjusts goals/timeline?

| Option | Description | Selected |
|--------|-------------|----------|
| Full regeneration | Entire plan regenerates from scratch with updated context. | ✓ |
| Targeted regeneration | Only affected milestones regenerate. | |
| Incremental patching | AI modifies existing plan in place. | |

**User's choice:** Full regeneration
**Notes:** Reuses existing plan generation flow

### Should current plan context be passed during regeneration?

| Option | Description | Selected |
|--------|-------------|----------|
| Pass plan summary | Include milestone names and course names so AI can preserve what worked. | ✓ |
| Pass full plan | Serialize entire LearningPlan object. | |
| Fresh generation | Don't pass current plan at all. | |

**User's choice:** Pass plan summary
**Notes:** Lightweight context, not full serialization

### Should delete/swap trigger regeneration or just update client state?

| Option | Description | Selected |
|--------|-------------|----------|
| Client-only for delete/swap | Delete/swap update plan state instantly. Only chat refinements trigger AI. | ✓ |
| Always regenerate | Every change triggers full regeneration. | |

**User's choice:** Client-only for delete/swap
**Notes:** Instant for direct actions, AI-powered for chat refinements

---

## Claude's Discretion

- Dropdown menu styling and animation
- Plan summary serialization format for regeneration
- Auto-suggest replacement implementation details
- Compact alternative card layout specifics

## Deferred Ideas

None — discussion stayed within phase scope
