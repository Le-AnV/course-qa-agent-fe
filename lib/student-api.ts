import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type StudentClass = {
  id: string;
  code: string;
  name: string;
  trainer_name: string | null;
  credits: number;
  semester: string;
  academic_year: string;
  member_count: number;
  document_count: number;
};

export type ClassMember = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export type ClassDocument = {
  id: string;
  file_name: string;
  file_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
};

export type CatalogClass = StudentClass & {
  my_status: "active" | "pending" | "none";
};

export type JoinRequest = {
  id: string;
  class_id: string;
  class_code: string;
  student_id: string;
  username: string;
  email: string;
  role: string;
  status: string;
};

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function studentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  } catch {
    throw new Error(
      `Cannot reach backend at ${API_URL} — check the BE is running (docker compose up).`,
    );
  }
  if (res.status === 401) throw new Error("Session expired — please log in again.");
  if (res.status === 403) throw new Error("You are not a member of this class.");
  if (res.status === 404) throw new Error("Class not found.");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const studentApi = {
  classes: () => studentFetch<StudentClass[]>("/api/student/classes"),
  classDetail: (id: string) => studentFetch<StudentClass>(`/api/student/classes/${id}`),
  members: (id: string) => studentFetch<ClassMember[]>(`/api/student/classes/${id}/members`),
  documents: (id: string) => studentFetch<ClassDocument[]>(`/api/student/classes/${id}/documents`),
  // Enrollment requests: browse the catalog, request to join, TA approves.
  catalog: () => studentFetch<CatalogClass[]>("/api/student/catalog"),
  requestJoin: (id: string) =>
    studentFetch<JoinRequest>(`/api/student/classes/${id}/request`, { method: "POST" }),
  myRequests: () => studentFetch<JoinRequest[]>("/api/student/requests"),
  cancelRequest: (id: string) =>
    studentFetch<{ cancelled: string }>(`/api/student/classes/${id}/request`, { method: "DELETE" }),
  pendingRequests: (id: string) =>
    studentFetch<JoinRequest[]>(`/api/student/classes/${id}/requests`),
  approveRequest: (classId: string, studentId: string) =>
    studentFetch<JoinRequest>(`/api/student/classes/${classId}/requests/${studentId}/approve`, {
      method: "POST",
    }),
  rejectRequest: (classId: string, studentId: string) =>
    studentFetch<{ rejected: string }>(`/api/student/classes/${classId}/requests/${studentId}/reject`, {
      method: "POST",
    }),
};

/** Accent color per class, stable by id (UI only). */
const ACCENTS = ["#2563EB", "#0EA5E9", "#6366F1", "#10B981", "#F59E0B", "#EC4899"];

export function accentFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export function termFor(c: StudentClass): string {
  return `${c.semester} ${c.academic_year}`;
}
