'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ChatWindow } from '@/features/chat/chat-window';
import { ChatHistorySidebar } from '@/features/history/chat-history-sidebar';

export default function AgentPage() {
  const routeParams = useParams();
  const classId = (routeParams?.id as string) || '';
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = React.useState(0);

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
      {/* Cột Trái: Lịch sử Chat (AI-95) */}
      <ChatHistorySidebar
        classId={classId}
        activeSessionId={activeSessionId}
        onSelectSession={(sessionId) => setActiveSessionId(sessionId)}
        onNewChat={() => setActiveSessionId(null)}
        refreshTrigger={historyRefresh}
        className="hidden md:flex"
      />

      {/* Cột Giữa: Khung Chat Chính */}
      <div className="flex-1 flex flex-col bg-[#F7F7F7] border border-[#DADADA] rounded-xl overflow-hidden relative">
        {/*
          Mỗi lớp 1 scope chat riêng: classId đi kèm mọi request để BE
          lọc syllabus/tài liệu đúng lớp, tránh lẫn dữ liệu giữa các lớp.
        */}
        <ChatWindow
          classId={classId}
          activeSessionId={activeSessionId}
          onTurnComplete={handleTurnComplete}
          onBackgroundTurnComplete={handleBackgroundTurnComplete}
          onOpenSession={(sessionId) => setActiveSessionId(sessionId)}
          onNewChat={() => setActiveSessionId(null)}
        />
      </div>

    </div>
  );
}

