/**
 * E2 documents client (AI-35/37/41/39): upload, list/search/filter, class
 * tags, delete & replace. Talks to `GET|POST|DELETE /api/documents` when the
 * backend runs; the materials page (/teacher/materials) falls back to mock
 * data so the UI is reviewable without the backend.
 */

export type DocumentStatus =
  | "pending"
  | "processing"
  | "indexed"
  | "rejected"
  | "failed"
  | "replaced";

export type ClassOption = {
  id: string;
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
  /** AI-39 AC-03: uploads of an existing file name create the next version. */
  version: number;
  createdAt: string;
};

export type AcceptedType = {
  extension: string;
  mime: string;
  label: string;
};

/** Upload AC-01/AC-07: the 6 accepted material formats, max 100MB per file. */
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
];

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export const MOCK_CLASSES: ClassOption[] = [
  { id: "class-a", name: "CS101 - Class A", code: "CS101-A" },
  { id: "class-b", name: "CS101 - Class B", code: "CS101-B" },
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
    version: 1,
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
    version: 1,
    createdAt: "2026-10-08T14:30:00Z",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function backendUrl(): string {
  return API_URL;
}

/** HTTP error from the backend (network failures throw TypeError instead). */
export class ApiError extends Error {
  status: number;

  constructor(status: number, detail?: string | null) {
    super(detail ?? `Backend responded with ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function throwForStatus(res: Response): Promise<never> {
  const detail = await res
    .json()
    .then((b) => (b as { detail?: string }).detail)
    .catch(() => null);
  throw new ApiError(res.status, detail);
}

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
  if (!res.ok) await throwForStatus(res);
  const rows = (await res.json()) as {
    id: string;
    name: string;
    code: string;
  }[];
  return rows.map((r) => ({ id: r.id, name: r.name, code: r.code }));
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
  version: number;
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
    version: i.version ?? 1,
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
  if (!res.ok) await throwForStatus(res);
  const body = (await res.json()) as {
    items: DocumentRow[];
    total: number;
  };
  return {
    items: body.items.map(toItem),
    total: body.total,
  };
}

/** AI-41: approve pending -> processing (trainer/admin only, BE enforces). */
export async function approveDocument(
  auth: AuthHeaders,
  documentId: string,
): Promise<DocumentItem> {
  const res = await fetch(
    `${API_URL}/api/documents/${encodeURIComponent(documentId)}/approve`,
    { method: "POST", headers: headers(auth) },
  );
  if (!res.ok) await throwForStatus(res);
  return toItem((await res.json()) as DocumentRow);
}

/** One per-file upload result (AI-35 AC-03/AC-04, AI-39 AC-03). */
export type UploadOutcome = {
  fileName: string;
  item: DocumentItem | null;
  error: string | null;
};

type UploadRow = {
  file_name: string;
  document: DocumentRow | null;
  error: string | null;
};

/**
 * Multi-file upload into one class. A file name already used in that class
 * becomes the next version and re-indexes (AI-39 AC-03).
 */
export async function uploadDocuments(
  auth: AuthHeaders,
  classId: string,
  files: File[],
): Promise<UploadOutcome[]> {
  const form = new FormData();
  form.set("class_id", classId);
  for (const f of files) form.append("files", f);
  const res = await fetch(`${API_URL}/api/documents/`, {
    method: "POST",
    headers: headers(auth),
    body: form,
  });
  if (!res.ok) await throwForStatus(res);
  const body = (await res.json()) as { uploaded: UploadRow[] };
  return body.uploaded.map((u) => ({
    fileName: u.file_name,
    item: u.document ? toItem(u.document) : null,
    error: u.error,
  }));
}

export type DeleteResult = {
  deleted: string;
  fileName: string;
  version: number;
  purgedChunks: number;
};

/**
 * AI-39 AC-01: delete a file. The backend requires `confirm=true` and purges
 * the file's chunks from the vector store before removing it.
 */
export async function deleteDocument(
  auth: AuthHeaders,
  documentId: string,
): Promise<DeleteResult> {
  const res = await fetch(
    `${API_URL}/api/documents/${encodeURIComponent(documentId)}?confirm=true`,
    { method: "DELETE", headers: headers(auth) },
  );
  if (!res.ok) await throwForStatus(res);
  const body = (await res.json()) as {
    deleted: string;
    file_name: string;
    version: number;
    purged_chunks: number;
  };
  return {
    deleted: body.deleted,
    fileName: body.file_name,
    version: body.version,
    purgedChunks: body.purged_chunks,
  };
}

/**
 * AI-39 AC-03: replacing means uploading a file with the same name into the
 * same class — a different name would become a brand-new document, so the UI
 * blocks it up front. Names compare case-insensitively, like the backend.
 */
export function replaceNameError(
  current: Pick<DocumentItem, "fileName">,
  replacement: Pick<File, "name">,
): string | null {
  if (current.fileName.toLowerCase() === replacement.name.toLowerCase()) {
    return null;
  }
  return (
    `Choose a file named "${current.fileName}" to replace it — ` +
    `"${replacement.name}" would be uploaded as a new document instead.`
  );
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
