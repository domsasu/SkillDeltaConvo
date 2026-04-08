"use client";

import type { LearningPlan } from "@/lib/plan-types";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { MilestoneSection } from "./milestone-section";
import { PlanSummaryBar } from "./plan-summary-bar";

interface PlanViewProps {
  plan: LearningPlan;
  onBack: () => void;
}

export function PlanView({ plan, onBack }: PlanViewProps) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#0056d2] hover:underline"
      >
        <ArrowLeft size={14} />
        Back to home
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#0f1114]">{plan.title}</h1>
        <button className="flex items-center gap-2 rounded-full bg-[#0056d2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0048b0] transition-colors">
          Start learning plan
          <ChevronRight size={14} />
        </button>
      </div>

      <PlanSummaryBar
        role={plan.summary.role}
        skills={plan.summary.skills}
        duration={plan.summary.totalDuration}
        hoursPerWeek={plan.summary.hoursPerWeek}
      />

      <div className="space-y-6">
        {plan.milestones.map((milestone, idx) => (
          <MilestoneSection
            key={milestone.id}
            milestone={milestone}
            isFirstMilestone={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}
