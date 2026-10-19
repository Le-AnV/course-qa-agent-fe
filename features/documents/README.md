# features/documents — E2 frontend (upload, list, tag, preview)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-35 | Upload Course Materials | nguyenvu040905 | 9 formats; **documents only** — account import is admin's separate flow (AC-08) |
| AI-37 | Document List & Search | Khang Vu | list with search + status badges |
| AI-39 | Delete & Replace | Unassigned | confirm dialog; delete purges Qdrant chunks; same-name upload creates v-next and re-indexes |
| AI-41 | Tag Documents by Class | nguyenvu040905 | pick class from admin-created list only |
| AI-43 | Preview & Download | Unassigned | preview original file, download |

**Components:** `class-materials.tsx` (`ClassMaterials`) — upload, list/search/filter, approve, delete & replace; rendered inside the class syllabus page.

Route: `/teacher/class/[id]/syllabus` (trainer).
