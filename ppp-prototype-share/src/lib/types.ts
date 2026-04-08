import type { UIMessage } from "ai";
import type { LearningPlan, PlanCourse } from "@/lib/plan-types";

export type AppPhase =
  | "entry"
  | "loading"
  | "chatting"
  | "ready_for_plan"
  | "plan_generating"
  | "plan_generated"
  | "viewing_plan";

export type GatheredInfo = {
  goal: string | null;
  skills: string | null;
  background: string | null;
  constraints: string | null;
};

export type StructuredPillData = {
  type: "multi" | "single";
  question: string;
  options: string[];
};

export type ConversationStateData = {
  gathered_info: GatheredInfo;
  ready_for_plan: boolean;
  suggested_pills: StructuredPillData;
};

export type DebugLogEntry = {
  label: string;
  detail?: Record<string, unknown>;
  ts: string;
};

export type ChatUIMessage = UIMessage<
  never,
  {
    "conversation-state": ConversationStateData;
    "plan-generating": { status: string };
    "learning-plan": LearningPlan;
    "plan-updated": { message: string };
    "course-swap": { milestoneId: string; oldCourseId: string; newCourse: PlanCourse };
    "debug-log": DebugLogEntry;
  }
>;
