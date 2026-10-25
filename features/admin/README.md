# features/admin — E8 frontend (system config, stats)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-105 | Configure LLM, API Key, Email Sender | Pham Doan Dong | admin settings page: model name, API key, SMTP — **masked inputs** (never display stored secrets), real queue sending + rate limit UI |
| AI-107 | Configure Embedding Model & Thresholds | Pham Doan Dong | retrieval threshold (default 0.8), content-gap thresholds (3/2/30) |
| AI-111 | System Usage Statistics | Unassigned | stats view (if part of dashboard) |

**Key notes:** admin-only route guard (RBAC from E1). Secrets are write-only from the UI — server never returns stored values.

**Planned files:** `settings-llm-form.tsx`, `settings-email-form.tsx`, `settings-thresholds-form.tsx`, `stats-panel.tsx`.
Route: `/dashboard` (admin section) or `/dashboard/settings`.
