# UI Design Spec — Personal Profile (AI-29)

> **Ticket:** AI-29
> **Epic:** E1 - User Management
> **Status:** Draft (Design branch — not implemented yet)
> **Scope:** Shared profile for all authenticated roles (student, trainer / teaching_assistant, admin)

This document is the FE Design spec for AI-29 and the handoff reference for the
Implementation branch. It replaces the hardcoded mock in
`app/(shell)/teacher/account/page.tsx` ("Nguyễn Văn Minh" / `minh.nv@…`) with a
real profile panel wired to the BE endpoints shipped in `25dac2b`
(`GET /api/auth/me`, `PATCH /api/auth/profile`, `POST /api/auth/change-password`).

Companion BE design: `course-qa-agent-be/docs/design/ai-29-personal-profile.md`.

## 1. UI Overview

One shared **Profile** surface, reachable by every authenticated role. Two quiet
sections on a single centered column — identity first, security second. No
per-role variants: the only role-dependent element is a read-only `Badge`.

- **Header (memorable element):** monogram avatar (`AvatarFallback` initials
  from display name) + display name + email + role `Badge`. This is the single
  distinctive moment; everything else stays disciplined.
- **Profile section:** editable display name (`full_name`, 1–100 chars, trimmed).
  Email, role, class stay read-only — they are admin-managed (AI-31).
- **Security section:** change-password form (old / new / confirm) inside a
  `Dialog` or a second `Card`. Wrong old password shows the generic login
  message — never reveals whether it was "close".
- **Feedback:** `sonner` toasts on success; inline `Alert` on errors;
  `Skeleton` while `/me` loads; `Empty`-style notice + redirect to `/login`
  on 401 (session expired).
- **No avatar upload.** The current "Change avatar" button is mock with no BE
  column behind it — removed in Implementation (out of scope, §6).

## 2. Design plan (frontend-design two-pass)

### Pass 1 — tokens

**Color (5 hex, light mode; dark mode reuses existing `.dark` oklch ramp):**

| Token              | Hex       | Role                                                        |
|--------------------|-----------|-------------------------------------------------------------|
| `--profile-ink`    | `#172033` | Headings + display name (matches teacher shell today)       |
| `--profile-body`   | `#334155` | Body text (slate-700, softer than ink)                      |
| `--profile-faint`  | `#64748B` | Labels, descriptions, read-only values (slate-500)          |
| `--profile-line`   | `#E2E8F0` | Card / input borders (slate-200, matches teacher shell)     |
| `--profile-accent` | `#1D4ED8` | Single accent: primary action + avatar monogram wash        |

All other surfaces use existing semantic tokens (`bg-card`, `text-muted-foreground`,
`bg-muted`, `border-border`) so dark mode keeps working without new overrides.

**Type (one family, two weights — matches app today):**

- Display / headings: Geist Sans (`--font-sans` via `font-heading`), 600–700,
  tracking tight (`-0.01em`) on the display name only.
- Body / labels / inputs: Geist Sans 400–500, sentence case everywhere.
- No monospace data labels, no all-caps eyebrows.

**Layout (centered single column, left-aligned content):**

```text
+--------------------------------------------------+
|  (A) Identity header — avatar | name, email,    |
|      role badge                               |
+--------------------------------------------------+
|  (B) Card "Profile"                           |
|      Display name [input]  Email (read-only)   |
|      Role (badge)  Class (read-only)           |
|      [Save changes]                           |
+--------------------------------------------------+
|  (C) Card "Security"                          |
|      [Change password] -> Dialog               |
|      Old / New / Confirm + [Update password]   |
+--------------------------------------------------+
```

- Max width `max-w-2xl mx-auto`, vertical rhythm `flex flex-col gap-6`
  (never `space-y-*` per shadcn rule). Content left-aligned; nothing centered
  except the dialog.
- Mobile: cards stack full-width, dialog becomes bottom-sheet width; avatar
  shrinks `size-16` → `size-12`.

**Principles:**

1. One memorable element (monogram header); everything else quiet.
2. Read-only by default — only the display name and password fields are editable.
3. Every failure tells the user what to do next (field error / toast), never a
   dead banner.
4. No new dependencies, no new theme — compose from `components/ui` + `lib`.

### Pass 2 — uniqueness review (against the brief)

- Checked against the generic SaaS-card-kit default (identical rounded cards +
  soft grey shadow + gradient wash): our cards keep the existing `Card` ring
  (`ring-1 ring-foreground/10`, no shadow) and drop the login-modal gradient —
  the avatar monogram carries the identity instead.
- Checked against template chrome: no `01/02/03` step numbers (this is not a
  sequence), no ALL-CAPS eyebrow above "Profile"/"Security", no `A · B · C`
  meta strings, no `→` on buttons, sentence-case labels.
- Checked against the warm-cream + terracotta default: rejected — the app shell
  is monochrome oklch; the spec stays in slate + one academic blue so the page
  reads as part of the product, not a landing page.
- Result: plan kept as written; the only bold choice is the monogram header.

## 3. Component Architecture

New code lives in `features/profile/` (mirrors `features/login/`). Shared route:
`app/(shell)/account/page.tsx` (new). `app/(shell)/teacher/account/page.tsx`
becomes a redirect to `/account` for back-compat (removed or kept as re-export
in Implementation — no duplicate UI).

```text
features/profile/
  api.ts            # profileApi: me() / updateProfile() / changePassword()
                     # built on apiFetch() from lib/admin-api.ts (adds Bearer
                     # from localStorage qa.auth.token). No new deps.
  profile-panel.tsx # "use client": Suspense-ready panel, sections B + C
  password-dialog.tsx # Dialog with old/new/confirm fields
app/(shell)/account/page.tsx  # AuthGuard wrapper + <Suspense fallback>
```

**shadcn composition (per `shadcn` skill rules):**

- Sections: `Card` + `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/
  `CardFooter` (full composition, never content dumped in `CardContent` alone).
- Forms: `FieldGroup` + `Field` + `FieldLabel` + `Input`; invalid state via
  `data-invalid` on `Field` + `aria-invalid` on `Input` (never raw div grids).
- Buttons: `Button` variants (`default` save, `outline` change-password);
  pending state composes `Spinner` + `data-icon` + `disabled` (Button has no
  `isLoading` prop). Icons via `data-icon="inline-start"`, no sizing classes.
- Header: `Avatar` + `AvatarFallback` (initials, required) + `Badge` (role).
- Feedback: `toast()` from `sonner` (success), `Alert` (form/banner errors),
  `Skeleton` (loading), `Separator` between read-only rows. No custom
  `animate-pulse` divs, no `<hr>`.
- Dialog: `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle`
  (required) + `DialogDescription` + `DialogFooter`.
- Spacing: `flex flex-col gap-*`; equal sizes via `size-*`; `cn()` for
  conditionals; semantic colors only (no `bg-blue-500`, no `dark:` overrides —
  use the §2 hex via CSS vars wired to existing tokens where possible).

**Role badge mapping (display only):**

| `me.role`            | Badge            |
|----------------------|------------------|
| `student`            | `Student`        |
| `trainer`            | `Trainer`        |
| `teaching_assistant` | `Assistant`      |
| `admin`              | `Admin`          |

## 4. Data & API Flow

Base URL: `NEXT_PUBLIC_API_URL || "http://localhost:8000"` (same as
`login-modal.tsx` / `lib/admin-api.ts`). Auth: `Authorization: Bearer <JWT>`
from `localStorage qa.auth.token`. All three endpoints require auth; 401 means
expired/invalid session → clear session → redirect `/login`.

### 4.1. View profile (AC-01)

- **Endpoint:** `GET /api/auth/me`
- **Response (200 OK):**
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "System Administrator",
    "email": "admin@academic.edu.vn",
    "role": "admin",
    "class_id": null,
    "is_active": true
  }
  ```
  (`username` = `user.full_name` compat name; `role` lowercase alias.)
- **Flow:** page mounts → `profileApi.me()` → render header + read-only rows.
  Pending → `Skeleton`. 401 → sign out + redirect. Other errors → `Alert` with
  retry ("Couldn't load your profile. Check the connection and retry.").

### 4.2. Rename (AC-03)

- **Endpoint:** `PATCH /api/auth/profile`
- **Request:** `{ "full_name": "Nguyen Van A" }` (trimmed client-side;
  1–100 chars)
- **Response (200 OK):** updated `MeResponse` — header + `/me` state update
  immediately, no reload.
- **Errors:** `422` empty/overlong → field error under the input
  ("Display name must not be empty." / "…at most 100 characters.").
- **Flow:** Save → pending `Spinner` → success toast ("Profile updated.") +
  header re-render; failure → field `Alert` + `aria-invalid`.

### 4.3. Change password (AC-02)

- **Endpoint:** `POST /api/auth/change-password`
- **Request:** `{ "old_password": "…", "new_password": "…" }`
- **Response (200 OK):** `{ "message": "Password changed successfully." }`
- **Client validation (mirrors BE):** new ≥ 8 chars; new ≠ old; confirm ===
  new. Violations show field errors before any request.
- **Server errors:** `401` wrong old → generic banner
  ("Invalid email or password." — same message as login, by design);
  `404` missing/inactive account → same generic message; `422` weak/same →
  field error. Success → toast + close dialog + clear fields (session token
  unchanged).

## 5. States & Validation Matrix

| State                  | UI                                                              |
|------------------------|-----------------------------------------------------------------|
| Loading `/me`          | `Skeleton` header + card rows                                   |
| Loaded                 | Header + editable name + read-only email/role/class            |
| Saving name            | Button `Spinner`, inputs disabled                               |
| Name 422               | Field error + `aria-invalid`, no toast                          |
| Password dialog open   | Focus trap, `DialogTitle` "Change password"                     |
| Password success       | Toast "Password changed successfully.", dialog closes           |
| Wrong old (401)        | Generic banner in dialog, fields kept (except old cleared)      |
| Session 401 (any call) | Sign out, redirect `/login`, toast "Session expired. Log in…"  |
| Network failure        | `Alert` + `toast.error` with retry action                       |

## 6. Out of Scope (not in this Design)

- Email / role / class editing (admin-managed, AI-31).
- Avatar upload (no BE column; remove mock button).
- Legacy mock login contract (`POST /auth/login`, `demo-token`) — untouched.
- Admin user management UI (`/dashboard/accounts`) — separate ticket.
- Adding `@tanstack/react-query` / `@tanstack/react-form`: needs team approval
  per no-dependency-changes rule — Implementation phase 1 uses `apiFetch` +
  React state; TanStack adoption (if wanted) is a follow-up ticket.

## 7. Implementation Handoff & Test Plan

- **Files to add:** `features/profile/api.ts`, `features/profile/profile-panel.tsx`,
  `features/profile/password-dialog.tsx`, `app/(shell)/account/page.tsx`;
  **to change:** `app/(shell)/teacher/account/page.tsx` (redirect), nav entry
  (`components/ui/nav-config.ts` — add `/account` for all roles).
- **Manual checklist:** login as student/trainer/admin → `/account` shows
  name+email (AC-01); rename → header updates without reload (AC-03); empty /
  101-char name → 422 field error; change password happy path → old stops, new
  works (AC-02); wrong old → generic 401; short/same new → 422; expired token →
  redirect `/login`.
- **Automated (Implementation):** vitest for validation helpers + API client
  error mapping; `npm run lint`, `npm run test`, `npm run build`.
