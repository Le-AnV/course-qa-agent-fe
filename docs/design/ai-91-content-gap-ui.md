# UI Design — Repeated-Question Counter & Content Gap Dashboard (AI-91)

> **Ticket:** AI-91 (Epic E6, parent AI-23) · **Status:** Complete Specification / Aligned with Implementation  
> **Backend Contract:** `course-qa-agent-be/docs/design/ai-91-content-gap.md`  
> **Related Stories:** AI-128 (Class Configuration), AI-83 (Trainer Inbox UI), AI-67 (Internet Source Agent UI), AI-65 (Retrieval Score Threshold Admin UI)

---

## 1. Purpose & User Story

### User Story
> **As a trainer,**  
> I want to see which content categories of my class keep forcing the system to search the internet because our materials do not cover them,  
> **so that** I know where to add materials next.

### User Persona & Key Goals
* **Trainer / Teacher:** Needs actionable, pedagogical insights on curriculum blind spots. Does NOT need individual student surveillance or automated ticket spam.
* **Key Decisions Supported:**
  * Identify topics that have high student demand and low material coverage (marked `critical` or `Needs Material`).
  * Review concrete student struggle summaries and synthesized recurring question patterns.
  * Receive actionable advice on what slides, code examples, or comparisons to add to class materials.

---

## 2. Route & Navigation Architecture

* **Workspace Route:** Embedded directly in the primary Teacher Class Dashboard Overview:
  `app/(shell)/teacher/class/[id]/overview/page.tsx`
* **Component Architecture:** Modular, all-in-one interactive card:
  [`components/teacher/content-gap-overview-card.tsx`](file:///c:/Users/nghia/OneDrive/Desktop/FAcaProject/course-qa-agent-fe/components/teacher/content-gap-overview-card.tsx)
* **Access Guard (AC-18):**
  * Accessible only by the primary trainer, co-trainers, or admin.
  * Students have no access to the card and receive 403 on client API requests.

---

## 3. UI Layout & Component Hierarchy

Top to bottom on the Content Gap Overview Card:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: Curriculum Content Gap Analysis & Learning Blind Spots              │
│ Subtitle: Identify topics forcing web searches and recurring questions.    │
│                                                                             │
│ [Timeframe Filter: 30d | 7d | 90d | Semester]  [Material: All | Lecture ...] │
│ Updated: 14:35 (Cached)     Latest material update: 25/10/2026    [Refresh] │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Horizontal Stacked Bar Chart (Materials vs. Web Search Gap) (AC-11)      │
│                                                                             │
│ Topic                     Material Coverage vs. Web Fallback Gap    Deficit │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Memory Management & Ptrs  [████████████████|░░░░░░░░░░░░░░░░░░]     Critical│
│ Concurrency & Async       [█████████████|░░░░░░░░░░░░]               Warning │
│ OOP & Polymorphism        [█████████████████████████████|░]             Good│
│ ... (Top 10 categories + "Other" aggregation)                               │
│                                                                             │
│ Legend: ■ Answered from Materials (Emerald)  ░ Web Fallback Gap (Amber)     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Interactive Metrics & Gap Table (AC-12, AC-14)                           │
│                                                                             │
│ Topic / Issue         Priority  Web Searches  Students  Status   Action     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Dangling pointers     High      14 (6 pre/8 post) 18%   Missing  [Drilldown]│
│ Smart pointer syntax  Medium    9 (3 pre/6 post)  12%   Review   [Drilldown]│
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Pedagogical Drilldown Modal Dialog                                       │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Topic: Memory Management > Smart Pointers (Severity: Critical)          │ │
│ │                                                                         │ │
│ │ • Student Weakness Summary: Students struggle with when to use unique_ptr│ │
│ │   vs shared_ptr, frequently asking for practical syntax examples.       │ │
│ │                                                                         │ │
│ │ • Recurring Question Patterns:                                          │ │
│ │   - "How to initialize std::make_unique inside constructors" (6 asks)   │ │
│ │   - "Performance difference between raw and smart pointers" (4 asks)    │ │
│ │                                                                         │ │
│ │ • Missing Slide Points & Recommendations:                               │ │
│ │   Missing: Concrete code example of custom deleters and shared_ptr.     │ │
│ │   Action: Add 2 slides with C++20 make_unique code snippets into Unit 3.│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Visual & Functional Specifications

### 4.1. Header & Multi-Scope Filtering
* **Timeframe Selector:** Toggle between `30d`, `7d`, `90d`, and `semester` rolling windows.
* **Material Set Selector:** Filter metrics across `all`, `lecture`, `lab`, and `policies`.
* **Refresh Action:** On-demand recalculation trigger calling `POST /api/teacher/classes/{id}/content-gaps/refresh`.
* **Material Update Marker (AC-14):** Clearly displays "Latest material update: DD/MM/YYYY" to distinguish pre-update vs. post-update web searches.

### 4.2. Stacked Bar Chart & Bidirectional Table Interaction (AC-11)
* Dual-color horizontal bars:
  * Materials coverage: `#10B981` (Emerald).
  * Web fallback gap: `#F59E0B` (Amber).
* Interactive Click: Clicking a bar segment or topic label filters the detail table below to focus exclusively on that topic.

### 4.3. Metrics Table, Status Badges & Priority System (AC-12)
* **Priority Levels:** `High`, `Medium`, `Low`, `Info`.
* **Issue Statuses:** `Needs Review`, `Missing Material`, `Covered`, `Resolved`, `Optional`, `Enrichment`.
* **Material Timeline Split Badge:** Displays `X pre / Y post` update web search counts.

### 4.4. Pedagogical Drilldown Modal
* Surfaces deep learning insights from `StudentWeaknessProfile` and `CurriculumGapProfile`.
* Displays recurring synthesized question themes (`QuestionPattern`) with inquiry counts and representative student wordings.
* Outlines bulleted missing slide concepts and actionable curriculum advice for the teacher.

### 4.5. Privacy & Empty States (AC-13, AC-19)
* Zero student PII or raw question text leakages.
* Polished empty state with checkmark when all categories are well covered.
* Fail-safe retention of cached view if refresh encounters network errors.
