# UI Design & Implementation Specs — Materials List, Search & Filter (AI-37)

> **Ticket:** AI-37
> **Epic:** E2 - Course Materials (Knowledge Base)
> **Status:** Planned

This document serves as the implementation plan for browsing/searching the course-materials knowledge base on the Frontend (`/teacher/materials`).

## 1. Overview
Below the upload card, trainers see a documents table with search-by-name, class/type/status filters, and pagination (`PAGE_SIZE = 10`). Filters debounce 350ms. When the backend is unreachable, the list falls back to `MOCK_DOCUMENTS` with a "Backend unreachable — showing sample data." banner.

## 2. Components
- **`features/documents/document-list.tsx`** — filter grid (search `Input` + 3 `Select`s with `all` defaults), `Table` (File name, Type, Size, Uploader, Class, Uploaded, Status, optional Action), `EmptyState` when no rows, Previous/Next pagination footer.
- **`lib/documents.ts`** — `fetchDocuments`, `fetchMyClasses`, `ListParams`, `DocumentItem`, `formatFileSize`, `applyMockFallback` (pure, unit-tested).
- **`page.tsx`** — owns `filters`/`page` state, `loadDocuments` with debounce, `loadClasses` on mount.

## 3. API Integration
- **List:** `GET /api/documents/?search&class_id&file_type&status&page&page_size` with `Authorization` header → `{items: DocumentRow[], total: number}`. `snake_case` rows map to camelCase via `toItem`. Filter value `all` is omitted from the query.
- **Empty result:** show `EmptyState` ("No documents found — Try a different search term or filter."), never an empty table.
- **Pagination:** `totalPages = max(1, ceil(total / pageSize))`; Previous disabled on page 1, Next disabled on last page; both disabled while loading.

## 4. States
loading (`Documents ({total}) — loading…`), empty, error banner, mock-fallback banner, paginated list.

## 5. Responsive
Filter grid `sm:grid-cols-2 lg:grid-cols-4`. Table scrolls horizontally on small screens; consider stacked cards on mobile as a follow-up.

## 6. Next Steps
1. Confirm query-param names and `page_size` default with BE.
2. Implement `document-list.tsx` + list parts of `lib/documents.ts` and `page.tsx`.
3. Unit-test `applyMockFallback` (search/filter/pagination edges) and `formatFileSize`; manual-test each filter, empty result, and page boundaries.
