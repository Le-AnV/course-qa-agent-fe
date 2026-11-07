"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardList, Clock, FileQuestion } from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Reveal, SkeletonLine } from "@/components/shared/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  studentQuizResultApi,
  type QuizStudentSummary,
} from "@/lib/quiz-api";
import { cn } from "@/lib/utils";
import { PassBadge } from "./quiz-result-badges";
import {
  formatDateTime,
  formatPercentage,
  formatScore,
} from "./quiz-result-format";

/**
 * Class quiz list for students (AI-154). Shows only published quizzes and the
 * caller's own attempt summary, so it doubles as the entry point into attempt
 * history and answer review without exposing class-wide results.
 */
export function StudentQuizList({ classId }: { classId: string }) {
  const [quizzes, setQuizzes] = React.useState<QuizStudentSummary[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    studentQuizResultApi
      .listClassQuizzes(classId)
      .then((rows) => {
        if (cancelled) return;
        setQuizzes(rows);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof Error ? cause.message : "Could not load the quizzes.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, reloadToken]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <ClassPageHeader
        title="Quizzes"
        subtitle="Published quizzes for this class and how you did on each one."
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#DFB2A6] bg-[#F7F7F7] px-4 py-3 text-[13px] text-[#9D4C38]"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#DADADA] bg-white">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="flex items-center gap-4 border-b border-[#DADADA] px-4 py-4 last:border-b-0"
            >
              <div className="flex-1 space-y-2">
                <SkeletonLine className="h-3.5 w-48 max-w-full" />
                <SkeletonLine className="h-3 w-64 max-w-full" />
              </div>
              <SkeletonLine className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      ) : error && !quizzes ? null : quizzes && quizzes.length === 0 ? (
        <div className="rounded-lg border border-[#DADADA] bg-white p-4">
          <EmptyState
            icon={ClipboardList}
            title="No quizzes yet"
            description="Your trainer has not published a quiz for this class yet. It will appear here when it is ready."
          />
        </div>
      ) : quizzes ? (
        <Reveal>
          <div className="overflow-hidden rounded-lg border border-[#DADADA] bg-white">
            <div className="hidden border-b border-[#DADADA] px-4 py-3 text-[12px] font-medium text-[#6F6F6F] sm:flex">
              <span className="flex-1">Quiz</span>
              <span className="w-56 text-right">Your result</span>
              <span className="w-36" />
            </div>
            <ul className="divide-y divide-[#DADADA]">
              {quizzes.map((quiz) => (
                <QuizRow key={quiz.id} quiz={quiz} />
              ))}
            </ul>
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}

function QuizRow({ quiz }: { quiz: QuizStudentSummary }) {
  const hasAttempts = quiz.attempt_count > 0;
  const inProgressOnly = quiz.has_in_progress && !quiz.official_attempt_id;

  return (
    <li className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-[#FAFAFA] sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[13.5px] font-semibold text-[#111111]">
            {quiz.title}
          </h2>
          {quiz.official_attempt_id ? (
            <PassBadge isPassed={quiz.official_is_passed} />
          ) : inProgressOnly ? (
            <Badge
              variant="outline"
              className="h-auto gap-1 border-[#E8D5A4] bg-[#FFF8E7] px-2 py-0.5 text-[11px] font-semibold text-[#8A6414]"
            >
              <Clock className="size-3" aria-hidden />
              In progress
            </Badge>
          ) : null}
        </div>
        {quiz.description && (
          <p className="mt-1 line-clamp-2 text-[12.5px] text-[#5A5A5A]">
            {quiz.description}
          </p>
        )}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-[#6F6F6F]">
          <span className="inline-flex items-center gap-1">
            <FileQuestion className="size-3.5" aria-hidden />
            {quiz.question_count} question{quiz.question_count === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span>{formatScore(quiz.total_points)} points</span>
          {quiz.passing_score !== null && (
            <>
              <span aria-hidden>·</span>
              <span>Passing {formatScore(quiz.passing_score)}</span>
            </>
          )}
          {quiz.time_limit_minutes !== null && (
            <>
              <span aria-hidden>·</span>
              <span>{quiz.time_limit_minutes} min</span>
            </>
          )}
        </p>
      </div>

      <div className="shrink-0 sm:w-56 sm:text-right">
        {quiz.official_attempt_id ? (
          <>
            <p className="text-lg font-semibold leading-tight text-[#111111]">
              {formatPercentage(quiz.official_percentage)}
            </p>
            <p className="text-[11.5px] text-[#6F6F6F]">
              {formatScore(quiz.official_score)} /{" "}
              {formatScore(quiz.official_max_score)} points
            </p>
            <p className="mt-0.5 text-[11px] text-[#8A8A8A]">
              Submitted {formatDateTime(quiz.official_submitted_at)}
            </p>
          </>
        ) : inProgressOnly ? (
          <p className="text-[12.5px] text-[#6F6F6F]">
            Attempt in progress — result available after submission.
          </p>
        ) : quiz.submitted_count > 0 ? (
          <p className="text-[12.5px] text-[#6F6F6F]">No graded attempt yet.</p>
        ) : (
          <p className="text-[12.5px] text-[#6F6F6F]">Not started.</p>
        )}
      </div>

      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-2",
          "sm:w-36 sm:justify-end",
        )}
      >
        {quiz.official_attempt_id && (
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/student/quizzes/${quiz.id}/attempts/${quiz.official_attempt_id}`}
            >
              View result
            </Link>
          </Button>
        )}
        {hasAttempts && (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/student/quizzes/${quiz.id}`}>Attempt history</Link>
          </Button>
        )}
      </div>
    </li>
  );
}
