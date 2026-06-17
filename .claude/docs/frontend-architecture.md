# CollabSpace Frontend — Folder Architecture

Per-area layout and patterns. Mirror of backend `.claude/docs/service-architecture.md` for the SPA.

## Top-level `src/app/`

```text
src/app/
├── api/                 # All backend HTTP access
├── auth/                # AuthContext + route guards
├── context/             # Shared React contexts (workspaces, notifications)
├── components/
│   ├── layout/          # App chrome
│   ├── pages/           # Route-level screens
│   ├── shared/          # Reusable domain components
│   └── ui/              # Design system primitives (shadcn)
├── hooks/               # Shared hooks
├── utils/               # Pure helpers (format, navigation)
└── App.tsx              # Router root
```

## `api/` — HTTP layer

| File | Responsibility |
|------|----------------|
| `httpClient.ts` | `apiRequest`, `API_BASE_URL`, 401 refresh, `{ data }` unwrap |
| `session.ts` | localStorage session read/write, `session-changed` event |
| `requestCache.ts` | TTL cache + in-flight dedupe; `invalidateCachedRequestPrefix` |
| `types.ts` | Domain types consumed by UI |
| `mappers.ts` | BE JSON → domain (snake_case, nested shapes) |
| `authApi.ts` | Login, register, OTP, password, sessions |
| `usersApi.ts` | Profile, avatar, preferences, search, bulk, presence |
| `workspaceApi.ts` | Workspaces, projects, members, invitations, activity |
| `taskApi.ts` | Tasks, board, comments, attachments, activity |
| `notificationsApi.ts` | List, mark read, read-all, archive |
| `adminApi.ts` | Platform admin mutations |
| `adminErrors.ts` | Map BE error codes to user messages |
| `clientStats.ts` | Client-side KPI enrichment |
| `index.ts` | Re-exports (optional) |

### Where to add code

| Task | Path |
|------|------|
| New endpoint wrapper | `src/app/api/<domain>Api.ts` |
| New domain field | `types.ts` + `mappers.ts` |
| Shared cache key | `requestCache.ts` + invalidate on mutations |
| API error mapping | `adminErrors.ts` or local catch in page |

**Rule:** Pages and components import `*Api` modules — never call `fetch` directly.

## `auth/`

| File | Role |
|------|------|
| `AuthContext.tsx` | Session state, `login`/`logout`/`refresh`, `isAdmin`, guards |

Exports: `AuthProvider`, `useAuth`, `ProtectedRoute`, `AdminRoute`.

Login uses `setStoredSession(..., { emit: false })` then `refresh()` to avoid duplicate `/me` calls.

## `context/`

| Context | Provides |
|---------|----------|
| `WorkspacesContext` | `workspaces`, `loading`, `reload` |
| `NotificationsContext` | `notifications`, `unreadCount`, `reload` |

Wrap in `AppShell` so Sidebar/TopBar do not each call list APIs.

## `components/layout/`

| Component | Role |
|-----------|------|
| `AppShell` | Outlet + providers + Sidebar + TopBar + MobileNav |
| `Sidebar` | Nav links, workspace switcher |
| `TopBar` | Search, notifications dropdown, profile menu |
| `MobileNav` | Responsive nav |

## `components/pages/`

Organized by domain:

```text
pages/
├── auth/           Login, Register, Otp, Forgot/Reset password
├── workspace/      List, Detail
├── project/        Project list
├── task/           Kanban, TaskDetailSheet, CreateTaskModal, TaskComments, TaskActivity
├── profile/        MyProfilePage
├── admin/          AdminPage, AdminWorkspaceLayout
├── DashboardPage.tsx
├── NotificationsPage.tsx
├── InvitationsPage.tsx
└── ErrorPages.tsx
```

### Where to add a new screen

1. Create component under `pages/<area>/`.
2. Register route in `App.tsx` (protected vs public vs admin).
3. Add nav link in `Sidebar` / `MobileNav` if needed.
4. If it needs new API → extend `api/` first.

## `components/shared/`

Cross-page UI: `UserAvatar`, `StatusBadge`, `EmptyState`, `ConfirmDialog`, `RoleBadge`, etc.

Keep presentational — pass data from pages/hooks.

## `components/ui/`

shadcn/Radix primitives. **Do not** put business logic here.

Add new primitives only when reused across multiple pages.

## `hooks/`

| Hook | Use |
|------|-----|
| `useAsyncData` | Generic fetch + `enabled` for lazy load |
| `useWorkspaceMemberUsers` | Members + bulk user hydrate (cached) |
| `useTaskDeepLink` | Open task sheet from URL/query |
| `useNotificationOpenTaskRedirect` | Notification → task navigation |

## Patterns

### Loading data in a page

```tsx
const state = useAsyncData(() => workspaceApi.get(id), [id]);
if (state.loading) return <Skeleton />;
if (state.error) return <Error />;
const workspace = state.data;
```

Prefer context for data shared across layout (workspaces, notifications).

### Mutations

1. Call `*Api` method.
2. `toast.success` / `toast.error` (Sonner).
3. `state.reload()` or `invalidateCachedRequestPrefix("workspaces:")`.
4. Update context if needed.

### Modals / sheets

- `CreateTaskModal`, `TaskDetailSheet` — controlled open state from parent page.
- Lazy-fetch assignees: `useWorkspaceMemberUsers(workspaceId, { enabled: open })`.

### Admin

`AdminPage` — tabbed UI (roles, users, workspaces, broadcast). `adminApi` + `formatAdminApiError`.

## Anti-patterns

- Duplicate `workspaceApi.list()` in every page — use `WorkspacesContext`.
- Calling `GET /users/me/status` — endpoint does not exist; status from `GET /users/me` or `PATCH /users/me/status`.
- Absolute API URL in dev — breaks CORS; use proxy.
- Importing `User` from lucide and `types` without alias — use `User as DomainUser` or rename type import.
