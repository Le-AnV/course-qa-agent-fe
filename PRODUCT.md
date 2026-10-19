# Product

<!-- impeccable:product-schema 1 -->

> Inferred record. The user asked us to proceed without an interview, so every
> fact below is derived from repository evidence (README, routes, Jira AI project)
> rather than a confirmed interview. Treat inferred lines as hypotheses to correct.

## Platform

web

## Users

- **Students** — in a class, ask questions about that class's materials, work
  through assignments/proposals, read cited answers, keep chat history.
- **Trainers (lecturers)** — own one or more classes: upload and approve course
  materials, manage the syllabus, review student proposals and tickets, watch
  class activity.
- **Teaching assistants** — share the trainer's class-scoped workspace
  (materials, tickets, proposals) without owning the class.
- **Admins** — onboard accounts (create + bulk Excel import + email credentials),
  set up courses/classes and staff, monitor email queue and system health.
- RBAC roles are exactly `student`, `trainer`, `teaching_assistant`, `admin`
  (client filtering is UX only; the backend enforces every request).

## Product Purpose

A course Q&A agent: students ask questions and get answers grounded in their
class's own materials, with citations back to the source. Trainers/TA curate the
materials the answers come from; admins run the institution. Success means a
student trusts an answer because it points at the exact material it came from.

## Positioning

Answers are **class-scoped and citation-first**: retrieval runs only over the
approved materials of the student's own class, and every answer links to the
chapter/page it came from. A generic chatbot could not truthfully copy the
per-class scoping and the trainer approval loop behind the corpus.

## Operating Context

- University courses with multiple classes (sections) per course; one trainer per
  class, many students per class.
- Materials live per class (upload → review → approve) and feed retrieval.
- Students have a class workspace: chat agent, materials, proposals, syllabus,
  members.
- Trainers have a class workspace: overview, materials/syllabus management,
  tickets, proposals.
- Admin runs onboarding (single + bulk Excel import), credential emails (Gmail
  App Password sender, queued), and system monitoring (DB/Qdrant/LLM health, usage
  stats).
- Runs locally via Docker Compose (frontend :3000, backend :8000) and as a
  Next.js standalone container.

## Capabilities and Constraints

- **Stack (existing, not up for change):** Next.js 16 App Router + React 19 +
  TypeScript; Tailwind CSS v4; shadcn/ui primitives in `components/ui/`; all design
  tokens live in `app/globals.css`.
- Backend is a separate repo (`course-qa-agent-be`); the frontend talks to it over
  `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). No backend behavior
  changes in frontend work; contracts are owned by the backend design docs.
- Auth storage: `qa.auth.token` (JWT) and `qa.auth.role` in localStorage, mirrored
  to a cookie for middleware route gating. Client guards are UX only.
- Routing lives under `app/(shell)/` (navbar + sidebar + guard); `login/` and the
  landing page are public and already redesigned (out of scope here).
- Per README: never re-implement shared primitives, never hardcode colors — use
  semantic tokens.
- Fonts currently loaded: Geist, Geist Mono, Playfair Display (Playfair is wired in
  `app/layout.tsx` but not used as a committed display face yet).

## Brand Commitments

- Product name: **Course Q&A Agent** (subtitle/short form: "Syllabus Agent").
- Voice: plain, instructional English; student-facing copy in English.
- **Binding visual constraint (user-stated):** predominantly **white**, clean,
  institutional; a **clean blue** sidebar; must read as a real product designed by
  a product designer — explicitly not an AI-generated/template look. Login and
  landing page are already redesigned and set the tone.

## Evidence on Hand

- Playwright screenshots of the current product at
  `C:\Users\Gnurt\Desktop\oc-course\testreport\screenshots` (admin/teacher/student
  home, account, sidebars). No marketing copy, testimonials, benchmarks, or
  customer logos exist and none may be fabricated.
- An earlier design pass produced a surface brief for `/account` and a critique at
  `.impeccable/critique/2026-10-13T07-09-27Z__localhost-account.md`.

## Product Principles

1. **Citations or it didn't happen** — an answer is only useful if the source is
   visible and reachable.
2. **Every surface knows its class** — scope, role, and class context are always
   legible; nothing pretends to be global that isn't.
3. **Teacher oversight is the product** — approval, review, and proposal flows are
   first-class, not buried settings.
4. **Calm by default** — the interface is a workspace people read in for long
   sessions; clarity and quiet outrank decoration.
5. **Trust through plainness** — no invented urgency, no gamification; state is
   reported honestly (saved, queued, degraded).

## Accessibility & Inclusion

- Semantic HTML and keyboard reachability are required (the earlier audit found
  focus-loss and dangling `aria-describedby` defects — fix, don't repeat).
- Text contrast must pass 4.5:1 for body copy and 3:1 for large text; the earlier
  audit measured several failures (#94A3B8, #16A34A) that must not return.
