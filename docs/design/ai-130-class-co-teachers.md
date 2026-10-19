# UI Design — Co-teachers per Class (AI-130)

> **Ticket:** AI-130 (parent AI-23) · **Status:** Implemented (UI & client logic)
> **Backend contract:** `course-qa-agent-be/docs/design/ai-130-class-co-teachers.md`

This document is the design spec and hand-over reference for the co-teacher
surface built on the admin class management page
(`app/(shell)/admin/classes/page.tsx`) in the `Implementation_ClassManagement`
branch. Related: AI-127 (archive/restore), AI-128 (configuration), AI-129
(class page).

## 1. Purpose and user

Admins manage who teaches a class: the primary trainer owns it, co-trainers share
it. Co-teaching or a mid-semester handover happens on the class row itself — no
class is ever recreated, and trainers never lose their roster or materials.

## 2. Route and navigation

- Route: `/admin/classes` — the admin class management page.
- Two touchpoints: the `Trainer` column on each row, and the create-class form.
- The `Manage trainers` modal opens from the row `ActionMenu`.

## 3. Layout

`Trainer` column per row:

- Primary trainer `<select>` (admin-only affordance) that calls
  `assignStaff` and toasts "Primary trainer updated."
- Below it, when co-trainers exist: a `+ {names}` line listing every co-trainer
  (primary excluded).
- When no primary trainer is set: a `Needs trainer` hint in warning colour.
- The row select is labelled for assistive tech:
  `aria-label="Primary trainer for {code}"`.

Create-class panel — `Co-trainers (optional)` checkbox list fed by active
trainer/admin accounts excluding the chosen primary; "No other trainer accounts
yet." when the list is empty. Chosen co-trainers are applied right after the
class is created; the result toasts honestly:
"Class {code} created, but {n} co-trainer(s) could not be added — open Manage
trainers."

`Manage trainers` modal:

- Title `Trainers — {code}`, subtitle "The primary trainer owns the class;
  co-trainers share access."
- List of current trainers: name, email, and a role label — `Primary trainer` or
  `Co-trainer`.
- `Remove` buttons appear **only for co-trainers**; the primary row has no remove
  affordance (the backend also rejects it with `400`).
- `Add a co-trainer` select lists trainers not already on the class; the add
  button is disabled until a choice is made or while a request is busy.

## 4. Component presentation

- `classTrainers(cls)` normalises the row payload: `cls.trainers` when present,
  otherwise a single-entry array built from the legacy `trainer_id` /
  `trainer_name` fields with `is_primary: true` — old rows and new rows render
  identically.
- Role labels are text, not colour-only, so the distinction survives
  colour-blindness and screen readers.
- Member lists (`MembersTable` surfaces) show every trainer of the class because
  the API's members view is built from the same trainer set.

## 5. Data & API flow

- `lib/admin-api.ts`: `ClassTrainer` type (`trainer_id`, `name`, `email`,
  `is_primary`), `adminApi.addTrainer(classId, trainerId)` →
  `POST /api/admin/classes/{id}/trainers`, `adminApi.removeTrainer(classId,
  trainerId)` → `DELETE /api/admin/classes/{id}/trainers/{trainer_id}`; both
  return the updated `ClassRead` and replace the row/modal state.
- Primary trainer changes stay on `adminApi.assignStaff` — a different control
  and endpoint entirely.
- Errors (duplicate add, primary removal, invalid trainer) toast the backend
  `detail` message.

## 6. States and edge cases

- Adding or removing keeps the modal open with the refreshed list; the toasts
  report success.
- Duplicate add is impossible from the UI (already-added trainers are filtered
  out of the select) and is still rejected by the backend with `400`.
- A class without co-trainers renders no `+ names` line and the modal shows just
  the primary row.
- Archives do not touch trainer assignments; a restored class keeps its whole
  teaching team.

## 7. Acceptance-criteria mapping

| Jira criterion | UI deliverable |
|---|---|
| AC-01: Admin class list shows every trainer, primary first, with `is_primary` | `Trainer` column select + `+ names` line; modal lists every trainer labelled Primary/Co. |
| AC-02: Add/remove co-trainer; primary not removable here; duplicates rejected | Remove button only on co-trainer rows; select filters existing members; backend guards remain. |
| AC-03: Co-trainer workspace parity | Client-side nothing changes for trainers — the class simply appears in their workspace through the API. |
| AC-04: Member list shows every trainer | Member surfaces render the same trainer set (`MembersTable`). |

## 8. Branch and merge-request convention

Keep the design and implementation deliverables separate:

- Design branch: `features/Design_ClassManagement`; contains this document and its
  siblings for AI-127, AI-128, AI-129 and AI-131 under `docs/design/`.
- Implementation branch: `features/Implementation_ClassManagement`; contains the
  frontend code, but not these design documents.

Create separate merge requests for the two branches and link both to AI-127..131.
Do not mark review, CI, or manual-test checklist items complete without evidence.

## Attachments / Links

* Backend specs: `course-qa-agent-be/docs/design/ai-130-class-co-teachers.md`
* Jira: https://ai03.atlassian.net/browse/AI-130
