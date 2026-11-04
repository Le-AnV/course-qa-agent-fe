# AI-135 Answer Feedback and Confirmed Ticket Creation

## Purpose

Define the student and trainer UI for rating a completed AI answer and, when needed, asking the assigned teacher to review that answer. The existing chat history, text-selection Ask my teacher flow, and ticket inbox/detail views are reused.

## Student chat behavior

### Feedback controls

- Show **Helpful** and **Not helpful** below a persisted, completed assistant answer.
- Do not show controls while an answer is streaming, pending, or marked as an error.
- Use the backend assistant message ID from the SSE `done` event; use the message ID and saved feedback when rendering history.
- Mark the saved selection with `aria-pressed`. Disable both choices while a feedback request is in flight and expose saving/error status accessibly.
- Feedback can be changed. Changing it does not remove an existing ticket link.
- Use a brief entrance transition and honor reduced-motion preferences.

### Helpful flow

1. Student selects **Helpful**.
2. FE sends `PUT /api/chat/messages/{message_id}/feedback` with `{"feedback":"helpful"}`.
3. On success, display the saved selection and do not open the ticket dialog or send a ticket request.
4. On failure, keep the prior saved state, show an error, and allow retry.

### Not helpful flow

1. Student selects **Not helpful**.
2. FE saves the feedback through the same feedback endpoint.
3. Only after a successful response, offer the existing Ask my teacher dialog in feedback mode.
4. If history has no reliably linked original question, explain that ticket creation from this answer is unavailable; keep the existing text-selection Ask my teacher flow available.

## Confirm ticket dialog

The feedback mode reuses the existing Ask my teacher dialog and displays:

- The class associated with the chat, read-only.
- The original question, read-only.
- The complete assistant answer, read-only.
- Saved citations using the existing citation chip component.
- An optional details field for the student's explanation.
- **Cancel** and **Confirm and send** actions.

Opening the dialog, closing it, canceling, reloading the page, or selecting Helpful must not create a ticket. Only **Confirm and send** calls `POST /api/chat/messages/{message_id}/ticket` with `{"confirmed":true,"details":"..."}`.

While requests are running, disable relevant controls to prevent duplicate submits. If feedback saving or ticket creation fails, show a clear error, preserve entered details, and allow retry. The backend response is authoritative for the created ticket. Once created, show an **Open ticket** link; changing feedback leaves that link available.

## Ticket detail and trainer inbox

- Reuse the existing ticket citation display component in the student ticket detail and trainer inbox detail.
- Show the original question, complete answer, and citations from the ticket snapshot.
- Render an empty citation list without an empty placeholder.
- Keep existing manual ticket conversation and text-selection ticket flows unchanged in behavior.

## Data and API dependencies

Chat history provides `feedback`, nullable `ticket_id`, `original_question`, and `can_create_feedback_ticket` for assistant messages. The SSE completion event provides the assistant message ID needed for immediate feedback.

The ticket creation API accepts only confirmation and optional student details. Class, original question, full answer, and citations come from backend-persisted chat data. Ticket responses provide `citations` and nullable `source_message_id` for student and trainer views.

## States and accessibility

| State | UI behavior |
|---|---|
| Streaming/pending answer | No feedback controls. |
| Completed saved answer | Show both choices and saved selection, if any. |
| Saving feedback | Disable choices; announce saving status. |
| Feedback save error | Show alert; allow retry without changing saved state. |
| Negative feedback with known prompt | Offer Ask my teacher. |
| Negative feedback with unknown prompt | Explain the limitation; preserve selection-based teacher help. |
| Ticket dialog open | Show immutable source context, editable optional details, Cancel and explicit confirmation. |
| Ticket submit error | Keep dialog and details; allow retry. |
| Ticket created | Replace creation action with link to open that ticket. |
| Existing ticket after feedback change | Keep its link visible. |

Buttons expose pressed/busy state and visible keyboard focus. Respect reduced-motion settings for entrance and state transitions.

## Acceptance criteria mapping

| AC | UI behavior |
|---|---|
| AC-01 | Feedback controls appear only below completed, successful assistant answers. |
| AC-02 | Not helpful saves first, then offers a dialog with source context; creation requires explicit confirmation. |
| AC-03 | Ticket context and citations are visible in student and trainer ticket detail. |
| AC-04 | Helpful selection is saved and restored after reload without creating a ticket. |
| AC-05 | Rendering, feedback selection, dialog open/close, Cancel, and reload do not create tickets. |

## Acceptance test scenarios

- Complete an answer; verify controls are absent during streaming and after an error.
- Save Helpful, reload history, and verify it remains selected with no ticket request.
- Save Not helpful; verify the dialog opens only after save succeeds.
- Open and cancel the dialog; verify no ticket is created. Confirm once, then reload and open the resulting ticket.
- Cause a feedback or ticket request failure; verify the error is visible and ticket details remain available for retry.
- Double-click confirmation and retry after a network error; verify one ticket is linked to the answer.
- Verify citations appear in both student and trainer ticket details and the text-selection flow still works.
