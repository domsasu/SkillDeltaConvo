import { ChatSidePanel } from "@/components/lihp/chat-side-panel";
import { usePppChatSidePanel } from "@/hooks/usePppChatSidePanel";

export function CoachChatAside({ onClose }: { onClose: () => void }) {
  const chat = usePppChatSidePanel();

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
