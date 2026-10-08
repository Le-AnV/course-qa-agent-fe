# features/citations — E5 frontend (citation chips + excerpt popup)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-73 | Automatic Citations in Answers | Unassigned | render citation markers inline in streamed answers |
| AI-75 | Click Citation → Source Excerpt | Unassigned | popup/modal showing the chunk excerpt |
| AI-77 | Citations Point to Correct Chapter/Page | Unassigned | display file / chapter / page (or slide/sheet-row) exactly |

**Key notes:**
- Internet sources render with their own label — visually separate from curriculum citations.
- Excerpt fetched from `GET /api/citations/...`.

**Planned files:** `citation-chip.tsx`, `citation-popover.tsx`, `internet-source-badge.tsx`.
Consumed by `features/chat`.
