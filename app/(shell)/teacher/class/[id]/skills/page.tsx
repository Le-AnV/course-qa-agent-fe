"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Skill, SkillLevel, skillApi } from "@/lib/skill-api";
import {
  Layers,
  Sparkles,
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  HelpCircle,
} from "lucide-react";

const PROFICIENCY_LEVELS: {
  level: SkillLevel;
  name: string;
  badgeBg: string;
  badgeText: string;
  defaultThreshold: number;
}[] = [
  {
    level: "NOVICE",
    name: "Novice",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800 border-slate-300",
    defaultThreshold: 80,
  },
  {
    level: "BEGINNER",
    name: "Beginner",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800 border-blue-200",
    defaultThreshold: 75,
  },
  {
    level: "COMPETENT",
    name: "Competent",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800 border-emerald-200",
    defaultThreshold: 70,
  },
  {
    level: "PROFICIENT",
    name: "Proficient",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800 border-amber-200",
    defaultThreshold: 65,
  },
  {
    level: "MASTER",
    name: "Master",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800 border-purple-200",
    defaultThreshold: 60,
  },
];

export default function TeacherClassSkillsPage() {
  const params = useParams();
  const classId = params.id as string;

  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = React.useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = React.useState<Record<string, boolean>>({
    NOVICE: true,
    BEGINNER: true,
    COMPETENT: true,
    PROFICIENT: true,
    MASTER: true,
  });

  // Edit / draft states for rubric descriptions & thresholds
  const [rubricDrafts, setRubricDrafts] = React.useState<
    Record<string, { description: string; threshold_pct: number }>
  >({});
  const [savingLevel, setSavingLevel] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

  // New Skill Modal
  const [isCreatingSkill, setIsCreatingSkill] = React.useState(false);
  const [newSkillCode, setNewSkillCode] = React.useState("");
  const [newSkillName, setNewSkillName] = React.useState("");
  const [newSkillCategory, setNewSkillCategory] = React.useState("PYTHON");
  const [newSkillDesc, setNewSkillDesc] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);

  // Auto-generation State
  const [generatingSkills, setGeneratingSkills] = React.useState(false);

  const handleAutoGenerateSkills = async () => {
    if (!classId) return;
    const confirmGenerate = window.confirm(
      "Do you want to automatically synthesize a 5-level Skill Taxonomy and Rubrics based on the course description and metadata?"
    );
    if (!confirmGenerate) return;

    try {
      setGeneratingSkills(true);
      setError(null);
      const generated = await skillApi.autoGenerateSkills(classId);
      setSkills(generated);
      if (generated.length > 0) {
        setSelectedSkillId(generated[0].id);
      }
      setSaveSuccess(`Successfully generated ${generated.length} skills with rubrics!`);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate skills.");
    } finally {
      setGeneratingSkills(false);
    }
  };

  const fetchSkills = React.useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await skillApi.listClassSkills(classId);
      setSkills(data);
      if (data.length > 0 && !selectedSkillId) {
        setSelectedSkillId(data[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load skills.");
    } finally {
      setLoading(false);
    }
  }, [classId, selectedSkillId]);

  React.useEffect(() => {
    let active = true;
    if (!classId) return;

    skillApi
      .listClassSkills(classId)
      .then((data) => {
        if (!active) return;
        setSkills(data);
        if (data.length > 0) {
          setSelectedSkillId((prev) => prev || data[0].id);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load skills.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [classId]);

  const selectedSkill = React.useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId) || skills[0] || null;
  }, [skills, selectedSkillId]);

  // Sync drafts when selected skill changes
  const activeDrafts = React.useMemo(() => {
    if (!selectedSkill) return {};
    const drafts: Record<string, { description: string; threshold_pct: number }> = {};
    for (const p of PROFICIENCY_LEVELS) {
      const existing = selectedSkill.rubrics?.find((r) => r.level === p.level);
      drafts[p.level] = {
        description: existing?.description || "",
        threshold_pct: existing?.threshold_pct || p.defaultThreshold,
      };
    }
    return drafts;
  }, [selectedSkill]);

  const currentRubricDrafts = { ...activeDrafts, ...rubricDrafts };

  const handleRubricChange = (
    level: SkillLevel,
    field: "description" | "threshold_pct",
    val: string | number
  ) => {
    setRubricDrafts((prev) => ({
      ...prev,
      [level]: {
        description:
          field === "description"
            ? (val as string)
            : prev[level]?.description ?? activeDrafts[level]?.description ?? "",
        threshold_pct:
          field === "threshold_pct"
            ? (val as number)
            : prev[level]?.threshold_pct ?? activeDrafts[level]?.threshold_pct ?? 70,
      },
    }));
  };

  const handleSaveRubric = async (level: SkillLevel) => {
    if (!selectedSkill || !classId) return;
    const draft = currentRubricDrafts[level];
    if (!draft || !draft.description.trim()) {
      alert("Please provide the evaluation scope description for this level.");
      return;
    }

    try {
      setSavingLevel(level);
      await skillApi.updateClassRubric(classId, selectedSkill.id, level, {
        description: draft.description.trim(),
        threshold_pct: draft.threshold_pct,
      });
      setSaveSuccess(`Saved rubric for ${level}!`);
      setTimeout(() => setSaveSuccess(null), 3000);
      await fetchSkills();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save rubric.");
    } finally {
      setSavingLevel(null);
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillCode.trim() || !newSkillName.trim()) {
      alert("Skill code and name are required.");
      return;
    }

    try {
      setCreateLoading(true);
      const created = await skillApi.createClassSkill(classId, {
        code: newSkillCode.trim(),
        name: newSkillName.trim(),
        category: newSkillCategory.trim() || "GENERAL",
        description: newSkillDesc.trim() || undefined,
        rubrics: PROFICIENCY_LEVELS.map((p) => ({
          level: p.level,
          description: `Assessment of ${p.name} level understanding for ${newSkillName.trim()}`,
          threshold_pct: p.defaultThreshold,
        })),
      });
      setIsCreatingSkill(false);
      setNewSkillCode("");
      setNewSkillName("");
      setNewSkillDesc("");
      await fetchSkills();
      setSelectedSkillId(created.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create skill.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Skills & Evaluation Rubrics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Class Scoped
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Define specific skills tested in your quizzes and describe what knowledge is expected at each
            of the 5 mastery levels (Novice to Master).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleAutoGenerateSkills}
            disabled={generatingSkills}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-indigo-700 transition shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generatingSkills ? "animate-spin" : ""}`} />
            {generatingSkills ? "Synthesizing Rubrics..." : "Auto-generate Skills"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingSkill(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Skill Navigation */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              Course Skills ({skills.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="py-8 text-center px-2">
              <p className="text-sm text-slate-500">No skills defined for this course yet.</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleAutoGenerateSkills}
                  disabled={generatingSkills}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-violet-700 hover:to-indigo-700 transition shadow-sm disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${generatingSkills ? "animate-spin" : ""}`} />
                  {generatingSkills ? "Synthesizing..." : "Auto-generate 5-Level Rubrics"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingSkill(true)}
                  className="w-full text-xs text-slate-600 hover:text-slate-900 font-medium py-1"
                >
                  + Create manually
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map((s) => {
                const isSelected = selectedSkill?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSkillId(s.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-300 text-indigo-950 font-medium shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {s.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        {s.category}
                      </span>
                    </div>
                    <div className="text-sm font-semibold mt-1.5 line-clamp-1">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">{s.description}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Skill Detail & 5-Level Rubrics */}
        <div className="lg:col-span-8 space-y-6">
          {selectedSkill ? (
            <>
              {/* Skill Header */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {selectedSkill.code}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedSkill.name}</h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                    Category: {selectedSkill.category}
                  </span>
                </div>
                {selectedSkill.description && (
                  <p className="text-sm text-slate-600 mt-3">{selectedSkill.description}</p>
                )}
              </div>

              {saveSuccess && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {saveSuccess}
                </div>
              )}

              {/* 5-Level Rubric Accordions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Proficiency Rubrics (Novice to Master)
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Threshold: % correct required to pass level gate
                  </div>
                </div>

                {PROFICIENCY_LEVELS.map((p) => {
                  const isExpanded = expandedLevels[p.level] ?? true;
                  const draft = currentRubricDrafts[p.level] || {
                    description: "",
                    threshold_pct: p.defaultThreshold,
                  };
                  const isSaving = savingLevel === p.level;

                  return (
                    <div
                      key={p.level}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLevels((prev) => ({
                            ...prev,
                            [p.level]: !prev[p.level],
                          }))
                        }
                        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-bold border ${p.badgeBg} ${p.badgeText}`}
                          >
                            {p.level}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{p.name} Level</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-medium text-slate-500">
                            Passing: <strong className="text-slate-800">{draft.threshold_pct}%</strong>
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-5 space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Tested Understanding / Evaluation Scope
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                              Describe what knowledge depth or comprehension level is tested for this
                              skill at the {p.name} level.
                            </p>
                            <textarea
                              rows={3}
                              value={draft.description}
                              onChange={(e) =>
                                handleRubricChange(p.level, "description", e.target.value)
                              }
                              placeholder={`e.g. Can recognize and explain basic syntax, keywords, and simple rules of ${selectedSkill.name}.`}
                              className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-slate-600">
                                Pass Threshold:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={draft.threshold_pct}
                                onChange={(e) =>
                                  handleRubricChange(
                                    p.level,
                                    "threshold_pct",
                                    parseInt(e.target.value, 10) || 70
                                  )
                                }
                                className="w-20 text-sm font-semibold text-center rounded border border-slate-300 py-1 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-xs text-slate-500">%</span>
                            </div>

                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleSaveRubric(p.level)}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {isSaving ? "Saving..." : `Save ${p.name} Rubric`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select or create a skill to view and configure its rubrics.
            </div>
          )}
        </div>
      </div>

      {/* New Skill Modal */}
      {isCreatingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Add Course Skill</h2>
            <p className="text-xs text-slate-500 mb-4">
              Add a skill domain tailored for your course syllabus and quiz evaluation.
            </p>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Skill Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PY-CONTROL-FLOW"
                  value={newSkillCode}
                  onChange={(e) => setNewSkillCode(e.target.value.toUpperCase())}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python Control Flow & Loops"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. PYTHON"
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value.toUpperCase())}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of what this skill covers..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingSkill(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {createLoading ? "Creating..." : "Create Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
