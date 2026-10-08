# features/ingestion — E3 frontend (status, approval, retry)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-55 | Processing Status, Approval & Retry | Unassigned | approval queue UI (Pending → Approve/Reject), status badges, Retry on Failed |

**States to render:** `pending_approval → processing → indexed | failed | rejected`.
- Rejected documents never get indexed — show reason.
- Retry must be idempotent (same document, no duplicate chunks).

**Planned files:** `approval-queue.tsx`, `status-badge.tsx`, `retry-button.tsx`.
Route: `/dashboard` (trainer).
