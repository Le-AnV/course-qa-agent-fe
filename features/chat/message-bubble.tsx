import * as React from 'react';
import { ThinkingTrace } from './thinking-trace';

interface MessageBubbleProps {
  role: 'user' | 'ai';
  content: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  /** Reasoning steps recorded while this answer was being produced. */
  trace?: string[] | null;
  thinkingMs?: number;
}

export function MessageBubble({
  role,
  content,
  isLoading,
  isStreaming,
  trace,
  thinkingMs,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-[#F7F7F7] text-[#111111] rounded-tr-sm' 
            : 'bg-white border border-[#DADADA] text-[#111111] rounded-tl-sm shadow-xs'
        }`}
      >
        {/* Reasoning trace: live while thinking, collapsed summary afterwards */}
        {!isUser && trace && trace.length > 0 && (
          <ThinkingTrace steps={trace} running={isLoading} thinkingMs={thinkingMs} />
        )}

        {/* Message content (a waiting answer shows no bubble body yet) */}
        {isLoading && !trace?.length ? null : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
        )}

        {/* Citations — rendered once the answer has finished streaming */}
        {!isUser && !isLoading && !isStreaming && content.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md bg-[#F7F7F7] px-2 py-1 text-xs font-medium text-[#5A5A5A] ring-1 ring-inset ring-[#DADADA]">
                [1] Course Material Source
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
