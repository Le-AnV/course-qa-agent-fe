import { Metadata } from 'next';
import { ChatWindow } from '@/components/chat/chat-window';

export const metadata: Metadata = {
  title: 'Hỏi đáp AI | Course Q&A',
  description: 'Giao diện tương tác hỏi đáp với trợ lý AI',
};

export default function ChatPage() {
  return (
    // Thay h-full thành tính toán chiều cao (100vh trừ đi Navbar và Padding) để khóa cứng khung chat
    // Thêm overflow-hidden để đảm bảo chỉ có danh sách tin nhắn bên trong được phép cuộn
    <div className="flex flex-col h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)] bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {/* Đã import ChatWindow từ Bước 2.4 */}
      <ChatWindow />
    </div>
  );
}
