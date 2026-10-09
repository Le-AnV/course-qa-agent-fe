import * as React from 'react';

interface MessageBubbleProps {
  role: 'user' | 'ai';
  content: string;
  isLoading?: boolean;
}

export function MessageBubble({ role, content, isLoading }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-sm' 
            : 'bg-white border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
        }`}
      >
        {/* Nội dung tin nhắn hoặc Hiệu ứng Loading */}
        {isLoading ? (
          // AC-04: Hiệu ứng 3 dấu chấm nhấp nháy (...)
          <div className="flex items-center space-x-1 h-5">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
        )}

        {/* AC-04: Placeholder cho thẻ Citations (Trích dẫn) */}
        {/* Chỉ hiển thị hộp Citation này nếu là tin nhắn của AI và đã load xong nội dung */}
        {!isUser && !isLoading && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex flex-wrap gap-2">
              {/* Đây là vị trí dành sẵn để team Epic E5 nhúng Component của họ vào */}
              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/10">
                [1] Nguồn tài liệu môn học
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
