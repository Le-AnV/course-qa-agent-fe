# course-qa-agent-fe

Frontend for the course Q&A RAG chatbot — Next.js App Router.
Split from the `course-qa-agent` monorepo (UI foundation AI-121).

- Backend repo: `course-qa-agent-be`
- Jira: AI project on `ai03.atlassian.net` — this repo maps to [AI-121](https://ai03.atlassian.net/browse/AI-121)

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui primitives in `components/ui/`
- Lint: `next lint` (ESLint flat config `eslint.config.mjs`)

## Structure

```
.
├── app/
│   ├── globals.css          # ALL design tokens (colors, radius, fonts) live here
│   ├── layout.tsx           # fonts + page metadata
│   ├── login/               # outside the shell (public)
│   └── (shell)/             # every route here renders inside AppShell
│       ├── layout.tsx       # navbar + sidebar + auth guard
│       └── styleguide/      # component gallery — the team's visual reference
├── components/ui/           # ONLY place shared components live (Button, Card, Table…)
│   ├── nav-config.ts        # sidebar menu + roles + auth storage keys
│   ├── app-shell.tsx        # layout frame (navbar + sidebar + main + Toaster)
│   ├── auth-guard.tsx       # client redirect to /login (UX only — backend enforces)
│   └── empty-state.tsx      # zero-data states
├── features/<module>/       # feature-specific components (chat, admin, …)
├── lib/                     # API client & helpers (no UI)
└── public/                  # static assets
```

## Local run

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Health of the backend: `http://localhost:8000/health`
(see the `course-qa-agent-be` repo).

```bash
npm run lint   # eslint
npm run build  # production build
```

## Configuration

Copy `.env.example` to `.env.local` and adjust if needed. Never commit real keys.

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL. `NEXT_PUBLIC_*` values are baked into the bundle at **build** time — restart `next dev` / rebuild the image after changing it. |

## Docker (whole stack)

One command — no manual `npm run dev`:

```bash
docker compose up -d --build
```

| Service | Host port | Container port | Notes |
|---|---|---|---|
| frontend (Next.js standalone) | 3000 | 3000 | container `course-qa-frontend`, non-root `node` user |

The image build takes `NEXT_PUBLIC_API_URL` as a build arg (default
`http://localhost:8000`). Override for a build:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 docker compose build
```

**Port rule — local first, Docker second:** both modes use the **same** port,
so run **either** the local dev server **or** the container, never both at once.

| Mode | Command | Frontend port |
|---|---|---|
| Local (develop) | `npm run dev` | 3000 |
| Docker (container) | `docker compose up -d --build` | 3000 |

Stop with `docker compose down`.

## UI foundation (AI-121)

Every page is assembled from the shared library — never re-implement Button, Input
or Table, and never hardcode colors. Live examples: `/styleguide` (inside the app,
login required). Spec: [`docs/design/ai-121-ui-foundation.md`](docs/design/ai-121-ui-foundation.md)
— lands with the Design branch (`features/Design_UIFoundation`, MR !1).

### Adding a new page

1. Create `app/(shell)/<route>/page.tsx` — inside `(shell)` if it needs navbar/sidebar,
   outside (next to `login/`) if it must be public.
2. Import primitives from `@/components/ui` and assemble:

   ```tsx
   import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

   export default function MyPage() {
     return (
       <Card className="max-w-lg">
         <CardHeader><CardTitle>New ticket</CardTitle></CardHeader>
         <CardContent>
           <form className="flex flex-col gap-4">
             <label className="flex flex-col gap-1.5 text-sm font-medium">
               Subject
               <Input required placeholder="What is the question?" />
             </label>
             <Button type="submit">Submit</Button>
           </form>
         </CardContent>
       </Card>
     );
   }
   ```

3. Need a sidebar menu item for it? Add one entry in `components/ui/nav-config.ts`
   (`NAV_ITEMS`, with the roles that may see it) — no JSX edits.

### Adding a shared component

- Standard shadcn primitives: `npx shadcn@latest add <name>` (drops into `components/ui/`).
- Custom component: put it in `components/ui/`, use semantic tokens only
  (`bg-primary`, `text-muted-foreground`…), then add a section with a live example to
  `app/(shell)/styleguide/page.tsx`.
- Feature-specific widgets do **not** go in `components/ui/` — they live in
  `features/<module>/`.

### Auth storage contract (client UX only)

The login flow (AI-25) writes after a successful login:

| Key | Value |
|---|---|
| `qa.auth.token` | JWT access token |
| `qa.auth.role` | `student` \| `trainer` \| `admin` |

`AppShell` redirects to `/login` when either key is missing, and bounces a role off
routes it may not see (e.g. student opening `/dashboard`) back to its role home —
same rules as the sidebar menu. Both are UX only: the backend re-checks every
request (AI-27). To preview the shell before the login API exists, sign in via the
demo buttons on `/login` or set these keys in DevTools.
