"use client";

import * as React from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
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
import type { QuizQuestion, QuizQuestionInput } from "@/lib/quiz-api";

const LABELS = ["A", "B", "C", "D", "E", "F"] as const;
const TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "FILL_IN_BLANK"] as const;
const LEVELS = ["REMEMBER", "UNDERSTAND", "APPLY"] as const;

type OptionDraft = { option_text: string; is_correct: boolean };

type DraftState = {
  question_type: (typeof TYPES)[number];
  question: string;
  points: string;
  difficulty: (typeof LEVELS)[number];
  explanation: string;
  rubric: string;
  source_reference: string;
  options: OptionDraft[];
  correct_answers: string;
};

function toDraft(question: QuizQuestion | null): DraftState {
  if (!question) {
    return {
      question_type: "SINGLE_CHOICE",
      question: "",
      points: "1",
      difficulty: "REMEMBER",
      explanation: "",
      rubric: "",
      source_reference: "",
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
      ],
      correct_answers: "",
    };
  }
  return {
    question_type: question.question_type,
    question: question.question,
    points: String(question.points),
    difficulty: question.difficulty,
    explanation: question.explanation ?? "",
    rubric: question.rubric ?? "",
    source_reference: question.source_reference ?? "",
    options:
      question.options.length > 0
        ? question.options.map((option) => ({
            option_text: option.option_text,
            is_correct: option.is_correct,
          }))
        : [
            { option_text: "", is_correct: true },
            { option_text: "", is_correct: false },
          ],
    correct_answers: (question.grading_config?.correct_answers ?? []).join("\n"),
  };
}

function buildInput(draft: DraftState): { payload?: QuizQuestionInput; error?: string } {
  const points = Number(draft.points);
  if (!draft.question.trim()) return { error: "Question text is required." };
  if (!Number.isFinite(points) || points <= 0) return { error: "Points must be greater than 0." };

  const isChoice = draft.question_type !== "FILL_IN_BLANK";
  const options = isChoice ? draft.options.filter((o) => o.option_text.trim() !== "") : [];
  const correctAnswers = draft.correct_answers
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (isChoice) {
    if (options.length < 2) return { error: "A choice question needs at least two options." };
    const correct = options.filter((o) => o.is_correct).length;
    if (draft.question_type === "SINGLE_CHOICE" && correct !== 1) {
      return { error: "A single-choice question needs exactly one correct option." };
    }
    if (draft.question_type === "MULTIPLE_CHOICE" && correct < 1) {
      return { error: "A multiple-choice question needs at least one correct option." };
    }
  } else if (correctAnswers.length === 0 && !draft.rubric.trim()) {
    return { error: "Add at least one accepted answer or a rubric." };
  }

  return {
    payload: {
      question_type: draft.question_type,
      question: draft.question.trim(),
      points,
      difficulty: draft.difficulty,
      explanation: draft.explanation.trim() || null,
      rubric: draft.rubric.trim() || null,
      source_reference: draft.source_reference.trim() || null,
      options: options.map((option, index) => ({
        option_label: LABELS[index],
        option_text: option.option_text.trim(),
        is_correct: option.is_correct,
      })),
      correct_answers: correctAnswers,
    },
  };
}

export function QuizQuestionEditor({
  open,
  question,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  question: QuizQuestion | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: QuizQuestionInput) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState<DraftState>(() => toDraft(question));
  const [error, setError] = React.useState<string | null>(null);
  const [prevOpen, setPrevOpen] = React.useState(open);

  // Re-seed whenever the dialog opens, so a cancelled edit never leaks in.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(toDraft(question));
      setError(null);
    }
  }

  const isChoice = draft.question_type !== "FILL_IN_BLANK";

  function setOption(index: number, patch: Partial<OptionDraft>) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    }));
  }

  function setCorrect(index: number) {
    setDraft((current) => {
      if (current.question_type === "SINGLE_CHOICE") {
        return {
          ...current,
          options: current.options.map((option, i) => ({
            ...option,
            is_correct: i === index,
          })),
        };
      }
      return {
        ...current,
        options: current.options.map((option, i) =>
          i === index ? { ...option, is_correct: !option.is_correct } : option,
        ),
      };
    });
  }

  function changeType(next: (typeof TYPES)[number]) {
    setDraft((current) => ({
      ...current,
      question_type: next,
      options:
        next === "FILL_IN_BLANK"
          ? []
          : current.options.length >= 2
            ? current.options
            : [
                { option_text: "", is_correct: true },
                { option_text: "", is_correct: false },
              ],
    }));
  }

  async function submit() {
    const { payload, error: buildError } = buildInput(draft);
    if (!payload) {
      setError(buildError ?? "Check the question.");
      return;
    }
    setError(null);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this question.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next && !saving ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? "Edit question" : "Add question"}</DialogTitle>
          <DialogDescription>
            {question
              ? "Saving replaces this question and its options in place."
              : "The new question is appended at the end of the quiz."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="qq-type">Type</Label>
              <select
                id="qq-type"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                value={draft.question_type}
                onChange={(event) => changeType(event.target.value as DraftState["question_type"])}
                disabled={saving}
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="qq-points">Points</Label>
              <Input
                id="qq-points"
                type="number"
                min="0.01"
                step="0.5"
                value={draft.points}
                onChange={(event) => setDraft((c) => ({ ...c, points: event.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="qq-level">Difficulty</Label>
              <select
                id="qq-level"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                value={draft.difficulty}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, difficulty: event.target.value as DraftState["difficulty"] }))
                }
                disabled={saving}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="qq-prompt">Question</Label>
            <textarea
              id="qq-prompt"
              rows={3}
              className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              value={draft.question}
              onChange={(event) => setDraft((c) => ({ ...c, question: event.target.value }))}
              disabled={saving}
            />
          </div>

          {isChoice ? (
            <div className="grid gap-2">
              <Label>Options</Label>
              {draft.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrect(index)}
                    aria-label={`Mark option ${LABELS[index]} correct`}
                    aria-pressed={option.is_correct}
                    className={
                      option.is_correct
                        ? "size-5 shrink-0 rounded-full border-2 border-green-700 bg-green-100 text-[11px] font-bold text-green-900"
                        : "size-5 shrink-0 rounded-full border border-slate-300 text-[11px] font-semibold text-slate-400"
                    }
                  >
                    {LABELS[index]}
                  </button>
                  <Input
                    value={option.option_text}
                    aria-label={`Option ${LABELS[index]} text`}
                    onChange={(event) => setOption(index, { option_text: event.target.value })}
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove option ${LABELS[index]}`}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        options: current.options.filter((_, i) => i !== index),
                      }))
                    }
                    disabled={saving || draft.options.length <= 2}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    options: [...current.options, { option_text: "", is_correct: false }],
                  }))
                }
                disabled={saving || draft.options.length >= LABELS.length}
              >
                <Plus /> Add option
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="qq-answers">Accepted answers (one per line)</Label>
                <textarea
                  id="qq-answers"
                  rows={3}
                  className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                  value={draft.correct_answers}
                  onChange={(event) =>
                    setDraft((c) => ({ ...c, correct_answers: event.target.value }))
                  }
                  disabled={saving}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="qq-rubric">Rubric</Label>
                <textarea
                  id="qq-rubric"
                  rows={2}
                  className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                  value={draft.rubric}
                  onChange={(event) => setDraft((c) => ({ ...c, rubric: event.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="qq-source">Source excerpt</Label>
            <textarea
              id="qq-source"
              rows={2}
              className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              value={draft.source_reference}
              onChange={(event) =>
                setDraft((c) => ({ ...c, source_reference: event.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="qq-explanation">Explanation</Label>
            <textarea
              id="qq-explanation"
              rows={2}
              className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              value={draft.explanation}
              onChange={(event) => setDraft((c) => ({ ...c, explanation: event.target.value }))}
              disabled={saving}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={saving}>
            {saving && <LoaderCircle className="animate-spin" />}
            Save question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
