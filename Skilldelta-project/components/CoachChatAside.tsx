import { useEffect, useRef } from "react";
import { ChatSidePanel } from "@/components/lihp/chat-side-panel";
import { useSavedSkillGapCourses } from "@/contexts/saved-skill-gap-courses-context";
import { usePppChatSidePanel } from "@/hooks/usePppChatSidePanel";

export type CoachLaunchRequest = { id: number; text: string };

export function CoachChatAside({
  onClose,
  launchRequest,
  onConsumedLaunchRequest,
}: {
  onClose: () => void;
  launchRequest?: CoachLaunchRequest | null;
  onConsumedLaunchRequest?: () => void;
}) {
  const { setJobContextForSkillGapSaves } = useSavedSkillGapCourses();
  const chat = usePppChatSidePanel({
    onLinkedInJobContext: setJobContextForSkillGapSaves,
  });

  const processedLaunchIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!launchRequest || !onConsumedLaunchRequest) return;
    if (processedLaunchIdRef.current === launchRequest.id) return;
    processedLaunchIdRef.current = launchRequest.id;
    chat.onSend(launchRequest.text);
    onConsumedLaunchRequest();
  }, [launchRequest, chat.onSend, onConsumedLaunchRequest]);

  return (
    <ChatSidePanel
      messages={chat.messages}
      status={chat.status}
      error={chat.error}
      suggestedPills={chat.suggestedPills}
      phase={chat.phase}
      isRefining={chat.isRefining}
      planIndicators={chat.planIndicators}
      stripQuestions={chat.stripQuestions}
      pendingLocalReply={chat.pendingLocalReply}
      uploadError={chat.uploadError}
      clearUploadError={chat.clearUploadError}
      onResumeSubmit={chat.onResumeSubmit}
      onSend={chat.onSend}
      onRetry={chat.onRetry}
      onClose={onClose}
    />
  );
}
