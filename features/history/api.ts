/**
 * Chat History API Client (AI-95, Epic E7)
 * Implements Phase 5 Step 5.2 of `ke_hoach_task_AI-95.md`.
 * Built on `apiFetch` from `@/lib/admin-api` using `NEXT_PUBLIC_API_URL` and Bearer auth.
 */

import { apiFetch } from "@/lib/admin-api";
import type {
  AppendMessageRequest,
  ChatMessageItem,
  ChatSearchResponse,
  ChatSessionDetail,
  ChatSessionItem,
  ChatSessionListResponse,
  CreateSessionRequest,
  DeleteSessionResponse,
  RenameSessionRequest,
} from "./types";

/**
 * Extract human-readable error message from an API call error.
 */
export function getHistoryErrorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Request failed.";
}

/**
 * Fetch past chat sessions for the authenticated user, optionally scoped to a class (AC-04, AC-06).
 * Backend returns sessions sorted by `updated_at DESC` (newest first).
 *
 * @param classId Optional class ID filter
 * @returns Array of chat session summaries
 */
export async function getSessions(classId?: string): Promise<ChatSessionItem[]> {
  const isUuid = classId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId) : false;
  const query = isUuid ? `?class_id=${encodeURIComponent(classId!)}` : "";
  const res = await apiFetch<ChatSessionListResponse>(`/api/history${query}`);
  return res.items ?? [];
}

/**
 * Fetch full conversation transcript of a session with messages ordered chronologically (AC-05, AC-07).
 *
 * @param sessionId UUID of the chat session
 * @returns Session detail containing title and messages list
 */
export async function getSessionDetail(sessionId: string): Promise<ChatSessionDetail> {
  const data = await apiFetch<ChatSessionDetail>(`/api/history/${encodeURIComponent(sessionId)}`);
  return {
    ...data,
    session_id: data.session_id ?? data.id,
  };
}

/**
 * Explicitly create a new chat session for a class (AC-03).
 *
 * @param classId UUID of the class
 * @param title Optional title of the session
 * @returns Newly created chat session summary
 */
export async function createSession(
  classId: string,
  title?: string | null
): Promise<ChatSessionItem> {
  const payload: CreateSessionRequest = {
    class_id: classId,
    title: title ?? null,
  };
  return await apiFetch<ChatSessionItem>("/api/history/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Rename an owned chat session. The backend keeps the sidebar activity order.
 *
 * @param sessionId UUID of the chat session
 * @param title New conversation title
 * @returns Updated session summary
 */
export async function renameSession(
  sessionId: string,
  title: string
): Promise<ChatSessionItem> {
  const payload: RenameSessionRequest = { title };
  return await apiFetch<ChatSessionItem>(`/api/history/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Append a single message to an existing chat session (AC-01, AC-02).
 *
 * @param sessionId UUID of the chat session
 * @param payload Message data (role, content, used_web_search)
 * @returns Newly saved chat message record
 */
export async function appendMessage(
  sessionId: string,
  payload: AppendMessageRequest
): Promise<ChatMessageItem> {
  return await apiFetch<ChatMessageItem>(
    `/api/history/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Permanently delete a chat session and all its messages (AC-05).
 * Backend also removes corresponding content-gap vectors from Qdrant.
 *
 * @param sessionId UUID of the chat session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch<DeleteSessionResponse>(`/api/history/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

/**
 * Search user's chat history across titles and messages (AI-101 AC-01, AC-02, AC-03).
 *
 * @param query Search query string (minimum 1 non-whitespace character)
 * @param classId Optional class filter
 * @param limit Max results to return (default 20, max 50)
 * @param offset Pagination offset (default 0)
 * @returns Search results containing matching sessions with snippets
 */
export async function searchSessions(
  query: string,
  classId?: string,
  limit = 20,
  offset = 0,
): Promise<ChatSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (classId) params.set("class_id", classId);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  return apiFetch<ChatSearchResponse>(`/api/history/search?${params.toString()}`);
}

/**
 * Pin or unpin a chat session to keep it at the top of the history list.
 *
 * @param sessionId UUID of the chat session
 * @param isPinned Optional explicit boolean. If omitted, toggles current state.
 * @returns Updated session summary with new is_pinned and pinned_at values
 */
export async function togglePinSession(
  sessionId: string,
  isPinned?: boolean,
): Promise<ChatSessionItem> {
  const body = isPinned !== undefined ? JSON.stringify({ is_pinned: isPinned }) : undefined;
  return await apiFetch<ChatSessionItem>(`/api/history/${encodeURIComponent(sessionId)}/pin`, {
    method: "PATCH",
    ...(body ? { body } : {}),
  });
}

/**
 * Grouped API object for convenient import.
 */
export const historyApi = {
  getSessions,
  getSessionDetail,
  createSession,
  renameSession,
  appendMessage,
  deleteSession,
  searchSessions,
  togglePinSession,
  getErrorMessage: getHistoryErrorMessage,
};
