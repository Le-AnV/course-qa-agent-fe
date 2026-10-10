import { Metadata } from 'next';
import { ChatWindow } from '@/features/chat/chat-window';
import { MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Q&A Agent',
  description: 'Course Q&A Agent',
};

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: classId } = await params;
  return (
    <div className="flex h-full w-full gap-4">
      {/* Cột Trái: Lịch sử Chat (Dành cho Task "Save & Display Chat History") */}
      <div className="w-64 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hidden md:flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-sm">
          Chat History
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {/* Mock Data */}
          <button className="flex items-center gap-2 text-sm text-left p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
            <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Explain A* search algorithm</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">What units are in this course?</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">Where are week 1 materials?</span>
          </button>
        </div>
      </div>

      {/* Cột Giữa: Khung Chat Chính */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden relative">
        {/*
          Mỗi lớp 1 scope chat riêng: classId đi kèm mọi request để BE
          lọc syllabus/tài liệu đúng lớp, tránh lẫn dữ liệu giữa các lớp.
        */}
        <ChatWindow classId={classId} />
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
