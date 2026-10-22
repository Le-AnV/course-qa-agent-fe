# UI Design — Class Prerequisites & Enrollment Eligibility (AI-134)

> **Ticket:** AI-134 · **Status:** Implemented (UI & client logic)
> **Backend contract:** `course-qa-agent-be/docs/design/ai-134-class-prerequisites.md`

This document is the design spec and hand-over reference for the prerequisite
surfaces added to the admin class management page, the trainer member roster and
the student class catalog.

## 1. Purpose and users

- **Admin** declares which classes must be passed before a class can be joined.
- **Trainer** records each member's term result (`PASSED` / `FAILED`) in the
  prerequisite class.
- **Student / teaching assistant** sees which prerequisites still block a class
  and cannot send a join request until they are cleared.

The rule is visible before acting (catalog tag + disabled action), not only as a
server error after the request.

## 2. Routes and touchpoints

| Route | Touchpoint | Role |
|---|---|---|
| `/admin/classes` | `Prerequisites (optional)` checkbox list in the create-class panel | Admin |
| `/admin/classes` | `Prerequisites` section + `Save prerequisites` inside the manage modal (row action) | Admin |
| `/teacher/class/[id]/members` | `Result` column with a per-student select | Trainer |
| `/student/classes` | `Requires: <codes>` line and disabled request button | Student / TA |

## 3. Layout and behaviour

### Admin — create class

- Checkbox list inside the create form, labelled `Prerequisites (optional)`,
  scrollable at `max-h-32`, one row per existing class showing the class code.
- Selection is part of the create payload (`prerequisite_class_ids`); the class
  is created with its prerequisites in one request, so there is no half-created
  state to clean up.
- The list is not filtered by course or status beyond what the classes endpoint
  returns; admins pick by code.

### Admin — manage modal

- The row `Manage trainers` action opens the modal; the modal now also contains
  a `Prerequisites` section seeded from `cls.prerequisites`.
- The class being edited is filtered out of the list, so self-reference cannot be
  produced from the UI (the API rejects it anyway).
- `Save prerequisites` sends the **complete** selection; unchecking everything
  clears the prerequisites.
- Success sets a notice (`Prerequisites updated for {code}.`); failure toasts the
  backend message (e.g. unknown class) and leaves the selection untouched.
- Button is disabled while the request is in flight.

### Trainer — member roster

- The `Result` column renders a `<select>` with `Not graded`, `Passed`, `Failed`.
- Only rendered when the caller is a trainer and the member is not themselves a
  trainer row; teaching assistants and admins see the stored value as text or
  `—`.
- Colour is reinforcing, not the only signal: the select also shows the text
  value; `aria-label` is `Result for {username}`.
- Changing the select saves immediately; the row is optimistic-updated on
  success, disabled while saving, and toasts the error on failure.
- Clearing the selection sends `null` and returns the row to `Not graded`.

### Student / TA — catalog

- When `blocked_prerequisites` is non-empty, the card shows
  `Requires: SWE101, SWE201` in warning colour under the class code.
- The request button is disabled while `can_request === false`, its label reads
  `Prerequisite required`, and the `title` explains
  `Pass the prerequisite subjects first.`
- Once a prerequisite is graded `PASSED`, the next catalog load returns an empty
  block list and the normal `Request to join` action.

## 4. States

| State | Admin | Trainer | Student |
|---|---|---|---|
| Loading | Existing panel skeleton; modal opens with current selection | Roster skeleton; result column hidden until data arrives | Catalog skeleton |
| Empty | No classes to choose → empty bordered list | No members → existing empty row | No blocked prerequisites → no tag |
| Error | Toast with backend message; modal stays open | Toast on save; select keeps previous value | Existing retry banner for catalog failures |
| Busy | `Save prerequisites` disabled; create button disabled | Select disabled for the acting row | Request button shows `Sending…` |

## 5. Data and API flow

- `lib/admin-api.ts`
  - `ClassSection.prerequisites?: {id, code, name}[]`
  - `createClass({ ..., prerequisite_class_ids })`
  - `setPrerequisites(classId, ids)` → `PATCH /api/admin/classes/{id}/prerequisites`
- `lib/student-api.ts`
  - `CatalogClass.blocked_prerequisites?: {id, code, name}[]`,
    `CatalogClass.can_request?: boolean`
  - `ClassMember.result?: "PASSED" | "FAILED" | null`
  - `setResult(classId, studentId, result)` →
    `PATCH /api/student/classes/{id}/members/{student_id}/result`
- Trainer role is read via `useSyncExternalStore` from `AUTH_ROLE_KEY` in local
  storage, matching how the rest of the shell resolves the role client-side.
- Backend failures on fetch now say
  `Cannot reach backend at … — check "docker compose up -d --build" and the
  backend logs (migrations run on start), then Retry.` instead of blaming CORS.

## 6. Accessibility and responsive behaviour

- Checkbox lists use real `<label>` + `<input type="checkbox">`, keyboard
  operable and screen-reader announced.
- The result select has an explicit `aria-label` including the student name.
- Disabled request buttons keep readable text (`Prerequisite required`) rather
  than relying on colour; the reason is available via `title` (mouse) — screen
  readers get the label text.
- Layout reuses the existing admin table/card breakpoints: the modal is
  scrollable on narrow screens and the catalog cards stack vertically.

## 7. Known gaps

- The admin class table does not display a `Prerequisites` column; prerequisites
  are visible only inside the manage modal and in API responses.
- Class pickers show codes only — `ClassRead` has no `name` field for the
  prerequisite list.
- Transitive prerequisites (prerequisite of a prerequisite) and cross-class
  cycles are not represented in the UI.
- Catalogue blocking is computed per class; at very large catalogs this is an
  N+1 pattern on the backend.
