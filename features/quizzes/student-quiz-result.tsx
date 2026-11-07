"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { WorkspacePageHeader } from "@/components/shared/WorkspacePageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  studentQuizResultApi,
  type QuizAnswerResult,
  type QuizAttemptResult,
  type QuizQuestionResult,
} from "@/lib/quiz-api";
import { cn } from "@/lib/utils";
import { OfficialBadge, PassBadge } from "./quiz-result-badges";
import {
  formatDateTime,
  formatPercentage,
  formatScore,
  questionTypeLabel,
} from "./quiz-result-format";

/**
 * Student answer review for one submitted attempt (AI-154 AC-03). Correct
 * answers are always shown after submission; explanations only when the quiz
 * opted in (`show_explanations`).
 */
export function StudentQuizResult({
  quizId,
  attemptId,
}: {
  quizId: string;
  attemptId: string;
}) {
  const [result, setResult] = React.useState<QuizAttemptResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    studentQuizResultApi
      .getAttemptResult(quizId, attemptId)
      .then((payload) => {
        if (cancelled) return;
        setResult(payload);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load this result.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, attemptId, reloadToken]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="space-y-5">
        <div>
          <Link
            href={`/student/quizzes/${quizId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" /> All attempts
          </Link>
        </div>
        <Card>
          <CardContent>
            <EmptyState
              icon={XCircle}
              title="Result unavailable"
              description={error ?? "This attempt does not exist."}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={retry}>
                    Retry
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/student/quizzes/${quizId}`}>Back to attempts</Link>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullyCorrect = result.questions.filter(
    (question) => question.answer?.is_correct === true,
  ).length;
  const tone =
    result.is_passed === true
      ? "bg-[#ECFDF3] text-[#137A4B]"
      : result.is_passed === false
        ? "bg-[#FDF0EC] text-[#9D4C38]"
        : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/student/quizzes/${quizId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> All attempts
        </Link>
      </div>

      <WorkspacePageHeader
        title={result.quiz_title}
        subtitle={`Submitted ${formatDateTime(result.submitted_at)}`}
        badge={result.official ? <OfficialBadge /> : undefined}
        actions={
          <Button asChild variant="outline">
            <Link href={`/student/quizzes/${quizId}`}>All attempts</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-[11rem_1fr] sm:items-stretch">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl px-4 py-5 text-center",
              tone,
            )}
          >
            <p className="text-4xl font-semibold tracking-tight">
              {formatScore(result.total_score)}
              <span className="text-lg font-normal opacity-70">
                {" "}
                / {formatScore(result.max_score)}
              </span>
            </p>
            <p className="mt-1 text-sm font-medium opacity-80">
              {formatPercentage(result.percentage)}
            </p>
            <PassBadge isPassed={result.is_passed} className="mt-2" />
          </div>

          <div className="grid content-center gap-3 sm:grid-cols-2">
            <SummaryField
              label="Passing score"
              value={`${formatScore(result.passing_score)} / ${formatScore(result.max_score)}`}
            />
            <SummaryField
              label="Questions fully correct"
              value={`${fullyCorrect} of ${result.questions.length}`}
            />
            <SummaryField label="Started" value={formatDateTime(result.started_at)} />
            <SummaryField label="Graded" value={formatDateTime(result.graded_at)} />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">Answer review</h2>
            <p className="text-sm text-muted-foreground">
              Correct answers are shown after submission.
              {result.show_explanations ? " Explanations are enabled for this quiz." : ""}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {fullyCorrect} of {result.questions.length} fully correct
          </p>
        </div>

        <ol className="space-y-3">
          {result.questions.map((question) => (
            <QuestionReview key={question.id} question={question} />
          ))}
        </ol>
      </section>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function QuestionReview({ question }: { question: QuizQuestionResult }) {
  const answer = question.answer;
  const selectedLabels = answer?.selected_option_labels ?? [];
  const selected = new Set(selectedLabels);
  const correct = new Set(question.correct_option_labels);
  const textAnswer = (answer?.text_answer ?? "").trim();
  const hasAnswer = selectedLabels.length > 0 || textAnswer.length > 0;

  return (
    <li>
      <Card size="sm">
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Question {question.order_index + 1}</span>
                <span>·</span>
                <span>{questionTypeLabel(question.question_type)}</span>
                <span>·</span>
                <span>
                  {formatScore(question.points)} point
                  {question.points === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-foreground">
                {question.question}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <QuestionOutcome answer={answer} hasAnswer={hasAnswer} />
              <span className="text-sm font-semibold text-foreground">
                {formatScore(answer?.score_awarded ?? 0)} / {formatScore(question.points)}
              </span>
            </div>
          </div>

          {question.options.length > 0 && (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {question.options.map((option) => {
                const isSelected = selected.has(option.option_label);
                const isCorrect = option.is_correct;
                return (
                  <li
                    key={option.id}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-2.5 py-2 text-sm",
                      isCorrect
                        ? "border-[#BFE3CC] bg-[#ECFDF3]"
                        : isSelected
                          ? "border-[#E7C4BA] bg-[#FDF0EC]"
                          : "border-transparent bg-[#FAFAFA]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                        isCorrect
                          ? "border-green-700 text-green-900"
                          : isSelected
                            ? "border-[#9D4C38] text-[#9D4C38]"
                            : "border-transparent text-slate-400",
                      )}
                    >
                      {option.option_label}
                    </span>
                    <span className="min-w-0 flex-1 text-foreground">
                      {option.option_text}
                    </span>
                    {isCorrect && isSelected ? (
                      <span className="shrink-0 text-[10px] font-semibold text-[#137A4B]">
                        Your answer
                      </span>
                    ) : isCorrect ? (
                      <span className="shrink-0 text-[10px] font-semibold text-[#137A4B]">
                        Correct
                      </span>
                    ) : isSelected ? (
                      <span className="shrink-0 text-[10px] font-semibold text-[#9D4C38]">
                        Your answer
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {question.question_type === "FILL_IN_BLANK" ? (
            <div className="space-y-1 text-sm text-foreground">
              <p>
                <span className="font-medium">Your answer: </span>
                {textAnswer || "Not answered"}
              </p>
              {question.accepted_text_answers.length > 0 && (
                <p>
                  <span className="font-medium">Accepted answers: </span>
                  <span className="font-semibold text-[#137A4B]">
                    {question.accepted_text_answers.join(", ")}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground">
              <span className="font-medium">Your answer: </span>
              {selectedLabels.length > 0 ? selectedLabels.join(", ") : "Not answered"}
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="font-medium">Correct answer: </span>
              <span className="font-semibold text-[#137A4B]">
                {correct.size > 0 ? [...correct].join(", ") : "—"}
              </span>
            </p>
          )}

          {question.explanation && (
            <div className="flex gap-2 rounded-md bg-[#F4F7FA] px-3 py-2 text-sm text-slate-700">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#294D72]" aria-hidden="true" />
              <p>
                <span className="font-semibold">Explanation: </span>
                {question.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}

function QuestionOutcome({
  answer,
  hasAnswer,
}: {
  answer: QuizAnswerResult | null;
  hasAnswer: boolean;
}) {
  if (!answer || answer.is_correct === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#DADADA] bg-[#F7F7F7] px-2 py-0.5 text-[11px] font-semibold text-[#6F6F6F]">
        <MinusCircle className="size-3" aria-hidden="true" /> Not graded
      </span>
    );
  }
  if (answer.is_correct) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#BFE3CC] bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-semibold text-[#137A4B]">
        <CheckCircle2 className="size-3" aria-hidden="true" /> Correct
      </span>
    );
  }
  if (!hasAnswer) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#DADADA] bg-[#F7F7F7] px-2 py-0.5 text-[11px] font-semibold text-[#6F6F6F]">
        <MinusCircle className="size-3" aria-hidden="true" /> Not answered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E7C4BA] bg-[#FDF0EC] px-2 py-0.5 text-[11px] font-semibold text-[#9D4C38]">
      <XCircle className="size-3" aria-hidden="true" /> Incorrect
    </span>
  );
}
