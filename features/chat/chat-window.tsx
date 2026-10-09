'use client';

import * as React from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { useChatStream } from '@/hooks/use-chat-stream';
import { getClassById } from '@/lib/classes';

// Định nghĩa kiểu dữ liệu cho 1 tin nhắn
type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

// Khởi tạo trạng thái ban đầu của khung chat
// TODO (Task AI-95): Xóa dòng này và thay bằng API gọi lịch sử hội thoại (GET /api/history)
// Lịch sử cũng phải lọc theo classId — mỗi lớp 1 cuộc hội thoại riêng.
const INITIAL_MESSAGES: Message[] = [
  { 
    id: 'welcome-msg', 
    role: 'ai', 
    content: 'Xin chào! Mình là trợ lý AI môn học. Bạn cần mình giải đáp gì về bài giảng hay bài tập hôm nay?' 
  }
];

// Gợi ý câu hỏi khởi đầu — user mới đỡ nhìn khung chat trống.
const SUGGESTED_QUESTIONS = [
  'Môn học này có những unit nào?',
  'Giải thích thuật toán A* search?',
  'Tài liệu nào cần đọc cho unit 1?',
];

export function ChatWindow({ classId }: { classId: string }) {
  const cls = getClassById(classId);
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = React.useState(false); // Trạng thái chờ cụm từ đầu tiên (để hiện 3 dấu chấm)
  
  // Counter cho id tin nhắn (id ổn định, không gọi impure fn trong render).
  const msgIdRef = React.useRef(0);
  const nextMsgId = React.useCallback(() => {
    msgIdRef.current += 1;
    return `msg-${msgIdRef.current}`;
  }, []);

  // Mỏ neo dùng để tham chiếu tới vị trí cuối cùng của danh sách
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Bước 3.2: Tự động cuộn xuống cuối (Auto-scroll) mỗi khi có tin nhắn mới
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Bước 4.2: Khởi tạo Hook đọc Stream
  const { sendMessage, isStreaming } = useChatStream({
    classId,
    onChunk: (chunkText) => {
      // Khi nhận được mảnh chữ đầu tiên, lập tức tắt 3 dấu chấm loading đi
      setIsTyping(false);
      
      // Móc chữ mới nối vào đuôi của tin nhắn AI cuối cùng
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (!lastMsg || lastMsg.role !== 'ai') return prev;
        
        const updatedMsg = { ...lastMsg, content: lastMsg.content + chunkText };
        return [...prev.slice(0, -1), updatedMsg];
      });
    },
    onError: () => {
      setIsTyping(false);
    }
  });

  // Hàm xử lý khi user bấm Enter gửi chữ
  const handleSend = (text: string) => {
    // 1. Nhét câu hỏi của User VÀ một tin nhắn AI rỗng vào danh sách
    const newUserMsg: Message = { id: nextMsgId(), role: 'user', content: text };
    const emptyAiMsg: Message = { id: nextMsgId(), role: 'ai', content: '' };
    setMessages(prev => [...prev, newUserMsg, emptyAiMsg]);
    
    // 2. Bật hiệu ứng AI đang suy nghĩ chờ phản hồi (3 dấu chấm)
    setIsTyping(true);

    // 3. Kích hoạt Hook gọi API luồng
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Badge scope lớp: user luôn biết AI đang trả lời theo tài liệu lớp nào */}
      <div className="shrink-0 px-4 md:px-6 pt-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: cls?.accentColor ?? '#2563EB' }}
          />
          <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 truncate">
            {cls ? `${cls.code} · ${cls.title}` : `Class ${classId}`}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
            · AI chỉ dùng tài liệu lớp này
          </span>
        </div>
      </div>

      {/* Vùng trên: Khung danh sách tin nhắn (Tự động xuất hiện thanh cuộn nếu dài) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
            />
          ))}

          {/* Gợi ý câu hỏi — chỉ hiện khi chưa hỏi gì (ngoài tin chào) */}
          {messages.length <= 1 && !isTyping && (
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[12.5px] font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          
          {/* Nếu đang gọi API thì hiện thêm một bong bóng AI trống với hiệu ứng loading */}
          {isTyping && (
            <MessageBubble 
              role="ai" 
              content="" 
              isLoading={true} 
            />
          )}

          {/* Thẻ div rỗng dùng làm mỏ neo (anchor) để hàm scrollIntoView có chỗ trỏ tới */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Vùng dưới: Khung nhập tin nhắn (Luôn dính dưới đáy) */}
      <div className="w-full shrink-0">
        <ChatInput onSend={handleSend} disabled={isTyping || isStreaming} />
      </div>
    </div>
  );
}
