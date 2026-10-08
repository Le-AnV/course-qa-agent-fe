# UI Foundation Design — AppShell, Shared Components & Styleguide (AI-121)

> Design deliverable for `features/Design_UIFoundation` — companion to
> `features/Implementation_UIFoundation`. Related: [AI-121](https://ai03.atlassian.net/browse/AI-121).
> No Figma file for this ticket: the deliverable is a **component library + live styleguide**,
> so this document is the spec and `/styleguide` is the visual reference.

## 1. Goals / Non-goals

**Goals**

- One `AppShell` (navbar + sidebar + role menu + client auth guard) wrapping every route except `/login`.
- One `components/ui/` library — the **only** place shared components live.
- Design tokens (color / font / spacing / radius) in exactly one file.
- `/styleguide` page showing every component with copy-paste usage examples, so a teammate
  with no design background can build a form page from the styleguide + README alone.

**Non-goals**

- No real authentication logic — backend (AI-25/AI-27) owns that. The guard is **UX only**;
  hiding a menu never protects anything (backend re-checks every request).
- No backend changes, no RAG/chat logic, no extra UI library besides shadcn/ui + Tailwind.
- No hand-written CSS: all styling through Tailwind utilities + shadcn token variables.

## 2. Design tokens (single source of truth)

Tokens live in `frontend/app/globals.css` (Tailwind v4 `@theme` + shadcn CSS variables).
shadcn theme base: **neutral**, radius `0.625rem`.

| Token group | Variables | Notes |
|---|---|---|
| Surface | `--background`, `--foreground`, `--card`, `--popover` | page / card backgrounds |
| Brand | `--primary`, `--secondary`, `--accent`, `--muted` | button & highlight colors |
| State | `--destructive` (+ on-variants) | errors, delete actions |
| Line | `--border`, `--input`, `--ring` | separators, form controls, focus |
| Radius | `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg` | base `0.625rem` |
| Font | `--font-sans` (Geist), `--font-mono` (Geist Mono) | set in `app/layout.tsx` |
| Spacing | Tailwind default scale (4px base) | no custom scale needed |

Rules:

- Feature pages **never** hardcode hex colors — use semantic tokens (`bg-primary`,
  `text-muted-foreground`, `border-border`, …) so light/dark stays consistent.
- New token → edit `globals.css` only, then re-check `/styleguide`.

## 3. Component inventory (`frontend/components/ui/`)

| # | Component | Based on | Key variants / props |
|---|---|---|---|
| 1 | `Button` | shadcn button | variant: `default \| secondary \| outline \| ghost \| destructive \| link`; size: `xs \| sm \| default \| lg \| icon \| icon-xs \| icon-sm \| icon-lg` |
| 2 | `Input` | shadcn input | `type`, `disabled`, invalid state via `aria-invalid` |
| 3 | `Select` | shadcn select (Radix) | `SelectTrigger/Content/Item`; disabled state |
| 4 | `Modal` | shadcn dialog (Radix) | `Dialog/Trigger/Content/Header/Title/Description/Footer/Close`; controlled `open` |
| 5 | `Table` | shadcn table | `Table/Header/Head/Body/Row/Cell/Caption` |
| 6 | `Card` | shadcn card | `Card/Header/Title/Description/Content/Footer` |
| 7 | `Badge` | shadcn badge | variant: `default \| secondary \| outline \| destructive \| ghost \| link` |
| 8 | `Toast` | shadcn sonner | `<Toaster />` once in AppShell; `toast.success/error(...)` in pages |
| 9 | `EmptyState` | custom (tokens only) | `icon?`, `title`, `description`, `action?` — used for zero-data lists |

Shell components (also under `components/ui/`, because AC4 — shared things live there only):

| Component | File | Responsibility |
|---|---|---|
| `AppShell` | `app-shell.tsx` | layout frame: navbar + sidebar + `<main>`; hosts `<Toaster />` |
| `Navbar` | `navbar.tsx` | brand, page title slot, role badge, user menu (logout stub) |
| `Sidebar` | `sidebar.tsx` | nav links filtered by current role |
| `AuthGuard` | `auth-guard.tsx` | client redirect to `/login` when unauthenticated; role-gate UX |

Menu configuration (single array in `app-shell.tsx` / `nav-config.ts`):

| Route | student | trainer | admin | Label |
|---|---|---|---|---|
| `/chat` | ✅ | ✅ | ✅ | Chat |
| `/dashboard` | ❌ | ✅ | ✅ | Dashboard |
| `/styleguide` | ✅ | ✅ | ✅ | Styleguide |
| `/login` | (public — outside shell) | | | — |

- student home → `/chat`; trainer/admin home → `/dashboard`.
- Adding a menu item = one entry in `nav-config.ts` with `roles: Role[]` — no JSX edits.

## 4. AppShell layout

```
┌──────────────────────────────────────────────┐
│ Navbar: brand · page title · role badge · user │
├────────────┬─────────────────────────────────┤
│ Sidebar    │  <main> route content           │
│  Chat      │                                 │
│  Dashboard │   (feature pages render here,   │
│  …by role  │    using components/ui only)    │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

Responsive: sidebar is hidden below `lg` — the navbar shows the nav links inline instead; navbar stays at all sizes.

## 5. Auth guard flow (UX only)

```
route change
  └─ token in localStorage?  ── no ──► router.replace("/login")
         │ yes
         └─ route role allowed? ── no ──► redirect to role home (chat/dashboard)
                │ yes
                └─ render AppShell + page
```

**Client storage contract** (proposed for AI-25 login flow to write after `POST /api/auth/login`):

| Key | Value |
|---|---|
| `qa.auth.token` | JWT access token string |
| `qa.auth.role` | `student` \| `trainer` \| `admin` |

Guard reads only these keys; it never decodes/validates the JWT (that is the backend's job).
`/login` is the only route rendered **outside** AppShell.

## 6. Styleguide page

Route: `/styleguide` (inside AppShell, all roles).

Sections, in order: Design tokens → Button → Input → Select → Modal → Table → Card →
Badge → Toast → EmptyState. Each section shows:

1. rendered live example,
2. a `<pre>` code snippet of the exact JSX to copy,
3. variant table (variant/size props).

This page is the onboarding artifact for teammates without design background (AC6).

## 7. Folder structure

```
frontend/
├── app/                     # routes only — thin pages
│   ├── globals.css          # ← ALL design tokens live here
│   ├── layout.tsx           # fonts + metadata
│   ├── login/page.tsx       # outside AppShell (real form: AI-25)
│   └── (shell)/             # every route here renders inside AppShell
│       ├── layout.tsx       # AppShell + AuthGuard wrapper
│       ├── page.tsx         # home (role-aware)
│       └── styleguide/page.tsx
├── components/
│   └── ui/                  # ← ONLY place shared components live (AC4)
│       ├── button.tsx, input.tsx, select.tsx, dialog.tsx, table.tsx,
│       ├── card.tsx, badge.tsx, sonner.tsx, empty-state.tsx
│       ├── app-shell.tsx, navbar.tsx, sidebar.tsx, auth-guard.tsx,
│       └── nav-config.ts
├── features/<module>/       # feature-specific components (never shared primitives)
└── lib/                     # api client, helpers (no UI)
```

## 8. How a feature page uses this (contract)

```tsx
// app/<route>/page.tsx  — assemble, never re-implement
import { Button, Input, Card, Table, Badge, EmptyState } from "@/components/ui";

export default function Page() {
  return (
    <Card>
      <Card.Header><Card.Title>Documents</Card.Title></Card.Header>
      <Card.Content>{/* Table or <EmptyState …/> when no rows */}</Card.Content>
    </Card>
  );
}
```

Rules for every future UI ticket:

1. Import primitives from `@/components/ui` only — no local `button.tsx`, no inline hex colors.
2. Need a new primitive? Add it to `components/ui/` + a section in `/styleguide`.
3. Feature-specific widgets belong in `frontend/features/<module>/`.
