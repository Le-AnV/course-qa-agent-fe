# AI-61 — Class Document Q&A Frontend Integration

> **Epic:** E4 — Contextual Q&A
>
> **Status:** Implemented
>
> **Branch:** `features/Design_class_document_QA`
>
> **Backend contract:** `POST /api/chat`

## 1. Scope

This task replaces the local chat mock with the authenticated backend stream. The chat window renders answer tokens as they arrive, attaches citations supplied by the backend, and opens protected source files using the current Bearer token.

All new user-facing text is in English.

## 2. Components

| File | Responsibility |
|---|---|
| `hooks/use-chat-stream.ts` | Sends `{ message, class_id }` to the backend and exposes token, citation, completion, and error callbacks. |
| `lib/sse.ts` | Parses fragmented UTF-8 SSE frames and dispatches the JSON event contract. |
| `features/chat/chat-window.tsx` | Appends streamed tokens and citations to the active assistant message. |
| `features/chat/message-bubble.tsx` | Renders citation chips only when real citations exist and streaming is complete. |
| `features/citations/citation-chip.tsx` | Downloads a protected source with the access token and opens it in a new tab. |
| `app/api/chat/route.ts` | Removed because the frontend now calls the real backend. |

## 3. Client flow

```text
Submit question
  → POST {NEXT_PUBLIC_API_URL}/api/chat with Bearer token
  → token events append text to the assistant message
  → citation events append source metadata
  → done ends the request
  → error shows a toast and clears the busy state
```

The class ID comes from the current class route and is included in every request. The backend remains responsible for deciding whether the authenticated user can access that class.

## 4. SSE contract

The parser recognizes these JSON events:

```typescript
type ChatCitation = {
  marker: string;
  document_id: string;
  file_name: string;
  heading: string | null;
  page: number | null;
  url: string;
};
```

| Event | Payload | Frontend action |
|---|---|---|
| `token` | `{ "text": string }` | Append text to the current assistant message. |
| `citation` | `ChatCitation` | Add one clickable citation chip. |
| `done` | `{}` | Mark streaming complete. |
| `error` | `{ "message": string }` | Throw an error and show its message in a toast. |

## 5. Opening citations

Citation URLs point to the backend document endpoint and therefore cannot be used as unauthenticated anchor links. `CitationChip`:

1. Opens a blank tab from the user's click to preserve browser user activation.
2. Fetches the source URL with `Authorization: Bearer <token>`.
3. Creates a temporary browser object URL from the returned blob.
4. Adds `#page={page}` for PDF citations.
5. Navigates the new tab and revokes the object URL after 60 seconds.

For non-PDF formats, the original file opens without a page fragment while the chip still displays any heading or page metadata supplied by the backend.

## 6. Error and loading behavior

- The input remains disabled while a request is active.
- The typing indicator is shown until the first token or an error arrives.
- HTTP errors use the backend `detail` message when available.
- SSE errors use the backend `message` value.
- Citation download errors are displayed through a toast.
- A response without citations does not display a placeholder source.

## 7. Verification

Run frontend tests:

```bash
npm test
```

Run lint checks for the integration files:

```bash
npm exec -- eslint \
  lib/sse.ts lib/sse.test.ts \
  hooks/use-chat-stream.ts \
  features/citations/citation-chip.tsx \
  features/chat/message-bubble.tsx \
  features/chat/chat-window.tsx
```

Verified during implementation:

- 46 frontend tests passed.
- SSE tests cover fragmented frames, split UTF-8 bytes, citations, completion, and errors.
- ESLint passed.
- TypeScript passed against source files after excluding stale `.next/dev` generated route metadata.

The production build reached compilation but could not download Geist, Geist Mono, and Playfair Display from Google Fonts because the verification environment blocks external network requests.

## 8. End-to-end dependency

Browser verification of a real answer and PDF citation requires:

- Backend, PostgreSQL, and Qdrant running.
- A valid Gemini API key.
- AI-55 indexed chunks containing source metadata.
- Original files present in the configured document storage volume.
- A student account actively enrolled in the tested class.
