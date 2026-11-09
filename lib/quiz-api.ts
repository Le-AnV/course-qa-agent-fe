import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type QuizImportIssue = {
  row_index: number;
  column: string | null;
  message: string;
};

export type QuizImportQuestion = {
  question_type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
  question: string;
  points: number;
  difficulty: "REMEMBER" | "UNDERSTAND" | "APPLY";
  explanation: string | null;
  rubric: string | null;
  source_reference: string | null;
  options: { option_label: string; option_text: string; is_correct: boolean }[];
  correct_answers: string[];
};

export type QuizImportPreview = {
  valid: boolean;
  errors: QuizImportIssue[];
  warnings: QuizImportIssue[];
  questions: QuizImportQuestion[];
};

export type QuizQuestion = {
  id: string;
  question_type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
  question: string;
  points: number;
  difficulty: "REMEMBER" | "UNDERSTAND" | "APPLY";
  order_index: number;
  explanation: string | null;
  rubric: string | null;
  source_reference: string | null;
  grading_config: { correct_answers?: string[] } | null;
  confidence: number | null;
  validation_flags: string[];
  options: {
    id: string;
    option_label: string;
    option_text: string;
    is_correct: boolean;
  }[];
};

export type QuizSummary = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  time_limit_minutes: number | null;
  opens_at: string | null;
  closes_at: string | null;
  max_attempts: number | null;
  question_count: number;
  created_at: string;
  updated_at: string;
};

export type QuizDetail = {
  id: string;
  class_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number | null;
  passing_percentage: number;
  opens_at: string | null;
  closes_at: string | null;
  max_attempts: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  approved_by_id: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  question_count: number;
  total_points: number;
  question_type_counts: Record<string, number>;
  questions: QuizQuestion[];
};

export type ImportedQuiz = QuizDetail;

export type QuizMetadataUpdate = {
  title?: string;
  description?: string | null;
  time_limit_minutes?: number | null;
  passing_percentage?: number | null;
  opens_at?: string | null;
  closes_at?: string | null;
  max_attempts?: number | null;
};

export type BlueprintCellAvailability = {
  skill_id: string;
  skill_code: string;
  skill_name: string;
  difficulty: string;
  available_in_bank: number;
};

export type BlueprintAvailabilityResponse = {
  class_id: string;
  cells: BlueprintCellAvailability[];
  total_bank_questions: number;
};

export type QuizGenerateBlueprintRequest = {
  title: string;
  description?: string | null;
  time_limit_minutes?: number | null;
  passing_score?: number | null;
  opens_at?: string | null;
  closes_at?: string | null;
  max_attempts?: number | null;
  target_skill_ids: string[];
  target_levels?: string[];
  questions_per_level?: number;
  auto_generate_missing?: boolean;
  document_ids?: string[];
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_solutions_after_submission?: boolean;
};

export type QuizQuestionInput = {
  question_type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
  question: string;
  points: number;
  difficulty:
    | "REMEMBER"
    | "UNDERSTAND"
    | "APPLY"
    | "NOVICE"
    | "BEGINNER"
    | "COMPETENT"
    | "PROFICIENT"
    | "MASTER";
  explanation: string | null;
  rubric: string | null;
  source_reference: string | null;
  options: { option_label: string; option_text: string; is_correct: boolean }[];
  correct_answers: string[];
};

// ---------------------------------------------------------------------------
// Results, attempt history and class statistics (AI-154)
// ---------------------------------------------------------------------------

export type QuizAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

/** One published quiz in the student's class list, with their own attempt summary. */
export type QuizStudentSummary = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  question_count: number;
  total_points: number;
  time_limit_minutes: number | null;
  passing_score: number | null;
  passing_percentage: number | null;
  attempt_count: number;
  submitted_count: number;
  has_in_progress: boolean;
  official_attempt_id: string | null;
  official_score: number | null;
  official_max_score: number | null;
  official_percentage: number | null;
  official_is_passed: boolean | null;
  official_submitted_at: string | null;
};

/** One row in the student's own attempt history for a quiz. */
export type QuizAttemptHistory = {
  id: string;
  quiz_id: string;
  status: QuizAttemptStatus;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  total_score: number | null;
  max_score: number | null;
  passing_score: number | null;
  passing_percentage: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  official: boolean;
};

export type QuizOptionResult = {
  id: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
};

export type QuizAnswerResult = {
  question_id: string;
  selected_option_labels: string[] | null;
  text_answer: string | null;
  score_awarded: number | null;
  is_correct: boolean | null;
};

export type QuizQuestionResult = {
  id: string;
  question_type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
  question: string;
  points: number;
  order_index: number;
  explanation: string | null;
  options: QuizOptionResult[];
  correct_option_labels: string[];
  accepted_text_answers: string[];
  answer: QuizAnswerResult | null;
};

/** Full result for one submitted attempt, including the answer review. */
export type QuizAttemptResult = {
  id: string;
  quiz_id: string;
  quiz_title: string;
  student_id: string;
  status: QuizAttemptStatus;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  total_score: number | null;
  max_score: number | null;
  passing_score: number | null;
  passing_percentage: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  official: boolean;
  show_explanations: boolean;
  questions: QuizQuestionResult[];
};

/** One row in the teacher's submissions table. */
export type QuizSubmission = {
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_code: string | null;
  student_email: string;
  status: QuizAttemptStatus;
  submitted_at: string | null;
  graded_at: string | null;
  total_score: number | null;
  max_score: number | null;
  passing_percentage: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  official: boolean;
};

export type QuizScoreBand = {
  band: string;
  count: number;
};

export type QuizQuestionStatistic = {
  question_id: string;
  order_index: number;
  question_type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
  question: string;
  points: number;
  answered_count: number;
  average_score: number;
  full_correct_rate: number;
};

/** Class statistics computed from one official attempt per student. */
export type QuizStatistics = {
  quiz_id: string;
  quiz_title: string;
  submitted_count: number;
  max_score: number;
  passing_percentage: number | null;
  average_score: number | null;
  average_percentage: number | null;
  pass_rate: number | null;
  score_bands: QuizScoreBand[];
  per_question: QuizQuestionStatistic[];
};

function token(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
}

async function responseError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  const detail = (body as { detail?: unknown }).detail;
  const message = typeof detail === "string" ? detail : `Request failed (${response.status})`;
  const error = new Error(message) as Error & { detail?: unknown };
  error.detail = detail;
  return error;
}

async function request<T>(path: string): Promise<T> {
  const auth = token();
  const response = await fetch(`${API_URL}${path}`, {
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
  });
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as T;
}

async function mutate<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const auth = token();
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw await responseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function quizPath(classId: string, quizId?: string, suffix = ""): string {
  const base = `/api/classes/${encodeURIComponent(classId)}/quizzes`;
  return quizId ? `${base}/${encodeURIComponent(quizId)}${suffix}` : base;
}

async function upload<T>(
  classId: string,
  file: File,
  form?: { title: string; description: string },
): Promise<T> {
  const data = new FormData();
  data.set("file", file);
  if (form) {
    data.set("title", form.title);
    if (form.description) data.set("description", form.description);
  }
  const auth = token();
  const response = await fetch(
    `${API_URL}/api/classes/${encodeURIComponent(classId)}/quizzes/import${form ? "" : "/preview"}`,
    { method: "POST", headers: auth ? { Authorization: `Bearer ${auth}` } : {}, body: data },
  );
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as T;
}

export const quizApi = {
  listQuizzes: (classId: string) =>
    request<QuizSummary[]>(`/api/classes/${encodeURIComponent(classId)}/quizzes`),
  getQuiz: (classId: string, quizId: string) =>
    request<QuizDetail>(
      `/api/classes/${encodeURIComponent(classId)}/quizzes/${encodeURIComponent(quizId)}`,
    ),
  previewImport: (classId: string, file: File) => upload<QuizImportPreview>(classId, file),
  importQuiz: (classId: string, file: File, title: string, description: string) =>
    upload<ImportedQuiz>(classId, file, { title, description }),
  updateQuiz: (classId: string, quizId: string, payload: QuizMetadataUpdate) =>
    mutate<QuizDetail>("PATCH", quizPath(classId, quizId), payload),
  addQuestion: (classId: string, quizId: string, payload: QuizQuestionInput) =>
    mutate<QuizDetail>("POST", quizPath(classId, quizId, "/questions"), payload),
  updateQuestion: (
    classId: string,
    quizId: string,
    questionId: string,
    payload: QuizQuestionInput,
  ) =>
    mutate<QuizDetail>(
      "PUT",
      quizPath(classId, quizId, `/questions/${encodeURIComponent(questionId)}`),
      payload,
    ),
  deleteQuestion: (classId: string, quizId: string, questionId: string) =>
    mutate<QuizDetail>(
      "DELETE",
      quizPath(classId, quizId, `/questions/${encodeURIComponent(questionId)}`),
    ),
  regenerateQuestion: (classId: string, quizId: string, questionId: string, instructions: string) =>
    mutate<QuizDetail>(
      "POST",
      quizPath(classId, quizId, `/questions/${encodeURIComponent(questionId)}/regenerate`),
      { instructions: instructions || null },
    ),
  approveQuiz: (classId: string, quizId: string) =>
    mutate<QuizDetail>("POST", quizPath(classId, quizId, "/approve")),
  reopenQuiz: (classId: string, quizId: string) =>
    mutate<QuizDetail>("POST", quizPath(classId, quizId, "/reopen")),
  deleteQuiz: (classId: string, quizId: string) =>
    mutate<void>("DELETE", quizPath(classId, quizId)),
  async exportQuiz(classId: string, quizId: string, fallbackName: string): Promise<void> {
    const auth = token();
    const response = await fetch(`${API_URL}${quizPath(classId, quizId, "/export")}`, {
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    });
    if (!response.ok) throw await responseError(response);
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = match ? match[1] : `${fallbackName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  },
  listSubmissions: (classId: string, quizId: string) =>
    request<QuizSubmission[]>(quizPath(classId, quizId, "/submissions")),
  getStatistics: (classId: string, quizId: string) =>
    request<QuizStatistics>(quizPath(classId, quizId, "/statistics")),
  async exportResults(classId: string, quizId: string, fallbackName: string): Promise<void> {
    const auth = token();
    const response = await fetch(
      `${API_URL}${quizPath(classId, quizId, "/results/export")}`,
      { headers: auth ? { Authorization: `Bearer ${auth}` } : {} },
    );
    if (!response.ok) throw await responseError(response);
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = match ? match[1] : `${fallbackName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  },
  async downloadTemplate(classId: string): Promise<void> {
    const auth = token();
    const response = await fetch(
      `${API_URL}/api/classes/${encodeURIComponent(classId)}/quizzes/import/template`,
      { headers: auth ? { Authorization: `Bearer ${auth}` } : {} },
    );
    if (!response.ok) throw await responseError(response);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "quiz_template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  },
  getBlueprintAvailability(classId: string): Promise<BlueprintAvailabilityResponse> {
    return request<BlueprintAvailabilityResponse>(
      `/api/classes/${encodeURIComponent(classId)}/quizzes/blueprint-matrix`,
    );
  },
  generateFromBlueprint(classId: string, payload: QuizGenerateBlueprintRequest): Promise<QuizDetail> {
    return mutate<QuizDetail>(
      "POST",
      `/api/classes/${encodeURIComponent(classId)}/quizzes/generate-blueprint`,
      payload,
    );
  },
};

/**
 * Student-side result reads (AI-154). These routes are ownership-scoped on the
 * backend: a caller only ever sees their own attempts.
 */
export const studentQuizResultApi = {
  listClassQuizzes: (classId: string) =>
    request<QuizStudentSummary[]>(
      `/api/student/classes/${encodeURIComponent(classId)}/quizzes`,
    ),
  listAttempts: (quizId: string) =>
    request<QuizAttemptHistory[]>(
      `/api/student/quizzes/${encodeURIComponent(quizId)}/attempts`,
    ),
  getAttemptResult: (quizId: string, attemptId: string) =>
    request<QuizAttemptResult>(
      `/api/student/quizzes/${encodeURIComponent(quizId)}/attempts/${encodeURIComponent(attemptId)}/result`,
    ),
};
