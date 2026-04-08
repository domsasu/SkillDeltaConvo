"use client";

import type { GatheredInfo } from "@/lib/types";
import type { LearningPlan } from "@/lib/plan-types";
import { SparkleIcon } from "@/components/shared/sparkle-icon";
import { LearningPlanBanner } from "@/components/lihp/learning-plan-banner";

interface ProgressivePlanModuleProps {
  gatheredInfo: GatheredInfo;
  plan: LearningPlan | null;
  isGenerating?: boolean;
  isRefining?: boolean;
  onViewPlan: () => void;
  pendingRemovals?: Set<string>;
  swapDisabled?: boolean;
  onRemoveCourse?: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
  onExploreAlternatives?: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
}

type StepStatus = "completed" | "active" | "pending";

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + "\u2026" : text;
}

function AssignmentCompleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.41667 12.8333C9.96049 12.8333 12.8333 9.96049 12.8333 6.41667C12.8333 2.87284 9.96049 0 6.41667 0C2.87284 0 0 2.87284 0 6.41667C0 9.96049 2.87284 12.8333 6.41667 12.8333ZM8.93801 4.21465L5.2302 7.92247L3.67708 6.3584C3.58958 6.2709 3.48567 6.22715 3.36536 6.22715C3.24505 6.22715 3.14114 6.2709 3.05364 6.3584C2.96614 6.4459 2.92057 6.54981 2.91692 6.67012C2.91328 6.79044 2.9552 6.89434 3.0427 6.98184L4.92395 8.86309C5.01145 8.95059 5.11354 8.99434 5.2302 8.99434C5.34687 8.99434 5.44895 8.95059 5.53645 8.86309L9.55052 4.83809C9.63802 4.75059 9.68177 4.64669 9.68177 4.52637C9.68177 4.40606 9.63802 4.30215 9.55052 4.21465C9.46302 4.12715 9.36093 4.0834 9.24427 4.0834C9.1276 4.0834 9.02552 4.12715 8.93801 4.21465Z" fill="#c1cad9"/>
    </svg>
  );
}

const GRADIENT_STYLE = {
  backgroundImage:
    "linear-gradient(142deg, #3587fc 9%, #4a0fab 56%, #8040ed 91%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
} as const;

function StatusItem({
  status,
  label,
}: {
  status: StepStatus;
  label: string;
}) {
  if (status === "completed") {
    return (
      <span className="flex items-center gap-1 text-sm text-[#404b61]">
        <AssignmentCompleteIcon className="shrink-0" />
        {label}
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="text-sm" style={GRADIENT_STYLE}>
        {label}
      </span>
    );
  }
  return <span className="text-sm text-[#c1cad9]">{label}</span>;
}

function DotSep() {
  return <span className="text-xs text-[#c1cad9]">{"\u2022"}</span>;
}

export function ProgressivePlanModule({
  gatheredInfo,
  plan,
  isGenerating = false,
  isRefining = false,
  onViewPlan,
  pendingRemovals,
  swapDisabled,
  onRemoveCourse,
  onExploreAlternatives,
}: ProgressivePlanModuleProps) {
  // Determine step statuses
  const goalStatus: StepStatus = gatheredInfo.goal
    ? "completed"
    : "active";
  const skillsStatus: StepStatus = gatheredInfo.skills
    ? "completed"
    : gatheredInfo.goal
      ? "active"
      : "pending";
  const timelineStatus: StepStatus = gatheredInfo.constraints
    ? "completed"
    : gatheredInfo.skills
      ? "active"
      : "pending";

  const goalLabel = gatheredInfo.goal
    ? truncate(gatheredInfo.goal, 50)
    : "Adding your goal...";
  const skillsLabel = gatheredInfo.skills
    ? truncate(gatheredInfo.skills, 40)
    : "Skills";
  const timelineLabel = gatheredInfo.constraints
    ? truncate(gatheredInfo.constraints, 40)
    : "Timeframe";

  // State 4: show LearningPlanBanner
  if (plan) {
    return (
      <LearningPlanBanner
        plan={plan}
        onViewPlan={onViewPlan}
        pendingRemovals={pendingRemovals}
        swapDisabled={swapDisabled}
        isRefining={isRefining}
        onRemoveCourse={onRemoveCourse}
        onExploreAlternatives={onExploreAlternatives}
      />
    );
  }

  // Derive title from gathered info
  const title = gatheredInfo.goal
    ? `Your ${truncate(gatheredInfo.goal, 40)} learning plan`
    : "Your learning plan";

  // States 1-3: progressive status (or generating skeleton)
  return (
    <div className="rounded-2xl bg-[#f0f6ff] p-5">
      <div className="flex flex-col gap-[11px]">
        <SparkleIcon className="h-3 w-3" />
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <p className="text-xl font-semibold leading-6 tracking-tight text-black">
              {title}
            </p>
            <div className="flex items-center gap-2">
              <StatusItem status={goalStatus} label={goalLabel} />
              <DotSep />
              <StatusItem status={skillsStatus} label={skillsLabel} />
              <DotSep />
              <StatusItem status={timelineStatus} label={timelineLabel} />
            </div>
          </div>
          {isGenerating && (
            <button className="shrink-0 rounded-lg bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white">
              Start learning plan
            </button>
          )}
        </div>
        {isGenerating && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[80px] w-full rounded-2xl"
                style={{
                  background: `linear-gradient(to right, white, #e3eeff ${30 + i * 20}%, white)`,
                  animation: "shimmer 2s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
