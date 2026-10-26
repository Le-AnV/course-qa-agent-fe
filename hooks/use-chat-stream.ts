import { useState, useCallback, useEffect, useRef } from 'react';
import { AUTH_TOKEN_KEY } from '@/components/ui/nav-config';
import {
  createSseParser,
  type ChatCitation,
  type ChatDoneEvent,
  type ChatProgressStage,
} from '@/lib/sse';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const CLIENT_TIMEOUT_MS = 305_000;

interface UseChatStreamProps {
  /** Class scope — BE dùng để lọc syllabus/tài liệu của đúng lớp, tránh lẫn dữ liệu giữa các lớp. */
  classId: string;
  /** Active conversation session for continuity (AI-97). Omit for a new chat; the backend creates it on the first answer. */
  sessionId?: string | null;
  /** elapsedMs: thời gian từ lúc gửi tới chunk này (đo trong hook, không đo ở render). */
  onChunk: (chunk: string, elapsedMs: number) => void;
  onProgress?: (stage: ChatProgressStage, message?: string) => void;
  onCitation?: (citation: ChatCitation) => void;
  onSuggestions?: (questions: string[]) => void;
  onDone?: (event: ChatDoneEvent) => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export function useChatStream({
  classId,
  sessionId,
  onChunk,
  onProgress,
  onCitation,
  onSuggestions,
  onDone,
  onFinish,
  onError,
}: UseChatStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  // Switching conversations keeps the answer running in the background: the
  // chat window routes its callbacks back to the conversation that started it.
  // Only a class change invalidates the request scope.
  useEffect(() => {
    controllerRef.current?.abort();
  }, [classId]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsStreaming(true);
    const startedAt = Date.now();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY) || ''}`
        },
        body: JSON.stringify({
          message,
          class_id: classId,
          session_id: sessionId ?? null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(body?.detail || `Chat request failed (${response.status}).`);
      }

      if (!response.body) {
        throw new Error('The chat API did not return a response stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let completed = false;
      const parser = createSseParser((event) => {
        if (event.type === 'progress') {
          onProgress?.(event.stage, event.message);
        } else if (event.type === 'token') {
          onChunk(event.text, Date.now() - startedAt);
        } else if (event.type === 'citation') {
          onCitation?.(event.citation);
        } else if (event.type === 'suggestions') {
          onSuggestions?.(event.questions);
        } else if (event.type === 'done') {
          if (event.suggestedQuestions && event.suggestedQuestions.length > 0) {
            onSuggestions?.(event.suggestedQuestions);
          }
          completed = true;
          onDone?.(event);
        } else {
          throw new Error(event.message);
        }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.push(decoder.decode(value, { stream: true }));
      }
      parser.push(decoder.decode());
      parser.finish();

      if (!completed) throw new Error('The chat stream ended unexpectedly.');
      onFinish?.();
    } catch (err) {
      // A session switch aborts the request intentionally; do not show the
      // timeout toast for a stream the user has already navigated away from.
      if (controller.signal.aborted && !timedOut) return;

      const error =
        err instanceof DOMException && err.name === 'AbortError'
          ? new Error('The answer timed out. Please try again.')
          : err instanceof Error
            ? err
            : new Error('The answer could not be generated. Please try again.');
      onError?.(error);
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsStreaming(false);
      }
    }
  }, [classId, sessionId, onChunk, onProgress, onCitation, onSuggestions, onDone, onFinish, onError]);

  return {
    sendMessage,
    isStreaming
  };
}
