# UI Design — System Monitoring Dashboard (AI-109)

> **Ticket:** AI-109 - Health Check & System Monitoring
> **Status:** Implemented (UI & client logic)
> **Backend contract:** `course-qa-agent-be/docs/design/ai-109-health-check-system-monitoring.md`

This document is the design spec and hand-over reference for the `/admin/system`
page built in the `Implementation_HealthCheckSystemMonitoring` branch. It covers
the layout, component states, and client/API behaviour used for review and future
integration.

Related: AI-31 (admin dashboard), AI-27 (RBAC), AI-105 (LLM/Gemini config).

## 1. Purpose and user

An admin needs a single screen that shows green/red for each runtime dependency
(DB, Qdrant, LLM API) so outages are detected quickly (AC-02). The screen is
read-only; it never exposes secrets and only visualises the backend health
contract.

## 2. Route and navigation

- Route: `/admin/system` (page `app/(shell)/admin/system/page.tsx`, client
  component).
- Sidebar: an admin-only `System` link (`Activity` icon) added in
  `components/shared/Sidebar.tsx`, active when `pathname.startsWith("/admin/system")`.
- Nav source of truth: `components/ui/nav-config.ts` gains a `NAV_ITEMS` entry
  `{ href: "/admin/system", label: "System Health", roles: ["admin"], icon: Activity }`.
  Gating stays UX-only; the backend endpoint enforces RBAC.

## 3. Layout

`AdminPageShell` (title `System Health`, subtitle `Live status of the database,
vector store and AI model.`) with two header actions:

- `Auto every 30s` checkbox (`auto` state) - toggles a 30s interval re-fetch.
- `Refresh` button - manual reload; the icon spins while `loading`.

Body, top to bottom:

1. Error banner (only when `error`): rose panel with the message and an inline
   `Retry` link that re-runs `load()`.
2. Overall roll-up card: status icon (`Activity`), headline `All systems
   operational` when `status === "ok"` else `Degraded`, and `Last checked
   {HH:MM:SS}`. Right side shows an `OK` / `DEGRADED` pill.
3. Per-component cards (`grid gap-3`), one per entry in `health.components`:
   icon + label + `detail` (falls back to a static blurb) and a status badge.
4. Footer note: `Health checks run server-side; secrets are never returned to the
   browser.`

Loading state: skeleton card `Loading system health…` shown before the first
result; the roll-up headline reads `Checking…`.

## 4. Component presentation

`COMPONENT_META` maps the backend `name` to a label, blurb, and icon (unknown
names fall back to a generic server icon):

| `name`  | Label        | Icon       | Blurb |
|---|---|---|---|
| `db`    | Database     | `Database` | PostgreSQL - accounts, classes, documents |
| `qdrant`| Vector store | `Server`   | Qdrant - document embeddings for retrieval |
| `llm`   | AI model     | `Sparkles` | Google Gemini - answer generation |

`StatusBadge` renders green (healthy) or red (unhealthy) with a dot, and a label
derived from `status`:

| `healthy` | `status`                | Badge label   |
|---|---|---|
| true      | `configured`            | `Configured`  |
| true      | `up`                    | `Healthy`     |
| false     | `unconfigured`          | `Not configured` |
| false     | `down`                  | `Down`        |

Colour: healthy = emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`),
unhealthy = rose. This is the green/red requirement of AC-02.

## 5. Data & API flow

- `lib/admin-api.ts` adds `systemHealth()` -> `GET /api/admin/system/health` and
  the `HealthComponent` / `SystemHealth` types mirroring the backend schema.
- The page calls `adminApi.systemHealth()` on mount, on `Refresh`, and every 30s
  while `auto` is on.
- `401` (no/invalid token) and `403` (non-admin) surface through `apiFetch` as
  `Error(detail ?? Request failed (status))` and render in the error banner.
- `loading`, `error`, `health`, `checkedAt`, and `auto` are the only page states.

## 6. States and edge cases

- Loading: first load shows the skeleton; button disabled and spinning.
- Error: banner + `Retry`; the previous health (if any) stays visible.
- Empty: not applicable - the endpoint always returns the three components.
- Unknown component names render safely via the `metaFor` fallback.
- The page makes no mutation calls, so no success/notice flow is needed.

## 7. Acceptance-criteria mapping

| Jira criterion | UI deliverable |
|---|---|
| AC-02: dashboard shows green/red for each component | `/admin/system` renders one card per component with a green/red `StatusBadge` plus an overall `OK`/`DEGRADED` roll-up. |
| AC-01 / AC-03 (backend) | Consumed via `systemHealth()`; the UI displays the safe `detail` strings only and never receives secrets. |

## 8. Branch and merge-request convention

Keep the design and implementation deliverables separate:

- Design branch: `features/Design_HealthCheckSystemMonitoring`; contains this
  document under `docs/design/`.
- Implementation branch: `features/Implementation_HealthCheckSystemMonitoring`;
  contains frontend code, but not this design document.

Create separate merge requests for the two branches and link both to AI-109. Do
not mark review, CI, or manual-test checklist items complete without evidence.

## Attachments / Links

* Backend specs: `course-qa-agent-be/docs/design/ai-109-health-check-system-monitoring.md`
* Jira: https://ai03.atlassian.net/browse/AI-109
