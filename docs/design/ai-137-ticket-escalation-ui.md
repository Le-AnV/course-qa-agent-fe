# AI-137 — Ticket escalation visibility (UI design)

**Status:** Draft for review
**Related:** AI-81 (student ticket UI), AI-83 (trainer inbox UI), AI-89 (ticket lifecycle UI), AI-137 (this task)
**Implementation branch:** `features/Implementation_TicketEscalationAndPreview`

---

## 1. Scope

AI-137 shows the escalation target on trainer ticket surfaces when the backend has
assigned a stale open ticket to a backup trainer.

In scope:

- Show the backup trainer's name in the trainer inbox list.
- Show the backup trainer's name and escalation time in the selected ticket detail.
- Keep the existing ticket list, filters, actions, and lifecycle behavior unchanged.

Out of scope:

- Escalation controls or manual reassignment.
- Notifications, toasts, or email.
- A new ticket route.
- Student-facing escalation UI.
- Changing who can reply, resolve, or reopen a ticket.

---

## 2. Surface and placement

| Surface | Route | Placement |
|---|---|---|
| Trainer class tickets | `/teacher/class/[id]/tickets` | `TicketInbox` list row and selected detail header |

The student ticket surfaces are unchanged. The API may return escalation fields to a
student owner, but this task does not render them there.

---

## 3. List row

For each ticket with a non-null `escalated_to_name`, render below the existing
metadata line:

```text
Escalated to <trainer name>
```

Visual treatment:

- Amber text (`text-amber-700`), semibold, 11px.
- One line; long names wrap rather than overflow the row.
- No icon is required; the text is the signal.
- The existing status badge, question preview, student name, class code, ticket ID,
  message count, and created time remain unchanged.
- Tickets without escalation render exactly as before; no placeholder or empty gap.

The row remains a single button. The escalation label is not a separate action and does
not change selection behavior.

---

## 4. Detail header

Inside the selected ticket header, after the ticket ID, render:

```text
Escalated to <trainer name> · <formatted escalation time>
```

- Name: semibold, amber, 12px.
- Time: normal weight, grey; wrapped in a `<time dateTime={...}>` element.
- If `escalated_at` is null, render only the name.
- If both fields are null, render nothing.
- The escalation line sits above the question/thread content and does not displace the
  status badge or class label.
- The line is informational only; no hover card, button, or action menu.

The existing `formatTicketDate` helper is used for the timestamp so the page keeps its
current date formatting.

---

## 5. States and edge cases

| State | Behaviour |
|---|---|
| No escalation | No label in list or detail. |
| Escalated, target name present | Label shown in both list and detail. |
| Escalated, target deleted | API returns `escalated_to_name = null`; no label. |
| Timestamp missing | Detail shows the name without a separator or empty time. |
| Very long trainer name | Wraps within the row/header; no horizontal scroll. |
| Loading | Existing skeleton/loading state; no escalation placeholder. |
| Error | Existing inline error + retry; escalation label is absent. |
| Filter changes | Label follows the returned ticket; no client-side derivation. |
| Ticket status changes | Existing refresh/poll updates the row; escalation label is not status-driven. |

The UI does not decide when escalation happens. It only renders the server fields.

---

## 6. Accessibility

- Escalation is conveyed by text, not colour alone.
- The detail timestamp uses a semantic `<time>` element with an ISO `dateTime`.
- The label does not introduce a new focus stop.
- Existing keyboard behavior for selecting rows and pagination is unchanged.
- Amber text is supplementary to the ticket status and question text; it is not the only
  indication that a ticket needs attention.

---

## 7. API mapping

Data comes from the existing trainer inbox response:

```http
GET /api/tickets?class_id=&status=&page=&page_size=
```

Fields consumed:

| Field | Use |
|---|---|
| `escalated_to_name` | Name in list and detail. |
| `escalated_at` | Timestamp in detail. |
| `escalated_to_id` | Not rendered; available for future links. |

The frontend treats all three fields as optional/nullable. No new fetch is added.

Backend contract:
`course-qa-agent-be/docs/design/ai-137-ticket-escalation-api.md`

---

## 8. AC mapping

| Acceptance criterion | UI surface |
|---|---|
| Trainer can see which backup trainer received a stale ticket | List label and detail line use `escalated_to_name`. |
| Trainer can see when escalation happened | Detail `<time>` uses `escalated_at`. |
| Normal tickets are unchanged | Conditional render only when `escalated_to_name` exists. |
| No new actions or permissions | Existing row selection, reply, resolve, and reopen actions are untouched. |
| Label is accessible | Text label plus semantic time element; no colour-only signal. |

---

## 9. Verification checklist

- [ ] An escalated ticket shows `Escalated to <name>` in the trainer list.
- [ ] The same ticket shows the name and formatted time in the detail header.
- [ ] A ticket without escalation shows no label and no empty gap.
- [ ] A ticket with `escalated_to_name = null` but `escalated_at` set shows no label.
- [ ] A ticket with a name but no timestamp shows only the name.
- [ ] Long names wrap without horizontal overflow.
- [ ] Keyboard selection, filters, pagination, reply, resolve, and reopen still work.
- [ ] The label is not the only status indicator and has sufficient contrast.
- [ ] Playwright smoke covers list + detail for the seeded escalated ticket.

---

## 10. Attachments

- Figma: not created for this task; the design follows the existing trainer ticket
  inbox pattern and the AI-89 UI design.
- API design: `course-qa-agent-be/docs/design/ai-137-ticket-escalation-api.md`.
- OpenAPI: FastAPI `/docs` after backend deployment.
- UX flow: escalation is a read-only annotation; no new flow is introduced.

---

## 11. Open decisions

1. **Notification:** no toast or banner is added; the label is persistent metadata.
2. **Target link:** `escalated_to_id` is not linked to a profile because no trainer
   profile route is in scope.
3. **Re-escalation:** the UI does not distinguish first vs later escalation; it renders
   the latest server fields.
