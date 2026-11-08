"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Clock, LoaderCircle, RotateCcw, Trophy } from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Button } from "@/components/ui/button";
import {
  availabilityLabel,
  formatWindow,
} from "@/features/quizzes/quiz-take-utils";
import { studentQuizApi, type StudentQuizListItem } from "@/lib/student-quiz-api";

const BADGE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200",
  UPCOMING: "bg-amber-50 text-amber-800 border-amber-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  EXHAUSTED: "bg-rose-50 text-rose-800 border-rose-200",
};

function attemptsLabel(quiz: StudentQuizListItem): string {
  if (quiz.max_attempts === null) return "Unlimited attempts";
  const left = quiz.attempts_left ?? 0;
  return `${left} of ${quiz.max_attempts} attempt${quiz.max_attempts === 1 ? "" : "s"} left`;
}

export function StudentQuizList({ classId }: { classId: string }) {
  const [quizzes, setQuizzes] = React.useState<StudentQuizListItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const data = await studentQuizApi.list(classId);
      setQuizzes(data.quizzes);
    } catch (err) {
      setQuizzes([]);
      setError(err instanceof Error ? err.message : "Could not load quizzes.");
    }
  }, [classId]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; state is set after await.
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <ClassPageHeader
        title="Quizzes"
        subtitle="Timed assessments for this class. Your answers autosave while you work."
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DFB2A6] bg-[#F7F7F7] px-4 py-3 text-[13px] text-[#9D4C38]"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {quizzes === null ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#DADADA] bg-white px-4 py-8 text-[13px] text-[#5A5A5A]">
          <LoaderCircle className="size-4 animate-spin" /> Loading quizzes…
        </div>
      ) : quizzes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#CFCFCF] bg-white px-4 py-8 text-center text-[13px] text-[#5A5A5A]">
          No quizzes have been published for this class yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {quizzes.map((quiz) => {
            const completed = quiz.attempt_status === "SUBMITTED" || quiz.attempt_status === "EXPIRED";
            const resume = quiz.attempt_status === "IN_PROGRESS";
            const canStartNew = quiz.can_start && !resume;
            const showResult = completed && Boolean(quiz.attempt_id);
            const playHref = `/student/class/${classId}/quizzes/${quiz.quiz_id}`;
            const resultHref = showResult ? `${playHref}/result/${quiz.attempt_id}` : playHref;
            const actionLabel = resume
              ? "Resume attempt"
              : canStartNew
                ? completed
                  ? "Try again"
                  : "Start quiz"
                : showResult
                  ? "View result"
                  : quiz.availability === "UPCOMING"
                    ? "Not open yet"
                    : quiz.availability === "CLOSED"
                      ? "Closed"
                      : quiz.availability === "EXHAUSTED"
                        ? "No attempts left"
                        : "Start quiz";
            const actionHref = canStartNew || resume ? playHref : resultHref;
            const actionEnabled = resume || canStartNew || showResult;
            return (
              <li
                key={quiz.quiz_id}
                className="rounded-xl border border-[#DADADA] bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-bold text-[#111111]">{quiz.title}</h2>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
                          BADGE[quiz.availability] ?? BADGE.CLOSED
                        }`}
                      >
                        {availabilityLabel(quiz.availability)}
                      </span>
                      {completed && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700">
                          {quiz.is_passed === null
                            ? "Submitted"
                            : quiz.is_passed
                              ? "Passed"
                              : "Not passed"}
                        </span>
                      )}
                    </div>
                    {quiz.description && (
                      <p className="text-[13px] text-[#5A5A5A]">{quiz.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[#5A5A5A]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" />
                        {formatWindow(quiz.opens_at, quiz.closes_at)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {quiz.time_limit_minutes
                          ? `${quiz.time_limit_minutes} minutes`
                          : "No time limit"}
                      </span>
                      <span>{attemptsLabel(quiz)}</span>
                      {completed && quiz.total_score !== null && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#111111]">
                          <Trophy className="size-3.5" />
                          {quiz.total_score} points
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 space-y-2 text-right">
                    {actionEnabled ? (
                      <Button asChild size="sm" variant={resume ? "default" : "outline"}>
                        <Link href={actionHref}>
                          {resume && <RotateCcw />}
                          {actionLabel}
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        {actionLabel}
                      </Button>
                    )}
                    {completed && canStartNew && showResult && (
                      <div>
                        <Link
                          href={resultHref}
                          className="text-[11.5px] font-semibold text-[#5A5A5A] underline"
                        >
                          Last result
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
