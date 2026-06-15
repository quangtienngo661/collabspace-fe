# CollabSpace Frontend — Project Architecture

## System context

```text
Browser (localhost:5173)
    │
    ▼
collabspace-fe (Vite + React 18 SPA)
    │  fetch → VITE_API_BASE_URL (/api/v1)
    ▼
[Vite dev proxy] ──► Traefik / API gateway (collabspace)
    │
    ├── auth-service      /api/v1/auth/*
    ├── user-service      /api/v1/users/*
    ├── workspace-service /api/v1/workspaces/*  (container :8080)
    ├── task-service      /api/v1/tasks/*
    └── notification-service /api/v1/notifications/*
```

Frontend **never** calls service ports directly. All traffic goes through the gateway prefix `/api/v1`.

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 18, TypeScript |
| Build | Vite 6 |
| Routing | React Router 7 (`react-router`) |
| Styling | Tailwind CSS 4, shadcn/Radix UI |
| Charts | Recharts |
| DnD | react-dnd (Kanban) |
| Toasts | Sonner |
| Theme | next-themes + localStorage `theme` |
| HTTP | Native `fetch` via `httpClient.ts` (not Axios) |

## Application bootstrap

- Entry: `src/main.tsx` → `src/app/App.tsx`
- `App.tsx`: `ThemeProvider` → `BrowserRouter` → `AuthProvider` → routes
- Authenticated shell: `ProtectedRoute` → `AppShell` (outlet for nested routes)
- Admin: separate routes `/admin`, `/admin/health` with `AdminRoute`

## Routing map

| Path | Page | Auth |
|------|------|------|
| `/login`, `/register`, `/otp`, `/forgot-password`, `/reset-password` | Auth pages | Public |
| `/dashboard` | Dashboard KPI + activity | Protected |
| `/workspaces` | Workspace list | Protected |
| `/workspaces/:id` | Workspace detail (members, settings) | Protected |
| `/workspaces/:id/projects` | Project list | Protected |
| `/workspaces/:id/projects/:pid` | Kanban board | Protected |
| `/notifications` | Notification inbox | Protected |
| `/invitations` | Accept/reject by invitation ID | Protected |
| `/profile` | Profile, sessions, preferences | Protected |
| `/admin` | Platform admin tabs | Admin |
| `/admin/health` | Service health probes | Admin |
| `/403` | Forbidden | Public |

## Global state

| Concern | Mechanism |
|---------|-----------|
| Session / user | `AuthContext` — `authApi.me()`, `usersApi.me()`, preferences |
| Workspace list | `WorkspacesContext` — single `workspaceApi.list()` for layout |
| Notifications badge | `NotificationsContext` — `notificationsApi.list()` |
| Theme | `App` local state + `document.documentElement.classList` |
| Server data (local) | `useAsyncData` hook — loading/error/reload per page |
| Request dedupe | `requestCache.ts` — 3s TTL in-flight + result cache |

## Auth flow

1. Login → `authApi.login` → `setStoredSession` (localStorage)
2. `AuthProvider.refresh` → `GET /auth/me` + `GET /users/me` + preferences
3. `httpClient` attaches `Authorization: Bearer <accessToken>`
4. On 401 → `POST /auth/refresh` → retry once → else redirect `/login`
5. Admin: `isAdmin` from role or `auth.manage` permission

## Data enrichment (client-side)

Some KPIs are **not** returned by list APIs:

- `clientStats.ts` — fetches members/projects/tasks per workspace to fill `memberCount`, `taskCount` on workspace list (N+1; acceptable for demo scale).

## FE completion status (MVP)

Aligned with `docs/fe-be-alignment.md`:

- **Done:** Auth flows, workspace/project CRUD, Kanban board API, task detail (priority, due date, labels, attachments, delete), comments CRUD, notifications read, invitations accept/reject, workspace/task activity, admin platform UI, user search in TopBar, logout-all sessions.
- **Intentionally disabled / BE gap:** notification archive, member role change, remove member, invite role select, admin unassign permission from role.
- **Polish gaps:** DELETE workspace (BE has owner DELETE; FE not wired), threaded comments UI, live presence polling, dueDate/labels on create-task modal, `commentCount` on board cards.

## Backend reference

Product truth and HTTP contracts live in the **collabspace** repo. Link, do not fork:

- `docs/features.md`
- `docs/api-routes.md`
- `.claude/docs/service-contracts.md`

When adding a feature, confirm the BE endpoint exists before building UI.
