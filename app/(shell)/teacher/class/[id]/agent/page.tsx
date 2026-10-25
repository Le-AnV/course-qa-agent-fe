'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ChatWindow } from '@/features/chat/chat-window';
import { ChatHistorySidebar } from '@/features/history/chat-history-sidebar';

/**
 * Trainer view of the class Q&A chat: same grounded-answer surface students
 * use, scoped to this class, so a trainer can check what the agent answers.
 */
export default function TeacherAgentPage() {
  const routeParams = useParams();
  const classId = (routeParams?.id as string) || '';
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = React.useState(0);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const handleTurnComplete = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setHistoryRefresh((value) => value + 1);
  };

  // Background turns only refresh the sidebar; they never steal the selection.
  const handleBackgroundTurnComplete = () => {
    setHistoryRefresh((value) => value + 1);
  };

  return (
    <div className="flex h-full w-full gap-4 min-h-0 flex-1">
        {/* Left column: chat history (AI-95) */}
        <ChatHistorySidebar
          classId={classId}
          activeSessionId={activeSessionId}
          onSelectSession={(sessionId) => setActiveSessionId(sessionId)}
          onNewChat={() => setActiveSessionId(null)}
          refreshTrigger={historyRefresh}
          mobileOpen={historyOpen}
          onMobileOpenChange={setHistoryOpen}
        />

        {/* Centre column: the chat itself, scoped to this class */}
        <div className="flex-1 flex flex-col bg-[#F7F7F7] border border-[#DADADA] rounded-xl overflow-hidden relative">
          <ChatWindow
            classId={classId}
            activeSessionId={activeSessionId}
            onTurnComplete={handleTurnComplete}
            onBackgroundTurnComplete={handleBackgroundTurnComplete}
            onOpenSession={(sessionId) => setActiveSessionId(sessionId)}
            onNewChat={() => setActiveSessionId(null)}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        </div>

      </div>
  );
}
