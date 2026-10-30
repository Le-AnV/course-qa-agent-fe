# AI-81 — Student question ticket UI design

## Entry point

Expose **Ask my teacher** on an assistant answer only as an explicit student action. A selected answer excerpt may be attached to the action; selecting text alone must not create a ticket. Do not create tickets automatically after an answer or feedback event.

## Create flow

1. Student opens the action and sees an editable question field, optional assistant-answer excerpt, and class selector populated from their enrolled classes.
2. Preselect the current class when it is among the student's enrolled classes; otherwise select the first available class. The student can change it.
3. The student submits explicitly. Disable duplicate submission while pending; show validation, API errors, or an empty-class state without losing entered content.
4. On success, show the ticket ID, class, and `OPEN` status in the confirmation dialog.

Question is required. Excerpt and question remain visually distinct so students can edit their own question without confusing it with the assistant answer.

## Details and follow-up

The student can enter an initial detail with creation or send a follow-up from the confirmation view. Show the original question, saved excerpt when present, and locally acknowledged follow-ups in the dialog. Explain that closing the dialog ends this immediate view; durable student history/notifications are owned by AI-87.

## Accessibility and responsive behavior

- Use a keyboard-operable button, labeled form controls, dialog title/description, and announced validation/network errors.
- Keep focus in the dialog and restore it to the trigger when closed.
- Ensure the dialog scrolls within the viewport on narrow screens and long text wraps.

## UI states to cover

Closed; loading classes; no classes; editing; submitting; validation/network failure; created confirmation; follow-up submitting/failure/success. Unit and browser checks should confirm that no request occurs before explicit submit, selected class is sent, and follow-up uses the returned ticket ID.
