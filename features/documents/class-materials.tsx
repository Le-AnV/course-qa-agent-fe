"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Upload, X } from "lucide-react";
import { AppSelect } from "@/components/ui/app-select";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import { FileTypeIcon, fileTypeTone } from "@/components/shared/FileTypeIcon";
import { Reveal, SkeletonLine } from "@/components/shared/page-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ACCEPTED_TYPES,
  ApiError,
  acceptedExtensions,
  approveDocument,
  backendUrl,
  canPreviewDocument,
  deleteDocument,
  downloadDocumentFile,
  fetchDocumentFile,
  fetchDocuments,
  formatFileSize,
  formatRelevanceReason,
  isRelevanceWarning,
  rejectDocument,
  replaceNameError,
  retryDocument,
  uploadDocuments,
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
  replaced: "Replaced",
};

const STATUS_DOT: Record<DocumentItem["status"], string> = {
  pending: "bg-[#B4881F]",
  processing: "bg-[#B9B9B9]",
  indexed: "bg-[#4B9E76]",
  rejected: "bg-[#C4644C]",
  failed: "bg-[#C4644C]",
  replaced: "bg-[#B9B9B9]",
};

const STATUS_TEXT: Record<DocumentItem["status"], string> = {
  pending: "text-[#8F6B16]",
  processing: "text-[#5A5A5A]",
  indexed: "text-[#3B7D5D]",
  rejected: "text-[#9D4C38]",
  failed: "text-[#9D4C38]",
  replaced: "text-[#5A5A5A]",
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

export function ClassMaterials({
  classId,
  className,
  onIndexedChange,
}: {
  classId: string;
  className?: string;
  onIndexedChange?: () => void;
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
  const [processingExists, setProcessingExists] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [replacingId, setReplacingId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<DocumentItem | null>(null);
  const [pendingReject, setPendingReject] = React.useState<DocumentItem | null>(null);
  const [replaceTarget, setReplaceTarget] = React.useState<DocumentItem | null>(null);
  const [previewTarget, setPreviewTarget] = React.useState<{
    item: DocumentItem;
    url: string;
  } | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [pendingRelevanceConfirm, setPendingRelevanceConfirm] = React.useState<DocumentItem | null>(null);
  const [pendingUploadWarning, setPendingUploadWarning] = React.useState<{
    file: File;
    reason: string;
  } | null>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  const [files, setFiles] = React.useState<File[]>([]);
  const [fileErrors, setFileErrors] = React.useState<string[]>([]);
  const [uploadState, setUploadState] = React.useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = React.useCallback(
    async (f: DocumentFilters, p: number, silent = false) => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.push("/login");
        return;
      }
      if (!silent) setLoading(true);
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
            : `Cannot reach backend at ${backendUrl()} — check the BE is running (docker compose up), then Retry; or open this page via http://localhost:3000 (BE CORS only allows that origin).`,
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [classId, router],
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial sync
  }, [classId]);

  const refreshProcessingStatus = React.useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    try {
      const result = await fetchDocuments(
        { token },
        { classId, status: "processing", page: 1, pageSize: 1 },
      );
      const processing = result.total > 0;
      setProcessingExists(processing);
      if (processing || processingExists) await load(filters, page, true);
      if (!processing && processingExists) onIndexedChange?.();
    } catch {
      // The normal list request reports backend failures; status polling can retry.
    }
  }, [classId, filters, load, onIndexedChange, page, processingExists]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts async status polling; updates happen after fetch resolves.
    void refreshProcessingStatus();
  }, [refreshProcessingStatus]);

  React.useEffect(() => {
    if (!processingExists) return;
    const interval = window.setInterval(() => {
      void refreshProcessingStatus();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [processingExists, refreshProcessingStatus]);

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

  async function handleForceUpload(file: File) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }
    setUploadState({ status: "uploading" });
    try {
      const form = new FormData();
      form.set("class_id", classId);
      form.append("files", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/documents/?force=true`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form },
      );
      if (!res.ok) throw new ApiError(res.status);
      const body = (await res.json()) as {
        uploaded: { file_name: string; error: string | null; warning?: string | null }[];
      };
      const failed = body.uploaded.filter((u) => u.error !== null);
      if (failed.length > 0) {
        setFileErrors(failed.map((f) => `${f.file_name}: ${f.error ?? "rejected"}`));
        setUploadState({ status: "error", message: "File upload was rejected." });
      } else {
        setFiles((prev) => prev.filter((f) => f.name !== file.name));
        setFileErrors([]);
        if (inputRef.current) inputRef.current.value = "";
        setUploadState({
          status: "done",
          message: `Uploaded "${file.name}" for approval.`,
        });
        setPage(1);
        await load(filters, 1);
      }
    } catch (err) {
      setUploadState({
        status: "error",
        message: err instanceof ApiError ? err.message : "Upload failed.",
      });
    }
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
        uploaded: { file_name: string; error: string | null; warning?: string | null }[];
      };

      const warned = body.uploaded.filter((u) => Boolean(u.warning));
      const failed = body.uploaded.filter((u) => u.error !== null);

      if (warned.length > 0) {
        const firstWarned = warned[0];
        const matchingFile = files.find((f) => f.name === firstWarned.file_name);
        if (matchingFile && firstWarned.warning) {
          setPendingUploadWarning({
            file: matchingFile,
            reason: firstWarned.warning,
          });
        }
      }

      if (failed.length > 0) {
        setFileErrors(failed.map((f) => `${f.file_name}: ${f.error ?? "rejected"}`));
        setUploadState({ status: "error", message: "Some files were rejected." });
      } else if (warned.length === 0) {
        setFiles([]);
        setFileErrors([]);
        if (inputRef.current) inputRef.current.value = "";
        setUploadState({
          status: "done",
          message: "Upload successful. Files are pending approval.",
        });
        setPage(1);
        await load(filters, 1);
      } else {
        setUploadState({ status: "idle" });
      }
    } catch (err) {
      setUploadState({
        status: "error",
        message:
          err instanceof ApiError
            ? `Upload failed (${err.status}).`
            : `Cannot reach backend at ${backendUrl()} — check the BE is running (docker compose up), or open this page via http://localhost:3000 (BE CORS only allows that origin).`,
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
      setProcessingExists(true);
      await load(filters, page);
    } catch (err) {
      setListError(
        err instanceof ApiError ? `Approve failed (${err.status}).` : "Approve failed.",
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function handleRetry(documentId: string, force = false) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }
    setRetryingId(documentId);
    setActionError(null);
    try {
      await retryDocument({ token }, documentId, { force });
      setProcessingExists(true);
      await load(filters, page);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setActionError(
        err instanceof ApiError ? `Retry failed: ${err.message}` : "Retry failed.",
      );
    } finally {
      setRetryingId(null);
    }
  }

  async function handleReject(documentId: string) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }
    setRejectingId(documentId);
    setActionError(null);
    try {
      await rejectDocument({ token }, documentId);
      await load(filters, page);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setActionError(
        err instanceof ApiError ? `Reject failed: ${err.message}` : "Reject failed.",
      );
    } finally {
      setRejectingId(null);
    }
  }

  async function handleDownload(item: DocumentItem) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }
    setDownloadingId(item.id);
    setActionError(null);
    try {
      await downloadDocumentFile({ token }, item);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setActionError(
        err instanceof ApiError
          ? `Download failed: ${err.message}`
          : "Download failed.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function handlePreview(item: DocumentItem) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push("/login");
      return;
    }
    setActionError(null);
    try {
      const blob = await fetchDocumentFile({ token }, item.id, "preview");
      setPreviewTarget((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { item, url: URL.createObjectURL(blob) };
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setActionError(
        err instanceof ApiError
          ? `Preview failed: ${err.message}`
          : "Preview failed.",
      );
    }
  }

  function closePreview() {
    setPreviewTarget((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setActionError("Not authenticated. Please log in again.");
      setPendingDelete(null);
      return;
    }
    setDeletingId(target.id);
    setActionError(null);
    try {
      await deleteDocument({ token }, target.id);
      setPendingDelete(null);
      const nextPage = documents.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      await load(filters, nextPage);
      onIndexedChange?.();
    } catch (err) {
      setPendingDelete(null);
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setActionError(
        err instanceof ApiError ? `Delete failed (${err.status}).` : "Delete failed.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function startReplace(document: DocumentItem) {
    setReplaceTarget(document);
    setActionError(null);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  }

  async function onReplacementChosen(chosen: FileList | null) {
    const target = replaceTarget;
    setReplaceTarget(null);
    if (!target || !chosen || chosen.length === 0) return;
    const file = chosen[0];
    const nameError = replaceNameError(target, file);
    if (nameError) {
      setActionError(nameError);
      return;
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setActionError("Not authenticated. Please log in again.");
      return;
    }
    setReplacingId(target.id);
    setActionError(null);
    try {
      const [outcome] = await uploadDocuments({ token }, target.classId, [file]);
      if (!outcome || outcome.error || !outcome.item) {
        setActionError(outcome?.error ?? "Replace failed.");
      } else {
        await load(filters, page);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setActionError(
        err instanceof ApiError ? `Replace failed (${err.status}).` : "Replace failed.",
      );
    } finally {
      setReplacingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mt-8 space-y-3" aria-labelledby="class-materials-heading">
      <div className="rounded-lg border border-[#DADADA] bg-white px-4 py-3.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="class-materials-heading" className="text-[15px] font-bold text-[#111111]">
              Materials
            </h3>
            <p className="mt-0.5 text-[13px] text-[#5A5A5A]">
              Files uploaded for {className ?? "this class"} — indexed into the knowledge base once approved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search materials"
                value={filters.search}
                onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                aria-label="Search materials by file name"
                className="w-full rounded border border-[#DADADA] bg-white py-1.5 pl-2.5 pr-3 text-[12.5px] text-[#111111] outline-none focus:border-[#111111] sm:w-52"
              />
            </div>
            <AppSelect
              value={filters.fileType}
              onValueChange={(fileType) => handleFiltersChange({ ...filters, fileType })}
              aria-label="Filter by file type"
              options={[
                { value: "all", label: "All types" },
                ...ACCEPTED_TYPES.map((t) => ({ value: t.extension, label: t.extension })),
              ]}
              size="sm"
              triggerClassName="w-auto"
            />
            <AppSelect
              value={filters.status}
              onValueChange={(status) => handleFiltersChange({ ...filters, status })}
              aria-label="Filter by status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending approval" },
                { value: "processing", label: "Processing" },
                { value: "indexed", label: "Indexed" },
                { value: "rejected", label: "Rejected" },
                { value: "failed", label: "Failed" },
                { value: "replaced", label: "Replaced" },
              ]}
              size="sm"
              triggerClassName="w-auto"
            />
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
            className="hidden"
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
                  <span className="flex min-w-0 items-center gap-2 truncate text-[12.5px] text-[#5A5A5A]">
                    <FileTypeIcon fileName={f.name} className="h-3.5 w-3.5 text-[var(--brand-ink)]" />
                    <span className="truncate">
                      {f.name} ({formatFileSize(f.size)})
                    </span>
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

      <input
        ref={replaceInputRef}
        id="class-material-replace"
        type="file"
        accept={acceptedExtensions().join(",")}
        onChange={(e) => void onReplacementChosen(e.target.files)}
        className="hidden"
        aria-label="Choose a replacement file"
        tabIndex={-1}
      />

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

      {actionError && (
        <p className="mb-3 text-[13px] text-[#9D4C38]">{actionError}</p>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#DADADA] bg-white">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 border-b border-[#DADADA] px-4 py-3 last:border-b-0"
            >
              <SkeletonLine className="h-4 w-4" />
              <SkeletonLine className="h-3.5 w-2/5" />
              <SkeletonLine className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <p className="rounded-lg border border-[#DADADA] bg-white py-8 text-center text-[13px] text-[#5A5A5A]">
          No materials yet — upload the first file for this class.
        </p>
      ) : (
        <Reveal className="overflow-x-auto rounded-lg border border-[#DADADA] bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DADADA] bg-white text-[12px] font-medium text-[#6F6F6F]">
                <th className="px-4 py-3">File</th>
                <th className="hidden px-4 py-3 sm:table-cell">Type</th>
                <th className="hidden px-4 py-3 md:table-cell">Size</th>
                <th className="hidden px-4 py-3 md:table-cell">Uploaded</th>
                <th className="px-4 py-3">Status</th>
                <th className="w-56 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADADA]">
              {documents.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${fileTypeTone(d.fileName)}`}
                      >
                        <FileTypeIcon fileName={d.fileName} className="h-5 w-5" />
                      </span>
                      <span className="truncate text-[13.5px] font-medium text-[#111111]">
                        {d.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--brand-ink)]">
                      {d.fileType}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-[#5A5A5A] md:table-cell">
                    {formatFileSize(d.sizeBytes)}
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-[#5A5A5A] md:table-cell">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`inline-flex items-center gap-2 ${
                          d.status === "failed"
                            ? "cursor-help underline decoration-dotted underline-offset-4"
                            : ""
                        }`}
                        title={d.status === "failed" ? (d.failureReason ?? "Document processing failed.") : undefined}
                        aria-label={
                          d.status === "failed"
                            ? isRelevanceWarning(d)
                              ? `Relevance warning: ${formatRelevanceReason(d.failureReason)}`
                              : `Failed: ${d.failureReason ?? "Document processing failed."}`
                            : undefined
                        }
                        role={d.status === "failed" ? "status" : undefined}
                        tabIndex={d.status === "failed" ? 0 : undefined}
                      >
                        {d.status === "processing" ? (
                          <span className="inline-flex items-center gap-1" aria-hidden="true">
                            <span className="material-processing-dot h-1.5 w-1.5 rounded-full bg-[#4B9E76]" />
                            <span className="material-processing-dot h-1.5 w-1.5 rounded-full bg-[#4B9E76]" />
                            <span className="material-processing-dot h-1.5 w-1.5 rounded-full bg-[#4B9E76]" />
                          </span>
                        ) : isRelevanceWarning(d) ? (
                          <span className="h-2 w-2 rounded-full bg-[#B4881F]" />
                        ) : (
                          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[d.status]}`} />
                        )}
                        <span
                          className={`text-[12.5px] ${
                            isRelevanceWarning(d) ? "font-medium text-[#8F6B16]" : STATUS_TEXT[d.status]
                          }`}
                        >
                          {isRelevanceWarning(d) ? "Unrelated warning" : STATUS_LABEL[d.status]}
                        </span>
                      </span>
                      {d.status === "failed" && (
                        isRelevanceWarning(d) ? (
                          <div className="max-w-[340px] rounded-md border border-[#F5E2B3] bg-[#FFFBF0] p-2.5 text-[11.5px] leading-relaxed text-[#7C5E10] shadow-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-[#8F6B16] mb-1">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#B4881F]" />
                              <span>Course Relevance Warning</span>
                            </div>
                            <p className="text-[#654D1B]">{formatRelevanceReason(d.failureReason)}</p>
                            <p className="mt-1 text-[11px] text-[#8F6B16] italic">
                              This file does not appear related to this class. Is this intentional?
                            </p>
                          </div>
                        ) : d.failureReason ? (
                          <div
                            className="max-w-[320px] rounded-md border border-[#F3D6CE] bg-[#FFF7F5] p-2 text-[11px] leading-relaxed text-[#9D4C38]"
                            title={d.failureReason}
                          >
                            <span className="font-semibold block text-[#843B2A] mb-0.5">Rejection reason:</span>
                            <span className="block break-words">{d.failureReason}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {d.status !== "replaced" && (
                        <>
                          {canPreviewDocument(d) && (
                            <button
                              type="button"
                              onClick={() => void handlePreview(d)}
                              disabled={
                                deletingId === d.id ||
                                replacingId === d.id ||
                                loading
                              }
                              className="rounded border border-[#CFCFCF] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                            >
                              Preview
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDownload(d)}
                            disabled={
                              downloadingId === d.id ||
                              deletingId === d.id ||
                              replacingId === d.id ||
                              loading
                            }
                            className="rounded border border-[#CFCFCF] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                          >
                            {downloadingId === d.id ? "Downloading…" : "Download"}
                          </button>
                        </>
                      )}
                      {d.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleApprove(d.id)}
                            disabled={
                              approvingId === d.id ||
                              rejectingId === d.id ||
                              deletingId === d.id ||
                              replacingId === d.id ||
                              loading
                            }
                            className="rounded border border-[#CFCFCF] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                          >
                            {approvingId === d.id ? "Approving…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingReject(d)}
                            disabled={
                              approvingId === d.id ||
                              rejectingId === d.id ||
                              deletingId === d.id ||
                              replacingId === d.id ||
                              loading
                            }
                            className="rounded border border-[#E1B4A8] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#9D4C38] shadow-xs transition-colors hover:bg-[#FFF7F5] disabled:opacity-50"
                          >
                            {rejectingId === d.id ? "Rejecting…" : "Reject"}
                          </button>
                        </>
                      )}
                      {d.status === "failed" && (
                        <>
                          {isRelevanceWarning(d) && (
                            <button
                              type="button"
                              onClick={() => setPendingRelevanceConfirm(d)}
                              disabled={
                                retryingId === d.id ||
                                rejectingId === d.id ||
                                deletingId === d.id ||
                                replacingId === d.id ||
                                loading
                              }
                              title="Confirm and add this file to the class anyway"
                              className="rounded border border-[#B4881F] bg-[#FFFDF5] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#8F6B16] shadow-xs transition-colors hover:bg-[#FFF9E6] disabled:opacity-50"
                            >
                              {retryingId === d.id ? "Adding…" : "Confirm & Add"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleRetry(d.id, false)}
                            disabled={
                              retryingId === d.id ||
                              rejectingId === d.id ||
                              deletingId === d.id ||
                              replacingId === d.id ||
                              loading
                            }
                            className="rounded border border-[#CFCFCF] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                          >
                            {retryingId === d.id ? "Retrying…" : "Retry"}
                          </button>
                        </>
                      )}
                      {d.status !== "replaced" && (
                        <button
                          type="button"
                          onClick={() => startReplace(d)}
                          disabled={
                            replacingId === d.id ||
                            retryingId === d.id ||
                            rejectingId === d.id ||
                            deletingId === d.id ||
                            approvingId === d.id ||
                            loading
                          }
                          className="rounded border border-[#CFCFCF] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                        >
                          {replacingId === d.id ? "Replacing…" : "Replace"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingDelete(d)}
                        disabled={
                          deletingId === d.id ||
                          approvingId === d.id ||
                          rejectingId === d.id ||
                          retryingId === d.id ||
                          replacingId === d.id ||
                          loading
                        }
                        className="rounded border border-[#DFB2A6] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#9D4C38] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                      >
                        {deletingId === d.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
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

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.fileName}?</DialogTitle>
            <DialogDescription>
              v{pendingDelete?.version} of this file is removed permanently and its
              chunks are deleted from the knowledge base, so the chatbot will no
              longer answer from it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              disabled={deletingId !== null}
              className="rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deletingId !== null}
              className="rounded border border-[#DFB2A6] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#9D4C38] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              {deletingId !== null ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingReject !== null}
        onOpenChange={(open) => !open && setPendingReject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {pendingReject?.fileName}?</DialogTitle>
            <DialogDescription>
              This document will not be indexed and cannot be approved later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPendingReject(null)}
              disabled={rejectingId !== null}
              className="rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!pendingReject) return;
                await handleReject(pendingReject.id);
                setPendingReject(null);
              }}
              disabled={rejectingId !== null}
              className="rounded border border-[#DFB2A6] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#9D4C38] shadow-xs transition-colors hover:bg-[#FFF7F5] disabled:opacity-50"
            >
              {rejectingId !== null ? "Rejecting…" : "Reject document"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingRelevanceConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRelevanceConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[#111111]">
              <AlertTriangle className="h-5 w-5 text-[#B4881F]" />
              Add this file to {className || "this class"}?
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#5A5A5A]">
              The system detected this file may not be related to this course.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 space-y-2 rounded-md border border-[#F5E2B3] bg-[#FFFBF0] p-3 text-[12.5px] text-[#7C5E10]">
            <p className="font-semibold text-[#111111]">
              File: <span className="font-normal">{pendingRelevanceConfirm?.fileName}</span>
            </p>
            <p className="text-[12px]">
              <span className="font-semibold text-[#8F6B16]">Detection: </span>
              {formatRelevanceReason(pendingRelevanceConfirm?.failureReason ?? null)}
            </p>
          </div>
          <p className="text-[12.5px] text-[#6F6F6F]">
            Are you sure you want to add this file? If this material is intentional for this class, confirm below to index it into the knowledge base anyway.
          </p>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setPendingRelevanceConfirm(null)}
              className="rounded border border-[#DADADA] bg-white px-3 py-1.5 text-[13px] font-medium text-[#111111] hover:bg-[#F7F7F7]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (pendingRelevanceConfirm) {
                  const id = pendingRelevanceConfirm.id;
                  setPendingRelevanceConfirm(null);
                  void handleRetry(id, true);
                }
              }}
              className="rounded bg-[#111111] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-xs hover:bg-[#2B2B2B]"
            >
              Yes, add file
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingUploadWarning !== null}
        onOpenChange={(open) => {
          if (!open) setPendingUploadWarning(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[#111111]">
              <AlertTriangle className="h-5 w-5 text-[#B4881F]" />
              Add this file to {className || "this class"}?
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#5A5A5A]">
              The system detected this file may not be related to this course.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 space-y-2 rounded-md border border-[#F5E2B3] bg-[#FFFBF0] p-3 text-[12.5px] text-[#7C5E10]">
            <p className="font-semibold text-[#111111]">
              File: <span className="font-normal">{pendingUploadWarning?.file.name}</span>
            </p>
            <p className="text-[12px]">
              <span className="font-semibold text-[#8F6B16]">Detection: </span>
              {formatRelevanceReason(pendingUploadWarning?.reason ?? null)}
            </p>
          </div>
          <p className="text-[12.5px] text-[#6F6F6F]">
            Are you sure you want to add this file? If this material is intentional for this class, confirm below to add it for approval.
          </p>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setPendingUploadWarning(null)}
              className="rounded border border-[#DADADA] bg-white px-3 py-1.5 text-[13px] font-medium text-[#111111] hover:bg-[#F7F7F7]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (pendingUploadWarning) {
                  const targetFile = pendingUploadWarning.file;
                  setPendingUploadWarning(null);
                  await handleForceUpload(targetFile);
                }
              }}
              className="rounded bg-[#111111] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-xs hover:bg-[#2B2B2B]"
            >
              Yes, add file
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewTarget !== null}
        onOpenChange={(open) => !open && closePreview()}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewTarget?.item.fileName}</DialogTitle>
            <DialogDescription>
              Preview of the uploaded material. Only authorized trainers can
              open this file.
            </DialogDescription>
          </DialogHeader>
          {previewTarget &&
            (previewTarget.item.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewTarget.url}
                alt={previewTarget.item.fileName}
                className="max-h-[70vh] w-full rounded border border-[#E5E5E5] object-contain"
              />
            ) : (
              <iframe
                src={previewTarget.url}
                title={`Preview of ${previewTarget.item.fileName}`}
                className="h-[70vh] w-full rounded border border-[#E5E5E5]"
              />
            ))}
          <DialogFooter>
            <button
              type="button"
              onClick={closePreview}
              className="rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => previewTarget && void handleDownload(previewTarget.item)}
              className="rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7]"
            >
              Download
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
