# UI Design — Student Results, Attempt History & Class Statistics (AI-154)

> **Ticket:** AI-154 (parent AI-147) · **Status:** Implemented
> **Backend contract:** `course-qa-agent-be/docs/design/ai-154-quiz-auto-grade.md`
> **Branch:** `features/Implementation_QuizAutoGrade`

## 1. Purpose and user

AI-154 closes the auto-grade loop. The backend already grades an attempt, exposes the
student's own result/history, and aggregates teacher submissions/statistics. The UI has to
make those three views usable without adding a new design language:

| User | Needs |
|---|---|
| **Student** | See every attempt, know which one is official, review the submitted attempt answer by answer, understand why an answer was wrong (when explanations are enabled). |
| **Teacher** | See who submitted, class averages, pass rate, score distribution, per-question difficulty, and download the class workbook. |

The screens reuse the existing quiz surfaces (`/teacher/class/[id]/quizzes/...`) and the
shared primitives (`ClassPageHeader`, `WorkspacePageHeader`, `Card`, `Table`, `Badge`,
`EmptyState`, `Skeleton`, `Button`). No chart library and no new dependency.

## 2. Routes

| Route | Screen | Entry point |
|---|---|---|
| `/teacher/class/{classId}/quizzes/{quizId}/results` | Teacher results dashboard | `Results` button on the quiz list and on the quiz review header (hidden for `DRAFT`) |
| `/student/quizzes/{quizId}` | Student attempt history | Linked by AI-153's quiz detail/list; direct URL works today |
| `/student/quizzes/{quizId}/attempts/{attemptId}` | Student answer review | `View result` on the history row; AI-153 should redirect here after submit |

**Why the student routes are not under `/student/class/[id]/quizzes/...`:** AI-153 owns the
student quiz list/detail and will land there. Keeping AI-154's read-only screens on a
separate prefix prevents route collisions while still allowing AI-153 to link to them. The
student pages use `PageContainer` + `WorkspacePageHeader`, exactly like `/student/classes`.

## 3. Teacher results dashboard

### 3.1 Header

```
← Back to quiz
┌────────────────────────────────────────────────────────────────────┐
│ Networking midterm                [12 official attempts]          │
│ Scores, pass rate and question-level performance. Only one         │
│ official attempt per student is counted.                           │
│                                              [ Export Excel ]      │
└────────────────────────────────────────────────────────────────────┘
```

* `Export Excel` calls `GET /api/classes/{classId}/quizzes/{quizId}/results/export`,
  saves the server filename (`quiz-{id}-results.xlsx`) and toasts `Results exported.`
* Disabled while loading, already exporting, or when `submitted_count = 0`.
* The page tolerates a missing quiz/class by showing the backend message with `Retry`.

### 3.2 Summary cards

Four compact `Card`s, each with an icon, label, value and one line of context:

| Card | Value | Context line |
|---|---|---|
| Students submitted | `submitted_count` | total submitted attempts (including retakes) |
| Average score | `average_score` | `out of {max_score} points` |
| Average percentage | `average_percentage` | `Across official attempts` |
| Pass rate | `pass_rate` | `{passed} of {official} students passed` |

All numbers use the shared formatter: integers stay integers, other values are trimmed to
two decimals, and `null` renders `—`.

### 3.3 Score distribution

A `Card` with six fixed bands (`<50`, `50-59`, `60-69`, `70-79`, `80-89`, `90-100`). Each
row is `band label · proportional bar · count`. The bar width is
`count / submitted_count * 100`, rounded; no chart library.

### 3.4 Question performance

A scrollable `Table`:

| Column | Source |
|---|---|
| `#` | `order_index + 1` |
| Question | full prompt, wraps (never truncated) |
| Type | `Single choice` / `Multiple choice` / `Fill in blank` |
| Points | `points` |
| Answered | `answered_count / submitted_count` |
| Avg score | `average_score` |
| Full correct | mini bar + `full_correct_rate` |

The type column is hidden below `md`; the table container scrolls horizontally on phones.

### 3.5 Submissions

Toolbar: search by student name/code/email, `Official only` toggle (`aria-pressed`), `Clear`
when a filter is active, and `Showing X of Y`.

| Column | Content |
|---|---|
| Student | name, then `student_code · student_email` |
| Submitted | localized `submitted_at` + status badge (`Submitted` / `Expired`) |
| Score | `total_score / max_score` |
| Percentage | `percentage%` |
| Result | `Passed` / `Failed` / `Not graded` |
| Attempt | `Official` badge, otherwise `Retake` |

Rows are not clickable: the backend exposes no teacher endpoint for a student's full
answer review, so the UI does not pretend one exists. Each row is keyed by `attempt_id`, so
multiple attempts from the same student never collapse.

## 4. Student attempt history

```
← My classes
┌────────────────────────────────────────────────────────────────────┐
│ Networking midterm                                                 │
│ Every attempt you made for this quiz, newest first. The official   │
│ attempt is the one counted for your class.                         │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ Attempt 3   [Submitted] [Official]                                 │
│ Started Nov 5, 2026, 08:00 · Submitted Nov 5, 2026, 09:30          │
│ This attempt counts for your class.                                │
│                                    6 / 6 · 100%  [Passed] [View]   │
└────────────────────────────────────────────────────────────────────┘
```

* Newest first, matching `GET /api/student/quizzes/{quizId}/attempts`.
* `IN_PROGRESS` rows show `Result available after submission.` and no link.
* The official attempt gets a stronger ring and the explanatory line; retakes stay listed.
* Score block shows `total / max`, percentage and `Passing X`.
* The page tries to read one submitted result to recover the quiz title (the history payload
  has no title). That secondary request is optional; a failure keeps the generic title.
* Empty state: `No attempts yet` + `Back to my classes`.

## 5. Student answer review

Header: quiz title, `Submitted {date}`, `Official` badge when applicable, `All attempts`
action.

### 5.1 Score summary

A two-column `Card`:

* Tinted score panel (green passed / red failed / neutral not graded) with
  `total / max`, `percentage%`, and `Passed`/`Failed`.
* Right side: passing score, `fully correct / total questions`, started and graded time.

### 5.2 Question cards

One `Card` per question, in `order_index` order:

| Element | Behaviour |
|---|---|
| Meta | `Question N · type · points` |
| Prompt | Full text, wrapped |
| Outcome | `Correct` (green), `Incorrect` (red), `Not answered` / `Not graded` (grey) |
| Score | `score_awarded / points` |
| Options | Correct options get a green surface + `Correct` (or `Your answer` when selected); selected wrong options get a red surface + `Your answer`; unchecked seeds stay neutral |
| Choice answer line | `Your answer: A, C · Correct answer: A, C` |
| Fill-in-blank | `Your answer: …` and `Accepted answers: …` |
| Explanation | Only when `show_explanations = true`, in a quiet blue info box with a bulb icon |

The backend already hides explanations when the quiz opts out, so the UI renders whatever
it receives and never exposes a "show explanation" affordance.

### 5.3 Errors

| Backend | UI |
|---|---|
| `404` | `Result unavailable` empty state; the message explains the attempt is not theirs or no longer exists |
| `409` (in progress) | Same panel with the backend message `The attempt has not been submitted yet.` |
| network | `Could not load this result.` + `Retry` |

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading | Skeleton cards/rows; no layout jump between loading and data |
| No submissions | `EmptyState` in a `Card`: `No submissions yet` + back to quiz |
| No attempts | `EmptyState`: `No attempts yet` + back to classes |
| Filter returns nothing | In-table `EmptyState` with `Clear filters` |
| Long question text | Wraps; question table grows vertically, no truncation |
| Many submissions | Horizontal scroll for wide columns; vertical page scroll for rows |
| Two attempts same score | Backend picks latest submission; the `Official` badge is the only signal the UI needs |
| Student opens another student's attempt | Backend `404`; UI shows the generic unavailable panel |
| Export with zero submissions | Button disabled; server also returns a valid empty workbook |
| Mobile (<640px) | Cards stack, header actions wrap, question type column hidden, tables scroll |

## 7. Implementation notes

* `lib/quiz-api.ts` gains the AI-154 types (`QuizAttemptHistory`, `QuizAttemptResult`,
  `QuizSubmission`, `QuizStatistics`, …), teacher methods
  `listSubmissions` / `getStatistics` / `exportResults`, and a separate
  `studentQuizResultApi` object for the ownership-scoped student routes.
* New `features/quizzes/quiz-results.tsx` (teacher dashboard),
  `student-quiz-attempts.tsx` (history), `student-quiz-result.tsx` (answer review),
  `quiz-result-badges.tsx` (status/pass/official pills) and `quiz-result-format.ts`
  (score, percentage, date and question-type formatting).
* `quiz-list.tsx` gains a `Results` row action for published/archived quizzes;
  `quiz-review.tsx` gains the same action in its header. Drafts never show it because no
  attempt can exist yet.
* No new dependency and no backend change: the UI consumes the AI-154 endpoints exactly
  as documented in the backend design note.

## 8. AI-153 integration

AI-154 owns the read side. AI-153 should:

1. Call `grade_attempt(db, attempt.id, commit=False)` inside the submit transaction.
2. Redirect to `/student/quizzes/{quizId}/attempts/{attemptId}` after a successful submit.
3. Link the quiz detail/list row to `/student/quizzes/{quizId}` for attempt history.

Without step 1, the AI-154 reads still grade lazily, so the screens remain correct — only
the "immediate feedback" transition is delayed by one read.

## 9. Acceptance-criteria mapping

| AC | Where it lands |
|---|---|
| **AC-03** Student sees score, percentage, pass flag, per-question answer review, correct answers, history with official attempt | §4 history + §5 answer review; `official` ring/badge; explanation gated by `show_explanations` |
| **AC-04** Teacher sees submissions, statistics (average, pass rate, bands, per-question), and exports Excel | §3 dashboard + `Export Excel`; one official attempt per student is stated in the copy |
| **AC-05** Integrity / no answer leak | Student results are only fetched for an owned, submitted attempt; in-progress attempts show no result; teacher rows are read-only |

## 10. Copy

| Context | String |
|---|---|
| Teacher page title | `{quiz title}` / fallback `Quiz results` |
| Teacher subtitle | `Scores, pass rate and question-level performance. Only one official attempt per student is counted.` |
| Export | `Export Excel` / `Exporting…` / toast `Results exported.` |
| Empty submissions | `No submissions yet` / `Student scores will appear here after they submit this quiz.` |
| Student history title | `{quiz title}` / fallback `Quiz attempts` |
| Student history subtitle | `Every attempt you made for this quiz, newest first. The official attempt is the one counted for your class.` |
| Empty history | `No attempts yet` / `Open this quiz from your class to start your first attempt. Your score and answer review will appear here.` |
| In-progress row | `Result available after submission.` |
| Official row | `This attempt counts for your class.` |
| Review title | `Answer review` |
| Review subtitle | `Correct answers are shown after submission.` (+ `Explanations are enabled for this quiz.`) |
| Unavailable | `Result unavailable` |

## 11. Test plan

Automated:

```powershell
npm run test      # quiz-result-format.test.ts
npm run lint
npm run build
```

Manual, with a published quiz that has submissions:

1. Teacher list → `Results` appears only on published/archived quizzes; opens the dashboard.
2. Summary values match the backend (`submitted_count`, averages, pass rate).
3. Bands sum to the official attempt count; per-question rows match the quiz order.
4. Search + `Official only` filter narrow the table; `Clear` restores it.
5. Export downloads a three-sheet workbook and toasts on success.
6. Student history marks exactly one official attempt; in-progress rows have no link.
7. Result page shows the score, correct/selected options, fill-in accepted answers, and
   explanations only when enabled.
8. Another student's attempt → unavailable panel; own in-progress attempt → `409` panel.
9. Empty class (no submissions) and empty student history both render their `EmptyState`.
10. Mobile: cards stack, tables scroll, header actions wrap.
