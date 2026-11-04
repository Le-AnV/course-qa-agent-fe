import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Category = {
  id: string;
  class_id: string;
  parent_id: string | null;
  name: string;
  chunk_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  subcategories: Category[];
};

export type CategoryTreeResponse = {
  items: Category[];
  total_categories: number;
  total_chunks: number;
};

export type CategoryCreatePayload = {
  name: string;
  parent_id?: string | null;
};

export type CategoryUpdatePayload = {
  name?: string;
  parent_id?: string | null;
};

export type CategoryGenerateResponse = {
  message: string;
  generated_categories_count: number;
  categories: Category[];
};

export type ContentGapQuestion = {
  id: string;
  question: string;
  timestamp: string;
  concept_tag?: string | null;
};

export type ContentGapReasonGroup = {
  reason_type: "missing_code" | "missing_comparison" | "debugging_error" | "missing_concept";
  title: string;
  explanation: string;
  questions: ContentGapQuestion[];
  question_count: number;
};

export type QuestionPattern = {
  pattern: string;
  inquiry_count: number;
  total_inquiry_count?: number;
  student_count: number;
  pedagogical_category: string;
  sample_question?: string | null;
  suggested_action?: string | null;
  scope_type?: "core_curriculum" | "enrichment" | null;
};

export type StudentWeaknessProfile = {
  struggle_summary: string;
  severity: "high" | "medium" | "low";
  question_patterns: QuestionPattern[];
};

export type CurriculumGapProfile = {
  missing_points: string[];
  recommendation: string;
};

export type ContentGapTopicReport = {
  category_id: string;
  category_name: string;
  parent_id?: string | null;
  material_answers: number;
  web_fallbacks: number;
  dedup_web_fallbacks?: number;
  total_queries: number;
  fallback_ratio: number;
  distinct_students: number;
  class_percentage: number;
  status: "critical" | "warning" | "good";
  student_weakness?: StudentWeaknessProfile;
  curriculum_gap?: CurriculumGapProfile;
  reason_groups: ContentGapReasonGroup[];
};

export type ContentGapDashboardResponse = {
  class_id: string;
  total_web_fallbacks: number;
  total_material_answers: number;
  overall_coverage_rate: number;
  critical_topics_count: number;
  total_students_enrolled: number;
  topics: ContentGapTopicReport[];
  last_updated_at: string;
};

function token(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = token();
  const headers = new Headers(init?.headers);
  if (auth) headers.set("Authorization", `Bearer ${auth}`);
  if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.detail || `Request failed with status ${response.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return response.json();
}

export const contentGapApi = {
  getCategories(classId: string): Promise<CategoryTreeResponse> {
    return request<CategoryTreeResponse>(`/api/classes/${encodeURIComponent(classId)}/categories`);
  },

  createCategory(classId: string, payload: CategoryCreatePayload): Promise<Category> {
    return request<Category>(`/api/classes/${encodeURIComponent(classId)}/categories`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCategory(classId: string, categoryId: string, payload: CategoryUpdatePayload): Promise<Category> {
    return request<Category>(
      `/api/classes/${encodeURIComponent(classId)}/categories/${encodeURIComponent(categoryId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },

  deleteCategory(classId: string, categoryId: string): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>(
      `/api/classes/${encodeURIComponent(classId)}/categories/${encodeURIComponent(categoryId)}`,
      {
        method: "DELETE",
      },
    );
  },

  generateCategories(classId: string): Promise<CategoryGenerateResponse> {
    return request<CategoryGenerateResponse>(
      `/api/classes/${encodeURIComponent(classId)}/categories/generate`,
      {
        method: "POST",
      },
    );
  },

  getContentGaps(classId: string): Promise<ContentGapDashboardResponse> {
    return request<ContentGapDashboardResponse>(
      `/api/classes/${encodeURIComponent(classId)}/content-gaps`,
    );
  },

  refreshContentGaps(classId: string): Promise<ContentGapDashboardResponse> {
    return request<ContentGapDashboardResponse>(
      `/api/classes/${encodeURIComponent(classId)}/content-gaps/refresh`,
      {
        method: "POST",
      },
    );
  },
};
