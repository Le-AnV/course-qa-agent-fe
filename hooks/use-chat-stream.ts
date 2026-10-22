import { useState, useCallback } from 'react';
import { AUTH_TOKEN_KEY } from '@/components/ui/nav-config';
import { createSseParser, type ChatCitation, type ChatProgressStage } from '@/lib/sse';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const CLIENT_TIMEOUT_MS = 305_000;

interface UseChatStreamProps {
  /** Class scope — BE dùng để lọc syllabus/tài liệu của đúng lớp, tránh lẫn dữ liệu giữa các lớp. */
  classId: string;
  /** elapsedMs: thời gian từ lúc gửi tới chunk này (đo trong hook, không đo ở render). */
  onChunk: (chunk: string, elapsedMs: number) => void;
  onProgress?: (stage: ChatProgressStage) => void;
  onCitation?: (citation: ChatCitation) => void;
  onDone?: () => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export function useChatStream({
  classId,
  onChunk,
  onProgress,
  onCitation,
  onDone,
  onFinish,
  onError,
}: UseChatStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    setIsStreaming(true);
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY) || ''}`
        },
        body: JSON.stringify({ message, class_id: classId }),
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
          onProgress?.(event.stage);
        } else if (event.type === 'token') {
          onChunk(event.text, Date.now() - startedAt);
        } else if (event.type === 'citation') {
          onCitation?.(event.citation);
        } else if (event.type === 'done') {
          completed = true;
          onDone?.();
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
      const error =
        err instanceof DOMException && err.name === 'AbortError'
          ? new Error('The answer timed out. Please try again.')
          : err instanceof Error
            ? err
            : new Error('The answer could not be generated. Please try again.');
      onError?.(error);
    } finally {
      window.clearTimeout(timeout);
      setIsStreaming(false);
    }
  }, [classId, onChunk, onProgress, onCitation, onDone, onFinish, onError]);

  return {
    sendMessage,
    isStreaming
  };
}
