/**
 * Chat History Type Definitions (AI-95, Epic E7)
 * Strictly synchronized 1-1 with Backend schemas in `course-qa-agent-be/app/schemas/history.py`
 */

/** Roles allowed for chat messages in DB schema and API contract */
export type ChatRole = "USER" | "ASSISTANT" | "SYSTEM";

/**
 * Summary representation of a chat session in the sidebar list (AC-04, AC-06).
 * Sorted newest-first by `updated_at`.
 */
export interface ChatSessionItem {
  id: string;
  class_id?: string;
  title: string | null;
  created_at?: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
  is_pinned?: boolean;
  pinned_at?: string | null;
}

/** Alias for ChatSessionItem */
export type ChatSessionSummary = ChatSessionItem;

/**
 * Citation snapshot stored with an assistant answer (AI-63 AC-03).
 * Backend JSON uses snake_case; ChatWindow maps it to the SSE camelCase shape.
 */
export interface ChatMessageCitation {
  index: number;
  kind: string;
  title: string;
  url: string | null;
  snippet: string;
  document_id: string | null;
  page: number | null;
  indexes?: number[] | null;
  highlights?: string[] | null;
}

/**
 * Individual chat message in a conversation session (AC-01, AC-02).
 */
export interface ChatMessageItem {
  id: string;
  session_id?: string;
  role: ChatRole;
  content: string;
  used_web_search: boolean;
  citations?: ChatMessageCitation[] | null;
  suggested_questions?: string[] | null;
  thinking_ms?: number | null;
  trace?: string[] | null;
  created_at: string; // ISO 8601 string
}

/**
 * Full conversation transcript details including chronologically ordered messages (AC-05, AC-07).
 */
export interface ChatSessionDetail {
  id: string;
  session_id?: string;
  class_id?: string;
  title: string | null;
  created_at?: string;
  updated_at?: string;
  messages: ChatMessageItem[];
}

/** Alias for ChatSessionDetail */
export type ChatDetailResponse = ChatSessionDetail;

/**
 * Response payload for session listing endpoint `GET /api/history`.
 */
export interface ChatSessionListResponse {
  items: ChatSessionItem[];
  total: number;
}

/**
 * Request payload to create an explicit chat session `POST /api/history/sessions` (AC-03).
 */
export interface CreateSessionRequest {
  class_id: string;
  title?: string | null;
}

/**
 * Request payload to rename an owned chat session `PATCH /api/history/{id}`.
 */
export interface RenameSessionRequest {
  title: string;
}

/**
 * Request payload to append a message to an existing session `POST /api/history/sessions/{id}/messages`.
 */
export interface AppendMessageRequest {
  role: ChatRole;
  content: string;
  used_web_search?: boolean;
  citations?: ChatMessageCitation[];
}

/**
 * Response payload when a session is deleted `DELETE /api/history/{id}`.
 */
export interface DeleteSessionResponse {
  message: string;
}

/**
 * Single search result item representing a matching conversation (AI-101 AC-01, AC-03).
 */
export interface SearchResultItem {
  session_id: string;
  title: string | null;
  updated_at: string;
  snippet: string;
  match_in: 'title' | 'message';
}

/**
 * Response payload for search endpoint `GET /api/history/search` (AI-101).
 */
export interface ChatSearchResponse {
  items: SearchResultItem[];
  total: number;
  query: string;
}

