import * as React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Giả sử dự án có xài shadcn ui button

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Tự động thay đổi chiều cao của textarea khi gõ nhiều dòng
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    
    onSend(trimmed);
    setContent('');
    
    // Reset chiều cao về mặc định sau khi gửi
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Bước 3.1: Xử lý sự kiện Enter và Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Trường hợp 1: Nhấn Enter (Không đè Shift) -> Gửi tin nhắn
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Chặn trình duyệt tự động chèn dòng mới
      handleSend();       // Thực thi việc đẩy dữ liệu lên
    }
    // Trường hợp 2: Nhấn Enter + Shift (e.key === 'Enter' && e.shiftKey)
    // -> Không gọi preventDefault() để giữ nguyên hành vi mặc định (tự động chèn ký tự \n)
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2 transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Hỏi trợ lý AI bất cứ điều gì về môn học... (Shift + Enter để xuống dòng)"
          className="flex-1 max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm focus:outline-none dark:text-slate-100 placeholder:text-slate-500"
          rows={1}
        />
        <Button 
          onClick={handleSend} 
          disabled={disabled || !content.trim()}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Gửi</span>
        </Button>
      </div>
    </div>
  );
}
