import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ClassTrainer = {
  trainer_id: string;
  name: string | null;
  email: string | null;
  is_primary: boolean;
};
export type ClassSection = {
  id: string;
  code: string;
  trainer_id: string | null;
  trainer_name: string | null;
  // Primary trainer first, then co-trainers. Optional: an older backend build
  // does not send it, so the UI falls back to trainer_id/trainer_name.
  trainers?: ClassTrainer[];
  credits: number;
  student_count: number;
  // P5: roster capacity (None = unlimited). P7: ACTIVE | ARCHIVED.
  capacity?: number | null;
  status?: string;
  document_count: number;
  ticket_count: number;
  // Subjects a student must pass before joining this class.
  prerequisites?: { id: string; code: string; name: string }[];
};
export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  class_id: string | null;
  class_code: string | null;
  student_code: string | null;
  staff_code?: string | null;
  is_active: boolean;
};
export type ImportRow = {
  id: number;
  row_number: number;
  username: string;
  email: string;
  role_raw: string;
  class_raw: string;
  status: "imported" | "skipped" | "failed";
  message: string;
  student_code: string | null;
  staff_code?: string | null;
};
export type ImportBatch = {
  id: number;
  filename: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  created_at: string;
};
export type ImportBatchDetail = ImportBatch & { rows: ImportRow[] };
export type EmailStats = {
  pending: number;
  sent: number;
  failed: number;
  // Live drain progress (AC-09) — present while "Send pending emails" is running.
  draining?: boolean;
  drain_started_at?: string | null;
  drain_total?: number;
  drain_done?: number;
  drain_sent?: number;
  drain_failed?: number;
};
export type EmailEntry = {
  id: number;
  to_email: string;
  subject: string;
  status: string;
  attempts: number;
  last_error: string;
  created_at: string;
  sent_at: string | null;
};
export type EmailConfig = {
  smtp_host: string;
  smtp_port: number;
  smtp_sender: string;
  has_app_password: boolean;
  smtp_rate_per_minute: number;
  email_dry_run: boolean;
};
export type AdminSettings = {
  llm: { model: string; api_key_configured: boolean };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_security: string;
    sender_email: string | null;
    rate_limit_per_minute: number;
    app_password_configured: boolean;
  };
};
export type GeminiKeyStatus = "active" | "paused" | "invalid" | "cooldown";
export type GeminiKey = {
  id: string;
  name: string;
  account_label: string | null;
  project_label: string | null;
  masked_key: string;
  status: GeminiKeyStatus;
  priority: number;
  available_models: string[];
  cooldown_until: string | null;
  last_error: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};
export type GeminiKeys = {
  keys: GeminiKey[];
  active_count: number;
  env_configured: boolean;
  auto_switch: boolean;
};
export type GeminiAutoSwitch = {
  enabled: boolean;
};
export type GeminiModelConfig = {
  model: string;
  available_models: string[];
};
export type GeminiKeyCreate = {
  name: string;
  api_key: string;
};
export type GeminiKeyUpdate = {
  name?: string;
  status?: "active" | "paused";
};
export type ConnectionTest = { success: boolean; message: string };
export type RetrievalConfig = {
  // AI-65: best similarity score needed to answer from class materials.
  // Below it, the question is handed to the Internet source agent.
  threshold: number;
  default_threshold: number;
  is_default: boolean;
  updated_at: string | null;
  unrelated_threshold: number;
  default_unrelated_threshold: number;
};
export type RetrievalTestResult = {
  question: string;
  top_score: number | null;
  class_id: string | null;
  class_name: string | null;
  matched_document: string | null;
  matched_snippet: string | null;
  source: string;
};
export type HealthComponent = {
  name: string;
  status: "up" | "down" | "configured" | "unconfigured";
  healthy: boolean;
  detail: string;
};
export type SystemHealth = {
  status: "ok" | "degraded";
  service: string;
  components: HealthComponent[];
};

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers ?? {}) },
    });
  } catch {
    throw new Error(
      `Cannot reach backend at ${API_URL} — check "docker compose up -d --build" and the backend logs (migrations run on start), then Retry.`,
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const adminApi = {
  // Classes (standalone: class IS the subject). Course endpoints are legacy
  // and no longer used by the UI.
  classes: () => apiFetch<ClassSection[]>("/api/admin/classes"),
  createClass: (args: {
    code: string;
    trainer_id: string;
    name?: string;
    semester?: string;
    academic_year?: string;
    credits?: number;
    capacity?: number;
    prerequisite_class_ids?: string[];
  }) =>
    apiFetch<ClassSection>("/api/admin/classes", {
      method: "POST",
      body: JSON.stringify(args),
    }),
  assignStaff: (classId: string, trainer_id: string | null) =>
    apiFetch<ClassSection>(`/api/admin/classes/${classId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ trainer_id }),
    }),
  setPrerequisites: (classId: string, prerequisite_class_ids: string[]) =>
    apiFetch<ClassSection>(`/api/admin/classes/${classId}/prerequisites`, {
      method: "PATCH",
      body: JSON.stringify({ prerequisite_class_ids }),
    }),
  // Co-teaching / mid-semester handover: teacher A starts, teacher B joins.
  addTrainer: (classId: string, trainer_id: string) =>
    apiFetch<ClassSection>(`/api/admin/classes/${classId}/trainers`, {
      method: "POST",
      body: JSON.stringify({ trainer_id }),
    }),
  removeTrainer: (classId: string, trainerId: string) =>
    apiFetch<ClassSection>(`/api/admin/classes/${classId}/trainers/${trainerId}`, {
      method: "DELETE",
    }),
  // P7: archive hides the class from teachers/students; ACTIVE restores it.
  setClassStatus: (classId: string, status: "ACTIVE" | "ARCHIVED") =>
    apiFetch<ClassSection>(`/api/admin/classes/${classId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteClass: (classId: string | number) =>
    apiFetch<{ deleted: string; document_count: number; ticket_count: number; member_count: number }>(
      `/api/admin/classes/${classId}`,
      { method: "DELETE" },
    ),
  // Roster capacity is an admin-owned setting (PATCH /api/classes/{id}/config);
  // class trainers read it but cannot change it (backend rejects with 403).
  setClassCapacity: (classId: string, capacity: number | null) =>
    apiFetch<{ class_id: string; capacity: number | null }>(`/api/classes/${classId}/config`, {
      method: "PATCH",
      body: JSON.stringify({ capacity }),
    }),

  // Accounts (AC-03, AC-11, AC-12)
  users: () => apiFetch<AdminUser[]>("/api/admin/users"),
  createUser: (
    username: string,
    email: string,
    role: string,
    class_code?: string,
    student_code?: string,
    staff_code?: string,
  ) =>
    apiFetch<AdminUser>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username,
        email,
        role,
        class_code: class_code || null,
        student_code: student_code || null,
        staff_code: staff_code || null,
      }),
    }),
  generateUserCode: (fullName: string, role: string) =>
    apiFetch<{ code: string }>("/api/admin/users/generate-code", {
      method: "POST",
      body: JSON.stringify({ full_name: fullName, role }),
    }),
  setActive: (userId: string | number, is_active: boolean) =>
    apiFetch<AdminUser>(`/api/admin/users/${userId}/active`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    }),
  resetPassword: (userId: string | number) =>
    apiFetch<{ user_id: string; emailed_to: string }>(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
    }),
  deleteUser: (userId: string | number) =>
    apiFetch<{ deleted: string }>(`/api/admin/users/${userId}?confirm=true`, { method: "DELETE" }),

  // Import (AC-05..AC-10)
  templateUrl: () => `${API_URL}/api/admin/import-template`,
  authToken: () => (typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null),
  uploadImport: async (file: File): Promise<ImportBatch> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/admin/imports`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
    } catch {
      throw new Error(
        `Cannot reach backend at ${API_URL} — check "docker compose up -d --build" and the backend logs (migrations run on start), then Retry.`,
      );
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { detail?: string }).detail ?? `Upload failed (${res.status})`);
    }
    return (await res.json()) as ImportBatch;
  },
  imports: () => apiFetch<ImportBatch[]>("/api/admin/imports"),
  importDetail: (batchId: number | string) => apiFetch<ImportBatchDetail>(`/api/admin/imports/${batchId}`),

  // Email (AC-08, AC-09)
  emailConfig: () => apiFetch<EmailConfig>("/api/admin/email-config"),
  updateEmailConfig: (
    patch: Omit<Partial<EmailConfig>, "email_dry_run"> & { smtp_app_password?: string },
  ) =>
    apiFetch<EmailConfig>("/api/admin/email-config", { method: "PATCH", body: JSON.stringify(patch) }),
  emailStats: () => apiFetch<EmailStats>("/api/admin/email-queue/stats"),
  emailQueue: (status?: string) =>
    apiFetch<EmailEntry[]>(`/api/admin/email-queue${status ? `?status=${status}` : ""}`),
  processQueue: () => apiFetch<{ processed: number; sent: number; failed: number; busy?: boolean }>("/api/admin/email-queue/process", { method: "POST" }),
  retryEmail: (emailId: number) =>
    apiFetch<{ id: number; status: string }>(`/api/admin/email-queue/${emailId}/retry`, { method: "POST" }),
  retryImportRow: (rowId: number) =>
    apiFetch<ImportRow>(`/api/admin/import-rows/${rowId}/retry`, { method: "POST" }),
  // AI-105 runtime settings (read-only from UI, secrets never returned)
  adminSettings: () => apiFetch<AdminSettings>("/api/admin/settings"),
  geminiKeys: () => apiFetch<GeminiKeys>("/api/admin/llm/keys"),
  updateGeminiAutoSwitch: (enabled: boolean) =>
    apiFetch<GeminiAutoSwitch>("/api/admin/llm/auto-switch", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  createGeminiKey: (payload: GeminiKeyCreate) =>
    apiFetch<GeminiKey>("/api/admin/llm/keys", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateGeminiKey: (keyId: string, payload: GeminiKeyUpdate) =>
    apiFetch<GeminiKey>(`/api/admin/llm/keys/${keyId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteGeminiKey: (keyId: string) =>
    apiFetch<void>(`/api/admin/llm/keys/${keyId}`, { method: "DELETE" }),
  testGeminiKey: (keyId: string) =>
    apiFetch<ConnectionTest>(`/api/admin/llm/keys/${keyId}/test`, { method: "POST" }),
  geminiModels: () => apiFetch<GeminiModelConfig>("/api/admin/llm/models"),
  updateGeminiModel: (model: string) =>
    apiFetch<GeminiModelConfig>("/api/admin/llm/model", {
      method: "PATCH",
      body: JSON.stringify({ model }),
    }),
  testLlm: () => apiFetch<ConnectionTest>("/api/admin/llm/test-connection", { method: "POST" }),
  // AI-65: KB-vs-Internet routing threshold (T35, admin-configurable).
  retrievalConfig: () => apiFetch<RetrievalConfig>("/api/admin/retrieval-config"),
  updateRetrievalConfig: (threshold: number, unrelated_threshold?: number) =>
    apiFetch<RetrievalConfig>("/api/admin/retrieval-config", {
      method: "PATCH",
      body: JSON.stringify({ threshold, unrelated_threshold }),
    }),
  testRetrievalQuery: (question: string, class_id?: string) =>
    apiFetch<RetrievalTestResult>("/api/admin/retrieval-config/test", {
      method: "POST",
      body: JSON.stringify({ question, class_id }),
    }),
  // AI-109 system monitoring: live DB/Qdrant/LLM component health.
  systemHealth: () => apiFetch<SystemHealth>("/api/admin/system/health"),
  downloadTemplate: async (): Promise<Blob> => {
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!token) throw new Error("Not logged in — please log in as admin first.");
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/admin/import-template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new Error(
        `Cannot reach backend at ${API_URL} — check "docker compose up -d --build" and the backend logs (migrations run on start), then Retry.`,
      );
    }
    if (res.status === 401) throw new Error("Session expired — please log in again as admin.");
    if (res.status === 403) throw new Error("Admin only — your account is not an admin.");
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { detail?: string }).detail ?? `Template download failed (${res.status})`);
    }
    return await res.blob();
  },
};
