'use client';

import * as React from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { useChatStream } from '@/hooks/use-chat-stream';
import { getSessionDetail } from '@/features/history/api';
import type { ChatMessageItem } from '@/features/history/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Define message type
type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  /** Reasoning steps shown while the answer is produced (and kept collapsed after). */
  trace?: string[];
  thinkingMs?: number;
};

// Initialize chat state
// History is fetched via getSessionDetail(activeSessionId) (Task AI-95)
// History must be filtered by classId - each class has its own chat scope.
const INITIAL_MESSAGES: Message[] = [
  { 
    id: 'welcome-msg', 
    role: 'ai', 
    content: "Hello! I am your course AI assistant. What can I help you with regarding today's lectures or assignments?" 
  }
];

// Suggested starter questions - prevents empty chat window for new users.
const SUGGESTED_QUESTIONS = [
  'What units are covered in this course?',
  'Explain the A* search algorithm?',
  'What reading materials are required for unit 1?',
];

// Retrieval steps surfaced while the agent works. A real backend can stream its
// own trace into the same component.
const THINKING_STEPS = [
  'Searching this class\u2019s materials',
  'Reading the syllabus sections that match',
  'Drafting an answer with citations',
];

export function ChatWindow({
  classId,
  activeSessionId,
  classLabel,
}: {
  classId: string;
  activeSessionId?: string | null;
  /** Real class code/name from the backend; the local mock list is only a fallback. */
  classLabel?: string | null;
}) {
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = React.useState(false); // Waiting state for the first chunk (to show typing indicator)
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  
  // Message ID counter (stable IDs, avoid calling impure fn during render).
  const msgIdRef = React.useRef(0);
  const nextMsgId = React.useCallback(() => {
    msgIdRef.current += 1;
    return `msg-${msgIdRef.current}`;
  }, []);

  // Anchor to reference the bottom of the message list
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load chat session history when activeSessionId changes (AC-07)
  React.useEffect(() => {
    if (!activeSessionId) {
      const timer = setTimeout(() => {
        setMessages(INITIAL_MESSAGES);
        setIsLoadingHistory(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setIsLoadingHistory(true);
      }
    });

    getSessionDetail(activeSessionId)
      .then((detail) => {
        if (!isMounted) return;
        const loaded: Message[] = (detail.messages || []).map((m: ChatMessageItem) => ({
          id: m.id,
          role: m.role.toLowerCase() === 'user' ? 'user' : 'ai',
          content: m.content,
        }));

        setMessages(loaded.length > 0 ? loaded : INITIAL_MESSAGES);
      })
      .catch((err) => {
        console.error('Failed to load session history:', err);
        toast.error('Could not load the conversation history.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSessionId]);


  // Step 3.2: Auto-scroll to bottom on new message
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Step 4.2: Initialize Stream Hook
  const { sendMessage, isStreaming } = useChatStream({
    classId,
    classLabel,
    onChunk: (chunkText, elapsedMs) => {
      // Turn off typing indicator when first chunk arrives
      setIsTyping(false);
      
      // Append new text to the last AI message, and freeze how long the
      // retrieval/thinking phase actually took (measured by the stream hook).
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (!lastMsg || lastMsg.role !== 'ai') return prev;
        
        const updatedMsg: Message = {
          ...lastMsg,
          content: lastMsg.content + chunkText,
          thinkingMs: lastMsg.thinkingMs ?? elapsedMs,
        };
        return [...prev.slice(0, -1), updatedMsg];
      });
    },
    onError: () => {
      setIsTyping(false);
    }
  });

  // Handler for user sending a message
  const handleSend = (text: string) => {
    // 1. Append the user message and a pending AI message carrying the trace,
    //    so the reasoning steps are visible while the answer is produced.
    const newUserMsg: Message = { id: nextMsgId(), role: 'user', content: text };
    const pendingAiMsg: Message = {
      id: nextMsgId(),
      role: 'ai',
      content: '',
      trace: THINKING_STEPS,
    };
    setMessages(prev => [...prev, newUserMsg, pendingAiMsg]);
    
    // 2. Enable AI typing indicator
    setIsTyping(true);

    // 3. Trigger the streaming API hook
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Top area: Message list container (auto-scrolls if long) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#6F6F6F]">
              <Loader2 className="h-6 w-6 animate-spin text-[#6F6F6F]" />
              <span className="text-xs">Loading conversation...</span>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isLastMessage = idx === messages.length - 1;
              const isMessageStreaming = isStreaming && isLastMessage && msg.role === 'ai';
              const isMessagePending = isTyping && isLastMessage && msg.role === 'ai';

              return (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={isMessageStreaming}
                  isLoading={isMessagePending}
                  trace={msg.trace}
                  thinkingMs={msg.thinkingMs}
                />
              );
            })
          )}

          {/* Suggested questions - only visible before user asks anything */}
          {messages.length <= 1 && !isTyping && (
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#5A5A5A] hover:border-[#CFCFCF] hover:text-[#111111] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Empty div serving as an anchor for scrollIntoView */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom area: Message input container (sticky to bottom) */}
      <div className="w-full shrink-0">
        <ChatInput onSend={handleSend} disabled={isTyping || isStreaming} />
      </div>
    </div>
  );
}
