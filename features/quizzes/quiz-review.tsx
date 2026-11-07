"use client";

import * as React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  LoaderCircle,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  quizApi,
  type QuizDetail,
  type QuizMetadataUpdate,
  type QuizQuestion,
  type QuizQuestionInput,
} from "@/lib/quiz-api";
import { QuizQuestionEditor } from "@/features/quizzes/quiz-question-editor";
import { fromDateTimeLocal, toDateTimeLocal } from "@/features/quizzes/quiz-take-utils";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");
}

function answersOf(question: QuizQuestion): string[] {
  if (question.question_type === "FILL_IN_BLANK") {
    return question.grading_config?.correct_answers ?? [];
  }
  return question.options
    .filter((option) => option.is_correct)
    .map((option) => `${option.option_label}. ${option.option_text}`);
}

export function QuizReview({ classId, quizId }: { classId: string; quizId: string }) {
  const [quiz, setQuiz] = React.useState<QuizDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [savingQuestion, setSavingQuestion] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<QuizQuestion | null>(null);
  const [regenerating, setRegenerating] = React.useState<QuizQuestion | null>(null);
  const [regenerateError, setRegenerateError] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<QuizQuestion | null>(null);
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [reopenOpen, setReopenOpen] = React.useState(false);
  const [form, setForm] = React.useState<QuizMetadataUpdate>({});
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    quizApi
      .getQuiz(classId, quizId)
      .then((detail) => {
        if (cancelled) return;
        setQuiz(detail);
        setError(null);
        setForm({
          title: detail.title,
          description: detail.description,
          time_limit_minutes: detail.time_limit_minutes,
          passing_score: detail.passing_score,
          opens_at: detail.opens_at,
          closes_at: detail.closes_at,
          max_attempts: detail.max_attempts,
        });
        setDirty(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load this quiz.");
      });
    return () => {
      cancelled = true;
    };
  }, [classId, quizId]);

  const isDraft = quiz?.status === "DRAFT";
  const isPublished = quiz?.status === "PUBLISHED";

  function applyDetail(detail: QuizDetail) {
    setQuiz(detail);
    setForm({
      title: detail.title,
      description: detail.description,
      time_limit_minutes: detail.time_limit_minutes,
      passing_score: detail.passing_score,
      opens_at: detail.opens_at,
      closes_at: detail.closes_at,
      max_attempts: detail.max_attempts,
    });
    setDirty(false);
  }

  async function saveMetadata() {
    setBusy(true);
    try {
      applyDetail(await quizApi.updateQuiz(classId, quizId, form));
      toast.success("Quiz settings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save quiz settings.");
    } finally {
      setBusy(false);
    }
  }

  async function saveQuestion(payload: QuizQuestionInput) {
    setSavingQuestion(true);
    try {
      const detail = editing
        ? await quizApi.updateQuestion(classId, quizId, editing.id, payload)
        : await quizApi.addQuestion(classId, quizId, payload);
      applyDetail(detail);
      setEditorOpen(false);
      setEditing(null);
      toast.success(editing ? "Question saved." : "Question added.");
    } finally {
      setSavingQuestion(false);
    }
  }

  async function regenerate(instructions: string) {
    if (!regenerating) return;
    setBusy(true);
    setRegenerateError(null);
    try {
      const detail = await quizApi.regenerateQuestion(classId, quizId, regenerating.id, instructions);
      applyDetail(detail);
      toast.success("Question regenerated.");
      setRegenerating(null);
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : "Could not regenerate this question.");
    } finally {
      setBusy(false);
    }
  }

  async function removeQuestion() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      applyDetail(await quizApi.deleteQuestion(classId, quizId, pendingDelete.id));
      toast.success("Question deleted.");
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete this question.");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    try {
      applyDetail(await quizApi.approveQuiz(classId, quizId));
      toast.success("Quiz approved.");
      setApproveOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve this quiz.");
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    setBusy(true);
    try {
      applyDetail(await quizApi.reopenQuiz(classId, quizId));
      toast.success("Quiz reopened for editing.");
      setReopenOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reopen this quiz.");
    } finally {
      setBusy(false);
    }
  }

  async function exportQuiz() {
    if (!quiz) return;
    setBusy(true);
    try {
      await quizApi.exportQuiz(classId, quizId, quiz.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download the quiz.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !quiz) {
    return (
      <div className="space-y-4">
        <Link
          href={`/teacher/class/${classId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> Quizzes
        </Link>
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="size-4 animate-spin" />
        Loading quiz…
      </div>
    );
  }

  const totalAfter = quiz.questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/teacher/class/${classId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> Quizzes
        </Link>
      </div>

      <ClassPageHeader
        title={quiz.title}
        subtitle={
          isPublished && quiz.approved_at
            ? `Approved by ${quiz.approved_by_name ?? "a teacher"} on ${new Date(quiz.approved_at).toLocaleDateString()}`
            : isDraft
              ? "Awaiting your review"
              : "Archived"
        }
        badge={
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {quiz.status}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isDraft && (
              <Button
                onClick={() => setApproveOpen(true)}
                disabled={busy || quiz.questions.length === 0}
                title={
                  quiz.questions.length === 0
                    ? "Add at least one question before approving"
                    : undefined
                }
              >
                <CheckCircle2 /> Approve
              </Button>
            )}
            {(isPublished || quiz.status === "ARCHIVED") && (
              <Button onClick={() => void exportQuiz()} disabled={busy}>
                <Download /> Export
              </Button>
            )}
            {isPublished && (
              <Button variant="outline" onClick={() => setReopenOpen(true)} disabled={busy}>
                <Undo2 /> Reopen for editing
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Quiz settings</h2>
          {!isDraft ? (
            <p className="text-sm text-slate-600">Reopen the quiz to change its settings.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="qs-title">Title</Label>
                <Input
                  id="qs-title"
                  value={form.title ?? ""}
                  onChange={(event) => {
                    setForm((c) => ({ ...c, title: event.target.value }));
                    setDirty(true);
                  }}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="qs-description">Description</Label>
                <textarea
                  id="qs-description"
                  rows={2}
                  className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                  value={form.description ?? ""}
                  onChange={(event) => {
                    setForm((c) => ({ ...c, description: event.target.value }));
                    setDirty(true);
                  }}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qs-time">Time limit (minutes)</Label>
                <Input
                  id="qs-time"
                  type="number"
                  min="1"
                  value={form.time_limit_minutes ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setForm((c) => ({
                      ...c,
                      time_limit_minutes: raw === "" ? null : Number(raw),
                    }));
                    setDirty(true);
                  }}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qs-passing">Passing score (%)</Label>
                <Input
                  id="qs-passing"
                  type="number"
                  min="0"
                  value={form.passing_score ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setForm((c) => ({
                      ...c,
                      passing_score: raw === "" ? null : Number(raw),
                    }));
                    setDirty(true);
                  }}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qs-open">Opens at</Label>
                <Input
                  id="qs-open"
                  type="datetime-local"
                  value={toDateTimeLocal(form.opens_at ?? null)}
                  onChange={(event) => {
                    setForm((c) => ({
                      ...c,
                      opens_at: fromDateTimeLocal(event.target.value),
                    }));
                    setDirty(true);
                  }}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qs-close">Closes at</Label>
                <Input
                  id="qs-close"
                  type="datetime-local"
                  value={toDateTimeLocal(form.closes_at ?? null)}
                  onChange={(event) => {
                    setForm((c) => ({
                      ...c,
                      closes_at: fromDateTimeLocal(event.target.value),
                    }));
                    setDirty(true);
                  }}
                  disabled={busy}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qs-attempts">Attempts allowed</Label>
                <Input
                  id="qs-attempts"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.max_attempts ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setForm((c) => ({
                      ...c,
                      max_attempts: raw === "" ? null : Number(raw),
                    }));
                    setDirty(true);
                  }}
                  disabled={busy}
                />
                <p className="text-[11px] text-slate-500">
                  Leave blank for unlimited. Students see the window and attempts left.
                </p>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={() => void saveMetadata()} disabled={busy || !dirty}>
                  {busy && <LoaderCircle className="animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Totals</h2>
          <p className="text-2xl font-semibold text-slate-900">
            {formatPoints(quiz.total_points)} <span className="text-sm font-normal text-slate-500">points</span>
          </p>
          <p className="text-sm text-slate-600">
            {quiz.question_count} question{quiz.question_count === 1 ? "" : "s"}
          </p>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(quiz.question_type_counts).map(([type, count]) => {
              const pct = quiz.question_count ? Math.round((count / quiz.question_count) * 100) : 0;
              return (
                <li key={type} className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <div>
                    <p className="text-slate-700">{type.replaceAll("_", " ")}</p>
                    <div className="mt-1 h-1.5 rounded bg-slate-100">
                      <div className="h-1.5 rounded bg-slate-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-slate-600">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Questions ({quiz.question_count})</h2>
          {isDraft && (
            <Button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              disabled={busy}
            >
              <Plus /> Add question
            </Button>
          )}
        </div>

        {!isDraft && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Reopen the quiz to edit its questions.
          </p>
        )}

        {quiz.questions.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            This quiz has no questions yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {quiz.questions.map((question, index) => {
              const answers = answersOf(question);
              return (
                <li
                  key={question.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>Question {index + 1}</span>
                        <span>·</span>
                        <span>{question.question_type.replaceAll("_", " ")}</span>
                        <span>·</span>
                        <span>
                          {formatPoints(question.points)} point
                          {question.points === 1 ? "" : "s"}
                        </span>
                        <span>·</span>
                        <span>{question.difficulty}</span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-slate-900">
                        {question.question}
                      </p>
                    </div>
                    {isDraft && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit question ${index + 1}`}
                          disabled={busy}
                          onClick={() => {
                            setEditing(question);
                            setEditorOpen(true);
                          }}
                        >
                          <PencilLine />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Regenerate question ${index + 1}`}
                          disabled={busy}
                          onClick={() => {
                            setRegenerateError(null);
                            setRegenerating(question);
                          }}
                        >
                          <RefreshCw />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete question ${index + 1}`}
                          disabled={busy}
                          onClick={() => setPendingDelete(question)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    )}
                  </div>

                  {question.options.length > 0 && (
                    <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <li key={option.id} className="flex items-start gap-2">
                          <span
                            className={
                              option.is_correct
                                ? "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-green-700 text-[11px] font-bold text-green-900"
                                : "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center text-[11px] font-semibold text-slate-400"
                            }
                          >
                            {option.option_label}
                          </span>
                          <span
                            className={
                              option.is_correct ? "font-semibold text-green-950" : "text-slate-700"
                            }
                          >
                            {option.option_text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {answers.length > 0 && (
                    <p className="mt-2 text-sm text-slate-600">
                      {question.question_type === "FILL_IN_BLANK"
                        ? "Accepted answers: "
                        : "Correct answer: "}
                      <span className="font-semibold text-green-900">{answers.join(", ")}</span>
                    </p>
                  )}

                  {question.source_reference && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold">Source: </span>
                      {question.source_reference}
                    </p>
                  )}

                  {question.explanation && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold">Explanation: </span>
                      {question.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {dirty && (
          <p className="text-sm text-slate-500">
            Unsaved settings — total after saving: {formatPoints(totalAfter)} points.
          </p>
        )}
      </section>

      <QuizQuestionEditor
        open={editorOpen}
        question={editing}
        saving={savingQuestion}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={saveQuestion}
      />

      <RegenerateDialog
        question={regenerating}
        busy={busy}
        error={regenerateError}
        onClose={() => {
          setRegenerating(null);
          setRegenerateError(null);
        }}
        onSubmit={regenerate}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => (!next && !busy ? setPendingDelete(null) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this question?</DialogTitle>
            <DialogDescription>
              The question and its options are removed permanently. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void removeQuestion()} disabled={busy}>
              Delete question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={approveOpen}
        onOpenChange={(next) => (!next && !busy ? setApproveOpen(false) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve “{quiz.title}”?</DialogTitle>
            <DialogDescription>
              {quiz.question_count} question{quiz.question_count === 1 ? "" : "s"} ·{" "}
              {formatPoints(quiz.total_points)} points. Once approved the questions are locked and
              the quiz becomes visible to students. You can reopen it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void approve()} disabled={busy}>
              Approve quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reopenOpen}
        onOpenChange={(next) => (!next && !busy ? setReopenOpen(false) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen for editing?</DialogTitle>
            <DialogDescription>
              The quiz returns to draft and its approval record is cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void reopen()} disabled={busy}>
              Reopen quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegenerateDialog({
  question,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  question: QuizQuestion | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (instructions: string) => Promise<void>;
}) {
  const [instructions, setInstructions] = React.useState("");
  const [prevId, setPrevId] = React.useState<string | null>(null);

  if ((question?.id ?? null) !== prevId) {
    setPrevId(question?.id ?? null);
    setInstructions("");
  }

  return (
    <Dialog open={question !== null} onOpenChange={(next) => (!next && !busy ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate question</DialogTitle>
          <DialogDescription>
            The current question stays until the new one is ready.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="regen-instructions">What should change? (optional)</Label>
          <textarea
            id="regen-instructions"
            rows={3}
            maxLength={500}
            className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            disabled={busy}
          />
          <p className="text-right text-xs text-slate-500">{instructions.length} / 500</p>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit(instructions)} disabled={busy}>
            {busy && <LoaderCircle className="animate-spin" />}
            {busy ? "Generating…" : "Regenerate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
