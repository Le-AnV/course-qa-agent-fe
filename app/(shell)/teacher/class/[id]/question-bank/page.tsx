"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  BankQuestion,
  BankQuestionCreatePayload,
  BankQuestionFilter,
  QuestionDifficulty,
  QuestionType,
  questionBankApi,
} from "@/lib/question-bank-api";
import { Skill, skillApi } from "@/lib/skill-api";
import { fetchDocuments, DocumentItem } from "@/lib/documents";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import {
  Database,
  Sparkles,
  Brain,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  FileText,
} from "lucide-react";

const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; badgeBg: string; badgeText: string }
> = {
  NOVICE: { label: "Novice", badgeBg: "bg-slate-100", badgeText: "text-slate-700 border-slate-300" },
  BEGINNER: { label: "Beginner", badgeBg: "bg-blue-50", badgeText: "text-blue-700 border-blue-200" },
  COMPETENT: { label: "Competent", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700 border-emerald-200" },
  PROFICIENT: { label: "Proficient", badgeBg: "bg-amber-50", badgeText: "text-amber-700 border-amber-200" },
  MASTER: { label: "Master", badgeBg: "bg-purple-50", badgeText: "text-purple-700 border-purple-200" },
  REMEMBER: { label: "Remember", badgeBg: "bg-slate-100", badgeText: "text-slate-700 border-slate-300" },
  UNDERSTAND: { label: "Understand", badgeBg: "bg-blue-50", badgeText: "text-blue-700 border-blue-200" },
  APPLY: { label: "Apply", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700 border-emerald-200" },
};


const TYPE_CONFIG: Record<string, { label: string; badgeBg: string; badgeText: string }> = {
  SINGLE_CHOICE: { label: "Single Choice", badgeBg: "bg-blue-50", badgeText: "text-blue-700 border-blue-200" },
  MULTIPLE_CHOICE: { label: "Multiple Choice", badgeBg: "bg-purple-50", badgeText: "text-purple-700 border-purple-200" },
  FILL_IN_BLANK: { label: "Fill-in-Blank", badgeBg: "bg-amber-50", badgeText: "text-amber-700 border-amber-200" },
};

export default function QuestionBankPage() {
  const params = useParams();
  const classId = params.id as string;

  // Data states
  const [questions, setQuestions] = React.useState<BankQuestion[]>([]);
  const [total, setTotal] = React.useState(0);
  const [stats, setStats] = React.useState<{
    difficulty: Record<string, number>;
    type: Record<string, number>;
  }>({ difficulty: {}, type: {} });
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);

  // Auto-dismiss success notification after 3.5 seconds
  React.useEffect(() => {
    if (!successNotice) return;
    const timer = setTimeout(() => {
      setSuccessNotice(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [successNotice]);

  // Filters
  const [search, setSearch] = React.useState("");
  const [skillFilter, setSkillFilter] = React.useState<string>("");
  const [typeFilter, setTypeFilter] = React.useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>("");

  // Expanded explanations
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});

  // Modals
  const [isAiGenOpen, setIsAiGenOpen] = React.useState(false);
  const [isMisconceptionOpen, setIsMisconceptionOpen] = React.useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = React.useState(false);

  // Generation Form States
  const [aiGenDocIds, setAiGenDocIds] = React.useState<string[]>([]);
  const [aiGenSkillIds, setAiGenSkillIds] = React.useState<string[]>([]);
  const [aiGenTypes, setAiGenTypes] = React.useState<QuestionType[]>([
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "FILL_IN_BLANK",
  ]);
  const [aiGenDifficulties, setAiGenDifficulties] = React.useState<QuestionDifficulty[]>([
    "NOVICE",
    "BEGINNER",
    "COMPETENT",
  ]);
  const [aiGenCountPerLevel, setAiGenCountPerLevel] = React.useState(2);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Misconception Form States
  const [miscTimeframe, setMiscTimeframe] = React.useState(14);
  const [miscSkillIds, setMiscSkillIds] = React.useState<string[]>([]);
  const [miscCount, setMiscCount] = React.useState(5);
  const [isMining, setIsMining] = React.useState(false);

  // Question Form State (Add / Edit)
  const [editingQuestion, setEditingQuestion] = React.useState<BankQuestion | null>(null);
  const [formType, setFormType] = React.useState<QuestionType>("SINGLE_CHOICE");
  const [formPrompt, setFormPrompt] = React.useState("");
  const [formPoints, setFormPoints] = React.useState(1.0);
  const [formDifficulty, setFormDifficulty] = React.useState<QuestionDifficulty>("NOVICE");
  const [formSkillId, setFormSkillId] = React.useState<string>("");
  const [formExplanation, setFormExplanation] = React.useState("");
  const [formRubric, setFormRubric] = React.useState("");
  const [formSourceRef, setFormSourceRef] = React.useState("");
  const [formOptions, setFormOptions] = React.useState<
    { option_label: string; option_text: string; is_correct: boolean }[]
  >([
    { option_label: "A", option_text: "", is_correct: true },
    { option_label: "B", option_text: "", is_correct: false },
    { option_label: "C", option_text: "", is_correct: false },
    { option_label: "D", option_text: "", is_correct: false },
  ]);
  const [formFillAnswers, setFormFillAnswers] = React.useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = React.useState(false);

  // Fetch function for manual refresh
  const reloadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: BankQuestionFilter = {
        search: search.trim() || undefined,
        skill_id: skillFilter || undefined,
        question_type: typeFilter || undefined,
        difficulty: difficultyFilter || undefined,
      };
      const res = await questionBankApi.list(classId, filters);
      setQuestions(res.items);
      setTotal(res.total);
      setStats({
        difficulty: res.counts_by_difficulty,
        type: res.counts_by_type,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load question bank");
    } finally {
      setLoading(false);
    }
  }, [classId, search, skillFilter, typeFilter, difficultyFilter]);

  // Effect to load questions whenever filter changes
  React.useEffect(() => {
    let active = true;
    const filters: BankQuestionFilter = {
      search: search.trim() || undefined,
      skill_id: skillFilter || undefined,
      question_type: typeFilter || undefined,
      difficulty: difficultyFilter || undefined,
    };

    questionBankApi
      .list(classId, filters)
      .then((res) => {
        if (!active) return;
        setQuestions(res.items);
        setTotal(res.total);
        setStats({
          difficulty: res.counts_by_difficulty,
          type: res.counts_by_type,
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load question bank");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [classId, search, skillFilter, typeFilter, difficultyFilter]);

  // Load skills and documents once
  React.useEffect(() => {
    let active = true;
    skillApi
      .listClassSkills(classId)
      .then((s) => {
        if (active) setSkills(s);
      })
      .catch(() => null);

    const token = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) || "" : "";
    fetchDocuments({ token }, { classId })
      .then((res: { items: DocumentItem[]; total: number }) => {
        if (active) setDocuments(res.items);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [classId]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateAi = async () => {
    try {
      if (aiGenDifficulties.length === 0) {
        setError("Please select at least one proficiency level.");
        return;
      }
      setIsGenerating(true);
      setError(null);
      const perLevelDict: Record<string, number> = {};
      aiGenDifficulties.forEach((lvl) => {
        perLevelDict[lvl] = aiGenCountPerLevel;
      });
      const totalCount = aiGenCountPerLevel * aiGenDifficulties.length;

      const res = await questionBankApi.generateFromDocuments(classId, {
        document_ids: aiGenDocIds,
        skill_ids: aiGenSkillIds,
        question_types: aiGenTypes,
        difficulty_levels: aiGenDifficulties,
        questions_per_level: perLevelDict,
        num_questions: totalCount,
      });
      setSuccessNotice(`Generated and saved ${res.length} new diagnostic questions to the Question Bank!`);
      setIsAiGenOpen(false);
      await reloadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMineMisconceptions = async () => {
    try {
      setIsMining(true);
      setError(null);
      const res = await questionBankApi.mineMisconceptions(classId, {
        timeframe_days: miscTimeframe,
        skill_ids: miscSkillIds,
        num_questions: miscCount,
      });
      setSuccessNotice(
        `Synthesized ${res.length} targeted probe questions from student chat inquiries!`
      );
      setIsMisconceptionOpen(false);
      await reloadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Misconception mining failed");
    } finally {
      setIsMining(false);
    }
  };

  const openAddQuestionModal = () => {
    setEditingQuestion(null);
    setFormType("SINGLE_CHOICE");
    setFormPrompt("");
    setFormPoints(1.0);
    setFormDifficulty("NOVICE");
    setFormSkillId(skills[0]?.id || "");
    setFormExplanation("");
    setFormRubric("");
    setFormSourceRef("");
    setFormOptions([
      { option_label: "A", option_text: "", is_correct: true },
      { option_label: "B", option_text: "", is_correct: false },
      { option_label: "C", option_text: "", is_correct: false },
      { option_label: "D", option_text: "", is_correct: false },
    ]);
    setFormFillAnswers("");
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: BankQuestion) => {
    setEditingQuestion(q);
    setFormType(q.question_type);
    setFormPrompt(q.question);
    setFormPoints(q.points);
    setFormDifficulty(q.difficulty);
    setFormSkillId(q.skill_id || "");
    setFormExplanation(q.explanation || "");
    setFormRubric(q.rubric || "");
    setFormSourceRef(q.source_reference || "");

    if (q.question_type === "FILL_IN_BLANK") {
      setFormFillAnswers(q.correct_answers ? q.correct_answers.join(" | ") : "");
    } else {
      const opts = (q.options || []).map((o) => ({
        option_label: o.option_label,
        option_text: o.option_text,
        is_correct: o.is_correct,
      }));
      setFormOptions(
        opts.length > 0
          ? opts
          : [
              { option_label: "A", option_text: "", is_correct: true },
              { option_label: "B", option_text: "", is_correct: false },
              { option_label: "C", option_text: "", is_correct: false },
              { option_label: "D", option_text: "", is_correct: false },
            ]
      );
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!formPrompt.trim()) {
      setError("Question prompt cannot be empty.");
      return;
    }

    try {
      setIsSubmittingQuestion(true);
      setError(null);

      const fillList =
        formType === "FILL_IN_BLANK"
          ? formFillAnswers
              .split("|")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;

      const payload: BankQuestionCreatePayload = {
        question_type: formType,
        question: formPrompt.trim(),
        points: formPoints,
        difficulty: formDifficulty,
        skill_id: formSkillId || null,
        explanation: formExplanation.trim() || null,
        rubric: formRubric.trim() || null,
        source_reference: formSourceRef.trim() || null,
        status: "APPROVED",
        options: formType !== "FILL_IN_BLANK" ? formOptions : [],
        correct_answers: fillList,
      };

      if (editingQuestion) {
        await questionBankApi.update(classId, editingQuestion.id, payload);
        setSuccessNotice("Question updated successfully.");
      } else {
        await questionBankApi.create(classId, payload);
        setSuccessNotice("New question added to Question Bank.");
      }

      setIsQuestionModalOpen(false);
      await reloadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question from the Question Bank?")) {
      return;
    }
    try {
      await questionBankApi.delete(classId, id);
      setSuccessNotice("Question deleted.");
      await reloadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete question");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Question Bank Repository</h1>
              <p className="text-sm text-slate-500">
                Centralized assessment repository aligned with Dreyfus Skill Taxonomy. Stage 1 of the quiz generation workflow.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAiGenOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </button>
          <button
            onClick={() => setIsMisconceptionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-sm transition"
            title="Generate questions from student chat questions and confusion tickets"
          >
            <Brain className="w-4 h-4" />
            From Student Doubts & Pitfalls
          </button>
          <button
            onClick={openAddQuestionModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {/* Notice & Alerts */}
      {successNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Questions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-blue-600">Single Choice</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.type["SINGLE_CHOICE"] || 0}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-purple-600">Multiple Choice</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.type["MULTIPLE_CHOICE"] || 0}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-amber-600">Fill in Blank</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.type["FILL_IN_BLANK"] || 0}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search question stem, explanation, citation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Skill Filter */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Skills ({skills.length})</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Question Types</option>
            <option value="SINGLE_CHOICE">Single Choice</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="FILL_IN_BLANK">Fill in Blank</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Difficulties</option>
            <option value="NOVICE">Novice (Syntax recall)</option>
            <option value="BEGINNER">Beginner (Control flow)</option>
            <option value="COMPETENT">Competent (Problem solving)</option>
            <option value="PROFICIENT">Proficient (Optimization)</option>
            <option value="MASTER">Master (Internals & concurrency)</option>
          </select>

          <button
            onClick={() => reloadData()}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Question List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-sm">Loading questions from Question Bank...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Database className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No questions found</h3>
          <p className="text-sm mt-1 text-slate-500 max-w-md mx-auto">
            {search || skillFilter || typeFilter || difficultyFilter
              ? "Try adjusting your filters or search keywords."
              : "Generate questions from class documents, student inquiries, or create questions manually to get started."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsAiGenOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </button>
            <button
              onClick={openAddQuestionModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus className="w-4 h-4" />
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isExpanded = !!expandedIds[q.id];
            const typeConf = TYPE_CONFIG[q.question_type] || {
              label: q.question_type,
              badgeBg: "bg-slate-50",
              badgeText: "text-slate-700 border-slate-200",
            };
            const diffConf = DIFFICULTY_CONFIG[q.difficulty] || {
              label: q.difficulty,
              badgeBg: "bg-slate-50",
              badgeText: "text-slate-700 border-slate-200",
            };

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition hover:border-slate-300"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>

                    {/* Question Type Badge */}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${typeConf.badgeBg} ${typeConf.badgeText}`}
                    >
                      {typeConf.label}
                    </span>

                    {/* Difficulty Badge */}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${diffConf.badgeBg} ${diffConf.badgeText}`}
                    >
                      {diffConf.label}
                    </span>

                    {/* Skill Tag */}
                    {q.skill_code && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {q.skill_code}
                      </span>
                    )}

                    {/* Source Tag */}
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1">
                      {q.source_type === "CHAT_MISCONCEPTION" ? (
                        <>
                          <Brain className="w-3 h-3 text-purple-600" />
                          <span className="text-purple-700">From Student Doubts</span>
                        </>
                      ) : q.source_type === "DOCUMENT" ? (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>From Document</span>
                        </>
                      ) : q.source_type === "EXCEL_IMPORT" ? (
                        <>
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                          <span>Excel Import</span>
                        </>
                      ) : (
                        <span>Manual</span>
                      )}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">{q.points} pt</span>

                    <button
                      onClick={() => openEditQuestionModal(q)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition"
                      title="Edit question"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div className="pt-3">
                  <p className="text-base font-semibold text-slate-900 leading-relaxed">
                    {q.question}
                  </p>
                </div>

                {/* Choices (Single / Multiple) */}
                {q.question_type !== "FILL_IN_BLANK" && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3.5">
                    {q.options.map((opt) => (
                      <div
                        key={opt.option_label}
                        className={`p-2.5 rounded-lg border text-sm flex items-start gap-2.5 ${
                          opt.is_correct
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                            : "bg-slate-50/50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                            opt.is_correct
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {opt.option_label}
                        </span>
                        <span className="flex-1">{opt.option_text}</span>
                        {opt.is_correct && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fill in Blank accepted answers */}
                {q.question_type === "FILL_IN_BLANK" && (
                  <div className="mt-3.5 p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-sm">
                    <span className="font-semibold text-amber-900">Accepted Answers: </span>
                    <span className="text-amber-950">
                      {q.correct_answers && q.correct_answers.length > 0
                        ? q.correct_answers.join(" | ")
                        : q.rubric || "(Defined in rubric)"}
                    </span>
                  </div>
                )}

                {/* Expandable Explanation & Rubric Accordion */}
                {(q.explanation || q.rubric || q.source_reference) && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleExpand(q.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Hide Explanation & Rubric
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> View Explanation & Rubric
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                        {q.explanation && (
                          <div>
                            <span className="font-semibold text-slate-900">Explanation: </span>
                            <span>{q.explanation}</span>
                          </div>
                        )}
                        {q.rubric && (
                          <div>
                            <span className="font-semibold text-slate-900">Rubric: </span>
                            <span>{q.rubric}</span>
                          </div>
                        )}
                        {q.source_reference && (
                          <div>
                            <span className="font-semibold text-slate-900">Source Reference: </span>
                            <span className="italic">{q.source_reference}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: AI Question Generator Modal */}
      {isAiGenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  AI Question Bank Generator
                </h2>
              </div>
              <button onClick={() => setIsAiGenOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Generate diagnostic questions calibrated strictly against your class materials and Dreyfus skill rubrics.
            </p>

            {/* Source Documents */}
            {documents.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Source Class Materials ({documents.length} available)
                </label>
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                  {documents.map((doc) => {
                    const isSelected = aiGenDocIds.includes(doc.id);
                    return (
                      <label
                        key={doc.id}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiGenDocIds((prev) => [...prev, doc.id]);
                            } else {
                              setAiGenDocIds((prev) => prev.filter((id) => id !== doc.id));
                            }
                          }}
                          className="accent-indigo-600 rounded"
                        />
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{doc.fileName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Target Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Skills ({skills.length} available)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                {skills.length === 0 ? (
                  <span className="text-xs text-slate-400">
                    No skills defined yet. All general course competencies will be addressed.
                  </span>
                ) : (
                  skills.map((s) => {
                    const isSelected = aiGenSkillIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setAiGenSkillIds((prev) =>
                            isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {s.code}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Target Difficulties */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Proficiency Levels ({aiGenDifficulties.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(["NOVICE", "BEGINNER", "COMPETENT", "PROFICIENT", "MASTER"] as QuestionDifficulty[]).map(
                  (lvl) => {
                    const isSelected = aiGenDifficulties.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setAiGenDifficulties((prev) =>
                            isSelected ? prev.filter((l) => l !== lvl) : [...prev, lvl]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 font-semibold"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Allowed Question Types
              </label>
              <div className="flex flex-wrap gap-2">
                {(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "FILL_IN_BLANK"] as QuestionType[]).map((t) => {
                  const isSelected = aiGenTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setAiGenTypes((prev) =>
                          isSelected ? prev.filter((item) => item !== t) : [...prev, t]
                        );
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold"
                          : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {TYPE_CONFIG[t].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number of Questions per Level */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Questions per Selected Level:{" "}
                  <span className="text-indigo-600 font-bold">{aiGenCountPerLevel}</span>
                </label>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Total: {aiGenCountPerLevel * aiGenDifficulties.length} questions
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={aiGenCountPerLevel}
                onChange={(e) => setAiGenCountPerLevel(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                <span>1 question / level</span>
                <span>
                  {aiGenDifficulties.length > 0
                    ? `(${aiGenCountPerLevel} per level × ${aiGenDifficulties.length} levels = ${aiGenCountPerLevel * aiGenDifficulties.length} total)`
                    : "No level selected"}
                </span>
                <span>10 questions / level</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAiGenOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGenerating || aiGenTypes.length === 0}
                onClick={handleGenerateAi}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Questions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Questions from Student Doubts & Pitfalls */}
      {isMisconceptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Generate from Student Doubts & Pitfalls
                </h2>
              </div>
              <button onClick={() => setIsMisconceptionOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Analyzes actual student questions from Chat and Support Tickets to identify common points of confusion and misconceptions, then generates targeted questions to test and reinforce those tricky topics.
            </p>

            {/* Target Skills */}
            {skills.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Skills (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                  {skills.map((s) => {
                    const isSelected = miscSkillIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setMiscSkillIds((prev) =>
                            isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          isSelected
                            ? "bg-purple-600 text-white border-purple-600 font-semibold"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {s.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Analysis Timeframe
              </label>
              <select
                value={miscTimeframe}
                onChange={(e) => setMiscTimeframe(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value={7}>Past 7 days</option>
                <option value={14}>Past 14 days (Recommended)</option>
                <option value={30}>Past 30 days</option>
                <option value={60}>Entire semester to date</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Questions to Generate: <span className="text-purple-600 font-bold">{miscCount}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={miscCount}
                onChange={(e) => setMiscCount(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsMisconceptionOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMining}
                onClick={handleMineMisconceptions}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {isMining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Student Inquiries...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyze & Generate Questions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Add / Edit Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingQuestion ? "Edit Bank Question" : "Add Question to Repository"}
              </h2>
              <button onClick={() => setIsQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as QuestionType)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="SINGLE_CHOICE">Single Choice</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="FILL_IN_BLANK">Fill-in-Blank</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proficiency Level
                </label>
                <select
                  value={formDifficulty}
                  onChange={(e) => setFormDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="NOVICE">Novice</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="COMPETENT">Competent</option>
                  <option value="PROFICIENT">Proficient</option>
                  <option value="MASTER">Master</option>
                </select>
              </div>

              {/* Skill */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mapped Skill
                </label>
                <select
                  value={formSkillId}
                  onChange={(e) => setFormSkillId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">(No specific skill)</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Question Stem / Prompt *
              </label>
              <textarea
                rows={3}
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                placeholder="Enter the complete question text..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Options for Single / Multiple Choice */}
            {formType !== "FILL_IN_BLANK" ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Options (Check the box for correct answer(s))
                </label>
                {formOptions.map((opt, optIdx) => (
                  <div key={opt.option_label} className="flex items-center gap-2">
                    <input
                      type={formType === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                      name="correct_option"
                      checked={opt.is_correct}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (formType === "SINGLE_CHOICE") {
                          setFormOptions((prev) =>
                            prev.map((o, idx) => ({ ...o, is_correct: idx === optIdx }))
                          );
                        } else {
                          setFormOptions((prev) =>
                            prev.map((o, idx) => (idx === optIdx ? { ...o, is_correct: checked } : o))
                          );
                        }
                      }}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span className="w-6 font-bold text-sm text-slate-700">{opt.option_label}</span>
                    <input
                      type="text"
                      value={opt.option_text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormOptions((prev) =>
                          prev.map((o, idx) => (idx === optIdx ? { ...o, option_text: val } : o))
                        );
                      }}
                      placeholder={`Text for option ${opt.option_label}`}
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accepted Correct Answer(s) (separate alternatives with |)
                </label>
                <input
                  type="text"
                  value={formFillAnswers}
                  onChange={(e) => setFormFillAnswers(e.target.value)}
                  placeholder="e.g. delete | delete operator"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}

            {/* Explanation & Rubric */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Explanation (Shown in review mode)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Rationale for the correct answer..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rubric / Grading Criteria
                </label>
                <textarea
                  rows={2}
                  value={formRubric}
                  onChange={(e) => setFormRubric(e.target.value)}
                  placeholder="Grading standard or partial credit policy..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingQuestion}
                onClick={handleSaveQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isSubmittingQuestion ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Question"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
