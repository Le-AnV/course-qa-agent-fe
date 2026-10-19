# UI Design — Class Configuration & Capacity (AI-128)

> **Ticket:** AI-128 (parent AI-23) · **Status:** Implemented (UI & client logic)
> **Backend contract:** `course-qa-agent-be/docs/design/ai-128-class-configuration.md`

This document is the design spec and hand-over reference for the per-class
teaching configuration built on the class settings page
(`app/(shell)/teacher/class/[id]/settings/page.tsx`) in the
`Implementation_ClassManagement` branch. Related: AI-127 (archive/restore),
AI-129 (class page), AI-130 (co-teachers).

## 1. Purpose and user

The trainer of a class (primary or co-trainer; admins too) edits how the class
should behave — student capacity, delivery mode, language, answer scope,
citation rule, answer length and session length — and can copy the teaching
configuration from another class they teach. Students never reach this surface:
they have no settings route.

## 2. Route and navigation

- Route: `/teacher/class/[id]/settings` (client component).
- Reached from the class workspace; the read-only class facts (code, semester,
  academic year, credits, trainer) render at the top for orientation.
- The student class layout has no settings destination, and the backend rejects
  students on every configuration route.

## 3. Layout

Top to bottom on the settings page:

1. Read-only class facts panel (`ReadOnlyField`: Code, Semester, Academic year,
   Credits, Trainer).
2. `Class information` form — the AI-129 class page fields (see companion doc).
3. Teaching configuration card — subtitle: "Student limit, delivery mode and
   session length for this class. Copy them onto another class…". Fields:
   - `Student capacity` — number input, empty means unlimited, inline error text
     bound via `aria-describedby="cfg-capacity-help"` and `aria-invalid`.
   - `Delivery mode` — select with `DELIVERY_LABELS` (on-campus / online /
     hybrid).
   - `Default language`, `Answer scope`, `Citation required`,
     `Max answer words`, `Session length`.
   - Save button disabled when the form is not dirty, busy, or the capacity is
     invalid.
4. Copy configuration card — source select + `Copy configuration` button.
   Subtitle: "Copies delivery mode and session length from a class you teach.
   Capacity is not copied — it depends on this class' own roster." When no other
   class is available: "No other class is available to copy from."

## 4. Component presentation

- Capacity input help text (`cfg-capacity-help`) shows either the validation
  error ("…cannot be lower than the current roster", in red) or the neutral
  hint; `aria-invalid` mirrors the error state.
- Dirty tracking: `dirty` gates the save button; a `Saved` check appears after a
  successful save and disappears on the next edit (`infoSaved` pattern).
- Copy flow refreshes the draft from the response (including the capacity text
  field) and toasts on failure.

## 5. Data & API flow

- `lib/student-api.ts` (class workspace client): `getClassInfo` /
  `updateClassInfo`, `getConfig` / `updateConfig`, `copyConfig(id, sourceId)`,
  and the config-sources list for the picker.
- The sources picker is scoped server-side (`GET /api/classes/config-sources`) —
  never archived, never a class the caller does not teach.
- `422` responses (bad vocabulary, out-of-range numbers) surface as toast errors
  through the shared fetch helper.

## 6. States and edge cases

- Loading: skeleton before the first config read; the forms render only when
  `!loading && !error && config`.
- Capacity floor: the backend refuses values below the current roster (`400`);
  the client pre-checks and shows the inline error before the request.
- Unlimited capacity: empty input → `capacity: null` (renders as
  `students / —` on the admin list).
- Copy with no source selected → button disabled.
- Archived classes are never offered as copy sources, and the configuration of an
  archived class stays readable by its staff.

## 7. Acceptance-criteria mapping

| Jira criterion | UI deliverable |
|---|---|
| AC-01: Staff-only surface | Settings route renders only for trainers/admins; backend re-checks every call. |
| AC-02: Typed values | Selects/inputs mirror the vocabulary; invalid input returns `422` and surfaces as a toast. |
| AC-03: Capacity optional, never below roster | Empty = unlimited; inline error + client check; backend guard remains authoritative. |
| AC-04: Partial updates | Only changed fields are sent; the response replaces the whole form state. |
| AC-05: Copy configuration | Copy card → `copyConfig`; source picker scoped by `config-sources`; capacity not copied (stated in the copy). |

## 8. Branch and merge-request convention

Keep the design and implementation deliverables separate:

- Design branch: `features/Design_ClassManagement`; contains this document and its
  siblings for AI-127, AI-129, AI-130 and AI-131 under `docs/design/`.
- Implementation branch: `features/Implementation_ClassManagement`; contains the
  frontend code, but not these design documents.

Create separate merge requests for the two branches and link both to AI-127..131.
Do not mark review, CI, or manual-test checklist items complete without evidence.

## Attachments / Links

* Backend specs: `course-qa-agent-be/docs/design/ai-128-class-configuration.md`
* Jira: https://ai03.atlassian.net/browse/AI-128
