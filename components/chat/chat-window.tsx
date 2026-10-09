'use client';

import * as React from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { useChatStream } from '@/hooks/use-chat-stream';

// Định nghĩa kiểu dữ liệu cho 1 tin nhắn
type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

// Khởi tạo trạng thái ban đầu của khung chat
// TODO (Task AI-95): Xóa dòng này và thay bằng API gọi lịch sử hội thoại (GET /api/history)
const INITIAL_MESSAGES: Message[] = [
  { 
    id: 'welcome-msg', 
    role: 'ai', 
    content: 'Xin chào! Mình là trợ lý AI môn học. Bạn cần mình giải đáp gì về bài giảng hay bài tập hôm nay?' 
  }
];

export function ChatWindow() {
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = React.useState(false); // Trạng thái chờ cụm từ đầu tiên (để hiện 3 dấu chấm)
  
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
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const emptyAiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: '' };
    setMessages(prev => [...prev, newUserMsg, emptyAiMsg]);
    
    // 2. Bật hiệu ứng AI đang suy nghĩ chờ phản hồi (3 dấu chấm)
    setIsTyping(true);

    // 3. Kích hoạt Hook gọi API luồng
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full relative">
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
