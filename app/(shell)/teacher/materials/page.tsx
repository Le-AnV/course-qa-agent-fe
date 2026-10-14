"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentList, type DocumentFilters } from "@/features/documents/document-list";
import { UploadDropzone } from "@/features/documents/upload-dropzone";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import {
  ApiError,
  MOCK_CLASSES,
  MOCK_DOCUMENTS,
  applyMockFallback,
  approveDocument,
  backendUrl,
  fetchDocuments,
  fetchMyClasses,
  type ClassOption,
  type DocumentItem,
} from "@/lib/documents";

const PAGE_SIZE = 10;

/**
 * Trainer materials (/teacher/materials): upload materials + browse/search
 * the knowledge base. Lives under /teacher so /dashboard stays free for
 * Admin onboarding (AI-31) — same route must not serve two features.
 */
export default function MaterialsPage() {
  const router = useRouter();  const [classes, setClasses] = useState<ClassOption[]>(MOCK_CLASSES);
  const [documents, setDocuments] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [total, setTotal] = useState(MOCK_DOCUMENTS.length);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DocumentFilters>({
    search: "",
    classId: "all",
    fileType: "all",
    status: "all",
  });
  const [loading, setLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadClasses = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setClasses(MOCK_CLASSES);
      return;
    }
    try {
      const mine = await fetchMyClasses({ token });
      setClasses(mine.length > 0 ? mine : MOCK_CLASSES);
    } catch {
      setClasses(MOCK_CLASSES);
    }
  }, []);

  const loadDocuments = useCallback(
    async (f: DocumentFilters, p: number) => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        const mock = applyMockFallback(MOCK_DOCUMENTS, f, p, PAGE_SIZE);
        setDocuments(mock.items);
        setTotal(mock.total);
        setUsingMock(true);
        setListError(null);
        return;
      }
      setLoading(true);
      try {
        const { items, total: t } = await fetchDocuments(
          { token },
          {
            search: f.search.trim() || undefined,
            classId: f.classId === "all" ? undefined : f.classId,
            fileType: f.fileType === "all" ? undefined : f.fileType,
            status: f.status === "all" ? undefined : f.status,
            page: p,
            pageSize: PAGE_SIZE,
          },
        );
        setDocuments(items);
        setTotal(t);
        setUsingMock(false);
        setListError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Token expired/invalid: send them back to login, never mock.
          router.push("/login");
          return;
        }
        if (err instanceof ApiError) {
          // Backend answered (403/400/500...): show the real reason, no mock.
          setDocuments([]);
          setTotal(0);
          setUsingMock(false);
          setListError(`Backend error ${err.status}: ${err.message}`);
        } else {
          // Network failure (BE down, wrong API URL, CORS origin blocked):
          // mock fallback so the UI stays reviewable.
          const mock = applyMockFallback(MOCK_DOCUMENTS, f, p, PAGE_SIZE);
          setDocuments(mock.items);
          setTotal(mock.total);
          setUsingMock(true);
          setListError(
            `Cannot reach backend at ${backendUrl()} — showing sample data. ` +
              `Check the BE is running, or open this page via http://localhost:3000 (BE CORS only allows that origin).`,
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    // Initial server fetch: legitimate data sync, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClasses();
    loadDocuments(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only initial sync
  }, []);

  function handleFiltersChange(next: DocumentFilters) {
    setFilters(next);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadDocuments(next, 1), 350);
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    loadDocuments(filters, nextPage);
  }

  async function handleApprove(documentId: string) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setApproveError("Not authenticated. Please log in again.");
      return;
    }
    setApprovingId(documentId);
    setApproveError(null);
    try {
      await approveDocument({ token }, documentId);
      await loadDocuments(filters, page);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      if (usingMock) {
        // Offline demo: flip the mock row so the flow is reviewable.
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === documentId ? { ...d, status: "processing" as const } : d,
          ),
        );
      } else {
        setApproveError(
          err instanceof Error ? err.message : "Approve failed.",
        );
      }
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Course materials</h1>
        <p className="text-sm text-muted-foreground">
          Upload files to your classes and verify what is in the knowledge base.
          {usingMock && " Showing sample data (backend unreachable)."}
        </p>
        {listError && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadDocuments(filters, page)}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
      <UploadDropzone
        classes={classes}
        onUploaded={() => {
          setPage(1);
          loadDocuments(filters, 1);
        }}
      />
      <DocumentList
        documents={documents}
        classes={classes}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        filters={filters}
        loading={loading}
        error={listError}
        approvingId={approvingId}
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
        onApprove={handleApprove}
      />
      {approveError && (
        <p className="text-sm text-destructive">{approveError}</p>
      )}
    </div>
  );
}
