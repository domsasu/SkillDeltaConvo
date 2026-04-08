export const runtime = "nodejs";

import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  tool,
  stepCountIs,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getConfig } from "@/lib/config";
import { buildSystemPrompt } from "@/lib/prompts/system-prompt";
import { conversationStateSchema } from "@/lib/prompts/schemas";
import { buildPlanInputSchema } from "@/lib/prompts/plan-schemas";
import { searchCoursesTool } from "@/lib/tools/search-courses";
import {
  learningPlanSchema,
  type LearningPlan,
  type PlanCourse,
} from "@/lib/plan-types";
import type { CourseHit } from "@/lib/coursera-types";
import type { ChatUIMessage, ConversationStateData } from "@/lib/types";

const DEFAULT_STATE: ConversationStateData = {
  gathered_info: { goal: null, skills: null, background: null, constraints: null },
  ready_for_plan: false,
  suggested_pills: {
    type: "single" as const,
    question: "",
    options: [],
  },
};

/**
 * Fallback: extract JSON metadata block from AI response text.
 * Used when the model does not call the report_conversation_state tool.
 */
function extractMetadataFromText(
  text: string
): ConversationStateData | null {
  const match = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (!match) return null;

  const parsed = conversationStateSchema.safeParse(JSON.parse(match[1]));
  return parsed.success ? parsed.data : null;
}

/**
 * Convert a CourseHit to a PlanCourse.
 */
function courseHitToPlanCourse(hit: CourseHit): PlanCourse {
  return {
    id: hit.id,
    name: hit.name,
    url: hit.url,
    imageUrl: hit.imageUrl,
    productType: hit.productType,
    partners: hit.partners,
    partnerLogos: hit.partnerLogos,
    skills: hit.skills,
    duration: hit.duration,
    productDifficultyLevel: hit.productDifficultyLevel,
    estimatedHours: 0,
    activityBadges: hit.activityBadges,
  };
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // OpenAI rate limits, server errors, timeouts, network issues
    if (msg.includes("rate limit") || msg.includes("429")) return true;
    if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("server error")) return true;
    if (msg.includes("timeout") || msg.includes("econnreset") || msg.includes("fetch failed")) return true;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const config = getConfig();
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  console.log("[chat/route] POST called with", messages.length, "messages");

  // Accumulate search results across multi-step tool calls
  const searchResultsCache = new Map<string, CourseHit>();

  // Pre-populate cache with existing plan courses from [PLAN_COURSES_JSON] tag.
  // This allows the model to reference original plan courses during broad refinements.
  const planCoursesRegex = /\[PLAN_COURSES_JSON\]([\s\S]*?)\[\/PLAN_COURSES_JSON\]/;
  for (const msg of messages) {
    if (msg.role !== "user") continue;
    for (const part of msg.parts ?? []) {
      if (part.type !== "text" || !("text" in part)) continue;
      const match = (part as { text: string }).text.match(planCoursesRegex);
      if (match) {
        try {
          const courses = JSON.parse(match[1]) as PlanCourse[];
          for (const c of courses) {
            searchResultsCache.set(c.id, {
              id: c.id,
              name: c.name,
              url: c.url,
              imageUrl: c.imageUrl,
              productType: c.productType,
              partners: c.partners,
              partnerLogos: c.partnerLogos,
              skills: c.skills,
              duration: c.duration,
              productDifficultyLevel: c.productDifficultyLevel,
              isPartOfCourseraPlus: true,
              activityBadges: c.activityBadges,
            });
          }
          console.log(`[chat/route] Pre-populated cache with ${courses.length} plan courses`);
        } catch { /* ignore parse errors */ }
        // Strip the tag from the message so the model doesn't see raw JSON
        (part as { text: string }).text = (part as { text: string }).text.replace(planCoursesRegex, "").trim();
      }
    }
  }

  const modelMessages = await convertToModelMessages(messages);

  // Track whether plan was emitted (to avoid double-emit)
  let planEmitted = false;
  let planGeneratingEmitted = false;

  // Detect swap/remove refinement — these should NOT trigger the full plan-generating shimmer
  const lastUserMsg = messages.findLast((m: ChatUIMessage) => m.role === "user");
  const lastUserText = lastUserMsg?.parts?.find((p: { type: string }) => p.type === "text");
  const userText = lastUserText && "text" in lastUserText ? (lastUserText as { text: string }).text : "";
  const isCourseSwapRequest = userText.startsWith("[REMOVE]") || userText.startsWith("[EXPLORE]");
  const isBroadRefinement = userText.startsWith("[Current Plan]");
  const isPlanTrigger = userText.trim() === "Generate my learning plan";

  // Extract existing course IDs from [EXPLORE] messages to prevent duplicate swaps
  const existingCourseIds = new Set<string>();
  const existingMatch = userText.match(/\[existing:([^\]]*)\]/);
  if (existingMatch && existingMatch[1]) {
    for (const id of existingMatch[1].split(",")) {
      if (id.trim()) existingCourseIds.add(id.trim());
    }
  }

  // Check if any user message explicitly mentions timeline/availability.
  // Used by the hard gate to reject model-inferred constraints.
  const timelineKeywords = /\b(month|week|hour|day|minute|year|full[- ]?time|part[- ]?time)\b/i;
  const userProvidedTimeline = messages
    .filter((m: ChatUIMessage) => m.role === "user")
    .some((m: ChatUIMessage) => {
      const text = m.parts
        ?.filter((p: { type: string }) => p.type === "text")
        .map((p) => ("text" in p ? (p as { text: string }).text : ""))
        .join(" ") ?? "";
      return timelineKeywords.test(text);
    });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Emit debug log to client (visible in browser console since
      // CloudWatch logs are not available on Amplify WEB_COMPUTE)
      function debugLog(label: string, detail?: Record<string, unknown>) {
        const entry = { label, detail, ts: new Date().toISOString() };
        console.log(`[chat/route] ${label}`, detail ?? "");
        writer.write({ type: "data-debug-log", data: entry });
      }

      debugLog("request-start", { messageCount: messages.length });

      // Track whether report_conversation_state already emitted state
      let conversationStateEmitted = false;

      // Report conversation state — emits immediately so client gets updates during streaming.
      // Hard gate: if the model claims ready_for_plan but required fields are missing,
      // override to false so plan generation cannot trigger on inferred data.
      const reportConversationState = tool({
        description: "Report the current conversation state after each response",
        inputSchema: conversationStateSchema,
        execute: async (input) => {
          const parsed = conversationStateSchema.safeParse(input);
          if (!parsed.success) return input;

          let state = parsed.data;
          const { goal, skills, constraints } = state.gathered_info;

          // Override inferred constraints: if the model filled in a timeline
          // but no user message actually contains time-related words, null it out.
          // Skip this check during refinement — the plan context contains time words.
          if (constraints && !userProvidedTimeline) {
            debugLog("constraints-inferred-override", { claimed: constraints });
            state = {
              ...state,
              gathered_info: { ...state.gathered_info, constraints: null },
            };
          }

          if (state.ready_for_plan && (!goal || !skills || !state.gathered_info.constraints)) {
            const missing = [
              !goal && "goal",
              !skills && "skills",
              !state.gathered_info.constraints && "timeline",
            ].filter(Boolean);
            debugLog("ready-for-plan-rejected", { missing, gathered_info: state.gathered_info });
            state = { ...state, ready_for_plan: false };
          }

          if (!conversationStateEmitted) {
            conversationStateEmitted = true;
            debugLog("emit-conversation-state", {
              source: "tool-immediate",
              readyForPlan: state.ready_for_plan,
            });
            writer.write({
              type: "data-conversation-state",
              data: state,
            });
          }

          // Return the (possibly corrected) state to the model so it sees the override
          return state;
        },
      });

      // Wrapper around searchCoursesTool that populates the cache
      const searchCoursesWithCache = tool({
        description: searchCoursesTool.description ?? "",
        inputSchema: searchCoursesTool.inputSchema,
        execute: async (input) => {
          // Signal plan generation started on first search call
          // Skip for swap/remove — those only swap one course, not regenerate the full plan
          if (!planGeneratingEmitted && !isCourseSwapRequest) {
            planGeneratingEmitted = true;
            debugLog("plan-generating-signal");
            writer.write({
              type: "data-plan-generating",
              data: { status: "generating" },
            });
          }
          debugLog("search-courses-start", { query: input.query });
          const execResult = await searchCoursesTool.execute!(input, {
            toolCallId: "",
            messages: modelMessages,
            abortSignal: new AbortController().signal,
          });
          const result = execResult as { query: string; courses: CourseHit[] };
          debugLog("search-courses-done", { query: input.query, count: result.courses.length });
          for (const course of result.courses) {
            searchResultsCache.set(course.id, course);
          }
          return result;
        },
      });

      // Tool that assembles the final learning plan — emits data part immediately
      const buildLearningPlanTool = tool({
        description:
          "Assemble the final learning plan from searched courses. Call this after completing all search_courses calls.",
        inputSchema: buildPlanInputSchema,
        execute: async (input): Promise<LearningPlan> => {
          debugLog("build-plan-start", {
            title: input.title,
            milestones: input.milestones.length,
            cachedCourses: searchResultsCache.size,
          });
          // Track used course IDs across milestones to prevent duplicates
          const usedCourseIds = new Set<string>();

          const milestones = input.milestones.map((milestone, index) => {
            const courses: PlanCourse[] = milestone.courseIds
              .map((id) => {
                if (usedCourseIds.has(id)) {
                  debugLog("course-dedup-skipped", { courseId: id, milestone: milestone.name });
                  return null;
                }
                const hit = searchResultsCache.get(id);
                if (!hit) {
                  debugLog("course-cache-miss", { courseId: id });
                  return null;
                }
                usedCourseIds.add(id);
                return courseHitToPlanCourse(hit);
              })
              .filter((c): c is PlanCourse => c !== null);

            return {
              id: `milestone-${index + 1}`,
              name: milestone.name,
              description: milestone.description,
              skills: milestone.skills,
              badges: milestone.badges,
              courses,
              estimatedWeeks: milestone.estimatedWeeks,
            };
          });

          const plan: LearningPlan = {
            title: input.title,
            summary: {
              role: input.role,
              skills: input.skills,
              totalDuration: input.totalDuration,
              hoursPerWeek: input.hoursPerWeek,
            },
            milestones,
          };

          // Validate
          const parsed = learningPlanSchema.safeParse(plan);
          if (parsed.success) {
            const planSummary = {
              title: plan.title,
              summary: plan.summary,
              milestones: plan.milestones.map((ms) => ({
                name: ms.name,
                courseCount: ms.courses.length,
                courses: ms.courses.map((c) => ({
                  name: c.name,
                  partners: c.partners,
                  type: c.productType,
                })),
              })),
            };
            debugLog("plan-validated", planSummary);

            // Emit plan data part immediately while stream is still open
            writer.write({
              type: "data-learning-plan",
              data: plan,
            });
            planEmitted = true;
            debugLog("plan-emitted");
          } else {
            debugLog("plan-validation-failed", {
              issues: parsed.error.issues.map((i) => ({
                path: i.path,
                message: i.message,
              })),
            });
          }

          return plan;
        },
      });

      // Tool that swaps a single course in an existing plan (for explore alternatives)
      const swapCourseTool = tool({
        description:
          "Swap a single course in the existing learning plan. IMPORTANT: The newCourseId MUST be an exact ID from the most recent search_courses results — do not use IDs from conversation history or memory. Call search_courses first if you haven't already.",
        inputSchema: z.object({
          milestoneId: z.string().describe("The milestone ID containing the course to swap (e.g., 'milestone-1')"),
          oldCourseId: z.string().describe("The ID of the course being replaced"),
          newCourseId: z.string().describe("The ID of the replacement course from search results"),
        }),
        execute: async (input) => {
          // Exclude courses already in the milestone to prevent duplicates
          const excludeIds = new Set([...existingCourseIds, input.oldCourseId]);

          let newCourseHit = searchResultsCache.get(input.newCourseId);
          // Reject if the selected course already exists in the milestone
          if (newCourseHit && excludeIds.has(input.newCourseId)) {
            debugLog("swap-course-duplicate-rejected", { newCourseId: input.newCourseId });
            newCourseHit = undefined; // fall through to auto-select
          }
          if (!newCourseHit) {
            // Auto-select the first available course not already in the milestone
            const fallback = Array.from(searchResultsCache.entries())
              .find(([id]) => !excludeIds.has(id));
            if (!fallback) {
              debugLog("swap-course-no-results", { newCourseId: input.newCourseId, excludeIds: [...excludeIds] });
              return {
                success: false,
                error: "No courses available in search results to swap (all are already in the milestone).",
              };
            }
            debugLog("swap-course-auto-select", {
              requestedId: input.newCourseId,
              autoSelectedId: fallback[0],
              autoSelectedName: fallback[1].name,
            });
            newCourseHit = fallback[1];
          }
          const newCourse = courseHitToPlanCourse(newCourseHit);
          debugLog("swap-course", {
            milestoneId: input.milestoneId,
            oldCourseId: input.oldCourseId,
            newCourse: newCourse.name,
          });

          writer.write({
            type: "data-course-swap",
            data: {
              milestoneId: input.milestoneId,
              oldCourseId: input.oldCourseId,
              newCourse,
            },
          });

          return { success: true, swappedCourse: newCourse.name };
        },
      });

      // Retry loop for transient LLM failures
      let lastError: unknown;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            debugLog("retry-attempt", { attempt, maxRetries: MAX_RETRIES });
            await delay(RETRY_DELAY_MS * attempt);
          }

          const result = streamText({
            model: openai(config.OPENAI_MODEL),
            system: buildSystemPrompt(),
            messages: modelMessages,
            tools: {
              report_conversation_state: reportConversationState,
              search_courses: searchCoursesWithCache,
              build_learning_plan: buildLearningPlanTool,
              swap_course: swapCourseTool,
            },
            stopWhen: stepCountIs(8),

            // Gate tools based on message type and step progress.
            // During conversation, the model gets exactly one step (text + tool call)
            // then the stream stops — preventing multi-step runaway responses.
            prepareStep({ steps }) {
              if (isPlanTrigger) {
                return {
                  activeTools: ["search_courses", "build_learning_plan", "report_conversation_state"] as const,
                };
              }

              if (isCourseSwapRequest) {
                return {
                  activeTools: ["search_courses", "swap_course", "report_conversation_state"] as const,
                };
              }

              if (isBroadRefinement) {
                return {
                  activeTools: ["search_courses", "build_learning_plan", "report_conversation_state"] as const,
                };
              }

              // Conversation phase: allow report_conversation_state on step 0,
              // then cut off tools so the model finishes and the stream ends.
              const alreadyReported = steps.some((step) =>
                step.toolResults.some((tr) => tr.toolName === "report_conversation_state")
              );
              if (alreadyReported) {
                return { activeTools: [] as const };
              }

              return {
                activeTools: ["report_conversation_state"] as const,
              };
            },

            onFinish({ steps, text }) {
              const toolNames = steps.flatMap((s) =>
                s.toolResults.map((tr) => tr.toolName)
              );
              debugLog("on-finish", {
                stepCount: steps.length,
                planEmitted,
                conversationStateEmitted,
                toolNames,
                textLength: text.length,
              });

              // If conversation state was already emitted by the tool, skip
              if (conversationStateEmitted) return;

              // Fallback: parse inline JSON metadata block from response text
              const inlineState = extractMetadataFromText(text);
              if (inlineState) {
                debugLog("emit-conversation-state", {
                  source: "inline-json",
                  readyForPlan: inlineState.ready_for_plan,
                  planEmitted,
                });
                writer.write({
                  type: "data-conversation-state",
                  data: inlineState,
                });
                return;
              }

              // Default state if nothing found (skip if plan was generated)
              if (!planEmitted) {
                debugLog("emit-conversation-state", { source: "default" });
                writer.write({
                  type: "data-conversation-state",
                  data: DEFAULT_STATE,
                });
              } else {
                debugLog("skip-conversation-state", { reason: "plan-emitted" });
              }
            },
          });

          writer.merge(result.toUIMessageStream());
          // If we get here without throwing, break out of retry loop
          break;
        } catch (err) {
          lastError = err;
          debugLog("stream-error", {
            attempt,
            error: err instanceof Error ? err.message : String(err),
            retryable: isRetryableError(err),
          });

          if (attempt < MAX_RETRIES && isRetryableError(err)) {
            continue;
          }

          // Non-retryable or exhausted retries — emit error to client
          debugLog("stream-error-final", {
            attempts: attempt + 1,
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
