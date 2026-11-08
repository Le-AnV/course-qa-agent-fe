'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ChatWindow } from '@/features/chat/chat-window';
import { ChatHistorySidebar } from '@/features/history/chat-history-sidebar';
import { useHistoryPanel } from '@/features/history/use-history-panel';
import { usePersistedChatSession } from '@/features/chat/use-persisted-chat-session';

export default function AgentPage() {
  const routeParams = useParams();
  const classId = (routeParams?.id as string) || '';
  const { activeSessionId, setActiveSessionId, startNewChat } = usePersistedChatSession(
    'student',
    classId,
  );
  const [historyRefresh, setHistoryRefresh] = React.useState(0);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const { isCollapsed: historyCollapsed, setCollapsed: setHistoryCollapsed } = useHistoryPanel();

  const handleTurnComplete = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setHistoryRefresh((value) => value + 1);
  };

  // Background turns only refresh the sidebar; they never steal the selection.
  const handleBackgroundTurnComplete = () => {
    setHistoryRefresh((value) => value + 1);
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-1 overflow-hidden rounded-xl border border-[#DADADA] bg-white">
      {/* GPT-style workspace: history sits inside the same surface and slides away. */}
      <ChatHistorySidebar
        classId={classId}
        activeSessionId={activeSessionId}
        onSelectSession={(sessionId) => setActiveSessionId(sessionId)}
        onNewChat={startNewChat}
        refreshTrigger={historyRefresh}
        side="left"
        collapsed={historyCollapsed}
        onExpand={() => setHistoryCollapsed(false)}
        mobileOpen={historyOpen}
        onMobileOpenChange={setHistoryOpen}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatWindow
          classId={classId}
          canOpenTicket
          activeSessionId={activeSessionId}
          onTurnComplete={handleTurnComplete}
          onBackgroundTurnComplete={handleBackgroundTurnComplete}
          onOpenSession={(sessionId) => setActiveSessionId(sessionId)}
          onNewChat={startNewChat}
          onOpenHistory={() => setHistoryOpen(true)}
          historyCollapsed={historyCollapsed}
          onToggleHistory={() => setHistoryCollapsed(!historyCollapsed)}
        />
      </div>
    </div>
  );
}

