# CollabSpace Frontend — API Integration

How the SPA talks to the CollabSpace backend. Canonical BE contracts: `collabspace/docs/api-routes.md`, `collabspace/.claude/docs/service-contracts.md`.

## Base URL & proxy

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Prefix for all requests. Default `/api/v1` |
| `VITE_API_PROXY_TARGET` | Vite proxy upstream (dev/preview only) |

```text
Browser → GET http://localhost:5173/api/v1/users/me
Vite proxy → GET http://localhost/api/v1/users/me (Traefik)
```

**Production static hosting:** set `VITE_API_BASE_URL` to full gateway URL at build time, or serve behind reverse proxy that forwards `/api/v1`.

**Dev rule:** keep `VITE_API_BASE_URL=/api/v1` and proxy — avoids CORS on forward-auth routes.

## httpClient

File: `src/app/api/httpClient.ts`

- `apiRequest<T>(path, options)` — main entry
- Options: `method`, `body`, `headers`, `auth` (default true), `retryOnUnauthorized` (default true)
- JSON body auto-stringified; `FormData` passed through (avatar upload)
- Unwraps `{ data: T }` responses (task-service pattern)
- `ApiError` with `status`, `message`, `payload`

### Token refresh

On 401 with `auth: true`:

1. `POST /auth/refresh` with stored `refreshToken` (deduped via shared `refreshPromise`)
2. Update session in localStorage
3. Retry original request once
4. **FormData bodies cannot be replayed** — throws `ApiError(401, "Session refreshed — retry the upload")`; caller must retry upload manually
5. On refresh failure → clear session, dispatch `collabspace:session-expired`

## Session storage

File: `src/app/api/session.ts`

- Key: collabspace session in `localStorage`
- `setStoredSession(session, { emit?: boolean })` — `emit: false` on login to prevent double refresh
- `session-changed` event for cross-tab sync

## Mappers

File: `src/app/api/mappers.ts`

Normalize BE inconsistencies:

- snake_case ↔ camelCase (`created_at`, `invitee_email`)
- Nested user on members
- Task status enum (`TODO` / `DOING` / `DONE`)
- Activity timeline action labels
- Notification type aliases (`commentmentioned` → `comment_mentioned`)

**Always map at API boundary** — UI uses `types.ts` shapes only.

## Request cache

File: `src/app/api/requestCache.ts`

- `cachedRequest(key, fn)` — 3s TTL + in-flight dedupe
- `invalidateCachedRequestPrefix(prefix)` — after mutations

Cached today: `auth/me`, `users:me`, `users:preferences`, `workspaces:list`, `workspaces:get:*`, `workspaces:members:*`, `workspaces:projects:*`, `users:bulk:*`.

Invalidate on login/logout and workspace create.

## API modules by domain

### authApi

| Method | Endpoint |
|--------|----------|
| login | `POST /auth/login` |
| register | `POST /auth/register` |
| me | `GET /auth/me` |
| refresh | (via httpClient) |
| OTP / password / sessions | `/auth/*` |

### usersApi

| Method | Endpoint | Notes |
|--------|----------|-------|
| me | `GET /users/me` | PATCH only `fullName`, `displayName`, `username`, `bio` |
| preferences | `GET/PATCH /users/me/preferences` | |
| avatar | `POST /users/me/avatar` | multipart `file` |
| status | `PATCH /users/me/status` | No GET — do not call `/users/me/status` |
| presence | `GET /users/presence?userIds=` | Optional live status |
| search | `GET /users/search?q=` | TopBar debounced |
| bulk | `POST /users/bulk` | `{ userIds: [] }` |

### workspaceApi

| Method | Endpoint |
|--------|----------|
| list/get/create/update | `/workspaces`, `/workspaces/:id` |
| members | `GET /workspaces/:id/members` |
| invitations | `GET /workspaces/:id/invitations` |
| invite | `POST /workspaces/:id/invite` body `{ email }` only |
| list my invitations | `GET /invitations/me` |
| accept/reject | `POST /invitations/:id/accept|reject` |
| projects CRUD | `/workspaces/:wsId/projects` |
| activity | `GET /workspaces/:id/activity?limit&offset` |
| delete workspace | `DELETE /workspaces/:id` — owner-only; wired in `WorkspaceListPage`, `WorkspaceDetailPage` |

### taskApi

| Method | Endpoint |
|--------|----------|
| list | `GET /tasks?workspaceId&...` |
| board | `GET /tasks/board?workspaceId&projectId` |
| create | `POST /tasks` |
| update details | `PATCH /tasks/:id/details` — no `taskId` in body |
| update status | `PATCH /tasks/:id/status` |
| assign | `PATCH /tasks/:id/assign` |
| delete | `DELETE /tasks/:id` |
| comments | `/tasks/:id/comments` |
| attachments | `/tasks/:id/attachments` |
| activity | `GET /tasks/:id/activity` |

Task create supports `dueDate`, `labels` — UI may not expose all fields in create modal.

### notificationsApi

| Method | Endpoint |
|--------|----------|
| list | `GET /notifications?skip&limit&status` |
| mark read | `PATCH /notifications/:id/read` |
| mark all | `PATCH /notifications/read-all` |
| archive | `PATCH /notifications/:id/archive` |

### adminApi

Platform admin under `/auth/admin/*`, `/users/admin/*`, `/workspaces/admin/*`, `/notifications/admin/broadcast`.

Broadcast requires header `Idempotency-Key` (UUID).

### dlqApi

Platform admin DLQ endpoints under `/dlq/*`.

| Method | Endpoint | Notes |
|--------|----------|-------|
| list | `GET /dlq/messages` | Raw fetch keeps `{ data, nextCursor, total }` intact |
| replay | `POST /dlq/messages/:id/replay` | No request body required |
| replayBatch | `POST /dlq/replay-batch` | Max 50 records |
| resolve | `POST /dlq/messages/:id/resolve` | Body `{ resolutionNote }`; required string, 5-1000 chars |
| discard | `POST /dlq/messages/:id/discard` | Body `{ resolutionNote }`; required string, 5-1000 chars |

## Common pitfalls (historical)

| Issue | Fix |
|-------|-----|
| Resend OTP with `userId` | Body `{ email }` only |
| Profile PATCH extra fields | Only allowed DTO fields |
| PATCH task details with `taskId` in body | Omit — id is in URL |
| `GET /users/me/status` | Does not exist |
| Cross-origin API in dev | Use Vite proxy |
| Duplicate `/me` after login | `emit: false` + refresh dedupe |
| Data fetching at scale | No TanStack Query — `useAsyncData` + context + 3s `requestCache` |
| JWT storage | `localStorage` — XSS risk; httpOnly cookie needs BE change |

## Checking alignment

After API changes:

1. Compare with `collabspace` controller DTO / Swagger
2. Update `docs/fe-be-alignment.md`
3. Run `fe-be-alignment` subagent or skill `/fe-api-integration`
