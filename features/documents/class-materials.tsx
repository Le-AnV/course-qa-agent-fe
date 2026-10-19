"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, X } from "lucide-react";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import {
  ACCEPTED_TYPES,
  ApiError,
  acceptedExtensions,
  approveDocument,
  fetchDocuments,
  formatFileSize,
  validationError,
  type DocumentFilters,
  type DocumentItem,
} from "@/lib/documents";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<DocumentItem["status"], string> = {
  pending: "Pending approval",
  processing: "Processing",
  indexed: "Indexed",
  rejected: "Rejected",
  failed: "Failed",
};

const STATUS_DOT: Record<DocumentItem["status"], string> = {
  pending: "bg-[#B4881F]",
  processing: "bg-[#B9B9B9]",
  indexed: "bg-[#4B9E76]",
  rejected: "bg-[#C4644C]",
  failed: "bg-[#C4644C]",
};

const STATUS_TEXT: Record<DocumentItem["status"], string> = {
  pending: "text-[#8F6B16]",
  processing: "text-[#5A5A5A]",
  indexed: "text-[#3B7D5D]",
  rejected: "text-[#9D4C38]",
  failed: "text-[#9D4C38]",
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

export function ClassMaterials({
  classId,
  className,
}: {
  classId: string;
  className?: string;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState<DocumentFilters>({
    search: "",
    classId,
    fileType: "all",
    status: "all",
  });
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);

  const [files, setFiles] = React.useState<File[]>([]);
  const [fileErrors, setFileErrors] = React.useState<string[]>([]);
  const [uploadState, setUploadState] = React.useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = React.useCallback(
    async (f: DocumentFilters, p: number) => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      try {
        const { items, total: t } = await fetchDocuments(
          { token },
          {
            search: f.search.trim() || undefined,
            classId,
            fileType: f.fileType === "all" ? undefined : f.fileType,
            status: f.status === "all" ? undefined : f.status,
            page: p,
            pageSize: PAGE_SIZE,
          },
        );
        setDocuments(items);
        setTotal(t);
        setListError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setDocuments([]);
        setTotal(0);
        setListError(
          err instanceof ApiError
            ? `Backend error ${err.status}: ${err.message}`
            : "Cannot reach the backend — check it is running, then Retry.",
        );
      } finally {
        setLoading(false);
      }
    },
    [classId, router],
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial sync
  }, [classId]);

  function handleFiltersChange(next: DocumentFilters) {
    setFilters(next);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void load(next, 1), 350);
  }

  function takeFiles(chosen: File[]) {
    setFileErrors(
      chosen.map(validationError).filter((e): e is string => e !== null),
    );
    setFiles(chosen);
    setUploadState({ status: "idle" });
  }

  async function handleUpload() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }
    if (files.length === 0) return;
    setUploadState({ status: "uploading" });
    try {
      const form = new FormData();
      form.set("class_id", classId);
      for (const f of files) form.append("files", f);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/documents/`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form },
      );
      if (!res.ok) throw new ApiError(res.status);
      const body = (await res.json()) as {
        uploaded: { file_name: string; error: string | null }[];
      };
      const failed = body.uploaded.filter((u) => u.error !== null);
      if (failed.length > 0) {
        setFileErrors(failed.map((f) => `${f.file_name}: ${f.error ?? "rejected"}`));
        setUploadState({ status: "error", message: "Some files were rejected." });
      } else {
        setFiles([]);
        setFileErrors([]);
        if (inputRef.current) inputRef.current.value = "";
        setUploadState({
          status: "done",
          message: "Upload successful. Files are pending approval.",
        });
        setPage(1);
        await load(filters, 1);
      }
    } catch (err) {
      setUploadState({
        status: "error",
        message:
          err instanceof ApiError
            ? `Upload failed (${err.status}).`
            : "Cannot reach the backend — check it is running.",
      });
    }
  }

  async function handleApprove(documentId: string) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }
    setApprovingId(documentId);
    try {
      await approveDocument({ token }, documentId);
      await load(filters, page);
    } catch (err) {
      setListError(
        err instanceof ApiError ? `Approve failed (${err.status}).` : "Approve failed.",
      );
    } finally {
      setApprovingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mt-8" aria-labelledby="class-materials-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="class-materials-heading" className="text-[15px] font-bold text-[#111111]">
            Materials
          </h3>
          <p className="mt-0.5 text-[13px] text-[#5A5A5A]">
            Files uploaded for {className ?? "this class"} — indexed into the knowledge base once approved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search materials"
              value={filters.search}
              onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
              aria-label="Search materials by file name"
              className="w-52 rounded border border-[#DADADA] bg-white py-1.5 pl-2.5 pr-3 text-[12.5px] text-[#111111] outline-none focus:border-[#111111]"
            />
          </div>
          <select
            value={filters.fileType}
            onChange={(e) => handleFiltersChange({ ...filters, fileType: e.target.value })}
            aria-label="Filter by file type"
            className="rounded border border-[#DADADA] bg-white px-2.5 py-1.5 text-[12.5px] text-[#111111] outline-none focus:border-[#111111]"
          >
            <option value="all">All types</option>
            {ACCEPTED_TYPES.map((t) => (
              <option key={t.extension} value={t.extension}>
                {t.extension}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFiltersChange({ ...filters, status: e.target.value })}
            aria-label="Filter by status"
            className="rounded border border-[#DADADA] bg-white px-2.5 py-1.5 text-[12.5px] text-[#111111] outline-none focus:border-[#111111]"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending approval</option>
            <option value="processing">Processing</option>
            <option value="indexed">Indexed</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
          </select>
          <button
            type="button"
            onClick={() => setUploadOpen((open) => !open)}
            aria-expanded={uploadOpen}
            className="flex items-center gap-1.5 rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7]"
          >
            <Upload className="h-4 w-4" />
            {uploadOpen ? "Close upload" : "Import materials"}
          </button>
        </div>
      </div>

      {uploadOpen && (
        <div className="mb-4 rounded-lg border border-[#DADADA] bg-white p-4">
          <input
            ref={inputRef}
            id="class-material-upload"
            type="file"
            multiple
            accept={acceptedExtensions().join(",")}
            onChange={(e) => takeFiles(Array.from(e.target.files ?? []))}
            className="sr-only"
            aria-label="Choose files to upload"
            tabIndex={-1}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose files to upload (click or drag and drop)"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length > 0) takeFiles(Array.from(e.dataTransfer.files));
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFCFCF] ${
              dragging ? "border-[#CFCFCF] bg-[#F7F7F7]" : "border-[#DADADA] bg-[#FAFAFA]"
            }`}
          >
            <Upload className="h-6 w-6 text-[#6F6F6F]" aria-hidden="true" />
            <p className="text-[13px] font-semibold text-[#111111]">
              Click to choose files, or drag and drop them here
            </p>
            <p className="text-[12px] text-[#6F6F6F]">
              {acceptedExtensions().join(", ")} · max 100MB per file
            </p>
          </div>

          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${f.size}`}
                  className="flex items-center justify-between gap-2 rounded border border-[#DADADA] px-3 py-1.5"
                >
                  <span className="truncate text-[12.5px] text-[#5A5A5A]">
                    {f.name} ({formatFileSize(f.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = files.filter((_, idx) => idx !== i);
                      takeFiles(next);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    aria-label={`Remove ${f.name}`}
                    className="rounded p-0.5 text-[#6F6F6F] transition-colors hover:text-[#111111]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {fileErrors.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {fileErrors.map((e) => (
                <li key={e} className="text-[12.5px] text-[#9D4C38]">
                  {e}
                </li>
              ))}
            </ul>
          )}
          {uploadState.status === "done" && (
            <p className="mt-2 text-[12.5px] text-[#3B7D5D]">{uploadState.message}</p>
          )}
          {uploadState.status === "error" && (
            <p className="mt-2 text-[12.5px] text-[#9D4C38]">{uploadState.message}</p>
          )}

          <div className="mt-3">
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={files.length === 0 || uploadState.status === "uploading"}
              className="rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              {uploadState.status === "uploading" ? "Uploading…" : "Upload for approval"}
            </button>
          </div>
        </div>
      )}

      {listError && (
        <div className="mb-3 flex items-center gap-2 rounded border border-[#DFB2A6] bg-white p-3 text-[13px] text-[#9D4C38]">
          <span className="flex-1">{listError}</span>
          <button
            onClick={() => void load(filters, page)}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-[#DADADA] bg-white p-8 text-center text-[13px] text-[#5A5A5A]">
          Loading materials…
        </div>
      ) : documents.length === 0 ? (
        <p className="rounded-lg border border-[#DADADA] bg-white py-8 text-center text-[13px] text-[#5A5A5A]">
          No materials yet — upload the first file for this class.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#DADADA] bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DADADA] bg-white text-[12px] font-medium text-[#6F6F6F]">
                <th className="px-4 py-3">File</th>
                <th className="hidden px-4 py-3 sm:table-cell">Type</th>
                <th className="hidden px-4 py-3 md:table-cell">Size</th>
                <th className="hidden px-4 py-3 md:table-cell">Uploaded</th>
                <th className="px-4 py-3">Status</th>
                <th className="w-28 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADADA]">
              {documents.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-[#6F6F6F]" />
                      <span className="truncate text-[13.5px] font-medium text-[#111111]">
                        {d.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded bg-[#F7F7F7] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#5A5A5A]">
                      {d.fileType}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-[#5A5A5A] md:table-cell">
                    {formatFileSize(d.sizeBytes)}
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-[#5A5A5A] md:table-cell">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[d.status]}`} />
                      <span className={`text-[12.5px] ${STATUS_TEXT[d.status]}`}>
                        {STATUS_LABEL[d.status]}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => void handleApprove(d.id)}
                        disabled={approvingId === d.id || loading}
                        className="rounded border border-[#CFCFCF] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                      >
                        {approvingId === d.id ? "Approving…" : "Approve"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-[#5A5A5A]">
          <span>
            Page {page} of {totalPages} · {total} files
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                const next = page - 1;
                setPage(next);
                void load(filters, next);
              }}
              className="rounded border border-[#DADADA] bg-white px-3 py-1 text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                void load(filters, next);
              }}
              className="rounded border border-[#DADADA] bg-white px-3 py-1 text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
