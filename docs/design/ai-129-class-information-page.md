# UI Design — Class Information Page (AI-129)

> **Ticket:** AI-129 (parent AI-23) · **Status:** Implemented (UI & client logic)
> **Backend contract:** `course-qa-agent-be/docs/design/ai-129-class-information-page.md`

This document is the design spec and hand-over reference for the class page
surface in the `Implementation_ClassManagement` branch: a read-only card on the
teacher and student class overviews, and the editor on the class settings page.
Related: AI-127 (archive/restore), AI-128 (configuration), AI-130 (co-teachers).

## 1. Purpose and user

Students need the practical facts of a class — what it covers, how to join
online, the class group, the schedule — in one predictable place. Trainers write
it once on the settings page; the same content renders read-only on both class
overviews.

## 2. Route and navigation

- Read surfaces: `/teacher/class/[id]/overview` and
  `/student/class/[id]/overview` render `ClassInfoCard`.
- Write surface: `/teacher/class/[id]/settings` renders the `Class information`
  form (same page as AI-128).
- No separate route; the card is a section of the class overview.

## 3. Layout

`components/shared/ClassInfoCard.tsx`:

- Card header: title (`Class information` by default) + optional `action` slot —
  the teacher overview passes an "edit in settings" affordance; the student
  overview passes none.
- Body: definition list (rows, `sm:grid-cols-[150px_1fr]` with a 150px label
  column) in display order: `Schedule`, `Online class`, `Class group`,
  `Description`, `More information`.
- Empty parts are skipped — the card never renders blank rows. When nothing is
  filled, the card shows `emptyMessage` ("No class information yet.").
- Links render as external anchors with an `ExternalLink` icon
  (`target="_blank"`, `rel="noopener noreferrer"`), underlined with a neutral
  decoration that darkens on hover.

Settings form (`Class information` card): Description (textarea, 2000),
Online class link (url input, placeholder `https://meet.google.com/…`), Class
group link (url input, placeholder `https://zalo.me/g/…`), Schedule (input, 200),
More information (textarea, 2000). Intro copy: "This is what students read on
the class overview… Empty fields are hidden."

## 4. Component presentation

- `hasClassInfo(info)` drives filled/empty rendering (description OR meeting URL
  OR group URL OR schedule note OR note).
- Description and note preserve line breaks (`whitespace-pre-line`).
- The label/value rhythm uses the shared type scale (12.5px semibold labels,
  13.5px values) so the card matches other summary surfaces.

## 5. Data & API flow

- `lib/student-api.ts`: `ClassInfo` type (`description`, `meeting_url`,
  `group_url`, `schedule_note`, `note`) with `getClassInfo` /
  `updateClassInfo` (`GET`/`PATCH /api/classes/{id}/info`).
- The settings form keeps a draft, sends only changed fields, and shows the
  `Saved` indicator on success; failures toast the backend `detail`.
- Read access follows the backend rules: staff always; students only for a live
  class they are enrolled in.

## 6. States and edge cases

- Empty card: "No class information yet." — no skeleton rows.
- Partial content: only filled rows render; order stays fixed.
- Invalid or non-http(s) links are rejected server-side (`422`) and surface as a
  toast; the inputs are prefilled with the current values.
- Clearing a field and saving removes its row from the read card.

## 7. Acceptance-criteria mapping

| Jira criterion | UI deliverable |
|---|---|
| AC-01: Staff write; enrolled students read | Settings form for staff; `ClassInfoCard` is read-only everywhere else. |
| AC-02: Links validated | `type="url"` inputs plus backend `422` handling surfaced as toasts. |
| AC-03: Field limits | `maxLength` mirrors the backend bounds (2000/500/200). |
| AC-04: Partial update / clearing | Draft diff send; empty string clears; card hides the cleared row. |
| AC-05: Non-teaching trainer 403; archived page staff-only | Server-enforced; the UI only renders what the API returns. |

## 8. Branch and merge-request convention

Keep the design and implementation deliverables separate:

- Design branch: `features/Design_ClassManagement`; contains this document and its
  siblings for AI-127, AI-128, AI-130 and AI-131 under `docs/design/`.
- Implementation branch: `features/Implementation_ClassManagement`; contains the
  frontend code, but not these design documents.

Create separate merge requests for the two branches and link both to AI-127..131.
Do not mark review, CI, or manual-test checklist items complete without evidence.

## Attachments / Links

* Backend specs: `course-qa-agent-be/docs/design/ai-129-class-information-page.md`
* Jira: https://ai03.atlassian.net/browse/AI-129
