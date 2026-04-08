"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import type {
  AppPhase,
  GatheredInfo,
  ChatUIMessage,
  ConversationStateData,
  StructuredPillData,
  DebugLogEntry,
} from "@/lib/types";
import type { LearningPlan, PlanCourse } from "@/lib/plan-types";
import { conversationStateSchema } from "@/lib/prompts/schemas";
import { EntryScreen } from "@/components/entry/entry-screen";
import { LihpPage } from "@/components/lihp/lihp-page";
import { LihpLoadingScreen } from "@/components/lihp/lihp-loading-screen";

const metadataJsonRegex = /```json\s*(\{[\s\S]*?\})\s*```\s*$/;

function extractMetadataFromText(
  text: string,
): ConversationStateData | null {
  const match = text.match(metadataJsonRegex);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    const result = conversationStateSchema.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function AppShell() {
  const searchParams = useSearchParams();
  const stripQuestions = searchParams.get("stripQuestions") === "true";

  const [phase, setPhaseState] = useState<AppPhase>("entry");
  const phaseRef = useRef<AppPhase>("entry");
  const setPhase = useCallback((next: AppPhase | ((prev: AppPhase) => AppPhase)) => {
    setPhaseState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      phaseRef.current = value;
      return value;
    });
  }, []);
  const [suggestedPills, setSuggestedPills] = useState<StructuredPillData>({ type: "single", question: "", options: [] });
  const [gatheredInfo, setGatheredInfo] = useState<GatheredInfo>({
    goal: null,
    skills: null,
    background: null,
    constraints: null,
  });

  // Merge incoming gathered info — never overwrite non-null with null
  const mergeGatheredInfo = useCallback((incoming: GatheredInfo) => {
    setGatheredInfo((prev) => ({
      goal: incoming.goal ?? prev.goal,
      skills: incoming.skills ?? prev.skills,
      background: incoming.background ?? prev.background,
      constraints: incoming.constraints ?? prev.constraints,
    }));
  }, []);
  const [plan, setPlanState] = useState<LearningPlan | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const [isRefining, setIsRefining] = useState(false);
  const planCountRef = useRef(0); // tracks how many times a plan has been received
  const pillsSuppressed = useRef(false); // true after user signals satisfaction — blocks pill updates
  // Maps message index → indicator type. Accumulates across all plan events.
  const [planIndicators, setPlanIndicators] = useState<Map<number, "created" | "rebuilt" | "swapped">>(new Map());
  // Tracks the latest update type so the useEffect can compute the message index after render
  const [pendingIndicatorType, setPendingIndicatorType] = useState<"created" | "rebuilt" | "swapped" | null>(null);
  const messagesLengthRef = useRef(0); // tracks current messages length for onData
  const [viewingPlan, setViewingPlan] = useState(false);

  const setPlan = setPlanState;

  // Persist plan to localStorage on every change
  useEffect(() => {
    if (plan) {
      try { localStorage.setItem("ppp-learning-plan", JSON.stringify(plan)); } catch {}
    } else {
      try { localStorage.removeItem("ppp-learning-plan"); } catch {}
    }
  }, [plan]);
  const [loadingMinElapsed, setLoadingMinElapsed] = useState(false);
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const planTriggerSent = useRef(false);

  const { messages, sendMessage, status, error } = useChat<ChatUIMessage>({
    onData(dataPart) {
      // Surface server-side debug logs in browser console
      if (dataPart.type === "data-debug-log") {
        const { label, detail, ts } = dataPart.data as DebugLogEntry;
        console.log(
          `%c[server] ${label}%c ${ts}`,
          "color: #0056d2; font-weight: bold",
          "color: #888",
          detail ?? ""
        );
        return;
      }

      try {
        console.log("[AppShell] onData received:", dataPart.type);
        if (dataPart.type === "data-conversation-state") {
          const { gathered_info, ready_for_plan, suggested_pills } =
            dataPart.data;
          const currentPhase = phaseRef.current;
          console.log("[AppShell] conversation state:", { ready_for_plan, gathered_info, currentPhase });

          if (currentPhase === "plan_generated") {
            // Check if the model explicitly changed the goal (goal change flow):
            // the model sets a NEW goal (non-null) while nulling skills/constraints
            // to signal re-gathering is needed. DEFAULT_STATE (all nulls) does NOT trigger this.
            const goalChanged = gathered_info.goal !== null &&
              (gathered_info.skills === null || gathered_info.constraints === null);
            if (goalChanged && !ready_for_plan) {
              console.log("[AppShell] Goal change detected — resetting to conversation mode");
              // Use setGatheredInfo directly (not merge) so null values actually clear fields
              setGatheredInfo(gathered_info);
              // Clear the old plan so auto-send can fire after re-gathering
              setPlan(null);
              if (suggested_pills?.options?.length > 0) {
                setSuggestedPills(suggested_pills);
              }
              // Reset plan trigger so a new plan can be generated later
              planTriggerSent.current = false;
              planCountRef.current = 0;
              setPhase("chatting");
            } else {
              // Normal refinement — update gathered info and pills
              mergeGatheredInfo(gathered_info);
              if (suggested_pills?.options?.length > 0 && !pillsSuppressed.current) {
                setSuggestedPills(suggested_pills);
              }
            }
          } else if (currentPhase === "plan_generating" || currentPhase === "viewing_plan") {
            // Blocked — ignore conversation state during these phases
          } else {
            // Conversation phase
            mergeGatheredInfo(gathered_info);
            setSuggestedPills(suggested_pills);
            if (ready_for_plan) {
              console.log("[AppShell] AI signaled ready_for_plan — setting plan_generating");
              setPhase("plan_generating");
            }
          }
        }
        if (dataPart.type === "data-plan-generating") {
          const currentPhase = phaseRef.current;
          console.log("[AppShell] Plan generation started (server signal), phase:", currentPhase);
          if (currentPhase === "plan_generated" || currentPhase === "viewing_plan") {
            setIsRefining(true);
          } else {
            setPhase("plan_generating");
          }
        }
        if (dataPart.type === "data-learning-plan") {
          const planData = dataPart.data as LearningPlan;
          console.log("[AppShell] Learning plan received:");
          console.log("[AppShell]   Title:", planData?.title);
          console.log("[AppShell]   Summary:", JSON.stringify(planData?.summary));
          console.log("[AppShell]   Milestones:", planData?.milestones?.length);
          if (planData?.milestones) {
            for (const ms of planData.milestones) {
              console.log(`[AppShell]   Milestone: "${ms.name}" — ${ms.courses?.length} courses`);
              for (const c of ms.courses || []) {
                console.log(`[AppShell]     Course: "${c.name}" (${c.partners?.join(", ")})`);
              }
            }
          }
          planCountRef.current += 1;
          setPendingIndicatorType(planCountRef.current === 1 ? "created" : "rebuilt");
          pillsSuppressed.current = false; // new plan — allow refinement pills
          setPlan(planData);
          setPendingRemovals(new Set());
          setIsRefining(false);
          setPhase("plan_generated");
        }
        if (dataPart.type === "data-course-swap") {
          const swapData = dataPart.data as {
            milestoneId?: string;
            oldCourseId?: string;
            newCourse?: PlanCourse;
          };
          const { milestoneId, oldCourseId, newCourse } = swapData;

          if (!milestoneId || !oldCourseId || !newCourse) {
            console.error("[AppShell] Invalid course swap data, clearing pending state:", swapData);
            setPendingRemovals(new Set());
            setIsRefining(false);
            return;
          }

          console.log("[AppShell] Course swap:", { milestoneId, oldCourseId, newCourse: newCourse.name });
          let swapApplied = false;
          setPlan((prev) => {
            if (!prev) return prev;
            // Check if milestoneId and oldCourseId actually exist in the plan
            const targetMilestone = prev.milestones.find((ms) => ms.id === milestoneId);
            if (!targetMilestone || !targetMilestone.courses.some((c) => c.id === oldCourseId)) {
              console.error("[AppShell] Swap mismatch — milestoneId or oldCourseId not found in plan:", { milestoneId, oldCourseId });
              return prev;
            }
            swapApplied = true;
            return {
              ...prev,
              milestones: prev.milestones.map((ms) => {
                if (ms.id !== milestoneId) return ms;
                return {
                  ...ms,
                  courses: ms.courses.map((c) =>
                    c.id === oldCourseId ? newCourse : c
                  ),
                };
              }),
            };
          });
          planCountRef.current += 1;
          setPendingIndicatorType("swapped");
          setPendingRemovals(new Set());
          setIsRefining(false);
        }
      } catch (err) {
        console.error("[AppShell] Error handling data part:", dataPart.type, err);
        // Always clear loading states so the UI doesn't get stuck
        setPendingRemovals(new Set());
        setIsRefining(false);
      }
    },
  });

  // Keep ref in sync so onData can read current message count
  useEffect(() => {
    messagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Add indicator to the map at the last assistant message index.
  // Runs after render so messages array is current (avoids stale closure in onData).
  useEffect(() => {
    if (!pendingIndicatorType) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        setPlanIndicators((prev) => new Map(prev).set(i, pendingIndicatorType));
        setPendingIndicatorType(null);
        return;
      }
    }
  }, [pendingIndicatorType, messages.length]);

  // Fallback: extract metadata from the latest assistant message text
  // in case data parts are not available (e.g., inline JSON pattern).
  // Only runs when stream is idle to avoid parsing incomplete JSON.
  useEffect(() => {
    if (status !== "ready") return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;

    const textPart = lastMsg.parts.find((p) => p.type === "text");
    if (!textPart || textPart.type !== "text") return;

    const metadata = extractMetadataFromText(textPart.text);
    if (!metadata) return;

    const currentPhase = phaseRef.current;

    if (currentPhase === "plan_generated") {
      if (metadata.suggested_pills?.options?.length > 0) {
        setSuggestedPills(metadata.suggested_pills);
      }
    } else if (currentPhase !== "plan_generating" && currentPhase !== "viewing_plan") {
      setSuggestedPills(metadata.suggested_pills);
      mergeGatheredInfo(metadata.gathered_info);
      if (metadata.ready_for_plan) {
        console.log("[AppShell] Fallback: AI signaled ready_for_plan — setting plan_generating");
        setPhase("plan_generating");
      }
    }
  }, [messages, status, mergeGatheredInfo, setPhase]);

  const handleViewPlan = useCallback(() => {
    setViewingPlan(true);
    setPhase("viewing_plan");
  }, []);

  const handleBackToHome = useCallback(() => {
    setViewingPlan(false);
    setPhase("plan_generated");
  }, []);

  // Start the minimum loading timer when phase enters "loading"
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => setLoadingMinElapsed(true), 200);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleSend = useCallback(
    (text: string) => {
      console.log("[AppShell] handleSend, current phase:", phase, "hasPlan:", !!plan);
      if (phase === "entry") {
        setPhase("loading");
      }

      // Detect satisfaction signals — clear pills so they don't reappear
      if (phase === "plan_generated") {
        const lower = text.toLowerCase().trim();
        const satisfactionSignals = ["looks good", "no", "no thanks", "nope", "i'm good", "all good", "that's it", "perfect", "done", "good to go", "skip for now"];
        if (satisfactionSignals.some((s) => lower === s || lower === s + "!")) {
          setSuggestedPills({ type: "single", question: "", options: [] });
          pillsSuppressed.current = true;
        }
      }

      let messageText = text;

      // Inject rich plan context for refinement messages
      if (phase === "plan_generated" && plan) {
        if (!text.startsWith("[Current Plan]") && !text.startsWith("[REMOVE]") && !text.startsWith("[EXPLORE]")) {
          const summary = `Role: ${plan.summary.role} | Skills: ${plan.summary.skills.join(", ")} | Timeline: ${plan.summary.totalDuration} at ${plan.summary.hoursPerWeek}`;
          const learner = `Learner: goal=${gatheredInfo.goal ?? "?"}, skills=${gatheredInfo.skills ?? "?"}, background=${gatheredInfo.background ?? "none"}, timeline=${gatheredInfo.constraints ?? "?"}`;
          const milestones = plan.milestones
            .map((ms) => {
              const courses = ms.courses
                .map((c) => `  - ${c.name} [${c.id}] | ${c.productDifficultyLevel} | ${c.skills.join(", ")} | ${c.duration}`)
                .join("\n");
              return `${ms.name} (${ms.id}) — ${ms.estimatedWeeks} weeks\n${courses}`;
            })
            .join("\n\n");
          // Serialize plan courses so the server can pre-populate its cache
          const allCourses = plan.milestones.flatMap((ms) => ms.courses);
          const coursesJson = JSON.stringify(allCourses);
          messageText = `[Current Plan]\n${summary}\n${learner}\n\n${milestones}\n\n[PLAN_COURSES_JSON]${coursesJson}[/PLAN_COURSES_JSON]\n\n${text}`;
        }
      }

      sendMessage({ text: messageText });
    },
    [phase, plan, gatheredInfo, sendMessage],
  );

  const handleRemoveCourse = useCallback(
    (courseId: string, _courseName: string, milestoneId: string, _milestoneName: string) => {
      // Remove the course from the plan directly — no AI call needed
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          milestones: prev.milestones.map((ms) => {
            if (ms.id !== milestoneId) return ms;
            return { ...ms, courses: ms.courses.filter((c) => c.id !== courseId) };
          }),
        };
      });
    },
    [setPlan],
  );

  // Prevent concurrent swap attempts — true when a swap is already in flight
  const swapDisabled = pendingRemovals.size > 0 || status === "streaming" || status === "submitted";

  const handleExploreAlternatives = useCallback(
    (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => {
      if (swapDisabled) return;
      // Include existing course IDs so the server can exclude duplicates
      const milestone = plan?.milestones.find((ms) => ms.id === milestoneId);
      const existingIds = milestone?.courses.map((c) => c.id).join(",") ?? "";
      setPendingRemovals((prev) => new Set(prev).add(courseId));
      handleSend(`[EXPLORE] Explore alternatives for "${courseName}" in "${milestoneName}" (${milestoneId}, ${courseId}) [existing:${existingIds}]`);
    },
    [handleSend, swapDisabled, plan],
  );

  // Clear pending shimmer states when stream finishes (fallback for failed swaps).
  // Track previous status to only clear on transition to "ready" (not on initial render).
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const wasActive = prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    prevStatusRef.current = status;

    if (status === "ready" && wasActive) {
      if (pendingRemovals.size > 0) {
        setPendingRemovals(new Set());
      }
      if (isRefining) {
        setIsRefining(false);
      }
    }
  }, [status, pendingRemovals.size, isRefining]);

  // Track first token during loading phase
  useEffect(() => {
    if (phase === "loading" && status === "streaming") {
      setFirstTokenReceived(true);
    }
  }, [phase, status]);

  // Transition from loading to chatting when both conditions met
  useEffect(() => {
    if (phase === "loading" && loadingMinElapsed && firstTokenReceived) {
      setPhase("chatting");
      setLoadingMinElapsed(false);
      setFirstTokenReceived(false);
    }
  }, [phase, loadingMinElapsed, firstTokenReceived]);

  // Auto-send plan generation trigger when AI signals ready_for_plan.
  // The model acknowledges the learner's last answer in its own turn,
  // then this effect fires a separate "Generate my learning plan" message
  // so plan generation appears as a distinct turn in the conversation.
  useEffect(() => {
    if (phase === "plan_generating" && !plan && !planTriggerSent.current) {
      if (status === "streaming" || status === "submitted") {
        return;
      }
      planTriggerSent.current = true;
      console.log("[AppShell] Auto-sending plan generation trigger");
      sendMessage({ text: "Generate my learning plan" });
    }
  }, [phase, status, plan, sendMessage]);

  // Fallback: if AI never sets ready_for_plan but all info is gathered,
  // trigger after a short debounce once the stream is idle.
  const allInfoGathered = !!(gatheredInfo.goal && gatheredInfo.skills && gatheredInfo.constraints);

  useEffect(() => {
    if (
      allInfoGathered &&
      !plan &&
      !planTriggerSent.current &&
      phase === "chatting" &&
      status !== "streaming" &&
      status !== "submitted"
    ) {
      const timer = setTimeout(() => {
        if (!planTriggerSent.current && !plan) {
          planTriggerSent.current = true;
          console.log("[AppShell] Fallback: all info gathered, triggering plan");
          setPhase("plan_generating");
          sendMessage({ text: "Generate my learning plan" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [allInfoGathered, phase, status, plan, messages.length, sendMessage]);

  // Reset plan trigger and phase on error so retry can work
  useEffect(() => {
    if (error) {
      console.log("[AppShell] Error detected, resetting for retry");
      if (phase === "plan_generating" && !plan) {
        planTriggerSent.current = false;
        setPhase("chatting");
      }
      if (phase === "loading") {
        setPhase("chatting");
        setLoadingMinElapsed(false);
        setFirstTokenReceived(false);
      }
    }
  }, [error, phase, plan]);

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMsg) return;

    const textPart = lastUserMsg.parts.find((p) => p.type === "text");
    if (textPart && textPart.type === "text") {
      sendMessage({ text: textPart.text });
    }
  }, [messages, sendMessage]);

  return (
    <div
      className={clsx(
        "h-screen transition-all duration-500 ease-out",
        phase === "entry" && "flex items-center justify-center",
        phase !== "entry" && "flex flex-col",
      )}
    >
      {phase === "entry" ? (
        <EntryScreen onSend={handleSend} />
      ) : phase === "loading" ? (
        <LihpLoadingScreen />
      ) : (
        <LihpPage
          messages={messages as ChatUIMessage[]}
          status={status}
          error={error}
          suggestedPills={suggestedPills}
          gatheredInfo={gatheredInfo}
          plan={plan}
          phase={phase}
          viewingPlan={viewingPlan}
          onViewPlan={handleViewPlan}
          onBackToHome={handleBackToHome}
          onSend={handleSend}
          onRetry={handleRetry}
          pendingRemovals={pendingRemovals}
          isRefining={isRefining}
          planIndicators={planIndicators}
          stripQuestions={stripQuestions}
          swapDisabled={swapDisabled}
          onRemoveCourse={handleRemoveCourse}
          onExploreAlternatives={handleExploreAlternatives}
        />
      )}
    </div>
  );
}
