"use client";

import type { ChatStatus } from "ai";
import type { AppPhase, ChatUIMessage, GatheredInfo, StructuredPillData } from "@/lib/types";
import type { LearningPlan } from "@/lib/plan-types";
import { LihpHeader } from "@/components/lihp/lihp-header";
import { ProgressivePlanModule } from "@/components/lihp/progressive-plan-module";
import { TrendingSection } from "@/components/lihp/trending-section";
import { SkillsSection } from "@/components/lihp/skills-section";
import { CollectionSection } from "@/components/lihp/collection-section";
import { ChatSidePanel } from "@/components/lihp/chat-side-panel";

interface LihpPageProps {
  messages: ChatUIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  suggestedPills: StructuredPillData;
  gatheredInfo: GatheredInfo;
  plan: LearningPlan | null;
  phase: AppPhase;
  viewingPlan: boolean;
  onViewPlan: () => void;
  onBackToHome: () => void;
  onSend: (text: string) => void;
  onRetry: () => void;
  pendingRemovals: Set<string>;
  isRefining: boolean;
  planIndicators: Map<number, "created" | "rebuilt" | "swapped">;
  stripQuestions?: boolean;
  swapDisabled?: boolean;
  onRemoveCourse: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
  onExploreAlternatives: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
}

export function LihpPage({
  messages,
  status,
  error,
  suggestedPills,
  gatheredInfo,
  plan,
  phase,
  viewingPlan,
  onViewPlan,
  onBackToHome,
  onSend,
  onRetry,
  pendingRemovals,
  isRefining,
  planIndicators,
  stripQuestions,
  swapDisabled,
  onRemoveCourse,
  onExploreAlternatives,
}: LihpPageProps) {
  return (
    <div className="flex h-screen flex-col bg-white">
      <LihpHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Main LIHP content - scrollable */}
        <main className="flex-1 overflow-y-auto border-r border-[#dae1ed]">
          <div className="px-8 py-6">
            <div className="mx-auto max-w-[860px]">
              <div className="space-y-8">
                {/* Progressive plan module — shows status during conversation, expands to full plan when ready */}
                <ProgressivePlanModule
                  gatheredInfo={gatheredInfo}
                  plan={plan}
                  isGenerating={phase === "plan_generating"}
                  isRefining={isRefining}
                  onViewPlan={onViewPlan}
                  pendingRemovals={pendingRemovals}
                  swapDisabled={swapDisabled}
                  onRemoveCourse={onRemoveCourse}
                  onExploreAlternatives={onExploreAlternatives}
                />
                {/* LIHP content always visible */}
                <TrendingSection />
                <SkillsSection />
                <CollectionSection />
              </div>
            </div>
          </div>
        </main>

        {/* Chat side panel */}
        <aside className="flex w-[400px] shrink-0 flex-col bg-white">
          <ChatSidePanel
            messages={messages}
            status={status}
            error={error}
            suggestedPills={suggestedPills}
            phase={phase}
            isRefining={isRefining}
            planIndicators={planIndicators}
            stripQuestions={stripQuestions}
            onSend={onSend}
            onRetry={onRetry}
          />
        </aside>
      </div>
    </div>
  );
}
