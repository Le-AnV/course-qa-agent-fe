# AI-149 / AI-151 — Quiz Blueprint Generator & Competency Skill Radar UI

> **Ticket:** [AI-149](https://ai03.atlassian.net/browse/AI-149) / [AI-151](https://ai03.atlassian.net/browse/AI-151) (Epic AI-147: Quiz Generation & Assessment) | **Priority:** High
> **Sprint:** Sprint 4 — Quiz & Attendance
> **Status:** Implemented & Verified
> **Target Branch:** `features/Implementation_QuizGenerator`
> **Related Stories:** AI-151 (review & publish UI), AI-153 (student quiz player), AI-154 (auto-grade UI), AI-159 (skill taxonomy UI), AI-160 (question bank UI).

---

## 1. Purpose and Scope

This document specifies the user interface architecture for the Standardized Assessment Matrix Blueprint Quiz Generator and the post-exam Dreyfus Competency Skill Radar Report.

### Core Capabilities:
1. **Teacher Blueprint Generator Modal:** Allows instructors to assemble balanced quizzes by targeting specific class skills and cognitive Dreyfus levels with uniform per-level question quotas ($k$), dynamic availability checks against the Question Bank, and on-demand AI document synthesis fallbacks.
2. **Student Competency Skill Radar Report:** Displays a multi-dimensional polygonal radar chart upon exam submission, highlighting achieved Dreyfus tiers, prerequisite foundation gaps, and level breakdowns.
3. **Student Solution Key Visibility Control:** Instructor toggle allowing/preventing students from viewing answer keys and explanations upon submission.
4. **Notification Auto-Dismiss:** Eliminates persistent toasts and banner notices with standard timeouts.

---

## 2. Component Architecture & User Flows

```
/teacher/class/[id]/quizzes
  └── [Generate Quiz (AI Blueprint)] button
        └── <QuizBlueprintModal />
              ├── Assessment Metadata (Title, Time Limit, Passing Score)
              ├── Skill Selection Chips (Multi-select)
              ├── Dreyfus Level Selection (NOVICE -> MASTER)
              ├── Uniform Quota Slider (Questions per Level: k)
              ├── Real-time Bank Inventory Comparison
              ├── Generation Toggles (AI fallback, Solution visibility, Shuffling)
              └── Dispatch -> Redirects to /quizzes/[quizId] editor

/student/class/[id]/quizzes/[quizId]
  └── <StudentQuizPlayer />
        ├── In-progress Quiz Engine (Questions, Options, Timer, Autosave)
        └── Submission Result View
              ├── Score Summary & Pass/Fail Badge
              ├── <SkillRadarChart /> (Polygonal SVG Radar + Dreyfus Badges + Gap Alerts)
              └── Conditional Solution Review
                    ├── If show_solutions === true: Full question reviews & explanations
                    └── If show_solutions === false: "Answer Key Hidden" educational banner
```

---

## 3. UI Specifications

### 3.1 Standardized Blueprint Generator Modal (`features/quizzes/quiz-blueprint-modal.tsx`)
* **Metadata Inputs:** Title (required), Description, Time Limit in minutes, Passing Score %.
* **Skill Selector:** Grid of toggleable badges displaying skill codes and titles.
* **Level Selector:** Dreyfus stages: `Novice`, `Beginner`, `Competent`, `Proficient`, `Master`.
* **Uniform Quota Configuration:**
  * Clean label: `Questions per Level:` (no LaTeX/dollar sign artifacts).
  * Slider input ($1 \le k \le 10$, default 3).
  * Calculated Total badge: $\text{Total} = |\text{Selected Skills}| \times |\text{Selected Levels}| \times k$.
* **Bank Availability Indicators:**
  * Compares requested count against live `GET /quizzes/blueprint-matrix`.
  * Green badge: *"Available in Question Bank"*.
  * Amber badge: *"Requires on-demand AI generation from class documents"*.
* **Options Toggles:**
  * *"Auto-generate missing questions with AI if bank is insufficient"*
  * *"Allow students to view answer key & explanations after submission"*
  * *"Shuffle question order"*
  * *"Shuffle answer options order"*

### 3.2 Student Competency Skill Radar Report (`features/quizzes/skill-radar-chart.tsx`)
* **Polygonal Radar Chart:**
  * Pure SVG polygon rendering with 5 concentric reference rings representing Dreyfus levels:
    * 20% (Novice) | 40% (Beginner) | 60% (Competent) | 80% (Proficient) | 100% (Master).
  * Color-coded gradient fill (`rgba(59, 130, 246, 0.25)`) with animated vertex markers.
* **Achieved Level Badges:**
  * `MASTER`: Violet / Purple (`bg-purple-100 text-purple-700`)
  * `PROFICIENT`: Indigo (`bg-indigo-100 text-indigo-700`)
  * `COMPETENT`: Emerald / Green (`bg-emerald-100 text-emerald-700`)
  * `BEGINNER`: Amber (`bg-amber-100 text-amber-700`)
  * `NOVICE`: Slate (`bg-slate-100 text-slate-700`)
* **Prerequisite Foundation Gap Alerts:**
  * Displays warning banners when a student passes higher-tier questions but failed foundational tiers (e.g., Passed Competent while failing Beginner).
* **Granular Breakdown Cards:**
  * Expandable per-skill accordion displaying questions earned, total questions, percentage, and pass/fail status per Dreyfus level.

### 3.3 Solution Concealment Banner (`features/quizzes/student-quiz-player.tsx`)
* When `result.show_solutions_after_submission === false`:
  * Renders an educational notice:
    > **Answer Key & Detailed Explanations Hidden**  
    > The instructor has configured this quiz to withhold solution keys. Your score and Dreyfus Skill Radar report have been recorded.
  * Correct answer checkmarks, explanation cards, and rubric criteria are completely omitted from the DOM.

### 3.4 Notification Auto-Dismiss Optimization
* **Toaster (`components/ui/sonner.tsx`):** Default duration set to 3500ms.
* **Review Actions (`features/quizzes/quiz-review.tsx`):** Explicit `duration: 3000` on approve and add-question toast triggers.
* **Question Bank (`app/(shell)/teacher/class/[id]/question-bank/page.tsx`):** 3.5s auto-dismiss timer on inline notice banners.

---

## 4. API Client Integration (`lib/quiz-api.ts`, `lib/student-quiz-api.ts`)

```typescript
export interface BlueprintCellAvailability {
  skill_id: string;
  skill_code: string;
  skill_name: string;
  difficulty: string;
  available_in_bank: number;
}

export interface BlueprintAvailabilityResponse {
  class_id: string;
  cells: BlueprintCellAvailability[];
  total_bank_questions: number;
}

export interface QuizGenerateBlueprintRequest {
  title: string;
  description?: string;
  time_limit_minutes?: number | null;
  passing_score?: number | null;
  target_skill_ids: string[];
  target_levels: string[];
  questions_per_level: number;
  auto_generate_missing: boolean;
  document_ids?: string[];
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_solutions_after_submission?: boolean;
}
```

---

## 5. Verification & Quality Assurance

* **TypeScript Typecheck (`npx tsc --noEmit`):** 0 errors.
* **ESLint (`npm run lint`):** 0 errors, 0 warnings.
* **Vitest Suite (`npm run test`):** 51/51 files passed, 314/314 tests passed (100% green).
* **Production Build (`next build`):** Exit code 0, 30/30 routes compiled.

