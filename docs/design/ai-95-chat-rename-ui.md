# AI-95 - Rename a Chat Conversation (UI Design)

> **Ticket:** AI-95 (Epic E7, chat history)
> **Repo:** `course-qa-agent-fe`
> **Target branch:** `features/Design_ChatRename`
> **Status:** Implemented (UI & client integration)

## Purpose

The sidebar already lists saved conversations and lets the owner delete one. A
session title is generated from the first question (AI-95 AC-03), which stops
being useful once the conversation moves on. This design adds a rename action
next to Delete so a student can give the conversation a memorable name.

> **Figma:** not produced. The dialog reuses the existing delete-confirmation
> pattern, so this document is the design deliverable for the Design branch.

## Layout

```
+------------------------------------------+
|  Chat History                    [+] [<] |
+------------------------------------------+
|  Logistics deadline             [pencil] [trash]
|  2 hr ago
|  Week 3 review                  [pencil] [trash]
|  Yesterday
+------------------------------------------+

        (click pencil)

+------------------------------------------+
|  Rename conversation                     |
|  Give this conversation a memorable      |
|  name. The message content stays         |
|  unchanged.                              |
|                                          |
|  Conversation title                      |
|  [ e.g. Chapter 3 review              ]  |
|  18/255 characters                       |
|                                          |
|                    [ Cancel ] [Save name]|
+------------------------------------------+
```

- The pencil sits beside the trash icon inside the same hover group, so it never
  selects the row.
- The rename dialog mirrors the delete dialog: title, description, one labelled
  field, helper counter, outline Cancel + primary Save.
- Long titles truncate in the row with `truncate`; the full value stays in the
  dialog input.

## States

| State | Behaviour |
|---|---|
| Row idle | Actions hidden (`opacity-0`), shown on `group-hover` or when the row is active |
| Dialog open | Input prefilled with the current title, autofocused, text selected by the browser |
| Empty input | `Save name` disabled |
| Unchanged title | `Save name` disabled |
| Saving | `Save name` shows a spinner, both buttons disabled, dialog cannot be dismissed |
| Save success | Dialog closes, row title updates in place, toast `Conversation renamed.` |
| Save failure | Dialog stays open, toast `Rename failed: <reason>` |
| Keyboard | `Enter` submits, `Escape` closes, pencil reachable by `Tab` and triggered by `Enter`/`Space` |

## Interaction flow

1. Hover a conversation (or focus it with the keyboard) -> pencil and trash appear.
2. Click the pencil -> dialog opens with the title prefilled.
3. Edit the title; whitespace is trimmed on save, and a value equal to the current
   title keeps the save button disabled.
4. Submit -> `PATCH /api/history/{session_id}` with `{ "title": "..." }`.
5. The returned `ChatSessionResponse` replaces the row locally; the list is **not**
   re-sorted, because a rename is not activity.
6. Failure keeps the dialog open so the text is not lost.

## Data contract

```http
PATCH /api/history/{session_id}
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "Week 3 - logistics review" }
```

`200` returns the updated `ChatSessionResponse`; `403`/`404`/`422` are shown in the
error toast through `getHistoryErrorMessage`.

## Validation and copy

| Element | Copy |
|---|---|
| Button title / aria-label | `Rename conversation` / `Rename <title>` |
| Dialog title | `Rename conversation` |
| Dialog description | `Give this conversation a memorable name. The message content stays unchanged.` |
| Field label | `Conversation title` |
| Placeholder | `e.g. Chapter 3 review` |
| Counter | `<n>/255 characters` |
| Primary action | `Save name` |
| Success toast | `Conversation renamed.` |
| Error toast | `Rename failed: <reason>` |

`maxLength=255` on the input matches the backend constraint; the counter shows the
trimmed length so it is clear what will be submitted.

## Accessibility

- The pencil is a focusable control with `role="button"`, `tabIndex={0}`, an
  `aria-label` that includes the conversation title, and `Enter`/`Space` handling.
- The dialog uses the shared `Dialog` primitives, so focus is trapped and restored.
- The character counter is plain text; the disabled state of `Save name` is the
  primary signal, not colour alone.

## Responsive behaviour

| Viewport | Behaviour |
|---|---|
| Desktop | Pencil and trash appear on hover in the sidebar row |
| Tablet | Same behaviour; the dialog is `sm:max-w-md` |
| Mobile | Action icons stay visible on the active row; dialog takes the full width |

## Related

- AI-95 - Save & Display Chat History (`docs/design/ai-95-ui-chat-history.md`).
- Backend: `course-qa-agent-be/docs/design/ai-95-chat-rename.md`.
