import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type QuizAvailability = "UPCOMING" | "OPEN" | "CLOSED" | "EXHAUSTED";
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export type StudentQuizListItem = {
  quiz_id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  opens_at: string | null;
  closes_at: string | null;
  max_attempts: number | null;
  attempts_used: number;
  attempts_left: number | null;
  availability: QuizAvailability;
  attempt_id: string | null;
  attempt_status: AttemptStatus | null;
  can_start: boolean;
  total_score: number | null;
  max_score: number | null;
  percentage: number | null;
  passing_score: number | null;
  passing_percentage: number | null;
  is_passed: boolean | null;
  official_attempt_id: string | null;
};

export type StudentQuizList = {
  server_time: string;
  quizzes: StudentQuizListItem[];
};

export type ExamOption = {
  id: string;
  option_label: string;
  option_text: string;
  order_index: number;
};

export type ExamQuestion = {
  id: string;
  question_type: QuestionType;
  question: string;
  points: number;
  difficulty: "REMEMBER" | "UNDERSTAND" | "APPLY";
  order_index: number;
  options: ExamOption[];
};

export type ResultOption = ExamOption & { is_correct: boolean };

export type ResultQuestion = Omit<ExamQuestion, "options"> & {
  explanation: string | null;
  rubric: string | null;
  source_reference: string | null;
  options: ResultOption[];
};

export type AnswerDraft = {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_labels: string[] | null;
  text_answer: string | null;
  is_marked_for_review: boolean;
  score_awarded: number | null;
  breakdown: Record<string, unknown> | null;
};

export type AnswerInput = {
  question_id: string;
  selected_option_labels?: string[] | null;
  text_answer?: string | null;
  is_marked_for_review?: boolean;
};

export type QuizAttemptResult = {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  total_score: number;
  max_score: number;
  percentage: number;
  passing_score: number | null;
  passing_percentage: number | null;
  is_passed: boolean | null;
  questions: ResultQuestion[];
  answers: AnswerDraft[];
};

export type QuizAttemptSession = {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_description: string | null;
  time_limit_minutes: number | null;
  status: AttemptStatus;
  started_at: string;
  deadline_at: string | null;
  server_time: string;
  remaining_seconds: number | null;
  questions: ExamQuestion[];
  answers: AnswerDraft[];
  total_points: number;
  answered_count: number;
  result: QuizAttemptResult | null;
};

function authHeaders(): HeadersInit {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  const detail = (body as { detail?: unknown }).detail;
  const message =
    typeof detail === "string"
      ? detail
      : response.status === 401
        ? "Session expired — please log in again."
        : response.status === 404
          ? "This quiz or attempt could not be found."
          : `Request failed (${response.status})`;
  return new Error(message);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    });
  } catch {
    throw new Error("Cannot reach the server. Your answers are kept locally; retry when online.");
  }
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

function attemptPath(attemptId: string, suffix = ""): string {
  return `/api/student/attempts/${encodeURIComponent(attemptId)}${suffix}`;
}

export const studentQuizApi = {
  list: (classId?: string) =>
    request<StudentQuizList>(
      `/api/student/quizzes${classId ? `?class_id=${encodeURIComponent(classId)}` : ""}`,
    ),
  start: (quizId: string) =>
    request<QuizAttemptSession>(
      `/api/student/quizzes/${encodeURIComponent(quizId)}/attempts`,
      { method: "POST" },
    ),
  get: (attemptId: string) => request<QuizAttemptSession>(attemptPath(attemptId)),
  saveAnswers: (attemptId: string, answers: AnswerInput[]) =>
    request<QuizAttemptSession>(attemptPath(attemptId, "/answers"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),
  submit: (attemptId: string, answers: AnswerInput[]) =>
    request<QuizAttemptSession>(attemptPath(attemptId, "/submit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),
};
