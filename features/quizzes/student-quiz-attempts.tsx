"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Clock } from "lucide-react";
import { WorkspacePageHeader } from "@/components/shared/WorkspacePageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { studentQuizResultApi, type QuizAttemptHistory } from "@/lib/quiz-api";
import { cn } from "@/lib/utils";
import { AttemptStatusBadge, OfficialBadge, PassBadge } from "./quiz-result-badges";
import { formatDateTime, formatPercentage, formatScore } from "./quiz-result-format";

/**
 * Student attempt history for one quiz (AI-154 AC-03). The official attempt
 * (highest graded score) is highlighted; retakes stay visible.
 */
export function StudentQuizAttempts({ quizId }: { quizId: string }) {
  const [attempts, setAttempts] = React.useState<QuizAttemptHistory[] | null>(null);
  const [quizTitle, setQuizTitle] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    studentQuizResultApi
      .listAttempts(quizId)
      .then((rows) => {
        if (cancelled) return;
        setAttempts(rows);
        setError(null);

        // The history payload does not carry the quiz title; read one result
        // to label the page. This is optional — a failure keeps the fallback.
        const candidate = rows.find((row) => row.status !== "IN_PROGRESS");
        if (!candidate) return;
        studentQuizResultApi
          .getAttemptResult(quizId, candidate.id)
          .then((result) => {
            if (!cancelled) setQuizTitle(result.quiz_title);
          })
          .catch(() => {
            // Title is cosmetic; the attempt list already rendered.
          });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load your attempts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, reloadToken]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/student/classes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> My classes
        </Link>
      </div>

      <WorkspacePageHeader
        title={quizTitle ?? "Quiz attempts"}
        subtitle="Every attempt you made for this quiz, newest first. The official attempt is the one counted for your class."
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : error && !attempts ? null : attempts && attempts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="No attempts yet"
              description="Open this quiz from your class to start your first attempt. Your score and answer review will appear here."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/student/classes">Back to my classes</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : attempts ? (
        <ol className="space-y-3">
          {attempts.map((attempt, index) => {
            const number = attempts.length - index;
            const inProgress = attempt.status === "IN_PROGRESS";
            return (
              <li key={attempt.id}>
                <Card
                  size="sm"
                  className={cn(
                    attempt.official && "ring-2 ring-[#365F85]/25",
                  )}
                >
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-foreground">
                          Attempt {number}
                        </h2>
                        <AttemptStatusBadge status={attempt.status} />
                        {attempt.official && <OfficialBadge />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Started {formatDateTime(attempt.started_at)}
                        {attempt.submitted_at
                          ? ` · Submitted ${formatDateTime(attempt.submitted_at)}`
                          : ""}
                      </p>
                      {attempt.official && (
                        <p className="mt-1 text-xs font-medium text-[#294D72]">
                          This attempt counts for your class.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      {inProgress ? (
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="size-3.5" aria-hidden="true" />
                          Result available after submission.
                        </p>
                      ) : (
                        <>
                          <div className="text-right">
                            <p className="text-lg font-semibold leading-tight text-foreground">
                              {formatScore(attempt.total_score)}
                              <span className="text-xs font-normal text-muted-foreground">
                                {" "}
                                / {formatScore(attempt.max_score)}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatPercentage(attempt.percentage)} · Passing{" "}
                              {formatScore(attempt.passing_score)}
                            </p>
                          </div>
                          <PassBadge isPassed={attempt.is_passed} />
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/student/quizzes/${quizId}/attempts/${attempt.id}`}>
                              View result
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
