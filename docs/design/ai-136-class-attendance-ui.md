# AI-136 — Class Attendance UI Design

> **Ticket:** [AI-136](https://ai03.atlassian.net/browse/AI-136) (Epic AI-145: Class Schedule & Attendance)
> **Priority:** High | **Story Points:** 8 SP
> **Status:** Design — ready for implementation review
> **Target branch:** `features/Design_ClassAttendance` → `features/Implementation_ClassAttendance`
> **Backend contract:** `course-qa-agent-be/docs/design/ai-136-class-attendance-api.md`
> **Related:** AI-157 (student schedule view), AI-158 (teacher absence + handover)

---

## 1. Purpose

Add a session-based attendance workspace to the existing class pages:

* **Teacher** — open a week, materialise sessions, mark each enrolled student,
  save, and see a class summary.
* **Student** — see their own attendance history and rate.
* **Admin** — open a summary modal from the admin class list.

The UI uses the existing app language (English), the existing class tab shell,
the existing `Table`, `Modal`, `Alert`, `EmptyState`, `Button`, `AppSelect`, and
`toast` primitives. No new design system is introduced.

### Scope boundaries

* Attendance is recorded only for `date <= today` (Vietnam time).
* Cancelled sessions are read-only. Cancelling/rescheduling is out of scope.
* No admin class-detail page; the admin gets a modal.
* No notification or auto-absence UI.
* No new backend migration.

---

## 2. Routes and navigation

### 2.1 Teacher

| Route | File |
|---|---|
| `/teacher/class/[id]/attendance` | `app/(shell)/teacher/class/[id]/attendance/page.tsx` |

Tab order becomes:

```text
Overview → Syllabus → Q&A Chat → Tickets → Quiz Import → Attendance → Members
→ Course Settings
```

Insert **Attendance after `Quiz Import`, before `Members`**. Keep the existing
tab order otherwise. The desktop tab row will have eight items; check the
1024 px layout and add `overflow-x-auto` to the nav if it overflows.

```ts
{ id: "attendance", label: "Attendance", href: `/teacher/class/${id}/attendance` }
```

### 2.2 Student

| Route | File |
|---|---|
| `/student/class/[id]/attendance` | `app/(shell)/student/class/[id]/attendance/page.tsx` |

Tab order becomes:

```text
Overview → Syllabus → Q&A Chat → My Tickets → Attendance → Members
```

Insert **Attendance after `My Tickets`, before `Members`**.

The existing `classSectionFromPathname()` already preserves a single nested
section such as `attendance`, so the mobile class switcher will link to the same
tab in another class without extra work.

### 2.3 Admin

No new route. Add an `ActionMenu` item on `app/(shell)/admin/classes/page.tsx`:

```text
Attendance summary
```

It opens the shared `AdminAttendanceModal`.

---

## 3. Component map

```text
lib/
├── attendance-api.ts                    [NEW] types + fetch client
└── attendance-api.test.ts               [NEW]

features/attendance/
├── attendance-week-picker.tsx           [NEW]
├── attendance-status-picker.tsx         [NEW]
├── attendance-sheet.tsx                 [NEW]
├── attendance-summary-table.tsx         [NEW]
├── attendance-schedule-manager.tsx      [NEW]
├── student-attendance-history.tsx       [NEW]
├── admin-attendance-modal.tsx           [NEW]
├── attendance-empty-state.tsx           [NEW] optional shared empty/error block
└── *.test.tsx                           [NEW]

app/(shell)/
├── teacher/class/[id]/attendance/page.tsx   [NEW]
├── student/class/[id]/attendance/page.tsx   [NEW]
├── teacher/class/[id]/layout.tsx            [EDIT] add tab
├── student/class/[id]/layout.tsx            [EDIT] add tab
└── admin/classes/page.tsx                   [EDIT] add action + modal
```

### 3.1 `attendance-api.ts`

Follow the `lib/quiz-api.ts` pattern:

* `AUTH_TOKEN_KEY` from `components/ui/nav-config`;
* `NEXT_PUBLIC_API_URL` fallback `http://localhost:8000`;
* Bearer token from `localStorage` in the browser;
* throw the backend `detail` on non-2xx;
* plain `snake_case` types matching the BE contract.

```ts
export type AttendanceStatus =
  | "present"
  | "late"
  | "excused_absence"
  | "unexcused_absence";

export type ClassSchedule = {
  id: string;
  class_id: string;
  subject: string;
  weekday: number;             // 0 = Monday
  start_time: string;          // "19:00:00"
  end_time: string;
  trainer_id: string;
  trainer_name: string | null;
  effective_from: string;      // "2026-09-01"
  effective_to: string | null;
};

export type ClassSession = {
  id: string;
  class_id: string;
  schedule_id: string | null;
  date: string;
  start_at: string;
  end_at: string;
  trainer_id: string;
  trainer_name: string | null;
  status: "scheduled" | "cancelled" | "rescheduled";
  note: string | null;
  student_count: number;
  marked_count: number;
};

export type AttendanceCounts = {
  present: number;
  late: number;
  excused_absence: number;
  unexcused_absence: number;
  unmarked: number;
};

export type AttendanceRecord = {
  student_id: string;
  student_code: string | null;
  full_name: string;
  email: string;
  status: AttendanceStatus | null;
  note: string | null;
  updated_at: string | null;
};

export type AttendanceSheet = {
  session: ClassSession;
  summary: AttendanceCounts;
  records: AttendanceRecord[];
};

export type AttendanceSummaryRow = {
  student_id: string;
  student_code: string | null;
  full_name: string;
  present: number;
  late: number;
  excused_absence: number;
  unexcused_absence: number;
  unmarked: number;
  attendance_rate: number | null;
};

export type AttendanceSummary = {
  class_id: string;
  date_from: string;
  date_to: string;
  total_sessions: number;
  students: AttendanceSummaryRow[];
};

export type StudentAttendance = {
  class_id: string;
  date_from: string;
  date_to: string;
  total_sessions: number;
  attended: number;
  attendance_rate: number | null;
  items: {
    session_id: string;
    date: string;
    start_at: string;
    end_at: string;
    session_status: "scheduled" | "cancelled" | "rescheduled";
    status: AttendanceStatus | null;
    note: string | null;
    updated_at: string | null;
  }[];
};

export const attendanceApi = {
  listSchedules: (classId: string) => ...,
  createSchedule: (classId: string, body: CreateScheduleBody) => ...,
  deleteSchedule: (classId: string, scheduleId: string) => ...,
  listSessions: (classId: string, from: string, to: string) => ...,
  createSession: (classId: string, body: CreateSessionBody) => ...,
  getSheet: (classId: string, sessionId: string) => ...,
  saveSheet: (classId: string, sessionId: string, records: SaveRecord[]) => ...,
  summary: (classId: string, from: string, to: string) => ...,
  myAttendance: (classId: string, from: string, to: string) => ...,
};
```

`saveSheet` sends `{ records }` and returns the refreshed `AttendanceSheet`.
`attendanceFetch` must throw an error object carrying `detail`; the pages use
that message in `toast.error(...)`.

---

## 4. Teacher tab

### 4.1 Layout

Desktop: two columns (week/session list + sheet). Mobile: one column with the
week picker above the session list and the sheet below.

```text
┌──────────────────────────────────────────────────────────────┐
│ Attendance                    [Manage schedule]              │
├───────────────┬──────────────────────────────────────────────┤
│ WEEK PICKER   │ SESSION HEADER                               │
│ ‹  Nov 3–9  › │ Mon 02/11 · 19:00–21:00 · scheduled          │
│ [Today]       │ Trainer: Academic Trainer                    │
│               │ Last saved: 10:15 05/11/2026                 │
│ ── sessions ──│                                              │
│ ● Mon 02/11   │ [Mark all present]          3 students       │
│   Wed 04/11   │ ┌──────────┬─────────┬─────────────────────┐ │
│   Fri 06/11   │ │ Student  │ Status  │ Note                │ │
│               │ ├──────────┼─────────┼─────────────────────┤ │
│               │ │ AS_0001  │ Present │ [........]          │ │
│               │ │ AS_0002  │ Absent  │ [........]          │ │
│               │ └──────────┴─────────┴─────────────────────┘ │
│               │                          [Save attendance]   │
├───────────────┴──────────────────────────────────────────────┤
│ SUMMARY (range: semester ▾)                                  │
│ Student | Present | Late | Excused | Unexcused | Unmarked | %│
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Week picker

* Monday → Sunday, `Mon dd/mm – Sun dd/mm`.
* Previous / next / today.
* On change: call `listSessions(classId, from, to)`.
* Cache per week in component state; invalidate after saving, creating a
  session, or adding/deleting a schedule.
* Use local date arithmetic, not UTC `toISOString()`, to avoid a one-day shift.

### 4.3 Session list

* Group by date; show `HH:mm–HH:mm`.
* Badge: `marked_count / student_count`.
* Selected session is visually distinct and keyboard-focusable.
* `cancelled`: dimmed, lock icon, cannot select for editing.
* Future: label `Not started`, sheet controls disabled, Save hidden.
* Empty: `No sessions in this week` + `Manage schedule` CTA.

### 4.4 Sheet

* One row per ACTIVE student, sorted by `student_code`.
* Status: segmented control with four options on desktop; `AppSelect` on mobile.
* Options: `Present`, `Late`, `Absent (excused)`, `Absent (unexcused)`.
* `Mark all present` applies locally only; it never calls the API by itself.
* Note input: optional, `maxLength=500`, placeholder `Optional note`.
* Dirty state: show `Unsaved changes`; Save disabled when not dirty.
* Saving: spinner + disable; success toast `Attendance saved`; error toast with
  backend `detail` and keep local state for retry.
* After save: replace the sheet with the response and update `Last saved`.
* Future/cancelled: banner with the reason, disable every control and Save.

### 4.5 Summary

* Default range: current semester. Selector: `This month`, `This semester`,
  `Custom`.
* Use the class's `semester` + `academic_year`; extend `lib/semester.ts` with a
  helper returning actual ISO dates if the existing `semesterDateRange()` only
  returns a display string.
* Sticky header, default sort by `student_code`.
* Rate as `%` with one decimal; `null` → `—`.
* Tooltip on the rate header: `(Present + Late) / (Present + Late + Unexcused + Unmarked)`.
* Empty summary: `No attendance data in this range`.

### 4.6 Manage schedule modal

* Existing templates: weekday, time, effective window, trainer, delete button.
* Add form:
  * weekday select (Mon–Sun; value 0–6),
  * `input type="time"` start/end,
  * `input type="date"` effective from/to,
  * trainer select, defaulting to the class's trainer.
* Empty state: `No weekly schedule yet. Add one to generate sessions.` + CTA.
* `Add one-off session`: date, start/end time, note (ad-hoc).
* After add/delete: refetch schedules and sessions, toast.
* Delete uses `ConfirmDialog`; explain that historical sessions are kept.

### 4.7 Teacher state matrix

| State | UI |
|---|---|
| Initial loading | Header + 3 skeleton rows in the left rail + table skeleton |
| Sessions loaded, none selected | First non-cancelled session auto-selected; sheet loads |
| Empty week | `No sessions in this week` + `Manage schedule` |
| No weekly schedule | `No weekly schedule yet. Add one to generate sessions.` |
| Session loading | Sheet skeleton; controls disabled |
| Sheet ready | Roster table; Save enabled only when dirty |
| Dirty | `Unsaved changes`; Save enabled |
| Saving | Spinner in Save; all status controls disabled |
| Save success | Toast `Attendance saved`; `Last saved` updates |
| Save error | `toast.error(detail)`; local changes preserved; Save re-enabled |
| Future session | Banner `This session has not started yet.`; controls + Save disabled |
| Cancelled session | Banner `This session was cancelled.`; row dimmed; controls disabled |
| Summary loading | Table skeleton |
| Summary error | `Alert` + `Retry`; page still usable |
| Summary empty | `No attendance data in this range` |

---

## 5. Student tab

### 5.1 Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ My attendance                         Attendance rate: 87.5% │
│ 7 / 8 sessions                                               │
├──────────────────────────────────────────────────────────────┤
│ Nov 2026 ▾                                                   │
│ ┌────────────┬──────────────┬────────────┬─────────────────┐ │
│ │ Date       │ Session      │ Status     │ Note            │ │
│ │ Mon 02/11  │ 19:00–21:00  │ ● Present  │                 │ │
│ │ Wed 04/11  │ 19:00–21:00  │ ● Late     │ Traffic         │ │
│ │ Fri 06/11  │ 19:00–21:00  │ — Not marked│                │ │
│ └────────────┴──────────────┴────────────┴─────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Requirements

* Summary cards: attendance rate, attended / total, breakdown by status.
* Default range: current semester; month filter.
* Status chips:
  * `Present` — green,
  * `Late` — amber,
  * `Absent (excused)` — slate/blue-grey,
  * `Absent (unexcused)` — red,
  * `Not marked` — neutral grey.
* Show `—` for a missing rate and `Not marked` for `status = null`.
* The page must never request or render another student's data.
* Empty: `No attendance yet`.
* Error: `We couldn't load your attendance.` + `Retry`.

### 5.3 Student state matrix

| State | UI |
|---|---|
| Loading | Two summary-card skeletons + table skeleton |
| Empty | `No attendance yet` + short explanation |
| Error | `Alert` + `Retry` |
| Success | Summary cards + history table |
| Rate is `null` | `—` with tooltip `No marked sessions yet` |
| Unmarked session | Neutral chip `Not marked` |

---

## 6. Admin summary modal

### 6.1 Trigger

`app/(shell)/admin/classes/page.tsx` → row `ActionMenu` → `Attendance summary`.

### 6.2 Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Attendance summary — CS101-FA26-001                      [×] │
│ Range: [This semester ▾]   [from] – [to]                     │
├──────────────────────────────────────────────────────────────┤
│ Student | Present | Late | Excused | Unexcused | Unmarked | %│
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

* `Modal` width `max-w-4xl`.
* Reuse `AttendanceSummaryTable`.
* Admin does not need to be the trainer; the API handles authorization.
* Empty: `No attendance data for this range`.
* Loading: table skeleton; error: inline `Alert` + Retry.

### 6.3 Admin state matrix

| State | UI |
|---|---|
| Opening | Modal shell + skeleton |
| Loading | Table skeleton |
| Empty | `No attendance data for this range` |
| Error | `Alert` + `Retry` inside the modal |
| Success | Summary table |
| Close | Reset range and cached rows |

---

## 7. English copy inventory

| Key | Copy |
|---|---|
| Tab | `Attendance` |
| Page title (teacher) | `Attendance` |
| Page title (student) | `My attendance` |
| Manage schedule | `Manage schedule` |
| Add schedule | `Add weekly schedule` |
| Add one-off | `Add one-off session` |
| Empty schedule | `No weekly schedule yet. Add one to generate sessions.` |
| Empty week | `No sessions in this week` |
| Empty student | `No attendance yet` |
| Empty summary | `No attendance data in this range` |
| Mark all | `Mark all present` |
| Save | `Save attendance` |
| Saving | `Saving…` |
| Saved toast | `Attendance saved` |
| Dirty | `Unsaved changes` |
| Last saved | `Last saved: {time}` |
| Future banner | `This session has not started yet.` |
| Cancelled banner | `This session was cancelled.` |
| Status — present | `Present` |
| Status — late | `Late` |
| Status — excused | `Absent (excused)` |
| Status — unexcused | `Absent (unexcused)` |
| Status — missing | `Not marked` |
| Note placeholder | `Optional note` |
| Rate header | `Attendance rate` |
| Retry | `Retry` |
| Load error | `We couldn't load attendance.` |
| Student load error | `We couldn't load your attendance.` |
| Summary action | `Attendance summary` |

Avoid abbreviations such as `Exc.` / `Unexc.` in the primary UI; they may appear
only in a compact table header with a tooltip.

---

## 8. Responsive and accessibility notes

* Teacher sheet: horizontal scroll on mobile is acceptable, but the status
  picker must remain reachable without horizontal scrolling.
* Use semantic table markup for the sheet and summary.
* `AttendanceStatusPicker` is a `radiogroup` with `aria-label="Attendance status
  for {student name}"`; arrow keys move between options.
* Save result announced through an `aria-live="polite"` region or the existing
  toast system.
* Disabled states must be real `disabled` attributes, not only CSS opacity.
* Do not rely on colour alone for status; include the text label.
* Date formatting uses `dd/mm` in tables and `dd/mm/yyyy` where ambiguity matters.

---

## 9. Data flow

```text
Teacher page mount
  → getClass(id) (existing class cache/API)
  → listSchedules(id)
  → listSessions(id, monday, sunday)
  → auto-select first editable session
  → getSheet(id, sessionId)
  → summary(id, semesterFrom, semesterTo)

Change week
  → listSessions(id, newFrom, newTo)
  → keep selection if still present, else select first editable session

Edit status / note
  → local dirty state only

Save
  → saveSheet(id, sessionId, changedRecords)
  → replace sheet with response
  → invalidate summary cache and refetch summary

Manage schedule
  → createSchedule / deleteSchedule / createSession
  → refetch schedules + sessions
```

`changedRecords` may be all rows (the plan's default) or only dirty rows. The
backend supports partial payloads; sending all rows is simpler and still valid.

---

## 10. Test plan

| File | Cases |
|---|---|
| `lib/attendance-api.test.ts` | URL build, Bearer header, JSON body, parse response, throw `detail` |
| `features/attendance/attendance-week-picker.test.tsx` | Monday–Sunday range, prev/next/today, no UTC drift |
| `features/attendance/attendance-status-picker.test.tsx` | four options, change, disabled, keyboard |
| `features/attendance/attendance-sheet.test.tsx` | roster render, mark all present, dirty state, save payload, future/cancelled disabled, error keeps state |
| `features/attendance/attendance-summary-table.test.tsx` | `%` formatting, `—` for null, sort by student code |
| `features/attendance/attendance-schedule-manager.test.tsx` | add/delete schedule, ad-hoc form, validation errors |
| `features/attendance/student-attendance-history.test.tsx` | loading/empty/error/success, chips, unmarked row |
| `features/attendance/admin-attendance-modal.test.tsx` | open/close, fetch summary, empty, error |

Manual checks:

1. Teacher tab appears in the right position; route works.
2. Student tab appears in the right position; route works.
3. 1024 px desktop: eight teacher tabs fit or scroll cleanly.
4. Mobile 390 px: week picker, session list, sheet remain usable.
5. Keyboard-only: all status options and Save are reachable.
6. No console errors on loading/empty/error paths.

---

## 11. Out of scope

* Cancel/reschedule session UI.
* Drag-and-drop timetable.
* Bulk import of schedules.
* Admin class-detail attendance page.
* Notifications or auto-absence.
* i18n; all copy is English.
* New backend migration.
