import { Metadata } from 'next';
import { ChatWindow } from '@/features/chat/chat-window';

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
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden relative">
      {/*
        Mỗi lớp 1 scope chat riêng: classId đi kèm mọi request để BE
        lọc syllabus/tài liệu đúng lớp, tránh lẫn dữ liệu giữa các lớp.
      */}
      <ChatWindow classId={classId} />
    </div>
  );
}
