# UI Design & Implementation Specs — Tag Documents by Class (AI-41)

> **Ticket:** AI-41
> **Epic:** E2 - Course Materials (Knowledge Base)
> **Status:** Planned

This document maps the AI-41 user story (*"As a trainer, I want to tag documents by class so that answers can be scoped to a specific subject and section."*) to its acceptance criteria, splitting Frontend-done work from Backend/integration work.

## 1. AC-01 — Choose a class when uploading (FE done, AI-35 scope)
- `features/documents/upload-dropzone.tsx`: class `Select` is mandatory — upload is disabled until a class is chosen (`disabled={files.length === 0 || !classId || ...}`), defaulting to the trainer's first class.
- `POST /api/documents/` sends `FormData{files, class_id}` so every document is tagged at upload time.
- Trainers cannot create courses/classes in the UI: there is no create-class control anywhere; `GET /api/documents/classes/mine` only lists admin-provisioned classes (T4), falling back to `MOCK_CLASSES` offline.

## 2. AC-02 — Filter documents by class (FE done, AI-37 scope)
- `features/documents/document-list.tsx`: class filter `Select` (`All classes` default), omitted from the query as `class_id` when `all`.
- `GET /api/documents/?...&class_id=...` via `fetchDocuments`; every table row shows its `Class` column (`className`).

## 3. AC-03 — Question scoped to the chosen class (FE sends scope, BE filters)
- FE: `hooks/use-chat-stream.ts` sends `{ message, class_id: classId }` on **every** chat request; `app/(shell)/student/class/[id]/agent/page.tsx` documents the per-class chat scope.
- BE (out of FE scope): apply a Qdrant native payload filter on `class_id` when answering. `app/api/chat/route.ts` is a mock placeholder — delete it once BE `POST /api/chat` is ready.

## 4. AC-04 — Classes keep documents separate (integration, BE-led)
- Separation is enforced by AC-01 tagging + AC-03 filtering on the backend. FE contributes both ends (tag on upload, scope on ask) but cannot prove citation separation alone.
- Verify with an integration test: two classes under one course, ask from class A, assert no citations from class B.

## 5. AC-05 — Student's class follows automatically (FE done, on main)
- `app/(shell)/student/class/[id]/agent/page.tsx`: `classId` comes from route `params` — the student never picks a class by hand. `ChatWindow` has no class picker (verified by grep: no `Select`).
- Chat history is keyed per `classId` (see TODO AI-95: history API must also filter by `classId`).

## 6. Remaining FE work (branch `features/Implementation_DocumentsClassTag`)
1. Fix `UploadDropzone` class sync: `classId` initialises from the first `classes` entry but never re-syncs when the async class list arrives — an upload could be tagged with a stale/empty class (AC-01 correctness). Extract pure `resolveDefaultClassId()` into `lib/documents.ts` + unit test.
2. Re-verify AC-01/AC-02/AC-05 manually with screenshots.
3. Integration test AC-04 with BE (needs Qdrant filter live).
