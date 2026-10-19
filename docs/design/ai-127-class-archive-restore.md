# UI Design — Class Archive & Restore (AI-127)

> **Ticket:** AI-127 (parent AI-23) · **Status:** Implemented (UI & client logic)
> **Backend contract:** `course-qa-agent-be/docs/design/ai-127-archive-restore-class.md`

This document is the design spec and hand-over reference for the archive/restore
surface built on the admin class management page
(`app/(shell)/admin/classes/page.tsx`) in the `Implementation_ClassManagement`
branch. Related: AI-128 (configuration), AI-129 (class page), AI-130
(co-teachers).

## 1. Purpose and user

An admin needs to retire a finished class without deleting anything: archiving
hides the class from its trainer and students, restoring brings it back
untouched. Permanent deletion is a deliberate second step that only works on an
already archived class.

## 2. Route and navigation

- Route: `/admin/classes` — the existing admin class management page (client
  component).
- No new navigation entries; archive/restore lives on each table row.

## 3. Layout

`AdminPageShell` (title `Classes`, subtitle "Each class is a subject with a
primary trainer, plus any co-trainers who share the teaching.") with the create
panel and the class table. Table columns:

1. `Class` — code, name, and an `Archived` badge when
   `(cls.status ?? "ACTIVE") === "ARCHIVED"`.
2. `Trainer` — primary trainer select plus a `+ co-trainer names` line (AI-130).
3. `Students` — `student_count`, with ` / capacity` appended when a capacity is
   set (AI-128).
4. `Actions` — the row `ActionMenu`.

Archived rows render at `opacity-60` so the state is visible at a glance while
staying in the table for review.

## 4. Component presentation

Row actions (portal `ActionMenu`, AI-131):

| Row state | Menu items |
|---|---|
| Active class | `Manage trainers` · `Archive class` |
| Archived class | `Manage trainers` · `Restore class` · `Delete permanently` |

- `Archive class` / `Restore class` open the shared `ConfirmDialog` with the
  class code in the copy:
  - Archive — tone `danger`, confirm label `Archive class`, body: "…is hidden
    from its trainer and students. Nothing is deleted — the roster, materials and
    tickets are kept, and you can restore it at any time."
  - Restore — tone `default`, confirm label `Restore class`, body: "…becomes
    visible to its trainer and students again."
- `Delete permanently` is offered **only** for archived classes — the comment in
  code says it is "a deliberate second step: archive first".
- Search (`Search classes, trainer`) matches code/name/trainer name as before.

## 5. Data & API flow

- `lib/admin-api.ts`: `adminApi.setClassStatus(id, "ARCHIVED" | "ACTIVE")` →
  `PATCH /api/admin/classes/{id}/status`; the response is the updated
  `ClassRead` and replaces the row in place.
- `AdminUser`-style `ClassSection` type carries `status`, `capacity`,
  `student_count` and `trainers` for rendering.
- Success toasts are explicit about data safety: "Archived CS101-A. Teachers and
  students no longer see it; nothing was deleted." / "Restored CS101-A. It is
  visible to its members again."
- Failures render `toast.error` with the backend `detail` message.

## 6. States and edge cases

- Busy: the dialog's confirm button shows `Archiving…` / `Restoring…` and is
  disabled while the request is in flight.
- Archived + no active students: archive is allowed (documents of archived
  classes leave the catalog server-side).
- Cancel closes the dialog without a request.
- A class without a primary trainer shows the `Needs trainer` hint regardless of
  status.

## 7. Acceptance-criteria mapping

| Jira criterion | UI deliverable |
|---|---|
| AC-01: Archive from the class management screen with confirmation | Row menu → `ConfirmDialog` (danger tone) → `setClassStatus(..., "ARCHIVED")`. |
| AC-02: Archived class disappears from active lists | Archived rows leave every non-admin workspace (server-side); the admin table keeps them, dimmed with a badge. |
| AC-03: Nothing is deleted | Confirmation copy states it explicitly; archive only flips `status`. |
| AC-06 / AC-07: Admin-only restore | `Restore class` appears only in the admin menu; the endpoint enforces admin. |
| AC-08: Badge + default visibility rules | `Archived` badge + `opacity-60` on archived rows. |

AC-04 (students reach archived material, AI-126) is not part of this surface.

## 8. Branch and merge-request convention

Keep the design and implementation deliverables separate:

- Design branch: `features/Design_ClassManagement`; contains this document and its
  siblings for AI-128, AI-129, AI-130 and AI-131 under `docs/design/`.
- Implementation branch: `features/Implementation_ClassManagement`; contains the
  frontend code, but not these design documents.

Create separate merge requests for the two branches and link both to AI-127..131.
Do not mark review, CI, or manual-test checklist items complete without evidence.

## Attachments / Links

* Backend specs: `course-qa-agent-be/docs/design/ai-127-archive-restore-class.md`
* Jira: https://ai03.atlassian.net/browse/AI-127
