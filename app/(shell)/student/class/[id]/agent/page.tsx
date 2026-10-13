'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ChatWindow } from '@/features/chat/chat-window';
import { ChatHistorySidebar } from '@/features/history/chat-history-sidebar';

export default function AgentPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const routeParams = useParams();
  const classId = (routeParams?.id as string) || '';
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

  return (
    <div className="flex h-full w-full gap-4">
      {/* Cột Trái: Lịch sử Chat (AI-95) */}
      <ChatHistorySidebar
        classId={classId}
        activeSessionId={activeSessionId}
        onSelectSession={(sessionId) => setActiveSessionId(sessionId)}
        onNewChat={() => setActiveSessionId(null)}
        className="hidden md:flex"
      />

      {/* Cột Giữa: Khung Chat Chính */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden relative">
        {/*
          Mỗi lớp 1 scope chat riêng: classId đi kèm mọi request để BE
          lọc syllabus/tài liệu đúng lớp, tránh lẫn dữ liệu giữa các lớp.
        */}
        <ChatWindow classId={classId} activeSessionId={activeSessionId} />
      </div>

      {/* Cột Phải: Syllabus Focus */}
      <div className="w-72 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hidden lg:flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-sm">
          Syllabus Focus
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center px-4">
            Agent focus content will appear here...
          </p>
        </div>
      </div>
    </div>
  );
}

