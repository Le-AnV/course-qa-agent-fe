# UI Design — Consistency & Accessibility Hardening (AI-131)

> **Ticket:** AI-131 (parent AI-122) · **Status:** Implemented (UI & client logic)
> **Branch:** `features/Design_ClassManagement` · **Companion API changes:**
> none (CORS note in `course-qa-agent-be/docker-compose.yml`)

This document is the design spec and hand-over reference for the hardening pass
that gave every surface one consistent, accessible visual language. Related work
in this batch: AI-127 (archive/restore), AI-128 (configuration), AI-129 (class
page), AI-130 (co-teachers) — all built on this foundation.

## 1. Purpose and user

A workspace user (admin, trainer, student) should experience one product, not a
patchwork: the same accent, the same dialogs, the same tables — usable on small
screens and with a keyboard. This pass fixes the known rough edges: clipped row
menus, dialogs that trap nothing, missing mobile navigation, a duplicated chat
scope strip, and the stray global materials page.

## 2. Design tokens and typography (AC-01)

- New `app/accent.css`, imported **after** `globals.css` in `app/layout.tsx`:
  - `--brand` ramp built on `#77AAFF` (the agreed accent) with hover/active
    shades and a subtle tint for backgrounds.
  - `--brand-ink` (`#1e56c8`) for text and links on light surfaces — chosen so
    text passes **WCAG AA (≥ 4.5:1)**; the accent fill is paired with the ink
    token, never with white text.
- Typography switches to **Inter** via `next/font`; the previous stack is
  retired.
- Landing, login and every workspace control consume the tokens from
  `accent.css` — no per-page hex copies of the brand blue remain.
- Course card accents and status colours move to the muted palette used across
  the app (e.g. sent/pending/failed statuses, course card borders).

## 3. Overlays and menus (AC-02, AC-03)

- `components/shared/ActionMenu.tsx` renders its menu in a **portal**
  (`document.body`), positioned against the trigger — row menus in tables and the
  sidebar are no longer clipped by `overflow` containers.
- `components/shared/Modal.tsx` and `ConfirmDialog.tsx`:
  - keep keyboard focus inside while open, return focus to the trigger on close;
  - close on `ESC`;
  - expose accessible names (`aria-labelledby`/`aria-describedby`) and announce
    destructive intent through the dialog tone + confirm copy;
  - destructive flows (archive a class, delete a user, reset a password) go
    through `ConfirmDialog` — no more raw `confirm()`/`alert()` in the app shell.

## 4. Navigation and responsiveness (AC-04)

- `components/shared/MobileNav.tsx`: a drawer under the desktop breakpoint
  exposing the same destinations as the sidebar (`nav-config.ts` is the single
  source of truth); a header trigger opens it, `ESC`/backdrop closes it.
- `CourseTabs` sits centered in the content column at desktop widths.
- Tables and page shells collapse gracefully: shared shells
  (`AdminPageShell`, `AppLayoutShell`) own spacing so pages stop hand-rolling
  their own.

## 5. Chat surface (AC-05)

- The chat screen shows the class scope exactly **once**: the duplicated scope
  strip is removed; the class label flows from `use-class-label` through
  `hooks/use-chat-stream` into the header.
- Thinking/citation rendering is consolidated (`features/chat/thinking-trace.tsx`)
  so streamed states read consistently.

## 6. Materials surface (AC-06)

- The global `/teacher/materials` page is removed.
- `features/documents/class-materials.tsx` (`ClassMaterials`) renders on the
  class syllabus page (`/teacher/class/[id]/syllabus`), so materials live with
  the class they belong to. Upload/replace/delete flows are unchanged, just
  relocated.

## 7. States and edge cases

- Portal menus and dialogs close on `ESC`, outside click and route change; only
  one overlay is interactive at a time.
- Focus is never lost: closing an overlay returns focus to its trigger.
- Mobile drawer + tab strip verified at small widths (no horizontal overflow on
  class pages).
- Colour is never the only signal: badges carry text labels alongside tone.
- Known, accepted follow-ups (pre-existing, out of this pass): low-contrast
  `#94a3b8` text in a few older surfaces, `<Link>` nested inside a button on one
  card, and Vietnamese strings that live outside the UI layer (import sheet,
  prompt templates).

## 8. Acceptance-criteria mapping

| Jira criterion | Deliverable |
|---|---|
| AC-01: Brand accent everywhere, AA contrast on fills | `accent.css` tokens + Inter; `--brand-ink` guarantees AA on accent fills and text. |
| AC-02: Row action menus never clipped | `ActionMenu` portal rendering. |
| AC-03: Accessible dialogs, destructive confirms | `Modal`/`ConfirmDialog` focus trap, ESC, names; destructive flows confirm first. |
| AC-04: Mobile navigation drawer; centered tabs | `MobileNav` drawer + centered `CourseTabs`. |
| AC-05: Chat shows the class scope once | Duplicated scope strip removed; single label via `use-class-label`. |
| AC-06: Materials move into the class | `/teacher/materials` removed; `ClassMaterials` on the class syllabus. |

## 9. Branch and merge-request convention

Keep the design and implementation deliverables separate:

- Design branch: `features/Design_ClassManagement`; contains this document and its
  siblings for AI-127..130 under `docs/design/`.
- Implementation branch: `features/Implementation_ClassManagement`; contains the
  frontend code, but not these design documents.

Create separate merge requests for the two branches and link both to AI-127..131.
Do not mark review, CI, or manual-test checklist items complete without evidence.

## Attachments / Links

* Verification evidence: `testreport/` scripts (`verify-phase-e.mjs`,
  `verify-modal-a11y.mjs`, `verify-mobile-nav.mjs`, `verify-chat-ux.mjs`, …)
* Jira: https://ai03.atlassian.net/browse/AI-131
