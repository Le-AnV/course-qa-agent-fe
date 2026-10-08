# CI Pipeline Design — FE Repo (AI-123)

> Design deliverable for `features/Design_CIPipelineFE` — companion to
> `features/Implementation_CIPipelineFE`. Related: [AI-123](https://ai03.atlassian.net/browse/AI-123).
> No Figma file for this ticket: the deliverable is a **CI configuration file**,
> so this document is the spec and the green pipeline on the Implementation MR
> is the visual reference.

## 1. Goals / Non-goals

**Goals**

- Every MR into `course-qa-agent-fe` is automatically verified by `lint` + `build`
  on FPT instance runners — the machine catches breakages, reviewers review logic.
- `build` is a hard gate; `lint` is advisory (see section 4).
- Pipeline triggers only on MR events and pushes to `main` — no duplicate runs.

**Non-goals**

- No CD, no container image push, no deployment of any kind.
- No real secrets in `.gitlab-ci.yml` — `NEXT_PUBLIC_API_URL` uses a dummy value.
- No changes to application code, Dockerfile, or dependencies.

## 2. Pipeline layout

Runner: FPT instance (shared) runners — no tags pinned, so any available
Linux runner picks the job up. (If jobs stay pending, pin `tags` to match the
runner afterwards.)

| Stage | Job | Image | Command | Gate |
|---|---|---|---|---|
| `lint` | `lint` | `node:20-slim` | `npm ci` (cached) → `npm run lint` | advisory (`allow_failure: true`) |
| `build` | `build` | `node:20-slim` | `npm run build` with dummy `NEXT_PUBLIC_API_URL` | hard (must pass) |

Rules:

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

## 3. Job details

**`lint`** — `npm ci` installs locked dependencies (cached on `package-lock.json`
via `cache: key: files: [package-lock.json]`). Runs `npm run lint` (ESLint flat
config `eslint.config.mjs`). Advisory only: exit code is reported but never
blocks the MR.

**`build`** — needs `lint` (`needs: [lint]` so logs read in order, but runs even
if lint warns). Runs `npm run build` with `NEXT_PUBLIC_API_URL: "http://localhost:8000"`.
`NEXT_PUBLIC_*` values are baked into the client bundle at build time; the dummy
value is enough to prove the build compiles. This job catches structural
breakages (e.g. global CSS imported outside a layout file).

**Not included:** a `docker build` check — instance runners may not provide a
Docker daemon. Revisit if a runner with Docker becomes available. Local
`docker compose up` remains the manual verification for the image.

## 4. Why lint is advisory

`main` currently carries 5 ESLint errors from MR !3 (`react/no-unescaped-entities`
in `landing-footer.tsx`, `@typescript-eslint/no-explicit-any` in
`landing-header.tsx` / `login-modal.tsx`). Those belong to Hào's AI-25 scope,
not to this infra ticket — so `lint` reports with `allow_failure: true` (yellow
warning) until that code is fixed, at which point the flag is removed and lint
becomes a hard gate.

## 5. Verification

On the Implementation MR (`features/Implementation_CIPipelineFE` → `main`):
open the MR and confirm the pipeline shows `lint` (allowed to warn) and `build`
green. Screenshots/logs of the green pipeline are the acceptance evidence for
AI-123 AC-01/AC-02.

## 6. Open items

1. Remove `allow_failure` from `lint` once MR !3's errors are fixed (follow-up).
2. Add a `docker build` check if a Docker-capable runner becomes available.
3. Pin runner `tags` if jobs stay pending on shared runners.
