# UI Design — Repeated-Question Counter & Content Gap Dashboard (AI-91)

> **Ticket:** AI-91 (Epic E6, parent AI-23) · **Status:** Draft Plan / Ready for Implementation  
> **Backend Contract:** `course-qa-agent-be/docs/design/ai-91-content-gap.md`  
> **Related Stories:** AI-128 (Class Configuration), AI-83 (Trainer Inbox UI), AI-67 (Internet Source Agent UI), AI-65 (Retrieval Score Threshold Admin UI)

---

## 1. Purpose & User Story

### User Story
> **As a trainer,**  
> I want to see which content categories of my class keep forcing the system to search the internet because our materials do not cover them,  
> **so that** I know where to add materials next.

### User Persona & Key Goals
* **Trainer / Teacher:** Needs actionable, aggregated insights on curriculum blind spots. Does NOT need individual student surveillance or automated ticket spam.
* **Key Decisions Supported:**
  * Identify topics that have high student demand but 0 or low material chunks.
  * Decide whether to upload supplementary slides/PDFs (Epic E2) or provide external study links.
  * Curate and accept proposed topics derived from unclassified queries.

---

## 2. Route & Navigation

* **Workspace Route:** `/teacher/class/[id]/content-gaps` (or integrated view in `/teacher/class/[id]/overview`).
* **Navigation Entry:** Added as a primary tab in [`course-qa-agent-fe/app/(shell)/teacher/class/[id]/layout.tsx`](file:///c:/Users/nghia/OneDrive/Desktop/FAcaProject/course-qa-agent-fe/app/(shell)/teacher/class/[id]/layout.tsx):
  ```tsx
  { id: "content-gaps", label: "Content Gaps", href: `/teacher/class/${id}/content-gaps` }
  ```
* **Access Guard (AC-18):**
  * Accessible only by the primary trainer, co-trainers, or admin.
  * Students have no navigation link and receive `403 Forbidden` if attempting direct route navigation.

---

## 3. UI Layout & Component Hierarchy

Top to bottom on the Content Gap Dashboard:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: Content Gaps                                                        │
│ Subtitle: Identify curriculum blind spots forcing Internet search fallback. │
│                                                                             │
│ [Status Bar]                                                                │
│ Updated: 14:35 (Cached 45m)    Latest material update: 25/10/2026   [Refresh]│
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Main Horizontal Stacked Bar Chart (AC-11)                                │
│                                                                             │
│ Category                   Materials vs Web Search Fallback       Web Ratio │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Python > Decorator         [████████████████|░░░░░░░░░░░░░░]        40.0%   │
│ FastApi > Dependency Inj.  [█████████████|░░░░░░░░░░░░░░░░░]        55.0%   │
│ Docker > Multi-stage       [███████|░░░░░░░░░░░░░░░░░░░░░░░]        75.0%   │
│ ... (Top 10 categories)                                                     │
│ Other (5 categories)       [██████████████████████|░░░░░░]          21.0%   │
│                                                                             │
│ Legend: ■ Answered from Materials    ░ Needed Web Search (Gap)               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Unclassified & Proposed Categories ("Not in Materials") (AC-06)          │
│                                                                             │
│ ┌───────────────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ AsyncIO Event Loop                    │ │ Git Interactive Rebase        │ │
│ │ 5 queries · 3 students · Chunk count: 0│ │ 4 queries · 2 students · 0 ch │ │
│ │ Tags: async def, loop, task           │ │ Tags: rebase -i, squash       │ │
│ │ [Accept as Category]   [Dismiss]      │ │ [Accept as Category] [Dismiss]│ │
│ └───────────────────────────────────────┘ └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Detailed Metrics Table (AC-12, AC-14)                                    │
│                                                                             │
│ Category          Web Searches  Unique Students  Last Asked  Chunks  Actions │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Python > Decorator  8 (4 pre/4 post)  6 (13.3%)     10m ago     2     [Edit] │
│ FastApi > Dep. Inj. 11 (2 pre/9 post) 7 (15.5%)     2h ago      1     [Edit] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Visual & Functional Specifications

### 4.1. Header & Operational Status (AC-14, AC-15)
* **Refresh Action:** Button with spinning indicator while recomputing. Triggers `POST /api/teacher/classes/{id}/content-gaps/refresh`.
* **Cache Notice:** Shows "Last computed at HH:MM" and indicates when serving cached data.
* **Material Update Marker (AC-14):** Badge displaying "Latest material update: DD/MM/YYYY". Informs the trainer that queries after this date indicate newly introduced or lingering gaps.

### 4.2. Main Chart: Horizontal Stacked Bar (AC-11)
* **Metric Display:**
  * Bar segmented into two colors:
    * Primary (`#10B981` / emerald-500): Questions answered from class materials.
    * Warning (`#F59E0B` / amber-500): Questions requiring web search fallback.
  * Sorted descending by `web_query_count`.
  * Display capped at **maximum 10 bars**. All remaining categories meeting the threshold are aggregated into an **"Other"** bar.
* **Interactive Tooltip on Hover:**
  * `Category Name`
  * `Web Search Count`: e.g. 8 searches
  * `Unique Students`: e.g. 6 students (13.3% of class)
  * `Web Search Ratio`: e.g. 40.0% of all questions in this category
  * `Last Asked`: e.g. "Yesterday at 16:45"

### 4.3. Unclassified Proposals Tray (AC-06)
* Queries that do not match existing material categories ($Score < 0.85$) are surfaced here if clustered together.
* Displays concept tags extracted from student web queries.
* Trainer action: Clicking **"Accept as Category"** converts the proposal into a regular category (`ClassCategory` with `status = 'accepted'`, initial `chunk_count = 0`), allowing future material uploads to bind to it.

### 4.4. Detail Table (AC-12, AC-14)
* **Columns:**
  1. `Category`: Name with 2-level breadcrumb (e.g. `Python > Decorator`).
  2. `Web Searches`: Total count, with badge breakdown: `X before update / Y after update` (AC-14).
  3. `Students Affected`: Unique student count and percentage of total class roster (e.g. `6 students (13%)`).
  4. `Curriculum Chunks`: Number of indexed chunks in class materials (`chunk_count`). A count of `0` renders in red/warning badge.
  5. `Last Asked`: Relative timestamp (e.g. "3 hours ago").
  6. `Actions`: Button opening category management modal (Rename / Merge / Split / Delete).

### 4.5. Privacy & Anonymity Safeguards (AC-13)
* **Zero Question Text:** No individual question strings are rendered anywhere on this dashboard.
* **Zero Student Names:** No student names, emails, or student IDs are exposed in the UI or included in API responses.

### 4.6. Empty and Error States (AC-19)
* **Empty State:** When no category exceeds the reporting thresholds, display a clean card:
  * Icon: CheckCircle (emerald)
  * Title: **"No gaps detected"**
  * Description: "All student questions in the past 30 days were either answered directly from your materials or fell below the reporting threshold."
* **Error Resilience:** If on-demand recomputation fails (e.g., LLM timeout), retain the previous cached dashboard view and present a non-intrusive warning banner: *"Could not refresh latest data. Displaying results computed at HH:MM."*

---

## 5. Category Management Modal (AC-07)

* **Rename:** In-place input to edit category label without losing attached chunks or historical query mappings.
* **Merge:** Select another category to combine with. Chunks and future query embeddings converge under the merged label.
* **Split:** Break a category into multiple sub-topics.
* **Delete:** Soft-delete or remove category mapping (associated chunks return to unassigned).

---

## 6. Frontend Architecture & File Tree

All implementation files will be housed cleanly under [`features/content-gap/`](file:///c:/Users/nghia/OneDrive/Desktop/FAcaProject/course-qa-agent-fe/features/content-gap/):

```text
course-qa-agent-fe/
├── app/(shell)/teacher/class/[id]/content-gaps/
│   └── page.tsx                         # Page entry point & layout container
├── features/content-gap/
│   ├── api.ts                           # API client (fetchDashboard, refresh, category CRUD)
│   ├── types.ts                         # TypeScript interfaces (Dashboard, Category, Proposal)
│   ├── gap-widget.tsx                   # Standalone summary card for Teacher Overview
│   ├── gap-stacked-bar-chart.tsx        # Horizontal stacked bar chart component (AC-11)
│   ├── gap-metrics-table.tsx            # Detail table with material update marker (AC-12, AC-14)
│   ├── unclassified-topics-card.tsx     # Card for reviewing & accepting proposed topics (AC-06)
│   ├── category-modal.tsx               # Modal dialog for Rename/Merge/Split/Delete (AC-07)
│   └── content-gap-dashboard.tsx        # Main dashboard coordinator component
```

---

## 7. Definition of Done (DoD) for UI Task

* [ ] Route `/teacher/class/[id]/content-gaps` accessible from teacher class navigation tab.
* [ ] Stacked horizontal bar chart renders top 10 categories + "Other" with accurate 2-color breakdown.
* [ ] Detail table displays search counts split into before vs. after latest material update.
* [ ] Unclassified queries surface proposed categories with one-click "Accept" action.
* [ ] Refresh button triggers immediate recompute with visual feedback and cached timestamp update.
* [ ] Category edit modal permits renaming, merging, and deleting.
* [ ] Tested on desktop and tablet viewport widths; zero PII / question text leakage.
* [ ] Fully handles empty state ("No gaps detected") and cache fallback on error.
