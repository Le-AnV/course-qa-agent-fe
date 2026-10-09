import { Metadata } from 'next';
import { ChatWindow } from '@/features/chat/components/chat-window';

export const metadata: Metadata = {
  title: 'Q&A Agent',
  description: 'Course Q&A Agent',
};

export default function AgentPage() {
  return (
    <div className="flex flex-col h-[650px] w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden relative">
      {/* 
        Sử dụng nguyên bản Component của team khác (không tự ý thay đổi code của họ) 
      */}
      <ChatWindow />
    </div>
  );
}
