# features/tickets — E6 frontend (student creates ticket, trainer inbox)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-81 | Student Opens a Question Ticket | Unassigned | "Ask teacher" button (in chat when unsatisfied) → pick class → submit |
| AI-83 | Trainer Ticket Inbox | Unassigned | `/dashboard` inbox, filter by status |
| AI-85 | Trainer Answers a Ticket | Unassigned | reply form |
| AI-87 | Student Notified of Reply | Unassigned | notification badge on `/chat` |
| AI-89 | Mark Resolved / Reopen | Unassigned | status actions both sides |

**Hard rule:** the UI is the ONLY trigger — **system never auto-creates tickets** (mentor decision, TECHSTACK §1). Ticket goes to the teacher of the student's class.

**Planned files:** `ask-teacher-button.tsx`, `ticket-inbox.tsx`, `ticket-thread.tsx`, `ticket-status-actions.tsx`.
