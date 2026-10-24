# features/history — E7 frontend (sidebar, reopen, search, delete)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-95 | Save & Display Chat History | Bui Trong Suu | sidebar conversation list on `/chat` |
| AI-97 | Reopen Old Conversation & Continue | Unassigned | click loads messages, continues context |
| AI-99 | Delete Chat History | Unassigned | confirm dialog; also removes content-gap points for those messages |
| AI-101 | Search Chat History | Unassigned | search box over past conversations |

**Planned files:** `history-sidebar.tsx`, `conversation-item.tsx`, `history-search.tsx`.
Route: `/chat` (sidebar) — consumed by `features/chat`.

**Session title:** a new session is auto-titled from the first 50 characters of
its first question. The pencil button beside Delete opens a rename dialog and
calls `PATCH /api/history/{session_id}`; renaming does not reorder the sidebar
or change the transcript.
