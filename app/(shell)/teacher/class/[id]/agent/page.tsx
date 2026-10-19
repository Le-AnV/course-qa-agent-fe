'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ChatWindow } from '@/features/chat/chat-window';
import { ChatHistorySidebar } from '@/features/history/chat-history-sidebar';
import { useClassLabel } from '@/features/chat/use-class-label';
import { MockBadge } from '@/components/shared/MockBadge';

/**
 * Trainer view of the class Q&A chat: same grounded-answer surface students
 * use, scoped to this class, so a trainer can check what the agent answers.
 */
export default function TeacherAgentPage() {
  const routeParams = useParams();
  const classId = (routeParams?.id as string) || '';
  const classLabel = useClassLabel(classId);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <MockBadge />
        <p className="text-[11.5px] text-[#5A5A5A]">
          Answers are sample data until the Q&A backend is connected.
        </p>
      </div>
      <div className="flex h-full w-full gap-4 min-h-0 flex-1">
        {/* Left column: chat history (AI-95) */}
        <ChatHistorySidebar
          classId={classId}
          activeSessionId={activeSessionId}
          onSelectSession={(sessionId) => setActiveSessionId(sessionId)}
          onNewChat={() => setActiveSessionId(null)}
          className="hidden md:flex"
        />

        {/* Centre column: the chat itself, scoped to this class */}
        <div className="flex-1 flex flex-col bg-[#F7F7F7] border border-[#DADADA] rounded-xl overflow-hidden relative">
          <ChatWindow classId={classId} activeSessionId={activeSessionId} classLabel={classLabel} />
        </div>

        {/* Right column: syllabus focus */}
        <div className="w-72 flex-shrink-0 bg-[#F7F7F7] border border-[#DADADA] rounded-xl hidden lg:flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#DADADA] font-semibold text-sm text-[#111111]">
            Syllabus Focus
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            <p className="text-sm text-[#6F6F6F] text-center px-4">
              Cited syllabus sections appear here as the agent answers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
