"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Shuffle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  quizApi,
  BlueprintAvailabilityResponse,
  QuizGenerateBlueprintRequest,
} from "@/lib/quiz-api";
import { skillApi, Skill } from "@/lib/skill-api";

const DREYFUS_LEVELS = [
  { key: "NOVICE", label: "Novice", bg: "bg-slate-100 text-slate-800 border-slate-300", desc: "Rule-based recall & syntax" },
  { key: "BEGINNER", label: "Beginner", bg: "bg-blue-50 text-blue-700 border-blue-200", desc: "Contextual understanding" },
  { key: "COMPETENT", label: "Competent", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Problem solving & application" },
  { key: "PROFICIENT", label: "Proficient", bg: "bg-amber-50 text-amber-700 border-amber-200", desc: "Holistic analysis & edge cases" },
  { key: "MASTER", label: "Master", bg: "bg-purple-50 text-purple-700 border-purple-200", desc: "Intuitive & architectural synthesis" },
];

interface QuizBlueprintModalProps {
  open: boolean;
  classId: string;
  onClose: () => void;
}

export function QuizBlueprintModal({ open, classId, onClose }: QuizBlueprintModalProps) {
  const router = useRouter();

  // Data states
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [availability, setAvailability] = React.useState<BlueprintAvailabilityResponse | null>(null);
  const [loadingData, setLoadingData] = React.useState(false);

  // Form states
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [timeLimit, setTimeLimit] = React.useState<number | "">(45);
  const [passingScore, setPassingScore] = React.useState<number | "">(70);
  const [selectedSkillIds, setSelectedSkillIds] = React.useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([
    "NOVICE",
    "BEGINNER",
    "COMPETENT",
  ]);
  const [questionsPerLevel, setQuestionsPerLevel] = React.useState(3);
  const [autoGenerateMissing, setAutoGenerateMissing] = React.useState(true);
  const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
  const [shuffleOptions, setShuffleOptions] = React.useState(true);
  const [showSolutionsAfterSubmission, setShowSolutionsAfterSubmission] = React.useState(true);

  // Submission state
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load skills & availability when dialog opens
  React.useEffect(() => {
    if (!open) return;
    let active = true;

    async function fetchData() {
      try {
        setLoadingData(true);
        setError(null);
        const [loadedSkills, avail] = await Promise.all([
          skillApi.listClassSkills(classId).catch(() => []),
          quizApi.getBlueprintAvailability(classId).catch(() => null),
        ]);
        if (!active) return;
        setSkills(loadedSkills);
        setAvailability(avail);
        // Default select all available skills
        if (loadedSkills.length > 0) {
          setSelectedSkillIds(loadedSkills.map((s) => s.id));
        }
        setTitle(
          (prev) =>
            prev ||
            `Assessment Quiz - ${new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`,
        );
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load skills or question bank.");
      } finally {
        if (active) setLoadingData(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, [open, classId]);

  // Derived counts
  const totalQuestions = selectedSkillIds.length * selectedLevels.length * questionsPerLevel;

  // Compute available items in bank matching the selection
  const matchingBankCount = React.useMemo(() => {
    if (!availability) return 0;
    const skillSet = new Set(selectedSkillIds);
    const levelSet = new Set(selectedLevels);
    return availability.cells
      .filter((c) => skillSet.has(c.skill_id) && levelSet.has(c.difficulty.toUpperCase()))
      .reduce((sum, c) => sum + c.available_in_bank, 0);
  }, [availability, selectedSkillIds, selectedLevels]);

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const selectAllSkills = () => {
    setSelectedSkillIds(skills.map((s) => s.id));
  };

  const clearAllSkills = () => {
    setSelectedSkillIds([]);
  };

  const toggleLevel = (lvl: string) => {
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide an assessment title.");
      return;
    }
    if (selectedSkillIds.length === 0) {
      setError("Please select at least one competency skill.");
      return;
    }
    if (selectedLevels.length === 0) {
      setError("Please select at least one proficiency level.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: QuizGenerateBlueprintRequest = {
        title: title.trim(),
        description: description.trim() || null,
        time_limit_minutes: timeLimit ? Number(timeLimit) : null,
        passing_score: passingScore ? Number(passingScore) : null,
        target_skill_ids: selectedSkillIds,
        target_levels: selectedLevels,
        questions_per_level: questionsPerLevel,
        auto_generate_missing: autoGenerateMissing,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_solutions_after_submission: showSolutionsAfterSubmission,
      };

      const quiz = await quizApi.generateFromBlueprint(classId, payload);
      onClose();
      // Redirect to review page for newly generated draft quiz
      router.push(`/teacher/class/${classId}/quizzes/${quiz.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz from blueprint.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next && !submitting ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Generate Quiz from Blueprint Matrix
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assemble a standardized competency assessment sampled directly from the Question Bank across target skills and Dreyfus tiers.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Assessment Metadata */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Assessment Details
            </h4>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="quiz-title" className="text-xs font-semibold">
                  Quiz Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="quiz-title"
                  placeholder="e.g. Midterm Competency Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 text-sm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="quiz-description" className="text-xs font-semibold text-slate-600">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="quiz-description"
                  placeholder="e.g. Standardized competency quiz covering all core skills."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="quiz-time" className="text-xs font-semibold">
                    Time Limit (Minutes)
                  </Label>
                  <Input
                    id="quiz-time"
                    type="number"
                    min={5}
                    max={180}
                    placeholder="45"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="quiz-passing" className="text-xs font-semibold">
                    Passing Score (%)
                  </Label>
                  <Input
                    id="quiz-passing"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="70"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value === "" ? "" : Number(e.target.value))}
                    className="mt-1 text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs font-semibold">Structure Type</Label>
                  <div className="mt-1 px-3 py-2 rounded-md bg-slate-50 border text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Standardized Matrix
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Target Skills */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Target Skills ({selectedSkillIds.length}/{skills.length} selected)
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllSkills}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllSkills}
                  className="text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {loadingData ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <LoaderCircle className="size-4 animate-spin text-indigo-600" />
                Loading class skills taxonomy...
              </div>
            ) : skills.length === 0 ? (
              <div className="p-3 rounded-lg border border-dashed text-center text-xs text-slate-500">
                No skills defined for this class yet. Questions will be sampled generally.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {skills.map((skill) => {
                  const selected = selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition ${
                        selected
                          ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {}} // handled by button
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {skill.code}
                          </span>
                          {skill.category && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {skill.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{skill.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Assessment Depth & Standardized Distribution */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Assessment Depth & Uniform Structure
            </h4>

            <div>
              <Label className="text-xs font-semibold block mb-1.5">
                Evaluation Levels (Dreyfus Acquisition Scale)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DREYFUS_LEVELS.map((lvl) => {
                  const active = selectedLevels.includes(lvl.key);
                  return (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => toggleLevel(lvl.key)}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                        active
                          ? `${lvl.bg} font-semibold ring-1 ring-offset-1`
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold">{lvl.label}</span>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => {}}
                          className="rounded text-indigo-600 pointer-events-none"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        {lvl.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions per level slider & calculation */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="q-per-level" className="text-xs font-bold text-slate-800">
                    Questions per Level:{" "}
                    <span className="text-indigo-600 text-sm font-extrabold">{questionsPerLevel}</span>
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Applied uniformly across each selected skill and proficiency tier.
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                    Total: {totalQuestions} Questions
                  </Badge>
                </div>
              </div>

              <input
                id="q-per-level"
                type="range"
                min={1}
                max={6}
                value={questionsPerLevel}
                onChange={(e) => setQuestionsPerLevel(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 question / level</span>
                <span>
                  {selectedSkillIds.length} skills × {selectedLevels.length} levels × {questionsPerLevel} ={" "}
                  <strong className="text-slate-700">{totalQuestions} total</strong>
                </span>
                <span>6 questions / level</span>
              </div>

              {/* Bank availability check */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Database className="size-3.5 text-slate-400" />
                  <span>Available in Question Bank:</span>
                  <span className="font-semibold text-slate-800">{matchingBankCount} items</span>
                </div>
                {matchingBankCount < totalQuestions && (
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Short by {totalQuestions - matchingBankCount} questions
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Options */}
          <div className="space-y-2.5 border-t pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Generation Options
            </h4>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoGenerateMissing}
                onChange={(e) => setAutoGenerateMissing(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800">
                  On-Demand AI Fallback (Auto-generate missing items)
                </span>
                <p className="text-[11px] text-slate-500">
                  If the Question Bank lacks enough questions for any skill/level tier, the AI automatically generates the missing questions from class documents and saves them to the bank.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showSolutionsAfterSubmission}
                onChange={(e) => setShowSolutionsAfterSubmission(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800">
                  Allow students to view answer key & explanations after submission
                </span>
                <p className="text-[11px] text-slate-500">
                  When enabled, students see correct answers and explanations after submitting. Uncheck for strict exams or high-stakes assessments to keep the answer key hidden.
                </p>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Shuffle className="size-3.5 text-slate-400" />
                <span>Shuffle question sequence</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Shuffle className="size-3.5 text-slate-400" />
                <span>Shuffle options (A, B, C, D)</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="border-t pt-3 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || totalQuestions === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin mr-1.5" />
                  Sampling & Assembling Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-1.5" />
                  Generate Quiz ({totalQuestions} Questions)
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
