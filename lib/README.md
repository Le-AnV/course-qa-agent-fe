# frontend/lib — API client & helpers

Shared plumbing, not feature UI.

| Planned file | Purpose |
|---|---|
| `api.ts` | fetch wrapper — base URL from `NEXT_PUBLIC_API_URL`, attaches JWT, uniform error handling |
| `sse.ts` | SSE stream reader for chat (`/api/chat`) |
| `types.ts` | shared TS types mirroring backend Pydantic schemas |

**Rules**
- Backend API is the source of truth — Next.js never runs RAG logic (TECHSTACK §8).
- RBAC middleware in Next.js only redirects; **real enforcement is in FastAPI**.
- Never hardcode secrets in frontend code.
