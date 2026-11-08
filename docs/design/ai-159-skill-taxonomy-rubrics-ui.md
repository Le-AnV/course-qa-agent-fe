# UI Design — Class Skills & 5-Level Rubrics Management (AI-159)

> **Ticket:** [AI-159](https://ai03.atlassian.net/browse/AI-159) (parent AI-147) · **Status:** Designed / Ready for review  
> **Backend Contract:** `course-qa-agent-be/docs/design/ai-159-skill-taxonomy-rubrics.md`  
> **Target Branch:** `features/Implementation_SkillTaxonomyRubrics`  
> **Design Branch:** `features/Design_SkillTaxonomyRubrics`  

---

## 1. Purpose and User Experience

Before teachers can generate targeted assessments, they need a clear, structured view of the competency standards being tested. AI-159 provides teachers with an intuitive workspace to view, edit, and automatically synthesize a 5-level Skill Taxonomy and Proficiency Rubrics tailored specifically to their class.

### 1.1 Who & Where
* **Target Users:** Primary Trainers, Co-Trainers, and Academic Admins. (Students never see this administration screen).
* **Route:** `/teacher/class/{id}/skills`
* **Navigation Placement:** Integrated as a top-level tab **"Skills & Rubrics"** (with icon `Layers`) inside the class workspace layout:
  ```
  /teacher/class/{id}/overview
  /teacher/class/{id}/syllabus
  /teacher/class/{id}/quizzes
  /teacher/class/{id}/skills       ← New competency workspace (AI-159)
  /teacher/class/{id}/tickets
  /teacher/class/{id}/members
  ```

---

## 2. Layout & Information Architecture

The interface utilizes a **Two-Column Master-Detail Layout** optimized for large screens:

```
+--------------------------------------------------------------------------------------------------------+
|  [Tab Navigation: Overview | Syllabus | Quizzes | Skills & Rubrics | Tickets | Members]                |
+--------------------------------------------------------------------------------------------------------+
|  Header: Class Skill Taxonomy & Rubrics                                                                |
|  Actions: [+ Add Skill]  [✨ Auto-generate Skills (AI)]                                                |
+---------------------------------------------------+----------------------------------------------------+
|  LEFT PANE: Master Skills List (1/3 width)        |  RIGHT PANE: Dreyfus 5-Level Rubrics (2/3 width)   |
|  - Search / Category filters                      |  - Selected Skill Header & Description             |
|  - List of Skills:                                |  - Level 1: NOVICE (80%) [Expand/Collapse]        |
|    * PY_FUNC (Functions & Scope) [Selected]       |    - Description text area (editable)              |
|    * PY_OOP (Object-Oriented Design)              |    - Pass threshold slider/input (%)               |
|    * DB_SQL (Relational Queries)                  |  - Level 2: BEGINNER (75%)                         |
|  - Empty State CTA if no skills exist             |  - Level 3: COMPETENT (70%)                        |
|                                                   |  - Level 4: PROFICIENT (65%)                       |
|                                                   |  - Level 5: MASTER (60%)                           |
|                                                   |  - [Save Changes] button per level                 |
+---------------------------------------------------+----------------------------------------------------+
```

### 2.1 Left Pane (Skills Repository)
* Displays skills grouped by code and category badge (e.g., `PYTHON`, `DATABASE`, `ALGORITHM`).
* Clicking a skill selects it and immediately loads its 5-level rubric breakdown on the right pane.
* **Empty State:** If a class has no skills yet, displays an illustrative empty state with a direct button to trigger AI auto-generation.

### 2.2 Right Pane (5-Level Dreyfus Rubrics)
* Displays the 5 proficiency tiers:
  - `NOVICE` (Slate badge, 80% default threshold)
  - `BEGINNER` (Blue badge, 75% default threshold)
  - `COMPETENT` (Emerald badge, 70% default threshold)
  - `PROFICIENT` (Amber badge, 65% default threshold)
  - `MASTER` (Purple badge, 60% default threshold)
* Each level card includes:
  - Clear pedagogical definition badge.
  - An editable textarea describing the required student comprehension scope.
  - A numeric threshold input with percentage sign.
  - A discrete **"Save"** button indicating draft status and saving state.

---

## 3. Key User Workflows

### 3.1 AI Auto-Generation Workflow
1. Teacher clicks **"Auto-generate Skills"** in the top action bar.
2. System displays a confirmation dialog summarizing that class metadata and syllabus notes will be synthesized.
3. Upon confirmation, button displays an animated spinner with `"Synthesizing Taxonomy..."`.
4. The client executes `skillApi.autoGenerateSkills(classId)`.
5. Upon 201 response, the master list populates immediately, the first skill is selected, and a success banner confirms `"Successfully generated N skills with rubrics!"`.

### 3.2 Manual Skill Creation Workflow
1. Teacher clicks **"+ Add Skill"**.
2. Modal dialog opens requesting:
   - `Code` (e.g., `PY-FUNC`)
   - `Name` (e.g., `Functions & Scope`)
   - `Category` (e.g., `PYTHON`)
   - `Description` (optional summary)
3. Upon submission, the frontend auto-bootstraps all 5 Dreyfus levels with standard thresholds and default scopes, creating a ready-to-refine template in one action.

### 3.3 Rubric Refinement & Inline Saving
1. Teacher modifies the description or pass threshold for a specific level.
2. Local draft state tracks modifications independently per level.
3. Teacher clicks **"Save"** on that level card.
4. Client sends `PUT /api/classes/{class_id}/skills/{skill_id}/rubrics/{level}` and displays a success badge for 3 seconds.

---

## 4. Frontend Component Structure

* **`lib/skill-api.ts`**: TypeScript definitions (`Skill`, `SkillLevelRubric`, `SkillLevel`, `SkillCreatePayload`) and fetch wrapper methods.
* **`app/(shell)/teacher/class/[id]/skills/page.tsx`**: Primary container component managing state:
  - `skills`: Array of loaded skill entities.
  - `selectedSkillId`: Currently focused skill.
  - `rubricDrafts`: Map of unsaved edits keyed by `SkillLevel`.
  - `expandedLevels`: Accordion visibility state for each level.
* **`app/(shell)/teacher/class/[id]/layout.tsx`**: Navigation tab integration.

---

## 5. Quality Assurance & Performance

* **Zero Cascading Renders:** Draft state derived via `useMemo` to eliminate React effect warning cycles (`set-state-in-effect`).
* **Optimized Production Packaging:** Verified with Next.js Turbopack & Webpack builds; 0 ESLint warnings, 0 TypeScript errors.

