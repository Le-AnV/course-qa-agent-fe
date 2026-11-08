"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, ChevronDown, Download, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { quizApi, type QuizDetail, type QuizSummary } from "@/lib/quiz-api";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");
}

function answerLines(question: QuizDetail["questions"][number]): string[] {
  if (question.question_type === "FILL_IN_BLANK") {
    return question.grading_config?.correct_answers ?? [];
  }
  return question.options
    .filter((option) => option.is_correct)
    .map((option) => `${option.option_label}. ${option.option_text}`);
}

export function QuizList({
  classId,
  refreshToken = 0,
  lastImported = null,
}: {
  classId: string;
  refreshToken?: number;
  lastImported?: QuizDetail | null;
}) {
  const [quizzes, setQuizzes] = React.useState<QuizSummary[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<Record<string, QuizDetail>>({});
  const [pendingDelete, setPendingDelete] = React.useState<QuizSummary | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setQuizzes(await quizApi.listQuizzes(classId));
      setError(null);
    } catch (err) {
      setQuizzes([]);
      setError(err instanceof Error ? err.message : "Could not load quizzes.");
    }
  }, [classId]);

  React.useEffect(() => {
    let cancelled = false;
    quizApi
      .listQuizzes(classId)
      .then((list) => {
        if (cancelled) return;
        setQuizzes(list);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setQuizzes([]);
        setError(err instanceof Error ? err.message : "Could not load quizzes.");
      });
    return () => {
      cancelled = true;
    };
  }, [classId, refreshToken]);

  // Expand the quiz that was just imported (render-phase adjustment, no effect).
  const [seedId, setSeedId] = React.useState<string | null>(null);
  if (lastImported && seedId !== lastImported.id) {
    setSeedId(lastImported.id);
    setExpandedId(lastImported.id);
    setDetails((prev) => ({ ...prev, [lastImported.id]: lastImported }));
  }

  async function toggle(quiz: QuizSummary) {
    if (expandedId === quiz.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(quiz.id);
    if (details[quiz.id]) return;

    setLoadingId(quiz.id);
    try {
      const detail = await quizApi.getQuiz(classId, quiz.id);
      setDetails((prev) => ({ ...prev, [quiz.id]: detail }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load this quiz.");
      setExpandedId(null);
    } finally {
      setLoadingId(null);
    }
  }

  async function exportQuiz(quiz: QuizSummary) {
    setBusy(true);
    try {
      await quizApi.exportQuiz(classId, quiz.id, quiz.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download the quiz.");
    } finally {
      setBusy(false);
    }
  }

  async function removeQuiz() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await quizApi.deleteQuiz(classId, pendingDelete.id);
      toast.success("Quiz deleted.");
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete this quiz.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <header>
        <h2 className="font-semibold text-slate-900">Quizzes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Expand a quiz to review its questions, or open it to edit, approve and export.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {quizzes === null ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="size-4 animate-spin" />
          Loading quizzes…
        </div>
      ) : quizzes.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          No quizzes for this class yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {quizzes.map((quiz) => {
            const open = expandedId === quiz.id;
            const detail = details[quiz.id];
            const isDraft = quiz.status === "DRAFT";
            return (
              <li key={quiz.id}>
                <button
                  type="button"
                  onClick={() => void toggle(quiz)}
                  aria-expanded={open}
                  aria-controls={`quiz-detail-${quiz.id}`}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {quiz.title}
                      </h3>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {quiz.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-600">
                      {quiz.description || "No description"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {quiz.question_count} question{quiz.question_count === 1 ? "" : "s"}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-slate-500 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                  <Button asChild size="sm" variant={isDraft ? "default" : "outline"}>
                    <Link href={`/teacher/class/${classId}/quizzes/${quiz.id}`}>
                      {isDraft ? "Review" : "Open"}
                    </Link>
                  </Button>
                  {!isDraft && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/teacher/class/${classId}/quizzes/${quiz.id}/results`}>
                        <BarChart3 /> Results
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void exportQuiz(quiz)}
                    disabled={busy || isDraft}
                    title={isDraft ? "Approve this quiz before exporting it" : undefined}
                  >
                    <Download /> Export
                  </Button>
                  {isDraft && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDelete(quiz)}
                      disabled={busy}
                    >
                      <Trash2 /> Delete
                    </Button>
                  )}
                </div>

                {open && (
                  <div
                    id={`quiz-detail-${quiz.id}`}
                    className="border-t border-slate-100 bg-slate-50/60 px-4 py-3"
                  >
                    {loadingId === quiz.id ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <LoaderCircle className="size-4 animate-spin" />
                        Loading questions…
                      </div>
                    ) : detail ? (
                      detail.questions.length === 0 ? (
                        <p className="text-sm text-slate-500">This quiz has no questions.</p>
                      ) : (
                        <>
                          <ol className="space-y-3">
                            {detail.questions.map((question, index) => {
                              const answers = answerLines(question);
                              return (
                                <li
                                  key={question.id}
                                  className="rounded-md border border-slate-200 bg-white p-3"
                                >
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
                                              option.is_correct
                                                ? "font-semibold text-green-950"
                                                : "text-slate-700"
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
                                      <span className="font-semibold text-green-900">
                                        {answers.join(", ")}
                                      </span>
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
                          <div className="mt-3">
                            <Button asChild size="sm" variant="link">
                              <Link href={`/teacher/class/${classId}/quizzes/${quiz.id}`}>
                                Open full review →
                              </Link>
                            </Button>
                          </div>
                        </>
                      )
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => (!next && !busy ? setPendingDelete(null) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pendingDelete?.title}”?</DialogTitle>
            <DialogDescription>
              The quiz and all its questions are removed permanently. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void removeQuiz()} disabled={busy}>
              Delete quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

