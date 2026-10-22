'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ChatWindow } from '@/features/chat/chat-window';
import { ChatHistorySidebar } from '@/features/history/chat-history-sidebar';

export default function AgentPage() {
  const routeParams = useParams();
  const classId = (routeParams?.id as string) || '';
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

  return (
    <div className="flex h-full w-full gap-4 min-h-0 flex-1">
      {/* Cột Trái: Lịch sử Chat (AI-95) */}
      <ChatHistorySidebar
        classId={classId}
        activeSessionId={activeSessionId}
        onSelectSession={(sessionId) => setActiveSessionId(sessionId)}
        onNewChat={() => setActiveSessionId(null)}
        className="hidden md:flex"
      />

      {/* Cột Giữa: Khung Chat Chính */}
      <div className="flex-1 flex flex-col bg-[#F7F7F7] border border-[#DADADA] rounded-xl overflow-hidden relative">
        {/*
          Mỗi lớp 1 scope chat riêng: classId đi kèm mọi request để BE
          lọc syllabus/tài liệu đúng lớp, tránh lẫn dữ liệu giữa các lớp.
        */}
        <ChatWindow classId={classId} activeSessionId={activeSessionId} />
      </div>

    </div>
  );
}

