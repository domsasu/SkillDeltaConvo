import { useChat } from "@ai-sdk/react";
import { generateId } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { SUGGESTION_FIND_GAPS_LABEL } from "@/components/entry/suggestion-buttons";
import type {
  AppPhase,
  ChatUIMessage,
  ConversationStateData,
  DebugLogEntry,
  GatheredInfo,
  StructuredPillData,
} from "@/lib/types";
import type { LearningPlan, PlanCourse } from "@/lib/plan-types";
import { conversationStateSchema } from "@/lib/prompts/schemas";

const FIND_GAPS_REPLY_DELAY_MS = 1200;
const LINKEDIN_JOB_REPLY_DELAY_MS = 2500;
const RESUME_AFTER_LINKEDIN_DELAY_MS = 3000;
const RESUME_TEXT_MAX_CHARS = 120_000;

const RESUME_AFTER_LINKEDIN_REPLY =
  "That's an impressive resume. I see 4 more relevant skill requirements outlined here, so we just have 3 to focus on: business intelligence breadth (Power BI / Looker), product analytics (funnels, cohorts, retention), and cloud data warehousing (BigQuery / Snowflake).";

const LINKEDIN_JOB_URL_RE =
  /https?:\/\/(www\.)?linkedin\.com\/jobs?\/view\/[^\s)\]}>'"]+/i;

const metadataJsonRegex = /```json\s*(\{[\s\S]*?\})\s*```\s*$/;

function extractMetadataFromText(text: string): ConversationStateData | null {
  const match = text.match(metadataJsonRegex);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    const result = conversationStateSchema.safeParse(parsed);
    if (result.success) return result.data as ConversationStateData;
  } catch {
    /* ignore */
  }
  return null;
}

function extractLinkedInJobUrl(text: string): string | null {
  const m = text.match(LINKEDIN_JOB_URL_RE);
  if (!m) return null;
  return m[0].replace(/[.,;]+$/u, "");
}

function parseRoleCompanyFromTitle(titleGuess: string | null): { role: string; company: string } | null {
  if (!titleGuess?.trim()) return null;
  const cleaned = titleGuess.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
  const parts = cleaned.split("|").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { role: parts[0], company: parts[1] };
  }
  const at = cleaned.match(/^(.+?)\s+at\s+(.+)$/i);
  if (at) {
    return { role: at[1].trim(), company: at[2].trim() };
  }
  return null;
}

function postedHintFromJobText(text: string): string {
  const m = text.match(/(\d+)\s+(day|days|week|weeks|month|months|hour|hours)\s+ago/i);
  if (!m) return "It was posted recently, so let's move fast!";
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u.startsWith("hour")) return "It was just posted, so let's move fast!";
  if (u.startsWith("day") && n <= 7) return "It was posted under a week ago, so let's move fast!";
  if (u.startsWith("week") && n === 1) return "It was posted about a week ago, so let's move fast!";
  if (u.startsWith("day")) return `It was posted ${n} days ago, so let's move fast!`;
  if (u.startsWith("week")) return `It was posted ${n} weeks ago, so let's move fast!`;
  return "It was posted recently, so let's move fast!";
}

async function fetchLinkedInJobPreview(
  url: string,
): Promise<{ titleGuess: string | null; text: string } | null> {
  try {
    const res = await fetch("/api/fetch-job-posting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = (await res.json()) as {
      titleGuess?: string | null;
      text?: string;
      error?: string;
    };
    if (!res.ok && res.status !== 422) return null;
    return { titleGuess: data.titleGuess ?? null, text: data.text ?? "" };
  } catch {
    return null;
  }
}

export function usePppChatSidePanel() {
  const [phase, setPhaseState] = useState<AppPhase>("chatting");
  const phaseRef = useRef<AppPhase>("chatting");
  const setPhase = useCallback((next: AppPhase | ((prev: AppPhase) => AppPhase)) => {
    setPhaseState((prev) => {
      const value = typeof next === "function" ? (next as (p: AppPhase) => AppPhase)(prev) : next;
      phaseRef.current = value;
      return value;
    });
  }, []);

  const [suggestedPills, setSuggestedPills] = useState<StructuredPillData>({
    type: "single",
    question: "",
    options: [],
  });
  const [gatheredInfo, setGatheredInfo] = useState<GatheredInfo>({
    goal: null,
    skills: null,
    background: null,
    constraints: null,
  });

  const mergeGatheredInfo = useCallback((incoming: GatheredInfo) => {
    setGatheredInfo((prev) => ({
      goal: incoming.goal ?? prev.goal,
      skills: incoming.skills ?? prev.skills,
      background: incoming.background ?? prev.background,
      constraints: incoming.constraints ?? prev.constraints,
    }));
  }, []);

  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const [isRefining, setIsRefining] = useState(false);
  const planCountRef = useRef(0);
  const pillsSuppressed = useRef(false);
  const [planIndicators, setPlanIndicators] = useState<Map<number, "created" | "rebuilt" | "swapped">>(new Map());
  const [pendingIndicatorType, setPendingIndicatorType] = useState<"created" | "rebuilt" | "swapped" | null>(null);
  const messagesLengthRef = useRef(0);
  const planTriggerSent = useRef(false);
  const localReplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingResumeAfterLinkedInRef = useRef(false);
  const [pendingLocalReply, setPendingLocalReply] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { messages, sendMessage, setMessages, status, error } = useChat<ChatUIMessage>({
    onData(dataPart) {
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
        if (dataPart.type === "data-conversation-state") {
          const { gathered_info, ready_for_plan, suggested_pills } = dataPart.data as {
            gathered_info: GatheredInfo;
            ready_for_plan: boolean;
            suggested_pills: StructuredPillData;
          };
          const currentPhase = phaseRef.current;

          if (currentPhase === "plan_generated") {
            const goalChanged =
              gathered_info.goal !== null &&
              (gathered_info.skills === null || gathered_info.constraints === null);
            if (goalChanged && !ready_for_plan) {
              setGatheredInfo(gathered_info);
              setPlan(null);
              if (suggested_pills?.options?.length > 0) {
                setSuggestedPills(suggested_pills);
              }
              planTriggerSent.current = false;
              planCountRef.current = 0;
              setPhase("chatting");
            } else {
              mergeGatheredInfo(gathered_info);
              if (suggested_pills?.options?.length > 0 && !pillsSuppressed.current) {
                setSuggestedPills(suggested_pills);
              }
            }
          } else if (currentPhase === "plan_generating" || currentPhase === "viewing_plan") {
            /* ignore */
          } else {
            mergeGatheredInfo(gathered_info);
            setSuggestedPills(suggested_pills);
            if (ready_for_plan) {
              setPhase("plan_generating");
            }
          }
        }
        if (dataPart.type === "data-plan-generating") {
          const currentPhase = phaseRef.current;
          if (currentPhase === "plan_generated" || currentPhase === "viewing_plan") {
            setIsRefining(true);
          } else {
            setPhase("plan_generating");
          }
        }
        if (dataPart.type === "data-learning-plan") {
          const planData = dataPart.data as LearningPlan;
          planCountRef.current += 1;
          setPendingIndicatorType(planCountRef.current === 1 ? "created" : "rebuilt");
          pillsSuppressed.current = false;
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
            setPendingRemovals(new Set());
            setIsRefining(false);
            return;
          }

          setPlan((prev) => {
            if (!prev) return prev;
            const targetMilestone = prev.milestones.find((ms) => ms.id === milestoneId);
            if (!targetMilestone || !targetMilestone.courses.some((c) => c.id === oldCourseId)) {
              return prev;
            }
            return {
              ...prev,
              milestones: prev.milestones.map((ms) => {
                if (ms.id !== milestoneId) return ms;
                return {
                  ...ms,
                  courses: ms.courses.map((c) => (c.id === oldCourseId ? newCourse : c)),
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
        console.error("[CoachChat] Error handling data part:", dataPart.type, err);
        setPendingRemovals(new Set());
        setIsRefining(false);
      }
    },
  });

  useEffect(() => {
    messagesLengthRef.current = messages.length;
  }, [messages.length]);

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
        setPhase("plan_generating");
      }
    }
  }, [messages, status, mergeGatheredInfo, setPhase]);

  useEffect(() => {
    return () => {
      if (localReplyTimeoutRef.current) {
        clearTimeout(localReplyTimeoutRef.current);
        localReplyTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      setUploadError(null);

      if (text === SUGGESTION_FIND_GAPS_LABEL) {
        const greeting =
          "Hello, It looks like you found a role you're interested in? That's exciting! Can you copy the Job link here for me to analyze?";
        if (localReplyTimeoutRef.current) {
          clearTimeout(localReplyTimeoutRef.current);
          localReplyTimeoutRef.current = null;
        }
        const userId = generateId();
        setMessages((prev) => [
          ...prev,
          {
            id: userId,
            role: "user",
            parts: [{ type: "text", text }],
          },
        ]);
        setPendingLocalReply(true);
        localReplyTimeoutRef.current = setTimeout(() => {
          localReplyTimeoutRef.current = null;
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              parts: [{ type: "text", text: greeting }],
            },
          ]);
          setPendingLocalReply(false);
        }, FIND_GAPS_REPLY_DELAY_MS);
        return;
      }

      const linkedInJobUrl = extractLinkedInJobUrl(text);
      if (linkedInJobUrl) {
        if (localReplyTimeoutRef.current) {
          clearTimeout(localReplyTimeoutRef.current);
          localReplyTimeoutRef.current = null;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "user",
            parts: [{ type: "text", text }],
          },
        ]);
        setPendingLocalReply(true);
        void (async () => {
          const [preview] = await Promise.all([
            fetchLinkedInJobPreview(linkedInJobUrl),
            new Promise<undefined>((resolve) => setTimeout(resolve, LINKEDIN_JOB_REPLY_DELAY_MS)),
          ]);
          const parsed = preview?.titleGuess
            ? parseRoleCompanyFromTitle(preview.titleGuess)
            : null;
          const posted =
            preview?.text && preview.text.length >= 50
              ? postedHintFromJobText(preview.text)
              : "It was posted recently, so let's move fast!";
          const firstLine = parsed
            ? `Got it, it looks like you're interested in the ${parsed.role} role at ${parsed.company}. ${posted}`
            : `Got it, it looks like you're interested in this job posting. ${posted}`;
          const secondBlock =
            "Based on your Coursera activity, you have **7 key skill gaps** to focus on. We can focus on those, or if you have a more representative resume or LinkedIn profile I can use, upload that now.";
          const reply = `${firstLine}\n\n${secondBlock}`;
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              parts: [{ type: "text", text: reply }],
            },
          ]);
          awaitingResumeAfterLinkedInRef.current = true;
          setPendingLocalReply(false);
        })();
        return;
      }

      awaitingResumeAfterLinkedInRef.current = false;

      if (phase === "plan_generated") {
        const lower = text.toLowerCase().trim();
        const satisfactionSignals = [
          "looks good",
          "no",
          "no thanks",
          "nope",
          "i'm good",
          "all good",
          "that's it",
          "perfect",
          "done",
          "good to go",
          "skip for now",
        ];
        if (satisfactionSignals.some((s) => lower === s || lower === s + "!")) {
          setSuggestedPills({ type: "single", question: "", options: [] });
          pillsSuppressed.current = true;
        }
      }

      let messageText = text;

      if (phase === "plan_generated" && plan) {
        if (!text.startsWith("[Current Plan]") && !text.startsWith("[REMOVE]") && !text.startsWith("[EXPLORE]")) {
          const summary = `Role: ${plan.summary.role} | Skills: ${plan.summary.skills.join(", ")} | Timeline: ${plan.summary.totalDuration} at ${plan.summary.hoursPerWeek}`;
          const learner = `Learner: goal=${gatheredInfo.goal ?? "?"}, skills=${gatheredInfo.skills ?? "?"}, background=${gatheredInfo.background ?? "none"}, timeline=${gatheredInfo.constraints ?? "?"}`;
          const milestones = plan.milestones
            .map((ms) => {
              const courses = ms.courses
                .map(
                  (c) =>
                    `  - ${c.name} [${c.id}] | ${c.productDifficultyLevel} | ${c.skills.join(", ")} | ${c.duration}`
                )
                .join("\n");
              return `${ms.name} (${ms.id}) — ${ms.estimatedWeeks} weeks\n${courses}`;
            })
            .join("\n\n");
          const allCourses = plan.milestones.flatMap((ms) => ms.courses);
          const coursesJson = JSON.stringify(allCourses);
          messageText = `[Current Plan]\n${summary}\n${learner}\n\n${milestones}\n\n[PLAN_COURSES_JSON]${coursesJson}[/PLAN_COURSES_JSON]\n\n${text}`;
        }
      }

      sendMessage({ text: messageText });
    },
    [phase, plan, gatheredInfo, sendMessage, setMessages]
  );

  const clearUploadError = useCallback(() => setUploadError(null), []);

  const submitResume = useCallback(
    ({ fileName, text, note }: { fileName: string; text: string; note?: string }) => {
      if (status === "submitted" || status === "streaming" || pendingLocalReply) {
        return;
      }
      setUploadError(null);
      const trimmedNote = note?.trim() ?? "";

      if (awaitingResumeAfterLinkedInRef.current) {
        awaitingResumeAfterLinkedInRef.current = false;
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "user",
            parts: [{ type: "text", text: `[Resume upload: ${fileName}]` }],
          },
        ]);
        setPendingLocalReply(true);
        void (async () => {
          await new Promise((r) => setTimeout(r, RESUME_AFTER_LINKEDIN_DELAY_MS));
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              parts: [{ type: "text", text: RESUME_AFTER_LINKEDIN_REPLY }],
            },
          ]);
          setPendingLocalReply(false);
        })();
        return;
      }

      const body = trimmedNote ? `${text}\n\n---\n${trimmedNote}` : text;
      handleSend(`[Resume upload: ${fileName}]\n\n${body}`);
    },
    [handleSend, pendingLocalReply, setMessages, status],
  );

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

  useEffect(() => {
    if (phase === "plan_generating" && !plan && !planTriggerSent.current) {
      if (status === "streaming" || status === "submitted") {
        return;
      }
      planTriggerSent.current = true;
      sendMessage({ text: "Generate my learning plan" });
    }
  }, [phase, status, plan, sendMessage]);

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
          setPhase("plan_generating");
          sendMessage({ text: "Generate my learning plan" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [allInfoGathered, phase, status, plan, messages.length, sendMessage, setPhase]);

  useEffect(() => {
    if (error) {
      if (phase === "plan_generating" && !plan) {
        planTriggerSent.current = false;
        setPhase("chatting");
      }
    }
  }, [error, phase, plan, setPhase]);

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    const textPart = lastUserMsg.parts.find((p) => p.type === "text");
    if (textPart && textPart.type === "text") {
      sendMessage({ text: textPart.text });
    }
  }, [messages, sendMessage]);

  return {
    messages: messages as ChatUIMessage[],
    status,
    error,
    suggestedPills,
    phase,
    isRefining,
    planIndicators,
    stripQuestions: false,
    pendingLocalReply,
    uploadError,
    clearUploadError,
    onResumeSubmit: submitResume,
    onSend: handleSend,
    onRetry: handleRetry,
  };
}
