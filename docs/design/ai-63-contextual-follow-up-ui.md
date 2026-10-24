# UI Design & Implementation Specs — Contextual Follow-up Questions (AI-63)

> **Ticket:** AI-63
> **Epic:** E4 — RAG Q&A (parent AI-23)
> **Repo:** `course-qa-agent-fe`
> **Target branch:** `features/Design_ContextualFollowUp`
> **Status:** Implemented (UI & client integration)

This document is the frontend design reference for **Contextual Follow-up Questions (AI-63)**.
It covers the chat states, the conversation-scoped stream handling, and the per-answer
citation display that lets a student ask follow-ups without repeating the topic.

> **Figma:** not produced for this story. The ticket was implemented directly against the
> existing AI-95 chat layout, so this document (states + interaction + data contract) is the
> design deliverable for the Design branch, per GitLab guide §3.2.1.

---

## 1. Overview & objectives

A follow-up such as *"so when is the deadline?"* must keep the meaning of the previous
question. The backend now resolves the follow-up and returns citations per answer; the
frontend has to:

1. Send the active conversation id with every question so the backend can load history.
2. Keep an answer streaming even when the student opens another conversation, without
   leaking the stream into the wrong transcript.
3. Show the citations of each individual answer, and restore them unchanged when the
   conversation is reloaded from history.

## 2. Scope

| Area | File | Change |
|---|---|---|
| Chat surface | `features/chat/chat-window.tsx` | Conversation-scoped stream snapshot, background-answer banner, per-answer citations |
| Message rendering | `features/chat/message-bubble.tsx` | Renders the citation list of a single answer |
| Stream state | `hooks/use-chat-stream.ts` | `session_id` in the request, `done` metadata, abort handling |
| SSE contract | `lib/sse.ts` | `citation` and `done` event types |
| Citation helpers | `lib/citations.ts` | `citationKey`, `mergeCitation`, `uniqueCitations` |
| History types | `features/history/types.ts` | `ChatMessageCitation`, `citations` on message payloads |
| Pages | `app/(shell)/student/class/[id]/agent/page.tsx`, `app/(shell)/teacher/class/[id]/agent/page.tsx` | Wire `session_id`, background-answer completion, "Back to chat" |

Out of scope for this UI: the history sidebar layout, rename/delete actions (handled by the
AI-95 work) and the Figma mockups.

## 3. Layout

The existing three-column agent layout is unchanged. AI-63 only adds two surfaces inside the
chat column:

```
+----------------------+---------------------------------------------+
| Chat History sidebar |  Chat window                                |
|                      |                                             |
|  Conversation A  <-- |  [ Q: What is the deadline ...? ]           |
|  Conversation B      |  [ A: ... [1] ... [2] ]                     |
|                      |     Sources: 1. Logistics_Vocabulary.docx   |
|                      |              2. Quiz.pdf                    |
|                      |                                             |
|                      |  +---------------------------------------+  |
|                      |  | AI is still answering in another       |  |
|                      |  | conversation. You can go back to it.  |  |
|                      |  |                        [ Back to chat ]|  |
|                      |  +---------------------------------------+  |
|                      |  [ Ask a follow-up...              Send ]   |
+----------------------+---------------------------------------------+
```

- The background-answer banner sits directly above the composer, so it never covers the
  transcript and never blocks typing in the current conversation.
- The citation block is part of the answer bubble, one block per assistant message.

## 4. Interaction flows

### 4.1 Follow-up inside the same conversation

1. Student asks the first question in a new chat → backend creates the session and returns
   `session_id` in the `done` event.
2. The window stores the id and passes it as `session_id` on the next request.
3. Student asks a follow-up without repeating the topic → the backend rewrites it and answers
   from the class evidence.
4. The answer streams in place; its own citations replace nothing from earlier answers.

### 4.2 Switching conversation while an answer is streaming

1. Answer is streaming in Conversation A.
2. Student opens Conversation B (or starts a new chat).
3. Conversation B shows its own transcript — the A stream is **not** rendered there.
4. Because a turn is still running, the banner appears:
   *"AI is still answering in another conversation. You can go back to it."*
5. `Back to chat` returns to Conversation A and re-attaches the in-progress stream.
6. When the background turn finishes, a toast confirms it and only the sidebar is refreshed.
   A background failure shows an error toast and does not touch the visible transcript.

### 4.3 Reloading a past conversation

1. Student selects a session in the sidebar.
2. `GET /api/history/{session_id}` returns messages with their stored `citations`.
3. Each answer is rendered with the citation list it was produced with; `uniqueCitations`
   removes duplicates introduced by older data.

## 5. States

| State | Chat column | Banner |
|---|---|---|
| New chat, no messages | Starter questions (existing behaviour) | hidden |
| Streaming (active conversation) | Progress stages: searching → reading → drafting, then tokens | hidden |
| Streaming (answer belongs to another conversation) | Transcript of the opened conversation | visible with `Back to chat` |
| Turn completed in background | Unchanged | hidden, success toast |
| Turn failed in background | Unchanged | hidden, error toast |
| History load failed | Existing error handling + toast | hidden |
| Empty history / no session | Starter questions | hidden |

## 6. Data contract

### 6.1 Request — `POST /api/chat`

```json
{
  "message": "So when is the deadline?",
  "class_id": "7f3c...",
  "session_id": "9a1b..."
}
```

`session_id` is `null` for a brand-new chat.

### 6.2 SSE events consumed by the UI

| Event | Payload used by the UI |
|---|---|
| `progress` | `stage`: `searching` \| `reading` \| `drafting` |
| `token` | incremental answer text |
| `citation` | `index`, `kind`, `title`, `url`, `snippet`, `document_id`, `page` |
| `done` | `session_id`, `user_message_id`, `assistant_message_id` |
| `error` | human-readable message |

### 6.3 History message shape

```json
{
  "id": "3c2d...",
  "role": "ASSISTANT",
  "content": "...",
  "used_web_search": false,
  "citations": [
    {
      "index": 1,
      "kind": "curriculum",
      "title": "Logistics_Vocabulary.docx",
      "url": null,
      "snippet": "...",
      "document_id": "0b4f...",
      "page": 2
    }
  ],
  "created_at": "2026-10-24T08:12:31Z"
}
```

The backend uses snake_case, the SSE payload uses camelCase; `mapHistoryCitation()` converts
history records into the same `ChatCitation` shape used by live answers.

## 7. Responsive behaviour

| Viewport | Behaviour |
|---|---|
| Desktop (≥1024px) | Sidebar, chat column and composer side by side (unchanged) |
| Tablet | Sidebar collapsible; banner and citation list keep full chat width |
| Mobile | Single chat column; banner stays above the composer and wraps to two lines |

## 8. Accessibility

- The banner is a status region (`role="status"`) so screen readers announce a background answer.
- `Back to chat` is a real button with visible focus ring and descriptive label.
- Citation entries are links when `url` exists; otherwise plain text with the document title.
- Progress stages are announced as text, not colour-only changes.

## 9. Acceptance criteria mapping

| AC | Where it is satisfied |
|---|---|
| AC-01 — follow-up keeps context | `session_id` sent by `use-chat-stream`, history loaded by the backend |
| AC-02 — answer stays in the right conversation | `StreamSnapshot` keyed by `activeSessionId` / `NEW_CHAT_KEY` |
| AC-03 — citations belong to one answer | `ChatMessageCitation` on history messages, `mergeCitation` for live events |
| AC-04 — history reload keeps citations | `uniqueCitations` on `getSessionDetail()` mapping |
| AC-05 — unfinished answer is discoverable | Background-answer banner + `Back to chat` + completion toast |

## 10. Verification

- `npm run build` (CI blocking job) — passes.
- `npx tsc --noEmit` — clean.
- `npx vitest run` — 96 tests pass, including SSE parsing and citation de-duplication.
- Manual: two-turn follow-up on a class with indexed documents; five citations per answer;
  switching conversation mid-stream shows the banner; reloading the session keeps the same
  citations.
