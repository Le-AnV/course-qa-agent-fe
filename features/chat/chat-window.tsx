'use client';

import * as React from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { useChatStream } from '@/hooks/use-chat-stream';
import { getClassById } from '@/lib/classes';

// Define message type
type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

// Initialize chat state
// TODO (Task AI-95): Remove this and replace with chat history API call (GET /api/history)
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

export function ChatWindow({ classId }: { classId: string }) {
  const cls = getClassById(classId);
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = React.useState(false); // Waiting state for the first chunk (to show typing indicator)
  
  // Message ID counter (stable IDs, avoid calling impure fn during render).
  const msgIdRef = React.useRef(0);
  const nextMsgId = React.useCallback(() => {
    msgIdRef.current += 1;
    return `msg-${msgIdRef.current}`;
  }, []);

  // Anchor to reference the bottom of the message list
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Step 3.2: Auto-scroll to bottom on new message
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Step 4.2: Initialize Stream Hook
  const { sendMessage, isStreaming } = useChatStream({
    classId,
    onChunk: (chunkText) => {
      // Turn off typing indicator when first chunk arrives
      setIsTyping(false);
      
      // Append new text to the last AI message
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

  // Handler for user sending a message
  const handleSend = (text: string) => {
    // 1. Append User message AND an empty AI message to the list
    const newUserMsg: Message = { id: nextMsgId(), role: 'user', content: text };
    const emptyAiMsg: Message = { id: nextMsgId(), role: 'ai', content: '' };
    setMessages(prev => [...prev, newUserMsg, emptyAiMsg]);
    
    // 2. Enable AI typing indicator
    setIsTyping(true);

    // 3. Trigger the streaming API hook
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Class scope badge: lets user know AI is answering based on this class's context */}
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
            · AI uses only this class&apos;s materials
          </span>
        </div>
      </div>

      {/* Top area: Message list container (auto-scrolls if long) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
            />
          ))}

          {/* Suggested questions - only visible before user asks anything */}
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
          
          {/* Show empty AI bubble with loading effect while waiting for API */}
          {isTyping && (
            <MessageBubble 
              role="ai" 
              content="" 
              isLoading={true} 
            />
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
