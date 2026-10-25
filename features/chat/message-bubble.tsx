'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ThinkingTrace } from './thinking-trace';
import { ChatMarkdown } from './chat-markdown';
import { CitationChip } from '@/features/citations/citation-chip';
import { citationKey } from '@/lib/citations';
import type { ChatCitation } from '@/lib/sse';

const subscribeNoop = () => () => {};

interface MessageBubbleProps {
  role: 'user' | 'ai';
  content: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  /** Reasoning steps recorded while this answer was being produced. */
  trace?: string[] | null;
  traceStep?: number;
  traceCompleted?: boolean;
  thinkingMs?: number;
  citations?: ChatCitation[];
  isError?: boolean;
  renderMarkdown?: boolean;
  chatSurface?: boolean;
}

export function MessageBubble({
  role,
  content,
  isLoading,
  isStreaming,
  trace,
  traceStep,
  traceCompleted,
  thinkingMs,
  citations = [],
  isError = false,
  renderMarkdown = false,
  chatSurface = false,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const reduceMotion = useReducedMotion();
  // Messages already present at hydration (history, landing preview) render
  // as-is; only messages that mount later animate in.
  const hydrated = React.useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <motion.div
      initial={!hydrated || reduceMotion ? false : { opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`min-w-0 max-w-[92%] break-words rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#F7F7F7] text-[#111111] rounded-tr-sm'
            : `bg-white border border-[#DADADA] text-[#111111] rounded-tl-sm ${chatSurface ? '' : 'shadow-xs'}`
        }`}
      >
        {/* Reasoning trace: live while thinking, collapsed summary afterwards */}
        {!isUser && trace && trace.length > 0 && (
          <ThinkingTrace
            steps={trace}
            activeStep={traceStep}
            completed={traceCompleted}
            running={isLoading || isStreaming}
            thinkingMs={thinkingMs}
          />
        )}

        {/* Message content (a waiting answer shows no bubble body yet) */}
        {isLoading && !trace?.length ? null : (
          <div
            role={isError ? 'alert' : undefined}
            className={`whitespace-pre-wrap text-sm leading-relaxed ${isError ? 'text-red-700' : ''}`}
          >
            {renderMarkdown ? <ChatMarkdown content={content} /> : content}
          </div>
        )}

        {/* Citations — rendered once the answer has finished streaming */}
        {!isUser && !isLoading && !isStreaming && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
            <div className="flex flex-wrap gap-2" aria-label="Sources">
              {citations.map((citation, position) => (
                <CitationChip
                  key={`${citationKey(citation)}-${position}`}
                  citation={citation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
