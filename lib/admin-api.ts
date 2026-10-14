import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Course = { id: string; code: string; title: string; class_count: number };
export type ClassSection = {
  id: string;
  course_id: string;
  course_code: string;
  code: string;
  trainer_id: string | null;
  trainer_name: string | null;
  ta_id: string | null;
  ta_name: string | null;
  student_count: number;
  document_count: number;
  ticket_count: number;
};
export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  class_id: string | null;
  class_code: string | null;
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
export type EmailStats = { pending: number; sent: number; failed: number };
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

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const adminApi = {
  // Courses & classes (AC-01, AC-02, AC-12)
  courses: () => apiFetch<Course[]>("/api/admin/courses"),
  createCourse: (code: string, title: string) =>
    apiFetch<Course>("/api/admin/courses", { method: "POST", body: JSON.stringify({ code, title }) }),
  classes: (courseId?: string | number) =>
    apiFetch<ClassSection[]>(`/api/admin/classes${courseId ? `?course_id=${courseId}` : ""}`),
  createClass: (course_id: string | number, code: string, name?: string, semester?: string, academic_year?: string, trainer_id?: string | number) =>
    apiFetch<ClassSection>("/api/admin/classes", {
      method: "POST",
      body: JSON.stringify({ course_id, code, name, semester, academic_year, trainer_id: trainer_id || null }),
    }),
  assignStaff: (classId: string | number, trainer_id: string | number | null, ta_id: string | number | null) =>
    apiFetch<ClassSection>(`/api/admin/classes/${classId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ trainer_id, ta_id }),
    }),
  deleteClass: (classId: string | number) =>
    apiFetch<{ deleted: string; document_count: number; ticket_count: number; member_count: number }>(
      `/api/admin/classes/${classId}`,
      { method: "DELETE" },
    ),

  // Accounts (AC-03, AC-11, AC-12)
  users: () => apiFetch<AdminUser[]>("/api/admin/users"),
  createUser: (username: string, email: string, role: string, class_code?: string) =>
    apiFetch<AdminUser>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ username, email, role, class_code: class_code || null }),
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
    const res = await fetch(`${API_URL}/api/admin/imports`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
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
  updateEmailConfig: (patch: Partial<EmailConfig> & { smtp_app_password?: string }) =>
    apiFetch<EmailConfig>("/api/admin/email-config", { method: "PATCH", body: JSON.stringify(patch) }),
  emailStats: () => apiFetch<EmailStats>("/api/admin/email-queue/stats"),
  emailQueue: (status?: string) =>
    apiFetch<EmailEntry[]>(`/api/admin/email-queue${status ? `?status=${status}` : ""}`),
  processQueue: () => apiFetch<{ processed: number; sent: number; failed: number }>("/api/admin/email-queue/process", { method: "POST" }),
  retryEmail: (emailId: number) =>
    apiFetch<{ id: number; status: string }>(`/api/admin/email-queue/${emailId}/retry`, { method: "POST" }),
  sendTestEmail: (to_email: string) =>
    apiFetch<{ sent_to: string }>("/api/admin/email-config/test", {
      method: "POST",
      body: JSON.stringify({ to_email }),
    }),
};
