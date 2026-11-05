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
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  questions: QuizQuestion[];
};

export type ImportedQuiz = QuizDetail;

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
};
