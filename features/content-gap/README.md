# features/content-gap — E6 frontend (dashboard widget)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-91 | Repeated-Question Counter (Content Gap) | Unassigned | widget on trainer `/dashboard`: "Topic X was asked N times" |

**Key notes (TECHSTACK §3.3):**
- Shows `search_count` + `unique_student_count`, only when thresholds hit (default ≥3 queries / ≥2 students / 30 days — configurable in E8).
- Data computed at view time — **no counter table**; response includes "Updated at HH:MM" + Refresh button (RAM cache 30–60 min).
- No ticket, no notification — trainer decides to upload more material or share a link.

**Planned files:** `gap-widget.tsx`, `gap-topic-card.tsx`.
