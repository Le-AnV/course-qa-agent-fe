# UI Design — Question Bank Repository & Generation Management (AI-160)

> **Ticket:** [AI-160](https://ai03.atlassian.net/browse/AI-160) (parent AI-147) · **Status:** Designed & Implemented  
> **Backend Contract:** `course-qa-agent-be/docs/design/ai-160-question-bank.md`  
> **Target Branch:** `features/Implementation_QuestionBank`  
> **Related Stories:** AI-159 (Skill Taxonomy & 5-Level Rubrics), AI-148/AI-149/AI-151 (Quiz creation & review).

---

## 1. Purpose and User Experience

The Question Bank provides teachers with a dedicated, pedagogical repository where all assessment items are curated, categorized, and directly aligned with class learning outcomes before being sampled into formal quizzes.

### 1.1 Target Users & Route
* **Target Users:** Primary Trainers, Co-Trainers, and Academic Admins.
* **Route:** `/teacher/class/{id}/question-bank`
* **Navigation Placement:** Integrated into the teacher class workspace layout between Skills & Rubrics and Quizzes:
  ```
  /teacher/class/{id}/overview
  /teacher/class/{id}/syllabus
  /teacher/class/{id}/skills          ← Skill Taxonomy (AI-159)
  /teacher/class/{id}/question-bank   ← Question Bank Repository (AI-160)
  /teacher/class/{id}/quizzes         ← Quizzes & Excel Import (AI-148/AI-151)
  /teacher/class/{id}/attendance
  /teacher/class/{id}/tickets
  /teacher/class/{id}/members
  ```

---

## 2. Layout & Information Architecture

The Question Bank interface provides a unified header with multi-action modal triggers, dynamic filter controls, and responsive question cards:

```
+--------------------------------------------------------------------------------------------------------+
|  [Tab Navigation: Overview | Syllabus | Skills & Rubrics | Question Bank | Quizzes | Attendance...]     |
+--------------------------------------------------------------------------------------------------------+
|  Header: Question Bank                                                                                 |
|  Subtitle: Curate and generate assessment questions mapped to your skill taxonomy.                    |
|  Actions: [✨ Generate with AI]  [🧠 From Student Doubts & Pitfalls]  [+ Add Question]                 |
+--------------------------------------------------------------------------------------------------------+
|  Filter Bar:                                                                                           |
|  [🔍 Search questions...] [All Skills ▾] [All Types ▾] [All Difficulties ▾]                           |
+--------------------------------------------------------------------------------------------------------+
|  Summary Stats: Total Questions: 24 | Novice: 8 | Beginner: 6 | Competent: 5 | Proficient: 3 | Master: 2 |
+--------------------------------------------------------------------------------------------------------+
|  QUESTION CARDS LIST:                                                                                  |
|  +--------------------------------------------------------------------------------------------------+  |
|  | #1  [Single Choice] [Competent] [Skill: PY_OOP] [Document Chunk]                                 |  |
|  | What happens when a child class inherits from multiple parents with conflicting method names?   |  |
|  |   (•) A. Python uses Method Resolution Order (MRO) with C3 linearization (Correct)              |  |
|  |   ( ) B. The compiler raises a MultipleInheritanceError                                          |  |
|  |   ( ) C. The first declared parent's method always overrides unconditionally                     |  |
|  |   ( ) D. Both methods run concurrently in separate execution threads                             |  |
|  | [▶ Show Explanation & Rubric]                                                [✏ Edit] [🗑 Delete]  |  |
|  +--------------------------------------------------------------------------------------------------+  |
|  | #2  [Multiple Choice] [Beginner] [Skill: DB_SQL] [Student Pitfall]                               |  |
|  | ...                                                                                              |  |
+--------------------------------------------------------------------------------------------------------+
```

---

## 3. Modal Workflows

### 3.1 Modal 1: Generate with AI (Document-Grounded)
* **Trigger:** Click `[✨ Generate with AI]` button in the top action bar.
* **Document Picker:** Multi-select course documents uploaded to the class.
* **Skill Picker:** Optional multi-select of target skills from the class taxonomy.
* **Question Types:** Checkboxes for `Single Choice`, `Multiple Choice`, and `Fill in Blank`.
* **Dreyfus Level Badges:** Select 1 or more proficiency levels (`Novice`, `Beginner`, `Competent`, `Proficient`, `Master`).
* **Questions Per Level Slider:**
  * Configures the exact number of questions generated **per selected level** (range: 1 to 10 questions/level).
  * Live total counter displays:
    $$\text{Total} = \text{Questions per Level} \times \text{Number of Selected Levels}$$
* **Submission:** Dispatches `questionBankApi.generateFromDocuments` with loading animation.

### 3.2 Modal 2: Generate from Student Doubts & Pitfalls
* **Trigger:** Click `[🧠 From Student Doubts & Pitfalls]` button.
* **Purpose:** Identifies recurring student questions, misconceptions, and confusion points from actual `ChatMessage` and `Ticket` inquiries.
* **Timeframe Selector:** Dropdown (7 days, 14 days, 30 days, or All Time).
* **Target Skills:** Optional skill selection to scope the diagnostic questions.
* **Submission:** Dispatches `questionBankApi.mineMisconceptions`.

### 3.3 Modal 3: Manual Add / Edit Question
* **Trigger:** Click `[+ Add Question]` or the `[✏ Edit]` button on any question card.
* **Form Fields:**
  * **Question Type:** Single Choice, Multiple Choice, Fill in Blank.
  * **Skill Assignment:** Select from class skill taxonomy dropdown.
  * **Difficulty Tier:** Dreyfus level selector (`Novice` to `Master`).
  * **Points:** Numeric input (default 1.0).
  * **Question Prompt:** Rich textarea for the question stem.
  * **Dynamic Options Builder:** For choice questions, add/remove options (A, B, C, D...), define text, and toggle correct flag(s).
  * **Fill-in-the-blank Answers:** Comma-separated acceptable answers.
  * **Explanation & Rubric:** Detailed pedagogical feedback explaining why the correct answer is right and why distractors are misconceptions.

---

## 4. Key UX Decisions & Separation of Concerns

1. **Clean Separation from Quizzes:**
   * Import from Excel and Export to Excel belong strictly to the **Quizzes** section (`/teacher/class/{id}/quizzes/import` and `/quizzes/[quizId]`).
   * The Question Bank focuses exclusively on question curation, document AI synthesis, and misconception diagnostics.
2. **Simplified Teacher Workflow:**
   * Removed extraneous approval status filters (`Draft`, `Archived`) from the question bank listing, streamlining question review since teachers are the sole content curators.
3. **Transparent Per-Level Generation:**
   * Rather than setting an ambiguous overall total that gets arbitrarily divided among levels, teachers explicitly choose how many questions to generate per selected level.

---

## 5. API Client Integration (`lib/question-bank-api.ts`)

| Client Method | HTTP Target | Description |
|---|---|---|
| `questionBankApi.list(classId, filters)` | `GET /api/classes/{id}/question-bank` | Fetch questions with filters & summary counts |
| `questionBankApi.create(classId, payload)` | `POST /api/classes/{id}/question-bank` | Create manual question |
| `questionBankApi.update(classId, qId, payload)` | `PUT /api/classes/{id}/question-bank/{qId}` | Update existing question |
| `questionBankApi.delete(classId, qId)` | `DELETE /api/classes/{id}/question-bank/{qId}` | Delete question |
| `questionBankApi.generateFromDocuments(...)` | `POST .../generate-from-documents` | Trigger AI generation from documents |
| `questionBankApi.mineMisconceptions(...)` | `POST .../mine-misconceptions` | Trigger misconception probing |

---

## 6. Verification and Code Quality

* **TypeScript Typecheck:** `npx tsc --noEmit` passing with 0 errors.
* **Linter:** `npm run lint` (`eslint`) passing with 0 errors.
* **Unit Tests:** `npm run test` (`vitest run`) passing 100% (50/50 test files, 309/309 tests).
* **Production Build:** `npm run build` cleanly compiling all 30 routes including `/teacher/class/[id]/question-bank`.

