/**
 * E2 documents client (AI-35/37/41): upload, list/search/filter, class tags.
 * Talks to `GET|POST /api/documents` when the backend runs; the materials
 * page (/teacher/materials) falls back to mock data so the UI is reviewable
 * without the backend.
 */

export type DocumentStatus =
  | "pending"
  | "processing"
  | "indexed"
  | "rejected"
  | "failed";

export type ClassOption = {
  id: string;
  courseId: string;
  name: string;
  code: string;
};

export type DocumentItem = {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  classId: string;
  className: string;
  status: DocumentStatus;
  createdAt: string;
};

export type AcceptedType = {
  extension: string;
  mime: string;
  label: string;
};

/** Upload AC-01/AC-07: the 7 accepted material formats, max 100MB per file. */
export const ACCEPTED_TYPES: AcceptedType[] = [
  { extension: ".pdf", mime: "application/pdf", label: "PDF document" },
  {
    extension: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word document",
  },
  { extension: ".md", mime: "text/markdown", label: "Markdown" },
  { extension: ".txt", mime: "text/plain", label: "Plain text" },
  {
    extension: ".pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "PowerPoint",
  },
  {
    extension: ".xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    label: "Excel",
  },
  { extension: ".csv", mime: "text/csv", label: "CSV" },
];

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export const MOCK_CLASSES: ClassOption[] = [
  { id: "class-a", courseId: "course-cs101", name: "CS101 - Class A", code: "CS101-A" },
  { id: "class-b", courseId: "course-cs101", name: "CS101 - Class B", code: "CS101-B" },
];

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    fileName: "syllabus.pdf",
    fileType: ".pdf",
    mimeType: "application/pdf",
    sizeBytes: 245760,
    uploaderId: "trainer-1",
    classId: "class-a",
    className: "CS101 - Class A",
    status: "indexed",
    createdAt: "2026-10-01T09:00:00Z",
  },
  {
    id: "doc-2",
    fileName: "week1-slides.pptx",
    fileType: ".pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    sizeBytes: 5242880,
    uploaderId: "trainer-1",
    classId: "class-a",
    className: "CS101 - Class A",
    status: "pending",
    createdAt: "2026-10-08T14:30:00Z",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AuthHeaders = {
  token: string;
};

function headers(auth: AuthHeaders): HeadersInit {
  return {
    Authorization: `Bearer ${auth.token}`,
  };
}

export async function fetchMyClasses(auth: AuthHeaders): Promise<ClassOption[]> {
  const res = await fetch(`${API_URL}/api/documents/classes/mine`, {
    headers: headers(auth),
  });
  if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
  const rows = (await res.json()) as {
    id: string;
    course_id: string;
    name: string;
    code: string;
  }[];
  return rows.map((r) => ({ id: r.id, courseId: r.course_id, name: r.name, code: r.code }));
}

type DocumentRow = {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  size_bytes: number;
  uploader_id: string;
  class_id: string;
  class_name: string;
  status: DocumentStatus;
  created_at: string;
};

function toItem(i: DocumentRow): DocumentItem {
  return {
    id: i.id,
    fileName: i.file_name,
    fileType: i.file_type,
    mimeType: i.mime_type,
    sizeBytes: i.size_bytes,
    uploaderId: i.uploader_id,
    classId: i.class_id,
    className: i.class_name,
    status: i.status,
    createdAt: i.created_at,
  };
}
export type ListParams = {
  search?: string;
  classId?: string;
  fileType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function fetchDocuments(
  auth: AuthHeaders,
  params: ListParams,
): Promise<{ items: DocumentItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.classId) query.set("class_id", params.classId);
  if (params.fileType) query.set("file_type", params.fileType);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 20));
  const res = await fetch(`${API_URL}/api/documents/?${query.toString()}`, {
    headers: headers(auth),
  });
  if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
  const body = (await res.json()) as {
    items: DocumentRow[];
    total: number;
  };
  return {
    items: body.items.map(toItem),
    total: body.total,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type DocumentFilters = {
  search: string;
  classId: string;
  fileType: string;
  status: string;
};

export function acceptedExtensions(): string[] {
  return ACCEPTED_TYPES.map((t) => t.extension);
}

/**
 * AI-41 (AC-01): keep the upload target class valid when the async class
 * list arrives after mount. Keeps `current` if it still exists, otherwise
 * falls back to the first class ("" when the list is empty, blocking upload).
 */
export function resolveDefaultClassId(
  classes: ClassOption[],
  current: string,
): string {
  if (current && classes.some((c) => c.id === current)) return current;
  return classes[0]?.id ?? "";
}

/** Upload AC-01/AC-07 client validation (pure, unit-tested). */
export function validationError(file: Pick<File, "name" | "size">): string | null {
  const dot = file.name.lastIndexOf(".");
  const ext = dot === -1 ? "" : file.name.slice(dot).toLowerCase();
  if (!acceptedExtensions().includes(ext)) {
    return `${file.name}: invalid format. Accepted: ${acceptedExtensions().join(", ")}.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name}: exceeds 100MB per file.`;
  }
  return null;
}

/** Mock fallback for the materials list when the backend is unreachable (pure, unit-tested). */
export function applyMockFallback(
  all: DocumentItem[],
  filters: DocumentFilters,
  page: number,
  pageSize: number,
): { items: DocumentItem[]; total: number } {
  const needle = filters.search.trim().toLowerCase();
  const filtered = all.filter((d) => {
    if (needle && !d.fileName.toLowerCase().includes(needle)) return false;
    if (filters.classId !== "all" && d.classId !== filters.classId) return false;
    if (filters.fileType !== "all" && d.fileType !== filters.fileType) return false;
    if (filters.status !== "all" && d.status !== filters.status) return false;
    return true;
  });
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total };
}
