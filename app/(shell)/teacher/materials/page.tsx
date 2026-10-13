"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentList, type DocumentFilters } from "@/features/documents/document-list";
import { UploadDropzone } from "@/features/documents/upload-dropzone";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import {
  MOCK_CLASSES,
  MOCK_DOCUMENTS,
  applyMockFallback,
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
  const [classes, setClasses] = useState<ClassOption[]>(MOCK_CLASSES);
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
      } catch {
        const mock = applyMockFallback(MOCK_DOCUMENTS, f, p, PAGE_SIZE);
        setDocuments(mock.items);
        setTotal(mock.total);
        setUsingMock(true);
        setListError("Backend unreachable — showing sample data.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Initial server fetch: legitimate data sync, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadDocuments(filters, 1);
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

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Course materials</h1>
        <p className="text-sm text-muted-foreground">
          Upload files to your classes and verify what is in the knowledge base.
          {usingMock && " Showing sample data (backend unreachable)."}
        </p>
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
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
