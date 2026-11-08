import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
export type QuestionDifficulty =
  | "NOVICE"
  | "BEGINNER"
  | "COMPETENT"
  | "PROFICIENT"
  | "MASTER"
  | "REMEMBER"
  | "UNDERSTAND"
  | "APPLY";
export type QuestionStatus = "DRAFT" | "APPROVED" | "ARCHIVED";
export type QuestionSourceType = "DOCUMENT" | "CHAT_MISCONCEPTION" | "MANUAL" | "EXCEL_IMPORT";

export type BankQuestionOption = {
  id?: string;
  question_id?: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_index?: number;
};

export type BankQuestion = {
  id: string;
  class_id: string;
  skill_id: string | null;
  skill_code: string | null;
  skill_name: string | null;
  created_by_id: string | null;
  question_type: QuestionType;
  question: string;
  points: number;
  difficulty: QuestionDifficulty;
  explanation: string | null;
  rubric: string | null;
  source_type: QuestionSourceType;
  source_document_id: string | null;
  source_document_name: string | null;
  source_reference: string | null;
  status: QuestionStatus;
  grading_config: Record<string, unknown> | null;
  correct_answers?: string[] | null;
  options: BankQuestionOption[];
  created_at: string;
  updated_at: string;
};

export type BankQuestionFilter = {
  skill_id?: string;
  question_type?: string;
  difficulty?: string;
  status?: string;
  source_type?: string;
  search?: string;
  skip?: number;
  limit?: number;
};

export type BankQuestionListResponse = {
  total: number;
  items: BankQuestion[];
  counts_by_difficulty: Record<string, number>;
  counts_by_type: Record<string, number>;
  counts_by_status: Record<string, number>;
};

export type BankQuestionCreatePayload = {
  question_type: QuestionType;
  question: string;
  points: number;
  difficulty: QuestionDifficulty;
  skill_id?: string | null;
  explanation?: string | null;
  rubric?: string | null;
  source_type?: QuestionSourceType;
  source_document_id?: string | null;
  source_reference?: string | null;
  status?: QuestionStatus;
  options?: {
    option_label: string;
    option_text: string;
    is_correct: boolean;
    order_index?: number;
  }[];
  correct_answers?: string[];
  grading_config?: Record<string, unknown>;
};

export type DocumentQuestionGenRequest = {
  document_ids: string[];
  skill_ids: string[];
  question_types: QuestionType[];
  difficulty_levels?: QuestionDifficulty[];
  questions_per_level?: Record<string, number>;
  num_questions?: number;
};

export type MisconceptionGenRequest = {
  timeframe_days: number;
  skill_ids: string[];
  questions_per_level?: Record<string, number>;
  num_questions?: number;
};

function token(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.detail || `Request failed with status ${res.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return res.json() as Promise<T>;
}

export const questionBankApi = {
  async list(classId: string, filters?: BankQuestionFilter): Promise<BankQuestionListResponse> {
    const auth = token();
    const url = new URL(`${API_URL}/api/classes/${classId}/question-bank`);
    if (filters?.skill_id) url.searchParams.set("skill_id", filters.skill_id);
    if (filters?.question_type) url.searchParams.set("question_type", filters.question_type);
    if (filters?.difficulty) url.searchParams.set("difficulty", filters.difficulty);
    if (filters?.status) url.searchParams.set("status", filters.status);
    if (filters?.source_type) url.searchParams.set("source_type", filters.source_type);
    if (filters?.search) url.searchParams.set("search", filters.search);
    if (filters?.skip !== undefined) url.searchParams.set("skip", String(filters.skip));
    if (filters?.limit !== undefined) url.searchParams.set("limit", String(filters.limit));

    const res = await fetch(url.toString(), {
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    });
    return handleResponse<BankQuestionListResponse>(res);
  },

  async create(classId: string, payload: BankQuestionCreatePayload): Promise<BankQuestion> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/question-bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BankQuestion>(res);
  },

  async update(
    classId: string,
    questionId: string,
    payload: Partial<BankQuestionCreatePayload>
  ): Promise<BankQuestion> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/question-bank/${questionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BankQuestion>(res);
  },

  async delete(classId: string, questionId: string): Promise<void> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/question-bank/${questionId}`, {
      method: "DELETE",
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.detail || `Failed to delete question (${res.status})`);
    }
  },

  async bulkUpdateStatus(
    classId: string,
    questionIds: string[],
    status: QuestionStatus
  ): Promise<{ updated_count: number }> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/question-bank/bulk-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify({ question_ids: questionIds, status }),
    });
    return handleResponse<{ updated_count: number }>(res);
  },

  async generateFromDocuments(
    classId: string,
    payload: DocumentQuestionGenRequest
  ): Promise<BankQuestion[]> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/question-bank/generate-from-documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BankQuestion[]>(res);
  },

  async mineMisconceptions(
    classId: string,
    payload: MisconceptionGenRequest
  ): Promise<BankQuestion[]> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/question-bank/mine-misconceptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BankQuestion[]>(res);
  },

  async exportExcel(
    classId: string,
    filters?: { skill_id?: string; question_type?: string; difficulty?: string; status?: string }
  ): Promise<Blob> {
    const auth = token();
    const url = new URL(`${API_URL}/api/classes/${classId}/question-bank/export-excel`);
    if (filters?.skill_id) url.searchParams.set("skill_id", filters.skill_id);
    if (filters?.question_type) url.searchParams.set("question_type", filters.question_type);
    if (filters?.difficulty) url.searchParams.set("difficulty", filters.difficulty);
    if (filters?.status) url.searchParams.set("status", filters.status);

    const res = await fetch(url.toString(), {
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    });
    if (!res.ok) {
      throw new Error(`Failed to export questions (${res.status})`);
    }
    return res.blob();
  },

  async importExcel(
    classId: string,
    file: File
  ): Promise<{ imported_count: number; warnings: string[] }> {
    const auth = token();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/api/classes/${classId}/question-bank/import-excel`, {
      method: "POST",
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
      body: formData,
    });
    return handleResponse<{ imported_count: number; warnings: string[] }>(res);
  },
};

