import * as React from 'react';
import { CitationChip } from '@/features/citations/citation-chip';
import type { ChatCitation } from '@/lib/sse';

interface MessageBubbleProps {
  role: 'user' | 'ai';
  content: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  citations?: ChatCitation[];
}

export function MessageBubble({ role, content, isLoading, isStreaming, citations = [] }: MessageBubbleProps) {
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
        {/* Message content or Loading indicator */}
        {isLoading ? (
          // AC-04: Pulsing dots typing indicator (...)
          <div className="flex items-center space-x-1 h-5">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
            {isStreaming && (
              <span 
                aria-hidden="true"
                className="inline-block w-1.5 h-4 ml-1 bg-blue-600 dark:bg-blue-400 align-middle animate-pulse rounded-xs" 
              />
            )}
          </div>
        )}

        {!isUser && !isLoading && !isStreaming && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex flex-wrap gap-2">
              {citations.map((citation) => (
                <CitationChip key={`${citation.marker}-${citation.document_id}`} citation={citation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
