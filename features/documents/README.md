# features/documents — E2 frontend (upload, list, tag, preview)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-35 | Upload Course Materials | nguyenvu040905 | 9 formats; **documents only** — account import is admin's separate flow (AC-08) |
| AI-37 | Document List & Search | Khang Vu | list with search + status badges |
| AI-39 | Delete & Replace | Unassigned | confirm dialog; delete also removes Qdrant points |
| AI-41 | Tag Documents by Class | nguyenvu040905 | pick class from admin-created list only |
| AI-43 | Preview & Download | Unassigned | preview original file, download |

**Planned files:** `upload-dropzone.tsx`, `document-list.tsx`, `document-row.tsx`, `preview-dialog.tsx`.

Route: `/dashboard` (trainer).
