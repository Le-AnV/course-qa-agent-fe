# features/auth — E1 frontend (login, RBAC, profile, admin)

| Jira | Story | Assignee | Notes |
|---|---|---|---|
| AI-25 | Account Login | Hào | `/login` form; error message must not reveal if account exists |
| AI-27 | RBAC | Hào | route guards by role; **hiding menus ≠ protection** — backend enforces too |
| AI-29 | Personal Profile | Bui Trong Suu | view/change own profile |
| AI-31 | Admin: Course/Class/Account + bulk import | Khang Vu | admin screens: create course → class → assign trainer; `.xlsx` import w/ template download, per-row report |

**Planned files:** `login-form.tsx`, `role-guard.tsx`, `profile-panel.tsx`, `admin/` (courses, classes, import).

No self-registration anywhere (TECHSTACK v7).
