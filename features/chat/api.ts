import { apiFetch } from '@/lib/admin-api';

/** Daily question allowance; `limit` is null for teachers/admins. */
export type ChatQuota = {
  limit: number | null;
  used: number;
  remaining: number | null;
  resets_at: string | null;
};

export function getChatQuota(): Promise<ChatQuota> {
  return apiFetch<ChatQuota>('/api/chat/quota');
}

export type AnswerFeedback = 'helpful' | 'not_helpful';

export function saveAnswerFeedback(messageId: string, feedback: AnswerFeedback): Promise<{ feedback: AnswerFeedback }> {
  return apiFetch(`/api/chat/messages/${messageId}/feedback`, {
    method: 'PUT', body: JSON.stringify({ feedback }),
  });
}
