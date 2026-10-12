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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function acceptedExtensions(): string[] {
  return ACCEPTED_TYPES.map((t) => t.extension);
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
