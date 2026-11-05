# AI-87 — In-app ticket reply notification (UI design)

**Status:** Implemented
**Related:** AI-81 (student tickets), AI-83 (trainer inbox), AI-89 (ticket lifecycle), AI-87 (this task)
**Implementation branch:** `features/Implementation_InAppNotification`

---

## 1. Scope

Students see unread instructor replies in the shared notification bell and can open the relevant ticket. The existing teacher bell continues to show unanswered tickets. Ticket-reply notifications stay inside the app; no ticket-reply email UI is involved.

The design reuses the ticket notification provider and bell in the desktop sidebar and mobile navigation. It does not add a separate notification page.

---

## 2. Routes and entry points

| Surface | Route | Behavior |
|---|---|---|
| Student home | `/student/home` (also `/student` entry) | Show the one-time summary popup when unread replies exist. |
| Student ticket detail | `/student/class/[id]/tickets?ticket_id=[ticket_id]` | Select the linked ticket and mark its unread reply seen. |
| Teacher home | `/teacher/home` | Show the one-time unanswered-ticket summary when tickets exist. |
| Teacher ticket detail | `/teacher/class/[id]/tickets?ticket_id=[ticket_id]` | Open the selected unanswered ticket. |

The provider wraps the navigation and page content so the student ticket page can refresh the bell after marking a reply seen.

---

## 3. Student notification bell

The badge shows the API's total number of tickets with unread instructor replies, capped visually at `99+`. The panel title is **New teacher replies**. Each row shows the class code, question preview, and time of its latest unread reply. Visible rows are sorted newest first by that reply time.

The panel requests the first five unread tickets; its header shows the full unread total. Opening the bell dismisses the summary popup. Selecting a row dismisses the popup, closes the panel, and follows the ticket deep link. The ticket page marks the selected reply seen and refreshes the bell.

The panel has refresh, loading, empty, and error states. It closes on outside pointer input, Escape, or route change.

---

## 4. Summary popup and motion

On a home entry with a positive count, the popup says **You have N new reply/replies from your instructor.** The teacher version says **You have N unanswered ticket/tickets.** It appears at most once per provider lifetime, auto-dismisses after four seconds, and can be dismissed with its close button or by opening the bell.

The popup and bell panel enter with a short opacity/translate/scale animation (`ticket-notification-pop`, 420 ms). The popup also has an opacity/transform exit transition. `prefers-reduced-motion: reduce` shortens these effects to 1 ms.

---

## 5. Refresh and unread state

The student provider requests `GET /api/tickets/mine?unread=true&page=1&page_size=5` on entry, on window focus, and every 30 seconds. It compares the latest unread reply IDs between responses and prompts the ticket page to refresh when they change. The teacher provider requests open tickets on entry and focus.

The ticket page determines each row's unread marker from `student_seen_at` and the reply list. When its selected ticket has an unread instructor reply, it calls `POST /api/tickets/{ticket_id}/seen`, refreshes the ticket list, and refreshes the bell. A failed seen request leaves the reply eligible for a later attempt.

---

## 6. States and edge cases

| State | UI behavior |
|---|---|
| No unread replies | Badge hidden; panel says “No new replies.” |
| New reply while page is open | Poll or window focus updates the badge and panel. |
| Multiple unread tickets | Panel orders its fetched rows by latest unread reply time. |
| Notification deep link | Ticket page selects the ticket from `ticket_id`, including when it is not on the current list page. |
| Seen request succeeds | Ticket and bell refresh; unread marker clears. |
| Seen request fails | The page can retry after its state changes; the API remains authoritative. |
| Request fails | Panel shows an error and a **Try again** control. |
| Home popup already shown | Route changes and later polls do not show it again in the same provider lifetime. |

---

## 7. Accessibility

- The bell button exposes an accessible count label, `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`.
- The panel has `role="dialog"`; the summary popup uses `role="status"` and has a labelled dismiss button.
- Ticket rows are links with visible text and keyboard focus styling.
- Badge information is conveyed by the accessible label and panel text, not color alone.
- Entry and exit motion respects the system reduced-motion preference.

---

## 8. API mapping

| Client operation | Backend endpoint |
|---|---|
| Load student unread count and rows | `GET /api/tickets/mine?unread=true&page=1&page_size=5` |
| Mark selected student ticket seen | `POST /api/tickets/{ticket_id}/seen` |
| Load teacher unanswered count and rows | `GET /api/tickets?status=OPEN&page=1&page_size=5` |

The student ticket response includes `student_seen_at` and `replies` for the row-level unread calculation.

---

## 9. AC mapping

| Criterion | UI behavior |
|---|---|
| AC-01: in-app notification appears | Student bell badge, panel, and home summary popup surface unread replies. |
| AC-02: click opens ticket detail | Panel row links to the student ticket route with `ticket_id`. |
| AC-03: ticket list shows latest status | Student tickets refresh after a new reply and after the selected reply is marked seen. |

---

## 10. Verification checklist

- Student and teacher bells appear in desktop and mobile navigation.
- Student home popup appears once per page load when unread replies exist; selecting a notification does not repeat it.
- Bell rows show the newest unread reply first and open the matching ticket.
- Opening the ticket clears its unread badge and row marker after the seen request succeeds.
- Polling and window focus update the count without reopening the home popup.
- Keyboard dismissal, loading/error/empty states, and reduced-motion behavior are checked.
