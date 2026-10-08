# features/chat — E4 frontend (student chat, SSE)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-59 | Student Chat Interface | Nguyễn Chí Trung | main `/chat` screen: message list, input, streaming render |
| AI-69 | Processing Status & System Errors | Unassigned | loading/thinking indicator, error states, retry |

**Key notes:**
- Consume **SSE** from `POST /api/chat` (streamed answer tokens).
- Internet-sourced answers must show a **distinct "Internet source" label** (never mixed with curriculum citations — E5 renders the citation chips).
- Follow-up questions keep conversation context (AI-63 backend).
- Student cannot choose class — class comes from their account.

**Planned files:** `chat-window.tsx`, `message-bubble.tsx`, `chat-input.tsx`, `streaming-indicator.tsx`.
Route: `/chat`.
