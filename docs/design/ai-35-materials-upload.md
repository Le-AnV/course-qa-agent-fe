# UI Design & Implementation Specs — Course Materials Upload (AI-35)

> **Ticket:** AI-35
> **Epic:** E2 - Course Materials (Knowledge Base)
> **Status:** Planned

This document serves as the implementation plan for the trainer course-materials upload flow on the Frontend (`/teacher/materials`).

## 1. Overview
Trainers upload course files into one of their classes. Only 7 material formats are accepted (AC-01/AC-07), max 100MB per file. A successful upload lands files in `pending` status awaiting approval (AI-41). The page falls back to mock data when the backend is unreachable so the UI stays reviewable.

## 2. Components
- **Route:** `app/(shell)/teacher/materials/page.tsx` — composes upload + list. Lives under `/teacher` so `/dashboard` stays free for Admin onboarding (AI-31).
- **`features/documents/upload-dropzone.tsx`** — class `Select`, drag-and-drop zone (click/Enter/Space + drag events), selected-file list with per-file remove, inline validation errors, uploading/done/error states.
- **`lib/documents.ts`** — `ACCEPTED_TYPES`, `MAX_FILE_SIZE_BYTES`, `acceptedExtensions()`, `validationError()`, auth header helper.

## 3. API Integration
- **Fetch classes:** `GET /api/documents/classes/mine` with `Authorization: Bearer <token>` → `{id, course_id, name, code}[]`. On failure or missing token, fall back to `MOCK_CLASSES`.
- **Upload:** `POST /api/documents/` with `FormData{files, class_id}` and `Authorization` header (no manual `Content-Type`).
  - On `200 OK`: `{uploaded: [{file_name, error | null}]}`. Entries with `error !== null` are shown inline and the banner becomes "Some files were rejected."
  - On non-2xx: banner shows `Backend responded with {status}`.
- **Auth:** token and role from `localStorage` (`AUTH_TOKEN_KEY`, `AUTH_ROLE_KEY`). Missing token → "Not authenticated. Please log in again."

## 4. Validation Rules (client-side, mirrored by tests)
- Extension must be one of `.pdf, .docx, .md, .txt, .pptx, .xlsx, .csv` (case-insensitive).
- Size must be `<= 100MB` per file.
- Upload button disabled when no files, no class, or an upload is in flight.

## 5. States
idle, uploading, done ("Upload successful. Files are pending approval."), error, per-file validation errors, unauthenticated.

## 6. Next Steps
1. Confirm the 7 accepted formats and 100MB limit with stakeholders/BE.
2. Implement `upload-dropzone.tsx` + `lib/documents.ts` upload parts.
3. Wire the class list with mock fallback.
4. Unit-test `validationError` and `formatFileSize`; manual-test with valid/invalid/oversize files.
