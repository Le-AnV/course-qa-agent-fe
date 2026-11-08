"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  EyeOff,
  Flag,
  LoaderCircle,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
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
import {
  answeredCount,
  formatDuration,
  remainingSeconds,
  serverClockOffset,
} from "@/features/quizzes/quiz-take-utils";
import {
  studentQuizApi,
  type AnswerInput,
  type ExamQuestion,
  type QuizAttemptResult,
  type QuizAttemptSession,
} from "@/lib/student-quiz-api";
import { SkillRadarChart } from "@/features/quizzes/skill-radar-chart";

type LocalAnswer = {
  selected_option_labels: string[];
  text_answer: string;
  is_marked_for_review: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function draftMap(session: QuizAttemptSession): Record<string, LocalAnswer> {
  const map: Record<string, LocalAnswer> = {};
  for (const answer of session.answers) {
    map[answer.question_id] = {
      selected_option_labels: answer.selected_option_labels ?? [],
      text_answer: answer.text_answer ?? "",
      is_marked_for_review: answer.is_marked_for_review,
    };
  }
  return map;
}

function toInput(answers: Record<string, LocalAnswer>): AnswerInput[] {
  return Object.entries(answers).map(([question_id, answer]) => ({
    question_id,
    selected_option_labels:
      answer.selected_option_labels.length > 0 ? answer.selected_option_labels : null,
    text_answer: answer.text_answer.trim() || null,
    is_marked_for_review: answer.is_marked_for_review,
  }));
}

function emptyAnswer(): LocalAnswer {
  return { selected_option_labels: [], text_answer: "", is_marked_for_review: false };
}

export function StudentQuizPlayer({
  classId,
  quizId,
  initialAttemptId,
}: {
  classId: string;
  quizId: string;
  initialAttemptId?: string;
}) {
  const router = useRouter();
  const [session, setSession] = React.useState<QuizAttemptSession | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, LocalAnswer>>({});
  const [index, setIndex] = React.useState(0);
  const [fatalError, setFatalError] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [clockMs, setClockMs] = React.useState(() => Date.now());
  const [offsetMs, setOffsetMs] = React.useState(0);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const hydratedRef = React.useRef(false);
  const dirtyRef = React.useRef(false);
  const submittingRef = React.useRef(false);
  const autoSubmittedRef = React.useRef(false);
  const sessionRef = React.useRef<QuizAttemptSession | null>(null);
  const answersRef = React.useRef<Record<string, LocalAnswer>>({});

  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  React.useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const applySession = React.useCallback((next: QuizAttemptSession, seed: boolean) => {
    setSession(next);
    setOffsetMs(serverClockOffset(next.server_time, Date.now()));
    setClockMs(Date.now());
    if (seed && next.status === "IN_PROGRESS") {
      setAnswers(draftMap(next));
      hydratedRef.current = true;
      dirtyRef.current = false;
      setSaveState("idle");
    }
    if (next.status !== "IN_PROGRESS") {
      dirtyRef.current = false;
      hydratedRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const loading = initialAttemptId
      ? studentQuizApi.get(initialAttemptId)
      : studentQuizApi.start(quizId);
    loading
      .then((next) => {
        if (!cancelled) applySession(next, true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFatalError(err instanceof Error ? err.message : "Could not open this quiz.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, initialAttemptId, applySession]);

  React.useEffect(() => {
    const timer = window.setInterval(() => setClockMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = session
    ? remainingSeconds(session.deadline_at, offsetMs, clockMs)
    : null;

  const persist = React.useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.status !== "IN_PROGRESS") return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const next = await studentQuizApi.saveAnswers(
        current.attempt_id,
        toInput(answersRef.current),
      );
      dirtyRef.current = false;
      setLastSavedAt(new Date());
      setSaveState("saved");
      if (next.status !== "IN_PROGRESS") {
        applySession(next, false);
      }
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Could not save your answers.");
      // A 409 means the server already auto-submitted this attempt.
      try {
        const latest = await studentQuizApi.get(current.attempt_id);
        if (latest.status !== "IN_PROGRESS") applySession(latest, false);
      } catch {
        // Keep the local draft and let the retry button try again.
      }
    }
  }, [applySession]);

  // Debounced autosave: one request after the student stops typing/selecting.
  React.useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current) return;
    if (!session || session.status !== "IN_PROGRESS") return;
    const timer = window.setTimeout(() => {
      void persist();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [answers, session, persist]);

  const submit = React.useCallback(
    async (auto: boolean) => {
      const current = sessionRef.current;
      if (!current || current.status !== "IN_PROGRESS" || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      if (!auto) setConfirmOpen(false);
      try {
        const next = await studentQuizApi.submit(
          current.attempt_id,
          toInput(answersRef.current),
        );
        applySession(next, false);
        if (auto) {
          toast.info("Time is up — your attempt was submitted automatically.");
        } else {
          toast.success("Quiz submitted.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not submit this quiz.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [applySession],
  );

  // A finalized attempt is rendered by AI-154's result page. Redirect both
  // after submit and when the player is opened with an already-submitted id.
  React.useEffect(() => {
    if (!session || session.status === "IN_PROGRESS") return;
    router.replace(`/student/quizzes/${session.quiz_id}/attempts/${session.attempt_id}`);
  }, [session, router]);

  // AC-04: the server deadline wins; the client never extends it.
  React.useEffect(() => {
    if (!session || session.status !== "IN_PROGRESS") return;
    if (remaining === null || remaining > 0) return;
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void submit(true);
  }, [remaining, session, submit]);

  // Reconnect: flush an autosave that failed while offline.
  React.useEffect(() => {
    const onOnline = () => {
      if (dirtyRef.current) void persist();
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden" && dirtyRef.current) void persist();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [persist]);

  React.useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current && sessionRef.current?.status === "IN_PROGRESS") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  if (fatalError) {
    return (
      <div className="space-y-4">
        <Link
          href={`/student/class/${classId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#5A5A5A] hover:text-[#111111]"
        >
          <ArrowLeft className="size-4" /> Quizzes
        </Link>
        <div className="rounded-xl border border-[#DFB2A6] bg-white p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{fatalError}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#DADADA] bg-white px-4 py-8 text-[13px] text-[#5A5A5A]">
        <LoaderCircle className="size-4 animate-spin" /> Loading your attempt…
      </div>
    );
  }

  if (session.result) {
    return (
      <QuizResult
        classId={classId}
        result={session.result}
        title={session.quiz_title}
      />
    );
  }

  const questions = session.questions;
  const current = questions[Math.min(index, Math.max(0, questions.length - 1))];
  const answered = answeredCount(answers);
  const marked = Object.values(answers).filter((answer) => answer.is_marked_for_review).length;
  const unanswered = Math.max(0, questions.length - answered);
  const answer = current ? answers[current.id] ?? emptyAnswer() : emptyAnswer();

  function updateAnswer(questionId: string, patch: Partial<LocalAnswer>) {
    dirtyRef.current = true;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? emptyAnswer()), ...patch },
    }));
  }

  function toggleOption(question: ExamQuestion, label: string) {
    const selected = answer.selected_option_labels;
    if (question.question_type === "SINGLE_CHOICE") {
      updateAnswer(question.id, { selected_option_labels: [label] });
      return;
    }
    updateAnswer(question.id, {
      selected_option_labels: selected.includes(label)
        ? selected.filter((item) => item !== label)
        : [...selected, label],
    });
  }

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "error"
        ? "Not saved — retry"
        : saveState === "saved" && lastSavedAt
          ? `Saved ${lastSavedAt.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "Autosave on";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/student/class/${classId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#5A5A5A] hover:text-[#111111]"
        >
          <ArrowLeft className="size-4" /> Quizzes
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
          <span
            className={
              (remaining ?? 0) <= 60 && remaining !== null
                ? "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-bold text-rose-800"
                : "inline-flex items-center gap-1.5 rounded-full border border-[#DADADA] bg-white px-3 py-1 font-semibold text-[#111111]"
            }
            aria-live="polite"
          >
            <Clock className="size-3.5" />
            {remaining === null ? "No time limit" : formatDuration(remaining)}
          </span>
          <button
            type="button"
            onClick={() => (saveState === "error" ? void persist() : undefined)}
            className={
              saveState === "error"
                ? "font-semibold text-[#9D4C38] underline"
                : "text-[#5A5A5A]"
            }
          >
            {saveLabel}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#DADADA] bg-white p-4 sm:p-5">
        <h1 className="text-[17px] font-bold text-[#111111]">{session.quiz_title}</h1>
        {session.quiz_description && (
          <p className="mt-1 text-[13px] text-[#5A5A5A]">{session.quiz_description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] text-[#5A5A5A]">
          <span>
            {answered}/{questions.length} answered
          </span>
          <span>·</span>
          <span>{marked} marked for review</span>
          {saveError && <span className="text-[#9D4C38]">· {saveError}</span>}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7EDF5]">
          <div
            className="h-full rounded-full bg-[var(--brand, #111111)] transition-[width]"
            style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <section className="rounded-xl border border-[#DADADA] bg-white p-4 sm:p-6">
          {current ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-[#5A5A5A]">
                <span className="font-semibold text-[#111111]">
                  Question {index + 1} of {questions.length}
                </span>
                <span>·</span>
                <span>{current.question_type.replaceAll("_", " ")}</span>
                <span>·</span>
                <span>
                  {current.points} point{current.points === 1 ? "" : "s"}
                </span>
                <span>·</span>
                <span>{current.difficulty}</span>
                {answer.is_marked_for_review && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                    <Flag className="size-3" /> Marked
                  </span>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-[14.5px] font-medium text-[#111111]">
                {current.question}
              </p>

              <div className="mt-4 space-y-2">
                {current.question_type !== "FILL_IN_BLANK" &&
                  current.options.map((option) => {
                    const selected = answer.selected_option_labels.includes(option.option_label);
                    return (
                      <label
                        key={option.id}
                        className={
                          selected
                            ? "flex cursor-pointer items-start gap-3 rounded-lg border-2 border-[#111111] bg-[#F7F7F7] px-3 py-2.5"
                            : "flex cursor-pointer items-start gap-3 rounded-lg border border-[#DADADA] px-3 py-2.5 hover:bg-[#FAFAFA]"
                        }
                      >
                        <input
                          type={current.question_type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                          name={`question-${current.id}`}
                          checked={selected}
                          onChange={() => toggleOption(current, option.option_label)}
                          className="mt-1"
                        />
                        <span className="text-[13.5px] text-[#111111]">
                          <span className="mr-1.5 font-bold">{option.option_label}.</span>
                          {option.option_text}
                        </span>
                      </label>
                    );
                  })}

                {current.question_type === "FILL_IN_BLANK" && (
                  <div>
                    <label
                      htmlFor={`answer-${current.id}`}
                      className="mb-1 block text-[12.5px] font-semibold text-[#5A5A5A]"
                    >
                      Your answer
                    </label>
                    <input
                      id={`answer-${current.id}`}
                      value={answer.text_answer}
                      onChange={(event) =>
                        updateAnswer(current.id, { text_answer: event.target.value })
                      }
                      className="w-full rounded-md border border-[#DADADA] px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]"
                      placeholder="Type your answer"
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateAnswer(current.id, {
                      is_marked_for_review: !answer.is_marked_for_review,
                    })
                  }
                >
                  <Flag /> {answer.is_marked_for_review ? "Unmark review" : "Mark for review"}
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => setIndex((value) => Math.max(0, value - 1))}
                  >
                    <ArrowLeft /> Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={index >= questions.length - 1}
                    onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
                  >
                    Next <ArrowRight />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#5A5A5A]">This quiz has no questions.</p>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-[#DADADA] bg-white p-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-wide text-[#5A5A5A]">
            Questions
          </h2>
          <div className="mt-3 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {questions.map((question, questionIndex) => {
              const questionAnswer = answers[question.id];
              const isAnswered = Boolean(
                questionAnswer &&
                  (questionAnswer.selected_option_labels.length > 0 ||
                    questionAnswer.text_answer.trim()),
              );
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setIndex(questionIndex)}
                  aria-label={`Question ${questionIndex + 1}${
                    questionAnswer?.is_marked_for_review ? " (marked for review)" : ""
                  }`}
                  className={[
                    "relative flex h-8 items-center justify-center rounded-md border text-[12px] font-semibold",
                    questionIndex === index
                      ? "border-[#111111] bg-[#111111] text-white"
                      : isAnswered
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-[#DADADA] bg-white text-[#5A5A5A]",
                  ].join(" ")}
                >
                  {questionIndex + 1}
                  {questionAnswer?.is_marked_for_review && (
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 text-[11.5px] text-[#5A5A5A]">
            <p className="flex items-center gap-2">
              <span className="size-3 rounded border border-emerald-200 bg-emerald-50" />
              Answered
            </p>
            <p className="flex items-center gap-2">
              <span className="size-3 rounded border border-[#DADADA] bg-white" />
              Not answered
            </p>
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500" />
              Marked for review
            </p>
          </div>

          <Button
            className="mt-4 w-full"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || session.status !== "IN_PROGRESS"}
          >
            {submitting ? <LoaderCircle className="animate-spin" /> : <Send />}
            {submitting ? "Submitting…" : "Submit quiz"}
          </Button>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open: boolean) => (!submitting ? setConfirmOpen(open) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit this quiz?</DialogTitle>
            <DialogDescription>
              You cannot change your answers after submitting.
            </DialogDescription>
          </DialogHeader>
          {unanswered > 0 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              {unanswered} question{unanswered === 1 ? "" : "s"} still have no answer. They will
              score zero.
            </p>
          ) : (
            <p className="text-[13px] text-[#5A5A5A]">All questions are answered.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Keep working
            </Button>
            <Button onClick={() => void submit(false)} disabled={submitting}>
              {submitting ? <LoaderCircle className="animate-spin" /> : <Check />}
              {submitting ? "Submitting…" : "Submit anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuizResult({
  classId,
  result,
  title,
}: {
  classId: string;
  result: QuizAttemptResult;
  title: string;
}) {
  const answers = new Map(result.answers.map((answer) => [answer.question_id, answer]));
  const expired = result.status === "EXPIRED";

  return (
    <div className="space-y-4">
      <Link
        href={`/student/class/${classId}/quizzes`}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#5A5A5A] hover:text-[#111111]"
      >
        <ArrowLeft className="size-4" /> Quizzes
      </Link>

      <section className="rounded-xl border border-[#DADADA] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[17px] font-bold text-[#111111]">{title}</h1>
            <p className="mt-0.5 text-[13px] text-[#5A5A5A]">
              {expired ? "Time expired — your attempt was submitted automatically." : "Submitted."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-bold leading-none text-[#111111]">
              {result.total_score}
              <span className="text-[14px] font-medium text-[#5A5A5A]">/{result.max_score}</span>
            </p>
            <p className="mt-1 text-[12.5px] font-semibold text-[#5A5A5A]">
              {result.percentage}%
              {result.is_passed !== null && (
                <span
                  className={
                    result.is_passed
                      ? "ml-2 inline-flex items-center gap-1 text-emerald-700"
                      : "ml-2 inline-flex items-center gap-1 text-rose-700"
                  }
                >
                  {result.is_passed ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                  {result.is_passed ? "Passed" : "Not passed"}
                </span>
              )}
            </p>
          </div>
        </div>
        {result.passing_percentage !== null && (
          <p className="mt-2 text-[12px] text-[#5A5A5A]">
            Passing: {result.passing_percentage}%
            {result.passing_score !== null ? ` (${result.passing_score} points)` : ""}
          </p>
        )}
      </section>

      {result.skill_radar && result.skill_radar.length > 0 && (
        <SkillRadarChart radarItems={result.skill_radar} />
      )}

      {result.show_solutions_after_submission === false && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-center gap-2.5">
          <EyeOff className="size-4 text-slate-500 shrink-0" />
          <span>
            Detailed answer keys and explanations are withheld by the instructor for this assessment.
          </span>
        </div>
      )}

      <ol className="space-y-3">
        {result.questions.map((question, questionIndex) => {
          const answer = answers.get(question.id);
          const selected = new Set(answer?.selected_option_labels ?? []);
          const awarded = answer?.score_awarded ?? 0;
          const showKey = result.show_solutions_after_submission !== false;
          return (
            <li key={question.id} className="rounded-xl border border-[#DADADA] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-[#5A5A5A]">
                <span className="font-semibold text-[#111111]">
                  Question {questionIndex + 1}
                </span>
                <span>·</span>
                <span>
                  {awarded}/{question.points} points
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13.5px] font-medium text-[#111111]">
                {question.question}
              </p>

              {question.options.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {question.options.map((option) => {
                    const chosen = selected.has(option.option_label);
                    return (
                      <li
                        key={option.id}
                        className={[
                          "flex items-start gap-2 rounded-md border px-3 py-2 text-[13px]",
                          showKey && option.is_correct
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : chosen
                              ? showKey
                                ? "border-rose-200 bg-rose-50 text-rose-900"
                                : "border-indigo-200 bg-indigo-50/60 text-indigo-900 font-medium"
                              : "border-[#E5E5E5] text-[#5A5A5A]",
                        ].join(" ")}
                      >
                        <span className="font-bold">{option.option_label}.</span>
                        <span className="flex-1">{option.option_text}</span>
                        {chosen && <span className="text-[11px] font-semibold">Your answer</span>}
                        {showKey && option.is_correct && (
                          <span className="text-[11px] font-semibold">Correct</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {question.question_type === "FILL_IN_BLANK" && (
                <p className="mt-2 text-[13px] text-[#5A5A5A]">
                  Your answer:{" "}
                  <span className="font-semibold text-[#111111]">
                    {answer?.text_answer?.trim() || "(blank)"}
                  </span>
                </p>
              )}

              {question.explanation && (
                <p className="mt-2 rounded-md bg-[#F7F7F7] px-3 py-2 text-[12.5px] text-[#5A5A5A]">
                  <span className="font-semibold text-[#111111]">Explanation: </span>
                  {question.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={`/student/class/${classId}/quizzes`}>
            <RotateCcw /> Back to quizzes
          </Link>
        </Button>
      </div>
    </div>
  );
}
