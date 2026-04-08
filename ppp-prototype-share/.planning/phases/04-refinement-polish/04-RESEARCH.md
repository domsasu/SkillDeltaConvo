# Phase 4: Refinement & Polish - Research

**Researched:** 2026-04-02
**Domain:** Conversational plan refinement, direct manipulation UI, streaming plan updates
**Confidence:** HIGH

## Summary

Phase 4 adds plan refinement capabilities to the PPP prototype through two interaction channels: (1) chat-based broad refinements (goal changes, timeline adjustments) that trigger full plan regeneration, and (2) direct UI actions on course cards (remove, explore alternatives) that trigger targeted AI-assisted replacements. The existing codebase provides nearly all the infrastructure needed -- the `CourseEditMenu` dropdown is fully styled, `data-learning-plan` data parts already flow from server to client with `setPlan()`, and the tool calling pipeline (`search_courses` + `build_learning_plan`) is proven.

The primary technical challenges are: (1) modifying the phase state machine guards in `app-shell.tsx` to allow chat interaction during `plan_generated` phase without breaking the existing conversation flow, (2) threading `onSend` and plan mutation callbacks from AppShell through LihpPage to the plan banner's ExpandedCourseRow components, and (3) extending the system prompt with refinement-specific instructions while keeping the plan regeneration pipeline (`searchResultsCache`, `build_learning_plan` tool) working for updates.

**Primary recommendation:** Layer refinement on top of existing patterns -- same data parts, same tool pipeline, same `setPlan()` flow. The core work is callback threading + state machine adjustments + system prompt extension, not new infrastructure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dual interaction model -- chat for broad refinements AND dropdown menus on course cards for direct actions (Remove, Explore alternatives). Dropdown triggers from pencil/edit icon on hover.
- **D-02:** Modified plan replaces current plan instantly (same `setPlan()` pattern) with fade-in animation. No diff view. Green checkmark "Updated learning plan" indicator in chat after plan updates.
- **D-03:** AI provides 1-2 sentence summary of what changed after any refinement, with "Why this recommendation?" section when suggesting alternatives. AI explains reasoning with bullet points.
- **D-04:** Both "Remove" and "Explore alternatives" in edit dropdown on each course row. Dropdown is white with rounded-xl, shadow, positioned below/above based on viewport.
- **D-05:** After removing a course, grey shimmer/placeholder row appears in its place while AI searches for alternatives. AI suggests replacement in chat with reasoning. Plan auto-updates when replacement found.
- **D-06:** "Explore alternatives" triggers chat-based flow (NOT inline expansion). User clicks -> pill/message in chat -> AI responds with recommendation + reasoning -> plan auto-updates.
- **D-07:** REMOVED -- no compact alternative cards. Alternatives flow entirely through chat.
- **D-08:** Hybrid pills -- 2 static pills + 2 AI-generated contextual pills. Static: "Shorten timeline", "Add hands-on projects". AI pills are context-aware.
- **D-09:** Refinement pills appear in chat panel below AI's plan summary message. Follows existing pill placement pattern.
- **D-10:** Full plan regeneration for chat-based refinements. Reuses existing plan generation flow (search_courses + build_learning_plan tools).
- **D-11:** Current plan summary (milestone names, course names) passed to AI during regeneration so it can preserve what worked.
- **D-12:** Remove triggers shimmer placeholder + AI replacement suggestion (server round-trip). Explore alternatives also goes through chat/AI. Broad chat refinements trigger full regeneration.

### Claude's Discretion
- Shimmer/placeholder animation style for removed course slots
- How plan summary is serialized for regeneration context (compact format in system prompt or injected as user message)
- "Updated learning plan" indicator implementation (inline in chat or as data part)
- AI message toolbar (thumbs up/down, copy, refresh) -- implement if time allows, defer if not

### Deferred Ideas (OUT OF SCOPE)
- AI message toolbar (thumbs up/down, copy, refresh, more) -- nice to have but not core refinement
- "Compare selected courses" action -- beyond REFN-01 to REFN-04 scope
- Course expand/collapse chevrons on individual course rows
- Voice input (microphone icon in chat input)
- "+" button in chat input
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REFN-01 | Conversational refinement -- user can adjust goals, background, constraints via chat to regenerate plan | Phase state machine modification to allow chat in `plan_generated`, system prompt extension for refinement instructions, plan context serialization (D-10, D-11) |
| REFN-02 | Delete a course from plan via direct UX interaction | Wire `CourseEditMenu` onRemove handler, shimmer placeholder state, programmatic chat message for AI replacement (D-04, D-05, D-12) |
| REFN-03 | Explore alternative courses for any course in the plan | Wire `CourseEditMenu` onExploreAlternatives handler, programmatic chat message, AI recommendation with reasoning in chat (D-04, D-06) |
| REFN-04 | Refinement prompt pills after plan generation | Hybrid static + AI-generated pills, pill display in `plan_generated` phase, system prompt pill generation instructions (D-08, D-09) |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | ^6.0.142 | streamText, tool calling, data parts | Already handles plan generation pipeline; same pattern works for refinement |
| @ai-sdk/react | ^3.0.144 | useChat hook, sendMessage | Already manages conversation state; refinement messages flow through same hook |
| @ai-sdk/openai | ^3.0.49 | OpenAI provider | Already configured |
| zod | ^4.3.6 | Schema validation | Already validates plan structure |
| clsx | ^2.1.1 | Conditional CSS classes | Already used throughout |
| lucide-react | ^1.7.0 | Icons | Already used for ChevronDown, edit icons |
| framer-motion | not installed | Animations | Listed in CLAUDE.md stack but NOT installed. Shimmer animation should use CSS keyframes (existing pattern in progressive-plan-module.tsx) |

### No New Dependencies Required
This phase is entirely about wiring existing infrastructure. No new libraries needed. The shimmer animation for removed course placeholders should use CSS `@keyframes` (already established pattern in `progressive-plan-module.tsx` lines 139-142).

## Architecture Patterns

### Component Callback Threading
The primary architectural challenge is threading `onSend` and plan mutation callbacks from AppShell down to course-level components. Current flow stops at ChatSidePanel. New flow needed:

```
AppShell (owns: handleSend, setPlan, plan)
  -> LihpPage (passes: onSend, plan, onRemoveCourse, onExploreAlternatives)
    -> ProgressivePlanModule (passes: plan, onRemoveCourse, onExploreAlternatives)
      -> LearningPlanBanner (passes: plan, onRemoveCourse, onExploreAlternatives)
        -> MilestoneCard (passes: courses, onRemoveCourse, onExploreAlternatives)
          -> ExpandedCourseRow (passes: course, onRemove, onExploreAlternatives)
            -> CourseEditMenu (receives: onRemove, onExploreAlternatives)
```

### Pattern 1: Programmatic Chat Messages from Plan Panel
**What:** When user clicks "Remove" or "Explore alternatives" on a course card, the plan component calls `onSend()` with a structured message that the AI understands as a refinement request.
**When to use:** All direct UI actions on course cards.
**Example:**
```typescript
// In ExpandedCourseRow or a wrapper
const handleRemove = () => {
  onRemoveCourse(course.id, milestone.name); // Update local plan state (shimmer)
  onSend(`[REMOVE] Remove "${course.name}" from "${milestone.name}" and suggest a replacement`);
};

const handleExploreAlternatives = () => {
  onSend(`Explore alternatives for "${course.name}" in "${milestone.name}"`);
};
```

### Pattern 2: Phase State Machine for Refinement
**What:** Allow chat interaction during `plan_generated` phase without resetting gathered info or re-triggering initial plan generation.
**When to use:** All refinement interactions after plan is displayed.
**Example:**
```typescript
// In app-shell.tsx onData handler
if (dataPart.type === "data-conversation-state") {
  setPhase((prev) => {
    // During refinement, allow pill updates but don't reset phase
    if (prev === "plan_generated") {
      // Only update pills, don't touch gathered info or phase
      if (dataPart.data.suggested_pills) {
        setSuggestedPills(dataPart.data.suggested_pills);
      }
      return prev; // Stay in plan_generated
    }
    // ... existing logic for non-plan phases
  });
}
```

### Pattern 3: Shimmer Placeholder for Removed Courses
**What:** When a course is removed, replace its row with a grey shimmer animation while AI finds a replacement.
**When to use:** Course removal (REFN-02).
**Example:**
```typescript
// Track pending removals in LearningPlanBanner or AppShell
const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());

// In ExpandedCourseRow rendering
if (pendingRemovals.has(course.id)) {
  return <ShimmerPlaceholder />;
}

// ShimmerPlaceholder component
function ShimmerPlaceholder() {
  return (
    <div
      className="h-[68px] w-full rounded-lg"
      style={{
        background: "linear-gradient(to right, #f0f6ff, #e3eeff 50%, #f0f6ff)",
        animation: "shimmer 2s ease-in-out infinite",
      }}
    />
  );
}
```

### Pattern 4: Plan Context for Regeneration
**What:** Serialize current plan compactly for the AI to reference during regeneration.
**When to use:** Any refinement that triggers plan update.
**Recommendation (Claude's discretion):** Inject as a user-role message rather than modifying the system prompt. This keeps the system prompt static and lets the AI see the current plan in conversation context.
**Example:**
```typescript
// Before sending refinement message, prepend plan context
const planContext = plan.milestones.map(ms =>
  `${ms.name}: ${ms.courses.map(c => c.name).join(", ")}`
).join("\n");

// The system prompt instructs AI to look for this format
const refinementMessage = `[Current Plan]\n${planContext}\n\n[Request] Shorten the timeline to 3 months`;
```

### Pattern 5: Refinement Pills (Hybrid Static + AI)
**What:** After plan generation, show 2 static + 2 AI-generated refinement pills.
**When to use:** After `data-learning-plan` is received (REFN-04).
**Recommendation (Claude's discretion):** Client-side generates static pills; AI's Step 7 response includes contextual pill suggestions via `suggested_pills` in conversation state. Requires modifying the phase guard to allow pill updates in `plan_generated`.
**Example:**
```typescript
// Static refinement pills
const STATIC_REFINEMENT_PILLS = ["Shorten timeline", "Add hands-on projects"];

// Merge with AI-generated pills
const refinementPills: StructuredPillData = {
  type: "single",
  question: "Refine your plan",
  options: [
    ...STATIC_REFINEMENT_PILLS,
    ...aiGeneratedPills, // from conversation state
    "Something else",
  ],
};
```

### Anti-Patterns to Avoid
- **Duplicating plan state:** Do NOT create a separate "refinement plan" state. Use the same `plan` state and `setPlan()` -- modified plans replace current plan instantly (D-02).
- **Blocking chat during plan phases:** The current phase guard blocks ALL conversation state updates in plan phases. This must be relaxed to allow refinement, but carefully -- don't re-trigger `plan_generating` from conversation state.
- **Re-triggering auto plan generation:** The `planTriggerSent` ref prevents double plan generation. During refinement, the auto-trigger effect (`useEffect` at line 196) must NOT fire. The ref needs proper management.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming plan updates | Custom WebSocket or SSE handler | Existing `data-learning-plan` data part via AI SDK | Already proven, same `writer.write()` pattern works for updates |
| Course search during refinement | New search endpoint | Existing `search_courses` tool in route handler | Same tool, same cache, same pipeline |
| Plan assembly after refinement | Manual plan object construction | Existing `build_learning_plan` tool | Handles dedup, validation, data part emission |
| Shimmer animation | framer-motion or JS animation library | CSS `@keyframes shimmer` | Already exists in `progressive-plan-module.tsx`, zero dependencies |
| Conversation state management | Custom state for refinement | Existing `useChat` hook from AI SDK | Messages, streaming status, abort all managed |

## Common Pitfalls

### Pitfall 1: Phase Guard Breaks Refinement Chat
**What goes wrong:** The current phase guard (app-shell.tsx lines 83-88) ignores ALL `data-conversation-state` updates when in `plan_generated` phase. This means refinement pills never display and gathered info never updates for regeneration context.
**Why it happens:** The guard was designed to prevent conversation state from resetting the plan. But refinement needs selective state updates.
**How to avoid:** Modify the guard to allow `suggested_pills` updates in `plan_generated` while still blocking `ready_for_plan` phase transitions. Use a refinement-aware conditional.
**Warning signs:** Pills don't appear after plan generation; chat seems "frozen" in plan_generated phase.

### Pitfall 2: Auto Plan Trigger Fires During Refinement
**What goes wrong:** When the user sends a refinement message, the `planTriggerSent` ref is already `true` from initial generation. But if it gets reset, the auto-trigger effect could fire "Generate my learning plan" again unexpectedly.
**Why it happens:** The auto-trigger logic (lines 196-205) watches `phase === "plan_generating" && !plan`. During refinement, plan already exists, so `!plan` is false -- this should be safe. But if plan is temporarily set to null during shimmer states, it could trigger.
**How to avoid:** Never set plan to `null` during refinement. For shimmer placeholders, track removed course IDs separately -- don't mutate the plan object. The AI sends a complete new plan via `data-learning-plan`.
**Warning signs:** "Generate my learning plan" appears as a user message during refinement.

### Pitfall 3: Chat Input Not Visible After Plan Generation
**What goes wrong:** After plan generation, the `ChatPanel` shows `ContextualPills` OR `ChatInput` based on `showPills` (chat-panel.tsx line 58-72). If refinement pills are shown, the text input is hidden. User cannot type a freeform refinement.
**Why it happens:** The existing pattern uses an either/or toggle -- pills replace the input.
**How to avoid:** For refinement phase, show BOTH pills and chat input. Or treat refinement pills as dismissible (clicking a pill sends it, then input appears). The existing `pillsDismissed` state handles this -- after selecting a pill, the chat input appears. The "Something else" freeform option in StructuredChoiceCard also works.
**Warning signs:** User wants to type a custom refinement but sees only pill options.

### Pitfall 4: System Prompt Too Long
**What goes wrong:** Adding refinement instructions to the already 178-line system prompt could push it past effective context for the model, leading to instruction-following degradation.
**Why it happens:** GPT-4o and gpt-4.1-mini handle long system prompts well, but there's diminishing returns past ~300 lines.
**How to avoid:** Keep refinement instructions concise (~40-50 lines). Use clear section headers. Consider separating refinement instructions into a conditional block only included when plan already exists (check message history for plan generation).
**Warning signs:** AI ignores refinement instructions or reverts to conversation-phase behavior.

### Pitfall 5: Lost searchResultsCache on Refinement
**What goes wrong:** The `searchResultsCache` Map in route.ts is request-scoped (created fresh per POST). During refinement, previous search results are not available -- the AI must search again.
**Why it happens:** HTTP is stateless; the cache only lives for one request lifecycle.
**How to avoid:** This is actually fine for the design. D-10 says full plan regeneration reuses the search + build pipeline. Each refinement request will do fresh searches. The AI just needs to know what courses are currently in the plan (via plan context in the message) to avoid re-selecting removed courses.
**Warning signs:** None -- this is expected behavior.

## Code Examples

### Wire CourseEditMenu Actions
```typescript
// Updated CourseEditMenu props
interface CourseEditMenuProps {
  onClose: () => void;
  onRemove: () => void;
  onExploreAlternatives: () => void;
  openUp?: boolean;
}

function CourseEditMenu({ onClose, onRemove, onExploreAlternatives, openUp = false }: CourseEditMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className={clsx(
        "absolute right-0 z-20 rounded-xl bg-white py-3 px-2 shadow-[0px_0px_4px_0px_#e8eef7,0px_4px_12px_4px_rgba(54,64,81,0.08)]",
        openUp ? "bottom-full mb-1" : "top-full mt-1",
      )}>
        <button
          onClick={() => { onRemove(); onClose(); }}
          className="flex w-[175px] items-center justify-between rounded p-2 text-sm text-[#0f1114] hover:bg-[#f0f6ff]"
        >
          Remove
          {/* existing trash SVG */}
        </button>
        <button
          onClick={() => { onExploreAlternatives(); onClose(); }}
          className="flex w-[175px] items-center justify-between rounded p-2 text-sm text-[#0f1114] hover:bg-[#f0f6ff]"
        >
          Explore alternatives
          {/* existing refresh SVG */}
        </button>
      </div>
    </>
  );
}
```

### Modified Phase Guard for Refinement
```typescript
// In app-shell.tsx onData handler
if (dataPart.type === "data-conversation-state") {
  const { gathered_info, ready_for_plan, suggested_pills } = dataPart.data;

  setPhase((prev) => {
    // Allow pill updates in plan_generated for refinement
    if (prev === "plan_generated") {
      if (suggested_pills?.options?.length > 0) {
        setSuggestedPills(suggested_pills);
      }
      return prev; // Stay in plan_generated
    }

    // Other plan phases: block completely
    if (prev === "plan_generating" || prev === "viewing_plan") {
      return prev;
    }

    // Conversation phase: existing behavior
    mergeGatheredInfo(gathered_info);
    setSuggestedPills(suggested_pills);
    if (ready_for_plan) return "plan_generating";
    return prev;
  });
}
```

### "Updated Learning Plan" Indicator
```typescript
// Recommendation (Claude's discretion): Use a new data part type
// In route.ts, after emitting data-learning-plan during refinement:
writer.write({
  type: "data-plan-updated",
  data: { message: "Updated learning plan" },
});

// In app-shell.tsx, handle this data part to show a confirmation in chat
// Or simpler: just let the AI's Step 7 text response serve as confirmation
// The AI says "I've updated your plan -- [explanation]" which appears in chat naturally
```

### System Prompt Refinement Section
```typescript
// Append to buildSystemPrompt() return value:
`
## Plan Refinement

When the user has an existing learning plan and asks for changes, you are in refinement mode.

### Detecting Refinement Context
- If the conversation contains a previous plan (you can see build_learning_plan tool results), you are refining.
- Messages starting with "[Current Plan]" contain the current plan summary for context.
- Messages starting with "[REMOVE]" indicate a course was removed via the UI.

### Broad Refinements (goal/timeline/scope changes)
When the user asks to adjust the plan broadly ("shorten to 3 months", "focus more on Python", "add portfolio projects"):
1. Acknowledge the change briefly (1 sentence)
2. Call search_courses 2-3 times with updated queries reflecting the new constraints
3. Call build_learning_plan with the revised milestones
4. After build, confirm what changed in 1-2 sentences

Preserve courses from the current plan that still fit the updated constraints. Only replace courses that conflict with the new direction.

### Course Removal
When you see "[REMOVE] Remove [course] from [milestone]":
1. Search for 1-2 replacement courses in the same skill area
2. Recommend a replacement with reasoning: "I'd suggest **[Course Name]** because..." followed by "**Why this recommendation?**" with bullet points
3. Call build_learning_plan with the updated plan (old course replaced with new)

### Explore Alternatives
When the user asks to explore alternatives for a specific course:
1. Search for 2-3 courses covering similar skills
2. Recommend your top pick with "**Why this recommendation?**" reasoning
3. Call build_learning_plan with the replacement

### Refinement Pills
After any plan update, include suggested_pills with refinement options. Use 4 options: 2 common refinements + 2 context-aware suggestions based on the current plan.
`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI SDK v3 useChat | AI SDK v6 with data parts | 2025 | Data parts enable structured server-to-client communication; used for plan emission |
| Separate state for refinements | Same state + `setPlan()` overwrite | N/A (design decision) | Simpler architecture, no diff/merge logic needed |

## Open Questions

1. **Plan context serialization format**
   - What we know: D-11 says "lightweight context, not full serialization" -- milestone names + course names
   - What's unclear: Whether to inject this as a user message prefix or modify the system prompt dynamically
   - Recommendation: User message prefix is simpler and keeps system prompt static. Format: `[Current Plan]\nMilestone: Course1, Course2\n...`

2. **"Updated learning plan" indicator implementation**
   - What we know: Figma shows green checkmark with "Updated learning plan" text in chat
   - What's unclear: Whether this should be a custom chat message type (data part) or just the AI's natural text response
   - Recommendation: Let the AI's text response serve as the update confirmation. Simpler than a new data part type. If the Figma design requires a specific green checkmark widget, it can be a styled div in the message rendering.

3. **Should the chat input always be visible in plan_generated phase?**
   - What we know: Current ChatPanel toggles between pills and input. Figma shows "Ask about selected courses..." placeholder.
   - What's unclear: Whether both should coexist or if pills should be above the input
   - Recommendation: Show refinement pills as a row above the chat input (not replacing it). This allows freeform refinement alongside quick pill actions. Alternatively, keep the existing either/or pattern since pills are dismissible.

## Sources

### Primary (HIGH confidence)
- Local codebase inspection: `app-shell.tsx`, `route.ts`, `system-prompt.ts`, `learning-plan-banner.tsx`, `lihp-page.tsx`, `chat-panel.tsx`, `plan-types.ts`, `types.ts`, `progressive-plan-module.tsx`, `contextual-pills.tsx`, `structured-choice-card.tsx`, `chat-side-panel.tsx`, `package.json`
- CONTEXT.md decisions (D-01 through D-12) -- locked implementation decisions from Figma review
- REQUIREMENTS.md -- REFN-01 through REFN-04 requirement definitions

### Secondary (MEDIUM confidence)
- Vercel AI SDK v6 data part patterns -- based on existing working implementation in codebase (not verified against latest docs, but code is working)
- System prompt engineering for refinement -- based on established patterns in current `buildSystemPrompt()`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; all libraries already installed and proven in the codebase
- Architecture: HIGH - All patterns derive directly from existing working code; refinement layers on top of proven patterns
- Pitfalls: HIGH - Identified from direct code analysis of phase guards, auto-trigger logic, and component prop threading

**Research date:** 2026-04-02
**Valid until:** 2026-04-16 (prototype deadline is April 15; research covers implementation through deadline)
