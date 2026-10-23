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
  // Optional: an older backend build does not send these.
  capacity?: number | null;
  status?: string;
};

export type ClassConfig = {
  class_id: string;
  capacity: number | null;
  delivery_mode: "on_campus" | "online" | "hybrid";
  default_language: "en" | "vi";
  answer_scope: "syllabus_only" | "syllabus_first" | "open";
  citation_required: boolean;
  max_answer_words: number;
  session_length_minutes: number;
};

export type ClassConfigSource = {
  id: string;
  code: string;
  name: string;
  status?: string;
};

/** An approved source document offered when copying a class template. */
export type TemplateDocument = {
  id: string;
  file_name: string;
  file_type: string;
  size_bytes: number;
  version: number;
};

export type TemplateDocumentSkip = {
  file_name: string;
  reason: string;
};

export const CLASS_INFO_FIELDS = [
  "description",
  "meeting_url",
  "group_url",
  "schedule_note",
  "note",
] as const;

export type ClassInfoField = (typeof CLASS_INFO_FIELDS)[number];

export type TemplateCopyOptions = {
  copyConfig?: boolean;
  infoFields?: ClassInfoField[];
};

export type TemplateCopyResult = {
  config: ClassConfig;
  info: ClassInfo;
  copied_documents: TemplateDocument[];
  skipped_documents: TemplateDocumentSkip[];
};

/** The class page (Phase B): written by teachers/admins, read by members. */
export type ClassInfo = {
  class_id: string;
  description: string | null;
  meeting_url: string | null;
  group_url: string | null;
  schedule_note: string | null;
  note: string | null;
};

export type ClassMember = {
  id: string;
  username: string;
  email: string;
  role: string;
  // Trainer-marked term result: null | PASSED | FAILED.
  result?: string | null;
};

export type ClassDocument = {
  id: string;
  file_name: string;
  file_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
};

export type SyllabusUnit = {
  id: string;
  unit_number: number;
  unit_title: string;
  description: string | null;
  content: string;
};

export type ClassSyllabusRoadmap = {
  class_id: string;
  document_id: string | null;
  file_name: string | null;
  topic_outline: string | null;
  units: SyllabusUnit[];
};

export type CatalogClass = StudentClass & {
  my_status: "active" | "pending" | "none";
  // Prerequisites the caller has not passed yet; empty means unlocked.
  blocked_prerequisites?: { id: string; code: string; name: string }[];
  can_request?: boolean;
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
      `Cannot reach backend at ${API_URL} — check "docker compose up -d --build" and the backend logs (migrations run on start), then Retry.`,
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
  // Trainer only: mark a member's term result (null | PASSED | FAILED).
  setResult: (classId: string, studentId: string, result: "PASSED" | "FAILED" | null) =>
    studentFetch<ClassMember>(`/api/student/classes/${classId}/members/${studentId}/result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    }),
  documents: (id: string) => studentFetch<ClassDocument[]>(`/api/student/classes/${id}/documents`),
  syllabusRoadmap: (classId: string) =>
    studentFetch<ClassSyllabusRoadmap>(`/api/student/classes/${classId}/syllabus`),
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
  // Class configuration (capacity + typed teaching config), trainer/admin only.
  config: (id: string) => studentFetch<ClassConfig>(`/api/classes/${id}/config`),
  updateConfig: (id: string, changes: Partial<Omit<ClassConfig, "class_id">>) =>
    studentFetch<ClassConfig>(`/api/classes/${id}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    }),
  configSources: () => studentFetch<ClassConfigSource[]>("/api/classes/config-sources"),
  copyConfig: (id: string, sourceClassId: string) =>
    studentFetch<ClassConfig>(`/api/classes/${id}/config/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_class_id: sourceClassId }),
    }),
  // One-time template copy: config + class information + approved documents.
  templateDocuments: (id: string, sourceClassId: string) =>
    studentFetch<TemplateDocument[]>(
      `/api/classes/${id}/template-documents?source_class_id=${encodeURIComponent(sourceClassId)}`,
    ),
  copyTemplate: (
    id: string,
    sourceClassId: string,
    documentIds: string[],
    options: TemplateCopyOptions = {},
  ) =>
    studentFetch<TemplateCopyResult>(`/api/classes/${id}/template-copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_class_id: sourceClassId,
        document_ids: documentIds,
        copy_config: options.copyConfig ?? true,
        info_fields: options.infoFields ?? [],
      }),
    }),
  // Class page: description, links, schedule and notes for this class.
  info: (id: string) => studentFetch<ClassInfo>(`/api/classes/${id}/info`),
  updateInfo: (id: string, changes: Partial<Omit<ClassInfo, "class_id">>) =>
    studentFetch<ClassInfo>(`/api/classes/${id}/info`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    }),
};

/** Accent color per class, stable by id (UI only). Muted set — class identity, not decoration. */
const ACCENTS = ["#5B7C99", "#4B9E76", "#B4881F", "#7C6E9E", "#C4644C", "#6F6F6F"];

export function accentFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export function termFor(c: StudentClass): string {
  return `${c.semester} ${c.academic_year}`;
}
