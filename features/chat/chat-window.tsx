'use client';

import * as React from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { SuggestedQuestions } from './suggested-questions';
import { useChatStream } from '@/hooks/use-chat-stream';
import { getSessionDetail } from '@/features/history/api';
import { mergeCitation, uniqueCitations } from '@/lib/citations';
import type { ChatMessageCitation, ChatMessageItem } from '@/features/history/types';
import { History, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ChatCitation, ChatProgressStage } from '@/lib/sse';

// Define message type
type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  /** Reasoning steps shown while the answer is produced (and kept collapsed after). */
  trace?: string[];
  traceStep?: number;
  traceCompleted?: boolean;
  thinkingMs?: number;
  citations?: ChatCitation[];
  suggestedQuestions?: string[];
  isError?: boolean;
};

/**
 * One in-flight answer. It is intentionally independent from the currently
 * selected conversation so switching sessions does not abort or lose it.
 */
type StreamContext = {
  /** Session key used while the answer is produced; NEW_CHAT_KEY until created. */
  key: string;
  /** Real backend session id, null while the first turn is still being created. */
  sessionId: string | null;
  /** Transcript before the user message was appended. */
  baseMessages: Message[];
  userMessage: Message;
  answer: Message;
  completed: boolean;
};

const NEW_CHAT_KEY = '__new_chat__';

/**
 * Render-safe snapshot of the in-flight stream. The ref below stays the source
 * of truth for stream callbacks; this state only mirrors what the current
 * render needs so we never read a ref during render.
 */
type StreamSnapshot = {
  key: string;
  sessionId: string | null;
  answerId: string;
};

function transcriptForContext(context: StreamContext): Message[] {
  return [...context.baseMessages, context.userMessage, context.answer];
}

// Initialize chat state
// History is fetched via getSessionDetail(activeSessionId) (Task AI-95, AI-97)
// History must be filtered by classId - each class has its own chat scope.
const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome-msg',
    role: 'ai',
    content: "Hello! I am your course AI assistant. What can I help you with regarding today's lectures or assignments?",
  },
];

// Progress stages emitted by the class chat SSE stream.
const THINKING_STEPS = [
  'Searching class materials',
  'Reviewing matching sections',
  'Synthesizing answer',
];
const THINKING_STEP_INDEX: Record<ChatProgressStage, number> = {
  searching: 0,
  reading: 1,
  drafting: 2,
};

function mapHistoryCitation(citation: ChatMessageCitation): ChatCitation {
  return {
    index: citation.index,
    kind: citation.kind === 'internet' ? 'internet' : 'curriculum',
    title: citation.title,
    url: citation.url ?? null,
    snippet: citation.snippet ?? '',
    documentId: citation.document_id ?? null,
    page: citation.page ?? null,
    indexes: citation.index ? [citation.index] : [],
    highlights: [],
  };
}

export function ChatWindow({
  classId,
  activeSessionId,
  onTurnComplete,
  onBackgroundTurnComplete,
  onOpenSession,
  onNewChat,
  onOpenHistory,
}: {
  classId: string;
  activeSessionId?: string | null;
  /** Called when the selected conversation's turn is persisted. */
  onTurnComplete?: (sessionId: string) => void;
  /** Called when a background turn finishes so the sidebar can refresh only. */
  onBackgroundTurnComplete?: (sessionId: string) => void;
  /** Lets the background-answer banner return to the conversation. */
  onOpenSession?: (sessionId: string) => void;
  /** Lets the banner return to a first-turn conversation that has no id yet. */
  onNewChat?: () => void;
  /** Mobile only: opens the chat-history drawer (the panel is hidden < md). */
  onOpenHistory?: () => void;
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

  // The answer currently being produced, even if the user opens another chat.
  const streamContextRef = React.useRef<StreamContext | null>(null);
  // Render mirror of the ref above; keeps ref access out of the render phase.
  const [streamSnapshot, setStreamSnapshot] = React.useState<StreamSnapshot | null>(null);
  // True until the SSE response is fully closed (suggestions arrive after
  // `done`, so the live transcript must survive that window).
  const streamActiveRef = React.useRef(false);

  const currentKey = activeSessionId ?? NEW_CHAT_KEY;
  // Stream callbacks are created at send time; this ref always tells them which
  // conversation is actually on screen right now.
  const currentKeyRef = React.useRef(currentKey);
  React.useEffect(() => {
    currentKeyRef.current = currentKey;
  }, [currentKey]);

  // Anchor to reference the bottom of the message list
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Keep the typing indicator tied to the conversation that owns the stream.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const context = streamContextRef.current;
      const key = activeSessionId ?? NEW_CHAT_KEY;
      setIsTyping(
        Boolean(
          context &&
            context.key === key &&
            !context.completed &&
            !context.answer.content,
        ),
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [activeSessionId]);

  // Load chat session history when activeSessionId changes (AC-07).
  // If the selected conversation owns the live answer, render that local
  // transcript instead: refetching would temporarily hide the streamed text.
  React.useEffect(() => {
    const key = activeSessionId ?? NEW_CHAT_KEY;
    const context = streamContextRef.current;

    if (context && context.key === key) {
      const timer = setTimeout(() => {
        setMessages(transcriptForContext(context));
        setIsLoadingHistory(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    // A finished background answer is already persisted. Drop the local copy;
    // the next visit can load the canonical transcript from the server.
    if (context?.completed && !streamActiveRef.current) {
      streamContextRef.current = null;
      setStreamSnapshot(null);
    }

    if (!activeSessionId) {
      if (context && context.key !== NEW_CHAT_KEY) {
        streamContextRef.current = null;
        setStreamSnapshot(null);
      }
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
          citations: uniqueCitations((m.citations ?? []).map(mapHistoryCitation)),
          suggestedQuestions: Array.isArray(m.suggested_questions) ? m.suggested_questions : undefined,
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

  const updateStreamAnswer = React.useCallback(
    (updater: (message: Message) => Message) => {
      const context = streamContextRef.current;
      if (!context) return;

      const nextAnswer = updater(context.answer);
      context.answer = nextAnswer;

      // Background answers only update their context; the visible transcript
      // belongs to another conversation and must not be touched.
      if (currentKeyRef.current !== context.key) return;

      setMessages((prev) =>
        prev.map((message) =>
          message.id === nextAnswer.id ? nextAnswer : message,
        ),
      );
    },
    [],
  );

  // Step 4.2: Initialize Stream Hook
  const { sendMessage, isStreaming } = useChatStream({
    classId,
    sessionId: activeSessionId,
    onProgress: (stage, stageMessage) => {
      const stepIdx = THINKING_STEP_INDEX[stage];
      updateStreamAnswer((message) => {
        const nextTrace = message.trace ? [...message.trace] : [...THINKING_STEPS];
        if (stageMessage) {
          nextTrace[stepIdx] = stageMessage;
        }
        return {
          ...message,
          trace: nextTrace,
          traceStep: stepIdx,
        };
      });
    },
    onChunk: (chunkText, elapsedMs) => {
      // Turn off typing indicator when first chunk arrives
      setIsTyping(false);

      // Append new text to the pending AI message, and freeze how long the
      // retrieval/thinking phase actually took (measured by the stream hook).
      updateStreamAnswer((message) => ({
        ...message,
        content: message.content + chunkText,
        thinkingMs: message.thinkingMs ?? elapsedMs,
      }));
    },
    onRestart: () => {
      setIsTyping(true);
      updateStreamAnswer((message) => ({
        ...message,
        content: '',
        citations: [],
      }));
    },
    onCitation: (citation) => {
      updateStreamAnswer((message) => ({
        ...message,
        citations: mergeCitation(message.citations, citation),
      }));
    },
    onSuggestions: (questions) => {
      updateStreamAnswer((message) => ({
        ...message,
        suggestedQuestions: questions,
      }));
    },
    onDone: (event) => {
      const context = streamContextRef.current;
      if (!context) return;

      const wasActive = currentKeyRef.current === context.key;

      if (event.sessionId) {
        context.sessionId = event.sessionId;
        // A first turn starts on the temporary new-chat key; adopt the real id
        // so returning to that conversation can find the local transcript.
        if (context.key === NEW_CHAT_KEY) {
          context.key = event.sessionId;
        }
      }

      context.completed = true;
      const nextAnswer = {
        ...context.answer,
        traceCompleted: true,
        ...(event.suggestedQuestions && event.suggestedQuestions.length > 0
          ? { suggestedQuestions: event.suggestedQuestions }
          : {}),
      };
      context.answer = nextAnswer;
      setIsTyping(false);
      setStreamSnapshot({
        key: context.key,
        sessionId: context.sessionId,
        answerId: context.answer.id,
      });

      if (wasActive) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === context.answer.id ? context.answer : message,
          ),
        );

        if (event.sessionId) {
          // First turn: the parent selects the new session and the effect above
          // renders the local transcript. Existing sessions only need a sidebar
          // refresh, not a transcript reload.
          onTurnComplete?.(event.sessionId);
        }
      } else if (event.sessionId) {
        // Do not steal the user's current selection. The sidebar still needs to
        // know that the background conversation has a new turn.
        onBackgroundTurnComplete?.(event.sessionId);
        toast.success('The answer finished in another conversation.');
      }
    },
    onError: (error) => {
      const context = streamContextRef.current;
      if (!context) return;

      const wasActive = currentKeyRef.current === context.key;
      context.completed = true;
      context.answer = {
        ...context.answer,
        content: error.message,
        isError: true,
      };
      setIsTyping(false);
      setStreamSnapshot({
        key: context.key,
        sessionId: context.sessionId,
        answerId: context.answer.id,
      });

      if (wasActive) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === context.answer.id ? context.answer : message,
          ),
        );
        toast.error(error.message);
      } else {
        toast.error(`The answer failed in another conversation: ${error.message}`);
      }
    },
  });

  // The stream is fully closed only when the hook drops `isStreaming`.
  React.useEffect(() => {
    if (!isStreaming) {
      streamActiveRef.current = false;
    }
  }, [isStreaming]);

  // Handler for user sending a message
  const handleSend = (text: string) => {
    // 1. Append the user message and a pending AI message carrying the trace,
    //    so the reasoning steps are visible while the answer is produced.
    const key = activeSessionId ?? NEW_CHAT_KEY;
    const baseMessages = messages;
    const newUserMsg: Message = { id: nextMsgId(), role: 'user', content: text };
    const pendingAiMsg: Message = {
      id: nextMsgId(),
      role: 'ai',
      content: '',
      trace: [...THINKING_STEPS],
      traceStep: 0,
    };

    streamContextRef.current = {
      key,
      sessionId: activeSessionId ?? null,
      baseMessages,
      userMessage: newUserMsg,
      answer: pendingAiMsg,
      completed: false,
    };
    setStreamSnapshot({
      key,
      sessionId: activeSessionId ?? null,
      answerId: pendingAiMsg.id,
    });
    currentKeyRef.current = key;

    setMessages([...baseMessages, newUserMsg, pendingAiMsg]);

    // 2. Enable AI typing indicator
    setIsTyping(true);

    // 3. Trigger the streaming API hook
    streamActiveRef.current = true;
    sendMessage(text);
  };

  const backgroundStream =
    streamSnapshot && isStreaming && streamSnapshot.key !== currentKey
      ? streamSnapshot
      : null;

  // The banner is actionable only when the parent can actually navigate back.
  const canReturnToBackground = backgroundStream
    ? backgroundStream.sessionId
      ? Boolean(onOpenSession)
      : Boolean(onNewChat)
    : false;

  const activeStreamAnswerId =
    streamSnapshot?.key === currentKey ? streamSnapshot.answerId : null;

  return (
    <div className="flex flex-col h-full relative bg-white">
      {/* Same surface tokens as the history panel next to it: one neutral bar, not two palettes. */}
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-[#DADADA] bg-[#F7F7F7] px-3 md:px-4">
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            title="Chat history"
            aria-label="Open chat history"
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#6F6F6F] transition-colors hover:bg-[#EDEDED] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20 md:hidden"
          >
            <History className="h-4 w-4" />
          </button>
        )}
        <h1 className="truncate text-[13px] font-semibold text-[#111111]">Course AI Assistant</h1>
      </header>

      {backgroundStream && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 md:px-4">
          <span className="truncate">
            AI is still answering in another conversation. You can go back to it.
          </span>
          {canReturnToBackground && (
            <button
              type="button"
              onClick={() => {
                if (backgroundStream.sessionId) {
                  onOpenSession?.(backgroundStream.sessionId);
                } else {
                  onNewChat?.();
                }
              }}
              className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 font-medium text-amber-900 transition-colors hover:bg-amber-100"
            >
              Back to chat
            </button>
          )}
        </div>
      )}

      {/* Top area: Message list container (auto-scrolls if long) */}
      <div className="flex-1 overflow-y-auto bg-white p-4 md:p-6 pb-8">
        <div className="w-full">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#6F6F6F]">
              <Loader2 className="h-6 w-6 animate-spin text-[#6F6F6F]" />
              <span className="text-xs">Loading conversation...</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMessageStreaming = isStreaming && msg.id === activeStreamAnswerId;
              const isMessagePending = isTyping && msg.id === activeStreamAnswerId;

              return (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={isMessageStreaming}
                  isLoading={isMessagePending}
                  trace={msg.trace}
                  traceStep={msg.traceStep}
                  traceCompleted={msg.traceCompleted}
                  thinkingMs={msg.thinkingMs}
                  citations={msg.citations}
                  isError={msg.isError}
                  renderMarkdown={msg.role === 'ai'}
                  chatSurface
                />
              );
            })
          )}

          {/* Follow-up question suggestions (AI-125) - visible after completed grounded answer */}
          {messages.length > 1 &&
            !isTyping &&
            messages[messages.length - 1]?.role === 'ai' &&
            !messages[messages.length - 1]?.isError &&
            Boolean(messages[messages.length - 1]?.suggestedQuestions?.length) && (
              <SuggestedQuestions
                questions={messages[messages.length - 1].suggestedQuestions!}
                disabled={isTyping || isStreaming}
                onSelect={handleSend}
                label="Suggested follow-ups:"
              />
          )}

          {/* Empty div serving as an anchor for scrollIntoView */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom area: Message input container (sticky to bottom) */}
      <div className="w-full shrink-0">
        <ChatInput onSend={handleSend} disabled={isTyping || isStreaming} chatLayout />
      </div>
    </div>
  );
}
