# UI Design — Teacher Review, Approve & Export Quiz (AI-151)

> **Ticket:** AI-151 (parent AI-147) · **Status:** Designed / Ready for review
> **Backend contract:** `course-qa-agent-be/docs/design/ai-151-quiz-review-approve-export.md`
> **Branches:** `features/Design_QuizReviewExport` (this) · `features/Implementation_QuizReviewExport`

## 1. Purpose and user

Today a teacher can import a quiz from Excel (AI-152) and see the result as a read-only
list: expand a row, read the questions, close it. Nothing can be corrected, nothing can be
handed to a student, nothing comes back out.

AI-151 turns that list into the surface a teacher actually works on:

1. **Review** — read every question with its options, correct answers, explanation, source
   excerpt, points, and the quiz totals.
2. **Fix** — edit the quiz title/settings, edit a question in place, add a question, delete
   one, or regenerate one the agent got wrong.
3. **Approve** — sign off; the record shows who and when.
4. **Export** — download the same `.xlsx` the import accepts, so the quiz can live in the
   school's own template.

**Who:** the class' primary trainer, a co-trainer, or an admin. Students never see this
surface — a `DRAFT` quiz is invisible to them, and only a `PUBLISHED` one reaches AI-153.

**Where:** the existing class tab, renamed from `Quiz Import` to `Quizzes`.

```
/teacher/class/{id}/quizzes            ← list + review (was /quizzes/import)
/teacher/class/{id}/quizzes/import     ← unchanged import flow (AI-152)
/teacher/class/{id}/quizzes/{quizId}   ← full review screen
```

`/quizzes/import` stays the import page. The tab must land on the list, not on the import
form, because the list is now the workspace's front door. Next.js resolves the static
`import` segment before the dynamic `[quizId]`, so the two routes coexist without a
rewrite.

## 2. Non-goals

- No question generation UI (AI-149 owns document selection and the generation form). The
  review screen only offers "Regenerate this question" on an existing one.
- No student-facing surface (AI-153) and no grading view (AI-154).
- No drag-and-drop reordering — not in any AC, and the backend has no reorder route.
- No new design tokens, no new component library entry. Everything is built from the
  existing `components/ui/` set (Button, Input, Select, Badge, Modal, EmptyState, Toast).

## 3. Layout

### 3.1 Quiz list (`/quizzes`)

The current `QuizList` component grows up rather than being replaced.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Quizzes                                             [ Import quiz ]  │
│ Import from Excel or generate from documents, then review and export.│
├──────────────────────────────────────────────────────────────────────┤
│ ▸ Networking midterm      [PUBLISHED]     12 questions · 28.5 pts    │
│   Chapters 1-4 · approved by Nguyễn Chí Trung on 6 Nov 2026          │
│                                                    [ Export ]        │
├──────────────────────────────────────────────────────────────────────┤
│ ▸ Database basics         [DRAFT]          8 questions · 16 pts      │
│   Awaiting your review                                               │
│                                          [ Review ]  [ Export ] ✕    │
└──────────────────────────────────────────────────────────────────────┘
```

Row anatomy (left to right): title, status badge, `{n} questions · {total} pts`, then the
contextual action group.

| Quiz status | Secondary line | Actions |
|---|---|---|
| `DRAFT` | `Awaiting your review` | `Review` (primary) · `Export` (disabled, tooltip "Approve this quiz before exporting it") · overflow `Delete` |
| `PUBLISHED` | `approved by {name} on {date}` | `Export` (primary) · overflow `Reopen for editing` |
| `ARCHIVED` | `Archived` | `Export` (primary) |

`Delete` and `Reopen` go through a confirm dialog (`AI-131` AC-03 requires destructive
actions to confirm). Both dialogs name the quiz title.

Expanding a row keeps the current inline question preview — it is the fast path for "did
the import work?" — but now ends with `Review all questions →` which navigates to the
detail page. The list never becomes an editor.

### 3.2 Review screen (`/quizzes/{quizId}`)

Two columns at ≥ 1024px, one column below.

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Quizzes                                                              │
│ Networking midterm                            [DRAFT]     [ Approve ]  │
├───────────────────────────────────────────┬────────────────────────────┤
│ Quiz settings                             │ Totals                     │
│ Title       [ Networking midterm      ]   │ 12 questions               │
│ Description [ Chapters 1-4            ]   │ 28.5 points                │
│ Time limit  [ 45 ] minutes                │ ▓▓▓▓▓▓▓░░░ 7 single            │
│ Passing     [ 60 ] %                      │ ▓▓▓░░░░░░░ 3 multiple          │
│                            [ Save ]       │ ▓░░░░░░░░░ 2 fill-in-blank     │
├───────────────────────────────────────────┴────────────────────────────┤
│ Questions (12)                                   [ Add question ]      │
│                                                                        │
│ 1  SINGLE_CHOICE · 1 pt · REMEMBER                    ⋯ Edit  Delete    │
│    What does CPU stand for?                                            │
│    ◉ A. Central Processing Unit        ← correct, green ring           │
│    ○ B. Central Program Unit                                           │
│    Source: Computer Architecture Ch.1                                  │
│    Explanation: CPU is the …                                           │
│  ────────────────────────────────────────────────────────────────────  │
│ 2  FILL_IN_BLANK · 2 pts · APPLY                       ⋯ Edit  Delete   │
│    …                                                                   │
└────────────────────────────────────────────────────────────────────────┘
```

**Header.** Back link, quiz title (inline-editable via the settings panel, not here), status
badge, and the one primary action:

- `DRAFT` → `Approve` (disabled with tooltip "Add at least one question before approving"
  when empty)
- `PUBLISHED` → `Export` (primary) + `Reopen for editing` (secondary)
- `ARCHIVED` → `Export`

**Settings panel.** A card, not a modal: metadata is edited while the questions stay
visible. `Save` is enabled only when a field changed; it calls
`PATCH /quizzes/{id}` and toasts "Quiz settings saved." Field rules mirror the backend:
`time_limit_minutes` integer ≥ 1, `passing_score` 0–100, `title` 1–255 and non-blank after
trim. Invalid input is caught client-side with an inline message, because the backend
answers `422`.

**Totals panel.** `question_count`, `total_points` (formatted `1.0 → 1`, `28.5 → 28.5`),
and a per-type breakdown with a proportional bar. This is AC-02's "question counts, total
points" made visible without a chart library — plain divs with `width: {pct}%`.

**Question card.** One card per question, in `order_index` order:

| Element | Content |
|---|---|
| Index | `index + 1` (never the stored `order_index`) |
| Meta line | `question_type` (spaces, not underscores) · `{points} pt(s)` · `difficulty` |
| Prompt | Full text, no truncation |
| Options | A–F; the correct ones get the green ring + bold used today |
| Answer summary | `Correct answer: …` for choices, `Accepted answers: …` for fill-in-blank |
| Source excerpt | `source_reference` when present, labelled `Source:`, clamped to 2 lines with a "Show more" toggle |
| Explanation | As today, labelled `Explanation:` |
| Actions | `Edit` (opens the question editor), `Delete` (confirm dialog) |

Editing is refused on the server after approval, so on a `PUBLISHED` quiz the per-question
`Edit`/`Delete` actions are hidden and the card carries a small note:
`Reopen the quiz to edit its questions.` Hiding beats letting the teacher try and read a
`409`.

### 3.3 Question editor

A modal (`Modal` from `components/ui/`), because it is a focused task with a clear
end. Opens for `Add question`, `Edit`, or `Regenerate`.

```
┌──────────────────────────────────────────────────────┐
│ Edit question 3                                 ✕    │
│ Type      [ SINGLE_CHOICE ▾ ]   Points [ 1 ]          │
│ Difficulty[ REMEMBER ▾ ]                              │
│ Question  [ …                                     ]    │
│                                                       │
│ Options            Correct                            │
│ A [ Central Processing Unit        ]  ●               │
│ B [ Central Program Unit           ]  ○               │
│ C [                                    ]  ○           │
│ + Add option (max F)                                  │
│                                                       │
│ Source excerpt [ … ]                                  │
│ Explanation    [ … ]                                  │
│ Rubric         [ … ]  (fill-in-blank only)            │
│                                                       │
│              [ Cancel ]   [ Save question ]           │
└──────────────────────────────────────────────────────┘
```

- **Type switch** changes the body: `SINGLE_CHOICE`/`MULTIPLE_CHOICE` show the option
  matrix, `FILL_IN_BLANK` shows `Accepted answers` (one per line, sent as
  `correct_answers`) and `Rubric`, and hides the matrix. Switching away from a type clears
  its now-irrelevant fields rather than leaving them to trip a `422`.
- **Client-side rules mirrored from AI-148**: at least 2 options, one correct option for
  single choice, ≥ 1 for multiple choice, labels always allocate `A`, `B`, `C`… in order
  (deleting B renames C→B), points > 0, prompt non-blank.
- **Live total**: the modal footer shows `Total after saving: 29.5 points` so the teacher
  sees the effect before committing.
- **Save disabled until dirty and valid.**

### 3.4 Regenerate

Reachable from the question card's overflow `Regenerate` (available on `DRAFT` only) and
from inside the editor.

```
┌──────────────────────────────────────────────────────┐
│ Regenerate question 3                           ✕    │
│ The current question stays until the new one is ready│
│                                                       │
│ What should change? (optional)                        │
│ [ Make the distractors harder, keep APPLY level   ]   │
│                                          0 / 500      │
│                                                       │
│             [ Cancel ]   [ Regenerate ]               │
└──────────────────────────────────────────────────────┘
```

While running: the button becomes a spinner with `Generating…`, the modal cannot be closed
(the user can still press `Cancel` to abort the request). On success the card updates in
place and the modal closes with a toast `Question 3 regenerated.` On `502/503` the modal
stays open with an inline error — `The generator could not produce a valid question. Your
current question was not changed.` / `Question generation is not available right now.` The
existing question is never blanked in the UI before the server confirms.

### 3.5 Approve

```
┌──────────────────────────────────────────────────────┐
│ Approve "Networking midterm"?                   ✕    │
│                                                       │
│ 12 questions · 28.5 points                            │
│                                                       │
│ Once approved, the questions are locked and the quiz  │
│ becomes visible to students. You can reopen it later. │
│                                                       │
│                  [ Cancel ]   [ Approve quiz ]        │
└──────────────────────────────────────────────────────┘
```

After success: the badge flips to `PUBLISHED`, the header shows
`Approved by {name} on {date}`, the primary action becomes `Export`, and the per-question
edit actions disappear. Toast: `Quiz approved.`

### 3.6 Export

Button label `Export`, with a download icon. On click it calls
`GET /quizzes/{id}/export`, streams the blob, and saves `quiz_{id}.xlsx`. No modal — the
action is reversible (re-download) and the file lands in the browser's download shelf.

Errors:

| Status | Message |
|---|---|
| `409` | `Approve this quiz before exporting it.` (should be unreachable — the button is disabled) |
| `404` | `This quiz no longer exists.` |
| network | `Could not download the quiz. Check your connection and try again.` |

## 4. States and edge cases

| State | Behaviour |
|---|---|
| Loading the quiz | Skeleton for header, settings and three question cards |
| Quiz not found / other class | Full-page `EmptyState`: "Quiz not found." + `Back to quizzes` |
| Zero questions | Totals show `0 questions · 0 points`; `Approve` disabled with tooltip; `Export` disabled; body shows an `EmptyState` with `Add question` and `Import from Excel` |
| Very long prompt | Wrapped, never truncated |
| 40+ questions | Plain scroll; no virtualisation (a quiz is capped at 1,000 rows by import, but a reviewable quiz in practice is < 100) |
| Approved quiz, edit attempted via URL | Server `409`; the UI shows the error toast and hides the actions |
| Concurrent edit by a co-trainer | Last write wins (the backend has no ETag). The list refetches on focus, so a stale page resolves itself on navigation; no optimistic merge is attempted |
| Regenerate while generator unconfigured | Inline error in the modal, question preserved |
| Save with no changes | `Save` disabled |
| Mobile (< 640px) | Settings and totals stack above the question list; question actions move into the card overflow menu; modal becomes full-height sheet |

## 5. Acceptance-criteria mapping

| AC | Where it lands |
|---|---|
| **AC-01** Review lists questions; edit content, change correct answers, add/delete, regenerate one | §3.2 question card + §3.3 editor (`PATCH`, `POST/PUT/DELETE /questions`) + §3.4 regenerate |
| **AC-02** Source excerpt, warnings, question counts, per-question points, total points visible | §3.2 totals panel (`question_count`, `total_points`, per-type breakdown), per-card `{points} pt`, `Source:` line; warnings after import are F3 in the BE doc — this story shows per-question validation errors in the editor, and import-time warnings stay on the import preview |
| **AC-03** Export blocked until approved | `Export` disabled with tooltip on `DRAFT` (§3.1, §3.2); server also answers `409` |
| **AC-04** Exported xlsx matches the template and re-imports cleanly | Export downloads the AI-148 workbook unchanged; verified end-to-end by the backend test `test_export_reimports_without_schema_drift` |
| **AC-05** Approval records who and when | Header line `Approved by {name} on {date}` and the list row's secondary line, both fed by `approved_by_name` / `approved_at` |

## 6. Copy

| Context | String |
|---|---|
| Tab | `Quizzes` |
| Page title | `Quizzes` |
| List subheader | `Import from Excel or generate from documents, then review and export.` |
| Draft secondary line | `Awaiting your review` |
| Approved secondary line | `Approved by {name} on {date}` |
| Export tooltip (draft) | `Approve this quiz before exporting it` |
| Approve disabled tooltip | `Add at least one question before approving` |
| Locked note | `Reopen the quiz to edit its questions.` |
| Regenerate warning | `The current question stays until the new one is ready` |
| Regenerate error (invalid) | `The generator could not produce a valid question. Your current question was not changed.` |
| Regenerate error (unavailable) | `Question generation is not available right now.` |
| Toasts | `Quiz settings saved.` · `Question added.` · `Question saved.` · `Question deleted.` · `Question {n} regenerated.` · `Quiz approved.` · `Quiz reopened for editing.` · `Quiz deleted.` |

## 7. Reuse and implementation notes

- `features/quizzes/quiz-list.tsx` keeps its `refreshToken` / `lastImported` props and its
  fetch/expand logic, and gains the row actions plus a `Review all questions` footer link
  that navigates to the new detail route.
- New `features/quizzes/quiz-review.tsx` (detail screen), `quiz-settings-card.tsx`,
  `quiz-totals-card.tsx`, `quiz-question-card.tsx`, `quiz-question-editor.tsx`,
  `quiz-regenerate-dialog.tsx`.
- `lib/quiz-api.ts` gains `updateQuiz`, `addQuestion`, `updateQuestion`, `deleteQuestion`,
  `regenerateQuestion`, `approveQuiz`, `reopenQuiz`, `exportQuiz`. The existing `request()`
  helper only does `GET`; a `mutate()` sibling handling method + JSON body is added rather
  than bolting method support onto `request`.
- Status badge colours reuse the existing badge variants: `DRAFT` muted, `PUBLISHED` green,
  `ARCHIVED` outline — no new token.
- The class tab in `app/(shell)/teacher/class/[id]/layout.tsx` changes
  `{ id: "quizzes", label: "Quiz Import", href: "…/quizzes/import" }` to
  `label: "Quizzes", href: "…/quizzes"`.
- No Figma file for this ticket: the deliverable is the spec above plus the components,
  following AI-121's precedent (component library + live styleguide, no mock).

## 8. Test plan (frontend)

Manual, on a class the trainer owns, with a `DRAFT` quiz present:

1. List shows totals and the right actions per status; `Export` is disabled on a draft.
2. Edit a single-choice question's correct answer → card updates, correct option ring moves.
3. Delete a question → remaining indexes renumber `1..n`, total points drop by that
   question's points.
4. Add a fill-in-blank question with two accepted answers → appears last, totals update.
5. Regenerate one question on a `DRAFT` → prompt/options change, other questions untouched.
6. Approve with zero questions → blocked with tooltip; add one, approve → badge flips,
   `Approved by … on …` renders, edit actions disappear.
7. Export the approved quiz → `.xlsx` downloads; re-upload it to `/quizzes/import` preview
   → `valid: true`, same question count and points.
8. Reopen → badge back to `DRAFT`, approval line gone, edit actions return.
9. Student account cannot reach `/teacher/class/{id}/quizzes/{quizId}` (redirected by the
   AppShell role guard; backend answers `403`).
10. Mobile width 390px: settings/totals stack, question actions collapse into the overflow.

Automated (Playwright, mirrors the existing `ui_test.py` suite): scenarios 1, 2, 6, 7 and 9
as the highest-value subset.

## 9. Branch and merge-request convention

- Design branch: `features/Design_QuizReviewExport` → MR to `main`, title
  `[Design] docs(quiz): review, approve and export contract (AI-151)`.
- Implementation branch: `features/Implementation_QuizReviewExport` → MR to `main`, title
  `[Feature] feat(quiz): teacher review, approval and Excel export (AI-151)`.
- Two separate MRs, never merged into each other.
- Screenshots of the implemented states are attached to the implementation MR per AI-121's
  styleguide precedent.
