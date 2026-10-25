# UI Design & Implementation Specs — Admin Dashboard (AI-31)

> **Ticket:** AI-31
> **Epic:** E8 - Admin & System Config
> **Status:** Implemented (UI & Client Logic)
> **Backend contract:** `course-qa-agent-be/docs/design/ai-31-admin-onboarding.md`

This document serves as the Design Specs and a hand-over reference detailing the architecture and components built in the `Implementation_AdminOnboarding` branch. The purpose is to provide context and guidance for review and future integration work.

Related: AI-31 (Khang Vu), AI-25 (login), AI-27 (RBAC), AI-105 (email sender).

## 1. UI Overview

The admin dashboard lives under `app/(shell)/dashboard/`. Entry page `page.tsx` renders:

- Heading `Admin dashboard` + subtitle `Set up courses and classes, onboard accounts, and watch credential emails go out.`
- Live email-queue card (only when `emailStats()` succeeds): `{pending} pending`, `{sent} sent`, `{failed} failed` with a `School` icon. Load failure shows `Could not load email stats: {error}`.
- 4 navigation cards in `grid gap-4 sm:grid-cols-2`, each `Card` + `CardHeader`/`CardTitle`/`CardDescription` + outline `Open` button (`Button asChild variant="outline" size="sm"` + `Link`):
  - `Courses & classes` (`BookOpen`) → `/dashboard/courses` — `Create a course first, then classes under it. Assign one trainer per class (AC-01, AC-02).`
  - `Accounts` (`Users`) → `/dashboard/accounts` — `Create student / trainer / teaching-assistant accounts. Deactivate, reset, delete (AC-03, AC-11, AC-12).`
  - `Bulk import` (`Inbox`) → `/dashboard/import` — `Download the .xlsx template, import a whole class, review per-row results (AC-05, AC-06, AC-10).`
  - `Email sender` (`Mail`) → `/dashboard/email` — `Gmail app-password config, queue status, retries. Never a personal password (AC-08, AC-09).`

Layout container is `flex flex-col gap-6`; header row is `flex items-center justify-between`.

### 1.1. Courses & classes (`courses/page.tsx`)

- `New course` card: inputs placeholder `SE101` (code) + `Intro to SE` (title), both `required`; submit `Create course`. Description: `Courses group classes (sections).`
- `New class` card: `select` with default option `Select a course…` + input placeholder `SE101-A` (`required`); submit disabled when `!classCourseId`. Description: `A class lives under exactly one course.`
- `Classes` card: description `Exactly one trainer per class; the same trainer may teach several classes (AC-02).` Table headers: `Class / Course / Trainer / TA / Students / Content` + action column. Trainer cell is a `select` with `aria-label={Trainer for ${k.code}}`; options come from active trainers only (`role === "trainer" && is_active`). Changing it calls `assignStaff(classId, trainerId | null, ta_id)`.
- Delete flow: `Button variant="destructive" size="sm"` opens `Dialog` (`pendingDelete: ClassSection | null`); title `Delete class {code}?`; confirm calls `deleteClass(id)`. Error surfaces as `Delete failed.` via `role="alert"`.
- Empty state: `EmptyState title="No classes yet" description="Create a course, then add its first class above."`
- Hint text above forms: `Create a course first — a class cannot be assigned to anyone before it exists (AC-01).`

### 1.2. Accounts (`accounts/page.tsx`)

- `New account` card: description `Pick a role and a class. The password is generated and emailed — you never see it (AC-07).` Role `select` is built from `IMPORTABLE_ROLES` (`student / trainer / teaching_assistant` — admin never via UI). Submit button `Create & email credentials`.
- `All accounts` card: table headers `Username / Email / Role / Class / Status` + right-aligned `Actions`. Role cell is `Badge variant="secondary"` with `role.replace("_", " ")` (so `teaching_assistant` renders `teaching assistant`). Status cell shows `deactivated` badge (`variant="destructive"`) when `!is_active`.
- Row actions: `Deactivate`/`Activate` toggle (`setActive(user.id, !is_active)`), `Reset password` (`resetPassword` → notice with `emailed_to`), `Delete` (`variant="destructive" size="sm"` → `setPendingDelete(u)`).
- Delete `Dialog`: title `Delete {email}?`, confirm `confirmDelete()` → `deleteUser(id)` (`DELETE /api/admin/users/{id}?confirm=true`); failure shows `Delete failed.`
- Empty state: `EmptyState title="No accounts yet" description="Create the first account above, or bulk-import a class."`
- Header comment (verified in code): `Every account is created by an admin — no self-registration. Deactivated accounts fail login; reset emails a new password; delete needs confirmation and the last admin is protected.`

### 1.3. Bulk import (`import/page.tsx`)

Three cards in order:

1. `1. Get the template` — description `Exact expected columns plus one example row (AC-06).` Button `Download template` (outline) → `downloadTemplate()`: `fetch(templateUrl(), { headers: authHeader() })`, `res.blob()`, download as `account-import-template.xlsx`. Failure: `Template download failed.`
2. `2. Upload a filled file` — description `Each account gets a random password, emailed to its gmail (AC-07).` Form: `<input type="file" accept=".xlsx" aria-label="Import file">` + submit `Import accounts` / `Importing…` (`disabled={uploading}`). Upload posts `FormData` (`file`) to `POST /api/admin/imports` with `Authorization: Bearer` header, then opens the created batch detail.
3. `Import history` — description `Every row is reported: imported, skipped (email exists), or failed (AC-10).` Empty state: `EmptyState title="No imports yet" description="Upload a filled template to onboard a whole class at once."` Batch list → `View details` (outline, `openDetail(batch)` → `importDetail(batch.id)`). Selected batch shows per-row table with `Retry row` / `Retrying…` (`disabled={retryingId === r.id}`) → `POST /api/admin/import-rows/{rowId}/retry`; failure: `Retry failed.` Row badges: `ROW_VARIANT = { imported: "default", skipped: "secondary", failed: "destructive" }`.

### 1.4. Email sender (`email/page.tsx`)

- `Sender configuration` card: note `Gmail / Workspace app password — every queued email is delivered for real (AC-08).` Fields: host placeholder `smtp.gmail.com`, sender `type="email"` placeholder `noreply@sc…`, app-password placeholder `xxxx xxxx xxxx xxxx` (write-only, always blank), rate (number). Config description switches on `has_app_password`: `An app password is stored (masked). Leave blank to keep it.` vs `No app password stored yet — sending will fail until one is set.` If `email_dry_run` is still true, a status line warns that emails are marked sent without delivery. Submit `Save sender` → `updateEmailConfig` → notice `Email sender saved. App password is stored, never shown.`; failure `Save failed.` Stats badges: `{pending} pending` (secondary), `{sent} sent` (default), `{failed} failed` (destructive, only when `> 0`).
- `Send queue` card: button `Send pending emails` (outline) → `processQueue()` → notice `Queue sent: {sent} delivered, {failed} failed ({processed} processed).`; failure `Send failed.` Link `View history` → `/admin/history`. A fixed-height `Pending` box previews up to 5 `emailQueue("pending")` rows (`to_email` + pending badge) and refreshes during and after a send. Queue filter input `aria-label="Filter queue by status"` drives `emailQueue(status?)`. Queue table rows carry `Retry` (outline, `retryOne(id)` → `retryEmail(id)`); failure `Retry failed.` Status badges: `STATUS_VARIANT = { sent: "default", pending: "secondary", failed: "destructive" }`.
- Header comment (verified in code): `App password (Gmail / Workspace), never a personal password, never hardcoded, masked in every response. Queue sends at a limited rate; pending/sent/failed are visible here.`

## 2. Component Architecture

Pages (all `"use client"`):

- `app/(shell)/dashboard/page.tsx` — `DashboardPage`: `stats` + `error` state; `useEffect` loads `adminApi.emailStats()` once.
- `app/(shell)/dashboard/courses/page.tsx` — `CoursesPage`: `courses / classes / trainers / error / courseCode / courseTitle / classCourseId / classCode / pendingDelete` state; trainer list derived via `u.filter((x) => x.role === "trainer" && x.is_active)`.
- `app/(shell)/dashboard/accounts/page.tsx` — `AccountsPage`: `users / classes / error / notice / username / email / role (default "student") / classCode / pendingDelete` state.
- `app/(shell)/dashboard/import/page.tsx` — `ImportPage`: `batches / selected (ImportBatchDetail | null) / error / uploading / retryingId` state; `API_URL` + `authHeader()` helpers for the `FormData`/blob/template calls that bypass `apiFetch`.
- `app/(shell)/dashboard/email/page.tsx` — `EmailPage`: `config / stats / queue / queueFilter / error / notice` + form state `host / port / sender / appPassword / rate`; `useEffect` reloads `emailConfig + emailStats + emailQueue(queueFilter)` on `queueFilter` change.

Shared building blocks (from the main UI library, reused as-is):

- `components/ui/button` (`Button`), `components/ui/card` (`Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`), `components/ui/dialog` (`Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`), `components/ui/input` (`Input`), `components/ui/badge` (`Badge`), `components/ui/table` (`Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`), `components/ui/empty-state` (`EmptyState`: dashed-border zero-data panel with `title + description + optional action`).
- `lib/admin-api.ts` — typed client over `NEXT_PUBLIC_API_URL ?? "http://localhost:8000"`: `authHeaders()` reads `localStorage qa.auth.token`; `apiFetch` throws `Error(detail ?? Request failed (status))` on non-OK; `adminApi` covers courses/classes/assign/delete, users/active/reset/delete, imports/importDetail/templateUrl/authToken, emailConfig/updateEmailConfig/emailStats/emailQueue/processQueue/retryEmail.
- `components/ui/nav-config.ts` — single source of truth: `Role = student | trainer | teaching_assistant | admin`; `IMPORTABLE_ROLES = [student, trainer, teaching_assistant]`; `NAV_ITEMS` includes `{ href: "/dashboard", label: "Dashboard", roles: [trainer, teaching_assistant, admin] }`; `navItemsForRole / canAccessRoute (UX-only, backend AI-27 is real enforcement) / homeRouteFor (student → /student/home, trainer/TA → /teacher/home, admin → /admin/home)`.
- Gating: `middleware.ts` (`PUBLIC_PATHS = [/login, /styleguide]`, role cookie `qa.auth.role`, unauthenticated → `/login`, `/` or `/login` when authed → `homeRouteFor`, otherwise `canAccessRoute` else bounce home); `components/ui/auth-guard.tsx` (`readRole` accepts the 4 roles, `useSyncExternalStore` snapshot `loading/guest/authed`, `signOut` clears `localStorage` + cookie); `components/shared/AppLayoutShell.tsx` wraps every `(shell)` page in `<AuthGuard>` + `AppSidebar role={role}` + `Toaster`. No `dashboard/layout.tsx` — pages rely on `(shell)/layout.tsx → AppLayoutShell`.

## 3. Data & Auth Flow

1. Admin logs in (AI-25); token stored in `localStorage qa.auth.token` (+ cookie for middleware), role in `qa.auth.role`.
2. Every dashboard call sends `Authorization: Bearer <token>` (`authHeaders()` in `admin-api.ts`; `authHeader()` in `import/page.tsx` for `FormData`/blob requests). No token → backend `401`; non-admin → `403` (backend enforces).
3. Reads populate tables on mount (`useEffect`); mutations (`create / assign / setActive / reset / delete / upload / retry / process / save sender / send test`) clear `error` first, then reload the affected list; success shows `notice`, failure sets `error` rendered as `<p role="alert" className="text-sm text-destructive">` (dashboard home uses `text-destructive` paragraph).
4. Template download is a `GET /api/admin/import-template` → `blob()` → `account-import-template.xlsx` (header exactly `username, gmail, type, class` + one example row, no password column — enforced backend-side, AC-05/AC-06).
5. Import upload is `POST /api/admin/imports` (`multipart file: *.xlsx`) → batch summary `{ id, filename, total_rows, imported_count, skipped_count, failed_count, created_at }` → detail view `GET /api/admin/imports/{id}` (`ImportBatchDetail` = batch + `rows[]: { id, row_number, username, email, role_raw, class_raw, status, message }`). Only `failed` rows retry via `POST /api/admin/import-rows/{rowId}/retry` (AC-10).
6. Imported/reset passwords are generated server-side, returned never — they exist only in queued email bodies (AC-07). Queue drains oldest-first via `POST /api/admin/email-queue/process` at the limited rate (AC-09); dry-run marks sent without real SMTP.

## 4. API Design Contract (Backend Handoff)

Frontend is configured to consume (all under `http://localhost:8000`, all admin-only except `/health`):

- `GET /api/admin/courses` → `[{ id, code, title, class_count }]`; `POST /api/admin/courses { code, title }` → `201 Course` (duplicate code → `400`).
- `GET /api/admin/classes?course_id=` → `[ClassRead]`; `POST /api/admin/classes { course_id, code }` → `201 ClassRead` (unknown course / duplicate code in course → `400`); `PATCH /api/admin/classes/{id}/assign { trainer_id, ta_id }` → `200 ClassRead`; `DELETE /api/admin/classes/{id}` → `200 { deleted, document_count, ticket_count, member_count }`.
- `GET /api/admin/users` → `[UserRead]`; `POST /api/admin/users { username, email, role, class_code }` → `201 UserRead` (trainer/TA require `class_code`; existing email → `400`); `PATCH /api/admin/users/{id}/active { is_active }`; `POST /api/admin/users/{id}/reset-password` → `{ user_id, emailed_to }`; `DELETE /api/admin/users/{id}?confirm=true` (missing confirm / last admin → `400`).
- `GET /api/admin/import-template` (`.xlsx` download); `POST /api/admin/imports` (multipart) → `201 ImportBatchRead`; `GET /api/admin/imports` → `[ImportBatchRead]`; `GET /api/admin/imports/{id}` → `ImportBatchDetail`; `POST /api/admin/import-rows/{rowId}/retry` → `200 ImportRowRead` (failed rows only).
- `GET /api/admin/email-config` → `{ smtp_host, smtp_port, smtp_sender, has_app_password, smtp_rate_per_minute, email_dry_run }` (secret never returned); `PATCH /api/admin/email-config` (write-only `smtp_app_password`, blank = keep; `email_dry_run` is server-side only); `GET /api/admin/email-queue/stats` → `{ pending, sent, failed }`; `GET /api/admin/email-queue?status=` → `[EmailOutboxRead]` (bodies not listed); `POST /api/admin/email-queue/process` → `{ processed, sent, failed }`; `POST /api/admin/email-queue/{id}/retry` → `{ id, status }`.

Full request/response shapes live in the backend design doc (`course-qa-agent-be/docs/design/ai-31-admin-onboarding.md`).

## 5. States & Responsive Behavior

- Loading: dashboard stats render only when loaded (`stats && …`); import shows `Importing…` (submit disabled while `uploading`); row retry shows `Retrying…` (`disabled={retryingId === r.id}`); class creation disabled when no course selected (`disabled={!classCourseId}`).
- Error: every page keeps `error: string | null`, cleared before each mutation, rendered as `role="alert"` destructive text with the backend `detail` message (`apiFetch` surfaces `detail ?? Request failed (status)`).
- Empty: `EmptyState` on accounts (`No accounts yet`), courses (`No classes yet`), import (`No imports yet`).
- Success: `notice` strings on accounts/email/import (`Test email sent to …`, `Email sender saved. …`, batch upload opens detail).
- Delete safety: both accounts and classes use a `Dialog` confirm (`pendingDelete !== null`); class delete warns first when `document_count + ticket_count > 0` (AC-12); user delete requires `?confirm=true` and the backend protects the last admin (AC-12).
- Responsive: dashboard grid `sm:grid-cols-2`; forms use `flex flex-col gap-3`; header `flex items-center justify-between`; tables scroll inside `CardContent`; sidebar/mobile nav share the same `NAV_ITEMS` source so `/dashboard` stays reachable on mobile.

## 6. Next Steps (Implementation Handoff)

1. Keep `NAV_ITEMS` as the single menu/gate source — adding a dashboard child route needs no JSX edits, only backend enforcement stays authoritative.
2. Do not invent new admin endpoints — `lib/admin-api.ts` mirrors the backend design doc 1:1; any contract change must land in `course-qa-agent-be/docs/design/ai-31-admin-onboarding.md` first.
3. Preserve the security invariants: no password column in the template, no password in any response, app password write-only/masked, generic login errors.

---

**Attachments / Links**

* Backend Specs: `course-qa-agent-be/docs/design/ai-31-admin-onboarding.md`
* Jira: https://ai03.atlassian.net/browse/AI-31
