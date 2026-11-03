# AI-89 — Ticket lifecycle and per-class counts (UI design)

**Status:** Draft for review
**Related:** AI-81 (student ticket creation), AI-83 (trainer inbox UI), AI-89 (this task)
**Supersedes:** AI-83 basic filter/class picker; AI-81 student ticket UI where it conflicts.

---

## 1. Scope

This design covers the student and trainer ticket surfaces:

- Student **My Tickets** page replacing the old `/proposals` mock.
- Trainer **Class Tickets** inbox with a per-class dropdown that shows open/completed counts.
- Admin-style status segmented filter (`Open / Answered / Resolved / Expired / All`).
- Ticket detail actions: follow-up, confirm resolved, mark resolved, reopen.
- **Ask my teacher** dialog opened by selecting an AI answer (student only).
- Archived classes removed from every ticket surface.

No admin ticket UI is added; admins receive `403` from ticket APIs.

---

## 2. Routes and entry points

| Surface | Route | Role |
|---|---|---|
| Student My Tickets | `/student/class/[id]/tickets` | Student |
| Student legacy proposals | `/student/class/[id]/proposals` | Redirects to `/tickets` |
| Trainer Class Tickets | `/teacher/class/[id]/tickets` | Trainer |
| Student chat | `/student/class/[id]/agent` | Student; text selection can open the ticket dialog |
| Trainer chat | `/teacher/class/[id]/agent` | Trainer; **no** ticket selection action |

Student class navigation shows a **My Tickets** tab (`id: tickets`) instead of the old proposals entry.

---

## 3. Shared inbox layout

Both roles use `TicketsInboxLayout`:

1. Page header: title, subtitle, optional total badge (`N ticket(s)`), optional header action (class picker).
2. Toolbar: search input + segmented status filter.
3. Two-pane body on wide screens:
   - Left: ticket list (340–380px).
   - Right: selected ticket detail.
   - Narrow screens: list/detail stack without horizontal overflow.
4. Pagination: previous/next, page indicator; reset to page 1 when class/filter changes.

### Status filter

Labels: **Open**, **Answered**, **Resolved**, **Expired**, **All**.

- Segmented control with a sliding white thumb, matching the admin UI.
- Each status has a colour dot: Open amber, Answered blue, Resolved green, Expired grey.
- Active tab: semibold text; inactive: medium grey with hover to dark.
- `aria-pressed` on each button; the group is labelled “Filter tickets by status”.
- Status is never conveyed by colour alone — the label is always visible.

Defaults:

| Role | Default filter |
|---|---|
| Student | `All` |
| Trainer | `Open` |

---

## 4. Student — My Tickets

### Header

- Title: **My Tickets**
- Subtitle: “Questions you sent to your teacher. Replies and status updates appear here.”
- Badge: total tickets for the current filter.
- Class picker: `All my classes` + every **active** class the student is enrolled in.
  - Student counts are not displayed because `/counts` is trainer-only.
  - Archived classes never appear.
  - If the URL class is archived or no longer enrolled, fall back to `""` (All).

### List

Each row shows:

- Status badge.
- Question preview.
- Class code · ticket short ID.
- Last activity / created time.
- Student name is omitted (it is always the current student).

Selecting a row opens the detail pane. The first visible ticket is selected automatically.

### Detail

- Header: status badge, class, ticket ID, created time.
- Original question block.
- Agent answer excerpt (read-only, if present).
- Student question.
- Thread: replies labelled **You** / **Teacher**.
- Footer guidance by status:
  - `OPEN`: “Waiting for your teacher to reply.”
  - `ANSWERED`: “Your teacher replied. Add a follow-up below or confirm it is resolved.”
  - `RESOLVED`: “This ticket is marked as resolved.”
  - `EXPIRED`: “This ticket expired after seven days without an answer.”

### Actions

| Status | Student actions |
|---|---|
| `OPEN` | Follow-up message |
| `ANSWERED` | Follow-up message + **Confirm resolved** |
| `RESOLVED` | **Reopen ticket** |
| `EXPIRED` | None |

- Follow-up is a textarea + **Send follow-up**; max 10,000 chars.
- Sending a follow-up on `ANSWERED` returns the ticket to `OPEN` in the UI immediately.
- Confirm resolved is disabled while the request is in flight; errors stay inline.
- Reopen returns the ticket to `ANSWERED`/`OPEN` and refreshes the list.
- After resolve/reopen, if a status filter is active, switch to the matching filter so the ticket stays visible.

---

## 5. Trainer — Class Tickets

### Header

- Title: **Class Tickets**
- Subtitle: “Student questions for your assigned classes. Newest first.”
- Badge: total tickets in the current filter.
- Class picker: **All assigned classes** + every active assigned class.
  - Each option shows `X open · Y completed`.
  - The All option shows totals from `/counts`.
  - The picker uses `AppSelect` with the admin popup style.
  - Archived classes are excluded; a stale URL class falls back to All.
  - If counts fail, the picker falls back to the plain class list without counts and shows a non-blocking error.

### List

Each row shows:

- Status badge.
- Question preview.
- Student name.
- Class code · ticket short ID.
- Created time.

Newest first. Selecting a row opens the detail pane.

### Detail

- Student name, class, ticket ID, created time.
- Original question and agent answer excerpt.
- Student question and full reply thread.
- Status guidance:
  - `OPEN`: “Waiting for your answer.”
  - `ANSWERED`: “Answered. Mark it resolved when the student no longer needs help.”
  - `RESOLVED`: “This ticket is completed.”
  - `EXPIRED`: “This ticket expired after seven days without an answer.”

### Actions

| Status | Trainer actions |
|---|---|
| `OPEN` | Reply + **Mark resolved** |
| `ANSWERED` | **Mark resolved** |
| `RESOLVED` | **Reopen ticket** |
| `EXPIRED` | None |

- Trainer reply is only available on `OPEN`; sending it moves the ticket to `ANSWERED`.
- Mark resolved works for `OPEN` and `ANSWERED`.
- Reopen works only for `RESOLVED`.
- After resolve/reopen, switch to the matching status filter if one is active, then refresh.
- Action errors render inline above the footer.

---

## 6. Ask my teacher (student chat only)

### Trigger

- The student selects text inside a single completed AI answer (`[data-chat-answer-content]`).
- Selection must not span multiple messages, and the message must not be streaming, pending, or an error.
- A floating **Ask my teacher** button appears next to the selection.
- Trainer chat never renders this action: `canOpenTicket` is passed only by the student agent page.

### Dialog — create state

| Field | Behaviour |
|---|---|
| Class | `AppSelect`; active classes only; preselected to the current class when available; otherwise empty. |
| Original question | Read-only text from the associated student question. |
| Agent answer | Read-only textarea containing the selected excerpt. |
| Your question | Required textarea, max 10,000 chars. |
| Buttons | **Cancel** / **Create ticket** (disabled while loading/submitting or without class/question). |

- While classes load: placeholder “Loading classes…”, picker disabled.
- No active classes: “No active classes”, create disabled.
- The current class must be preselected reliably. Implementation note: Radix renders a hidden native `<select>` inside the form and can emit a spurious empty change while options are loading; `AppSelect` ignores that invalid empty change.
- Errors are inline; the dialog keeps entered content on failure.

### Dialog — created state

- Title **Ticket created**; shows ticket ID, status, and class.
- Agent answer and student question remain visible.
- Reply thread labelled **You** / **Teacher**.
- Polls the ticket every 8 seconds while open so trainer replies appear without closing the dialog.
- `ANSWERED`: follow-up form + **Confirm resolved**.
- `OPEN`: follow-up form.
- `RESOLVED`: **Reopen ticket**.
- `EXPIRED`: expiry message, no actions.

---

## 7. Refresh, filtering, and pagination

- Changing status filter, class, or page is a **soft refresh**:
  - Keep the previous rows visible while the request is in flight.
  - Do not show a skeleton or empty frame.
  - Clear the selected ticket, search text, and action errors.
- Initial load and explicit **Retry** show the skeleton.
- Loading state: centred spinner + “Loading …”.
- Error state: inline error + **Retry**; rows are cleared.
- Empty state: “No tickets yet” vs “No tickets match this filter.”
- Search is client-side within the current page; placeholder “Search this page”.
- Student list polls every 20 seconds to pick up trainer replies; trainer refreshes on actions and filter changes.

---

## 8. States and edge cases

| State | Behaviour |
|---|---|
| Archived class in URL | Picker falls back to All; no request is sent for the archived class. |
| Archived class returned by list | Backend excludes it; UI never renders an archived option. |
| Counts request fails | Picker still works from the class list; counts error is non-blocking. |
| Ticket changes status elsewhere | Next poll/refresh updates the badge and available actions. |
| `409` on action | Inline error; keep the ticket visible; next refresh reconciles status. |
| Long question/answer | Scrollable blocks, wrapped text, no horizontal overflow. |
| No classes | Picker disabled; create flow explains that no active class is available. |
| One ticket | Badge says “1 ticket”, not “1 tickets”. |

---

## 9. Responsive and accessibility

- Two-pane inbox collapses to list/detail navigation on narrow screens.
- Header controls wrap; class picker max-width never exceeds the viewport.
- All controls keyboard operable; visible focus rings.
- Dialog traps focus, has a title/description, closes on Escape, and restores focus to the trigger.
- Status badges include text; colour is supplementary.
- Buttons have explicit labels (`Confirm resolved`, `Reopen ticket`, `Mark resolved`, `Send follow-up`).
- `aria-label` on the class picker and status filter group.

---

## 10. API mapping

| UI action | API |
|---|---|
| Student list | `GET /api/tickets/mine?class_id=&status=&page=&page_size=` |
| Student detail | `GET /api/tickets/{id}` |
| Trainer list/detail | `GET /api/tickets?class_id=&status=&page=&page_size=` (thread included in items) |
| Trainer counts | `GET /api/tickets/counts` |
| Create ticket | `POST /api/tickets` |
| Follow-up / reply | `POST /api/tickets/{id}/replies` |
| Confirm/mark resolved | `POST /api/tickets/{id}/resolve` |
| Reopen | `POST /api/tickets/{id}/reopen` |

Client functions live in `features/tickets/api.ts`. Authorization remains server-side.

---

## 11. AC mapping

| AC | UI surface |
|---|---|
| AC-01: trainer marks handled → `RESOLVED` | Trainer detail footer **Mark resolved** for `OPEN`/`ANSWERED`. |
| AC-02: reopen `RESOLVED` | Student and trainer **Reopen ticket**. |
| AC-03: counts per class | Trainer class picker `X open · Y completed`; All option totals. |
| Seven-day expiry | Expired copy and status filter. |
| Archived classes hidden | Picker, lists, counts, and detail actions. |
| Student follow-up | Student detail + Ask my teacher confirmation dialog. |
| Text selection only for students | `canOpenTicket` only on the student agent page. |

---

## 12. Verification checklist

- [ ] Student sees **My Tickets**; `/proposals` redirects.
- [ ] Student picker lists only active enrolled classes.
- [ ] Trainer picker lists only active assigned classes with correct counts.
- [ ] Switching `Open ↔ Answered ↔ Resolved ↔ Expired ↔ All` does not flash a skeleton.
- [ ] Status action buttons appear only for valid statuses.
- [ ] Confirm resolved/reopen refresh the list and keep the ticket visible when filtered.
- [ ] Archived class URL falls back to All without a failed request.
- [ ] Selecting an AI answer shows **Ask my teacher**; trainer chat does not.
- [ ] Dialog preselects the current class and keeps it selected after classes load.
- [ ] Keyboard-only flow works for picker, filters, dialog, and actions.
- [ ] Narrow viewport has no horizontal overflow.

---

## 13. Attachments

- Figma: not created for this task; implementation follows existing admin ticket/inbox patterns.
- API design: `course-qa-agent-be/docs/design/ai-89-ticket-lifecycle-and-counts-api.md`.
- OpenAPI: FastAPI `/docs` after backend deployment.
- UX flow: status transition table in the API design document.

---

## 14. Open decisions

1. Student **Confirm resolved** is retained (AI-81), limited to `ANSWERED`.
2. Student counts are not shown; `/counts` remains trainer-only.
3. Trainer ticket detail is sourced from the inbox list response; no separate detail fetch.
4. No admin ticket UI in this task.
