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
