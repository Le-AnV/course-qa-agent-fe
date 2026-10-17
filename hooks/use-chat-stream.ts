import { useState, useCallback } from 'react';
import { AUTH_TOKEN_KEY } from '@/components/ui/nav-config';
import { consumeSseStream, type ChatCitation } from '@/lib/sse';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface UseChatStreamProps {
  /** The backend uses this scope to retrieve materials from the selected class only. */
  classId: string;
  onChunk: (chunk: string) => void;
  onCitation: (citation: ChatCitation) => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export function useChatStream({ classId, onChunk, onCitation, onFinish, onError }: UseChatStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY) || ''}`
        },
        body: JSON.stringify({ message, class_id: classId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || `API error: ${response.statusText || response.status}`);
      }

      if (!response.body) {
        throw new Error('The API did not return a response stream.');
      }

      await consumeSseStream(response.body, {
        onToken: onChunk,
        onCitation,
        onDone: onFinish,
      });

    } catch (err) {
      if (onError) onError(err as Error);
    } finally {
      setIsStreaming(false);
    }
  }, [classId, onChunk, onCitation, onFinish, onError]);

  return {
    sendMessage,
    isStreaming
  };
}
