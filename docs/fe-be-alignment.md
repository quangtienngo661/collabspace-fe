# CollabSpace FE ↔ BE — Backlog căn chỉnh API

Tài liệu này liệt kê các chỗ **frontend** (`collabspace-fe`) còn cần sửa để khớp **backend** (`collabspace`).  
Nguồn backend: [collabspace `docs/features.md`](https://github.com/lengocanh2005it/collabspace/blob/main/docs/features.md), [api-routes](https://github.com/lengocanh2005it/collabspace/blob/main/docs/api-routes.md), [roles-and-permissions.md](./roles-and-permissions.md).

**Agent docs:** `CLAUDE.md`, `.claude/docs/api-integration.md`, skill `/fe-be-alignment`.

**Cập nhật:** 2026-06-17  
**Trạng thái backend MVP:** Auth, User, Workspace, Task, Comment, Notification — **Done**  
**Trạng thái Platform Admin API:** **Done** — xem [admin-backlog (BE)](https://github.com/lengocanh2005it/collabspace/blob/main/docs/team/admin-backlog.md)

**Platform roles (BE 2026-06-16):** `admin` | `user` — FE sync trong [fe-backlog § E](./fe-backlog.md#e--platform-role-sync-admin--user---done-2026-06-16).

**Trạng thái FE (main):** Phase 2 ✅ · Phase 3 ✅ · Phase Admin ✅ · Phase 4 ✅ · Phase 5 ✅ · Phase 6 (USER-T1 pickers) ✅ · UX/Role gating ✅

**Luồng demo MVP 7 bước (FE ↔ BE):** **Done** — invite accept/reject, comments + `@mention`, mark-read/read-all, workspace + task activity, admin ban/unban.

---

## Gap còn lại (tóm tắt — 2026-06-17)

| Mục | FE | BE | Ghi chú |
|-----|----|----|---------|
| Promote member → **manager** | UI có (owner) | `PATCH .../members/:userId` | ✅ — xem [roles-and-permissions.md](./roles-and-permissions.md) |
| Gỡ permission khỏi role (admin) | Toast khi bỏ tick | Chỉ assign | Chờ BE unassign endpoint |
| `commentCount` Kanban | Hiện khi BE trả `> 0` | Board có thể thiếu field | Optional BE hoặc N+1 |
| Invite validation (admin/member/pending) | Pre-check + `formatInviteError` | Rule đầy đủ | **Needs BE** — xem [fe-backlog § INV](./fe-backlog.md#inv--invite-validation--thọ-fe--be) |
| Admin overview KPI | Chưa có hàng stat tổng | Aggregate từ list APIs | **FE-only** — [fe-backlog C9](./fe-backlog.md#c9--adminpage--thiếu-overview--kpi-tổng--p0--thọ) |
| Admin `force-join` workspace | Chưa có UI | `POST /workspaces/admin/:id/force-join` | Planned (ít dùng) |

**Đã khớp (không còn gap tích hợp):** mark-read / read-all, comments CRUD, `GET /invitations/me` + accept/reject, workspace/task activity API, archive notification (`PATCH .../archive`), admin 4 tab (Roles, Users, Workspaces, Broadcast), ban/unban user.

**Không còn mismatch API nghiêm trọng** cho các endpoint end-user/admin đã expose.

---

## Đã khớp (không cần sửa thêm)

| Vùng | Ghi chú |
|------|---------|
| Auth cơ bản | Login, register, verify email, forgot/reset password, change password, logout, sessions |
| Workspace / Project | CRUD, invite member, list members, owner delete workspace |
| Task cơ bản | List, board, create, assign, đổi status, comments, attachments, activity |
| Notifications | List, mark-read, read-all, archive, deep link → task |
| Invitations | `GET /invitations/me`, accept/reject trên `/invitations` + notification actions |
| Activity | `GET /workspaces/:id/activity`, `GET /tasks/:id/activity` — Dashboard + WS detail + task sheet |
| User | Avatar upload, list/bulk, preferences, presence poll |
| HTTP client | Unwrap `{ data }` đúng pattern task-service |
| Platform admin | `adminApi` + `AdminPage` 4 tab; ban/unban, RBAC matrix, broadcast |
| Admin gate (FE) | `AuthContext.isAdmin` — `role === admin` hoặc `permissions` có `auth.manage` (khớp `PlatformAdminGuard`) |

---

## Phase 2 — Bug gây lỗi API (400) ✅ Đã sửa

| # | Vấn đề | Trạng thái |
|---|--------|-----------|
| 2.1 | Resend OTP gửi `userId` thay vì `email` | ✅ `authApi.resendVerificationOtp(email)` + `OtpPage` lấy email từ `sessionStorage.pendingVerificationEmail` |
| 2.2 | Profile save gửi field thừa (`jobTitle`, `department`…) | ✅ `usersApi.updateMe` chỉ nhận `fullName, displayName, username, bio`; `MyProfilePage` gửi đúng 4 field |
| 2.3 | Task edit gửi thừa `taskId` trong body | ✅ `taskApi.updateDetails` chỉ đặt taskId trong URL path, body sạch |

---

## Phase 3 — Tích hợp API MVP demo ✅ Done (2026-06)

Luồng demo 7 bước [`collabspace/docs/features.md`](../../collabspace/docs/features.md) đã nối API end-to-end trên FE:

| # | Bước demo | FE (hiện tại) | API backend |
|---|-----------|---------------|-------------|
| 3.1 | Accept/reject lời mời | `InvitationsPage`, `NotificationsPage`, `workspaceApi.listMyInvitations` | `GET /invitations/me`, `POST /invitations/{id}/accept\|reject` |
| 3.2 | Comment + `@mention` | `TaskComments.tsx` trong `TaskDetailSheet` | `GET/POST/PATCH/DELETE /tasks/{id}/comments` |
| 3.3 | Mark notification read | `notificationsApi`, `TopBar`, `NotificationsPage` | `PATCH /notifications/{id}/read`, `read-all` |
| 3.4 | Workspace activity | `DashboardPage`, `WorkspaceDetailPage` | `GET /workspaces/{id}/activity` |
| 3.5 | Task activity | `TaskActivity.tsx` | `GET /tasks/{id}/activity` |

---

## Phase Admin — Platform Administration API

Backend **Done** (A1–A7, AUTH-1→12, USER-1/2, WS-1→3, NOTIF-1, USER-T1).  
Nguồn: [admin-backlog.md](../../collabspace/docs/team/admin-backlog.md) · [features.md § Platform Administration](../../collabspace/docs/features.md) · [api-routes.md § Platform Admin API](../../collabspace/docs/api-routes.md).

**FE hiện tại:** `AdminPage.tsx` 4 tab (Roles, Users, Workspaces, Broadcast) + `adminApi.ts` typed; `/admin/health` probe đầy đủ.

### Polish admin (2026-06)

| Mục | Trạng thái |
|-----|------------|
| `POST /auth/admin/permissions` | [x] `adminApi.createPermission` + dialog **New Permission** |
| `PUT /auth/admin/roles/{id}` | [x] `adminApi.updateRole` + dialog **Edit** trên custom role |
| Gỡ permission khỏi role | BE chưa hỗ trợ — FE toast khi bỏ tick (đúng) |
| `GET /auth/admin/users` | [x] `listAllUsersEnriched()` merge `lastLoginAt` vào aggregate |
| Error codes (`PLATFORM_ADMIN_REQUIRED`, …) | [x] `formatAdminApiError()` trong `adminErrors.ts` |
| Typed admin DTOs | [x] `AdminRole`, `AdminPermission`, … + mappers |

### Tình trạng FE admin — ✅ Done (2026-06)

| Thành phần | FE | Backend |
|------------|-----|---------|
| Roles & Permissions | Matrix + CRUD qua `adminApi` | `/auth/admin/roles`, permissions, assign |
| Users | `listAllUsersEnriched`, role select, ban/unban, delete | `/users/admin/all`, active-status, anonymize |
| Workspaces | List + force delete | `/workspaces/admin/all`, `DELETE` |
| Broadcast | Form + idempotency key | `POST /notifications/admin/broadcast` |
| `AdminRoute` / `isAdmin` | ✅ | `PlatformAdminGuard` |

**Chưa có UI:** `POST /workspaces/admin/:id/force-join` (điều tra workspace — ít ưu tiên).

### Admin-0 — Tạo API layer (bắt buộc trước)

Tạo `src/app/api/adminApi.ts` (hoặc tách `authAdminApi`, `usersAdminApi`, `workspaceAdminApi`, `notificationAdminApi`):

| Service | Method | Path |
|---------|--------|------|
| auth | `GET` | `/auth/admin/roles` |
| auth | `GET` | `/auth/admin/permissions` |
| auth | `POST` | `/auth/admin/roles` |
| auth | `PUT` | `/auth/admin/roles/{id}` |
| auth | `DELETE` | `/auth/admin/roles/{id}` |
| auth | `POST` | `/auth/admin/permissions` |
| auth | `POST` | `/auth/admin/roles/{roleId}/permissions` |
| auth | `POST` | `/auth/admin/users/{userId}/roles` |
| auth | `GET` | `/auth/admin/users` |
| auth | `PATCH` | `/auth/admin/users/{id}/active-status` |
| user | `GET` | `/users/admin/all` |
| user | `DELETE` | `/users/admin/{id}` |
| workspace | `GET` | `/workspaces/admin/all` |
| workspace | `DELETE` | `/workspaces/admin/{id}` |
| workspace | `POST` | `/workspaces/admin/{id}/force-join` |
| notification | `POST` | `/notifications/admin/broadcast` |

Yêu cầu kỹ thuật:

- Mọi request dùng Bearer (đã có trong `httpClient`).
- Broadcast: header `Idempotency-Key` bắt buộc (`IDEMPOTENCY_KEY_REQUIRED` nếu thiếu).
- Xử lý lỗi: `403` + `PLATFORM_ADMIN_REQUIRED`, `DIRECTORY_QUERY_REQUIRED`, validation 400.
- Mapper riêng trong `mappers.ts` (admin user aggregate ≠ DTO end-user).

### Admin-1 — Tab Roles & Permissions (`AdminPage.tsx`)

| UI | API |
|----|-----|
| Load matrix | `GET /auth/admin/roles`, `GET /auth/admin/permissions` |
| Toggle permission ↔ role | `POST /auth/admin/roles/{roleId}/permissions` |
| Tạo / sửa / xóa role | `POST`, `PUT`, `DELETE /auth/admin/roles/{id}` |

Xóa copy *"Currently mocked frontend-only"* và logic `setTimeout` trong `saveChanges()`.

### Admin-2 — Tab User Roles (`AdminPage.tsx`)

| UI hiện tại | Sửa thành |
|-------------|-----------|
| `usersApi.list({ limit: 100 })` | `GET /users/admin/all` (aggregate auth + profile) |
| Dropdown `admin` / `user` (protected platform roles) | `POST /auth/admin/users/{userId}/roles` với `roleId` từ `GET /auth/admin/roles` |
| Không có ban/unban | Toggle `PATCH /auth/admin/users/{id}/active-status` `{ isActive }` |
| Không có cột đăng nhập | Hiển thị `lastLoginAt` từ `GET /auth/admin/users` |
| Không có xóa user | Nút + confirm → `DELETE /users/admin/{id}` (`204`) |

**Lưu ý:** Platform roles trên BE là entity có `id` + `name` — protected: `admin`, `user` (legacy `member`/`viewer` đã migrate).

### Admin-3 — Tab Workspaces (mới)

| UI đề xuất | API |
|------------|-----|
| Bảng tất cả workspace | `GET /workspaces/admin/all` |
| Force delete | `DELETE /workspaces/admin/{id}` |
| Force join (audit) | `POST /workspaces/admin/{id}/force-join` — body `{ role: "member", reason }` |

Route đề xuất: `/admin/workspaces` trong `App.tsx` + nav item trong `AdminWorkspaceLayout.tsx`.

> End-user UI (`WorkspaceDetailPage`) vẫn **disabled** delete — đúng contract; chỉ platform admin xóa qua admin API.

### Admin-4 — Tab Broadcast (mới)

| UI | API |
|----|-----|
| Form `title` + `body` | `POST /notifications/admin/broadcast` |
| Header | `Idempotency-Key: <uuid>` |

Hiển thị job id / trạng thái queued từ response.

### Admin-5 — Health page (cải thiện)

| File | Sửa |
|------|-----|
| `src/app/api/healthApi.ts` | Thêm probe `GET /tasks/health/live`, `GET /notifications/health/live` (hiện bỏ qua) |

### Admin-6 — USER-T1 ảnh hưởng end-user (không chỉ admin)

Backlog admin: `GET /users` và `/users/search` **bắt buộc có `q`** (trừ platform admin).

FE đang gọi `usersApi.list()` **không có `q`** tại:

- `src/app/components/pages/task/CreateTaskModal.tsx`
- `src/app/components/pages/task/KanbanBoardPage.tsx`
- `src/app/components/pages/task/TaskDetailSheet.tsx`

→ User thường gặp `403 DIRECTORY_QUERY_REQUIRED`.

**Sửa:** assignee picker search-as-you-type (`usersApi.list({ q })`) hoặc dùng `workspaceApi.members()` trong workspace.

### Checklist đóng admin-backlog § Đồng bộ Admin UI

| # | Việc (admin-backlog) | Trạng thái FE |
|---|----------------------|---------------|
| 1 | UI gọi đúng endpoint / OpenAPI client | [x] `adminApi.ts` + wire pages |
| 2 | Đối chiếu path `/admin/*` với bảng contract | [x] |
| 3 | Dùng `GET /users/admin/all` thay list user thường | [x] |
| 4 | Error codes (`PLATFORM_ADMIN_REQUIRED`, `IDEMPOTENCY_KEY_REQUIRED`, …) | [x] `formatAdminApiError()` |
| 5 | `POST /auth/admin/permissions` + UI tạo permission | [x] |
| 6 | `PUT /auth/admin/roles/{id}` + UI sửa role | [x] |
| 7 | Typed admin DTOs + mappers | [x] |
| 8 | `listAllUsersEnriched()` (auth + profile) | [x] |

### Thứ tự implement Admin

```text
Admin-0 (adminApi) → Admin-1/2 (AdminPage RBAC + users) → Admin-3 (workspaces) → Admin-4 (broadcast) → Admin-5 (health) → Admin-6 (USER-T1 task pickers)
```

---

### Mismatch FE↔BE đã sửa (2026-06)

| # | Vấn đề | Sửa |
|---|--------|-----|
| M1 | Invite accept/reject dùng `targetId` (workspaceId) | `getNotificationInvitationId()` → `metadata.invitationId` |
| M2 | Activity API dùng `skip` | Đổi sang `offset` (workspace + task) |
| M3 | Task activity parse `{ items, total }` + field BE | `mapActivityTimelineItem`, `TaskActivity.tsx` |
| M4 | Dashboard activity field ảo (`user`, `action`) | Dùng `actorName`, `summary`, `occurredAt` |
| M5 | Workspace role badge map `owner → admin` | `RoleBadge` nhận `"owner"` trực tiếp, amber badge riêng |
| M6 | Task delete không gate creator | `canDeleteTask = profile.userId === task.creatorId` |
| M7 | Project edit/delete không gate owner | `isOwner = workspace.ownerId === profile.userId` |
| M8 | Due date hiển thị raw ISO string | `formatDueDate()` + `dueDateStatus()` in `format.ts` |
| M9 | Kanban `+` button không pre-fill status | `createStatus` state + `onAdd(status: TaskStatus)` callback |
| M10 | Invite dialog gửi role field không tồn tại | Bỏ `inviteRole` state và Select; chỉ gửi `email` |

---

### Phase 4 — Hiển thị / UX (2026-06) ✅

| # | Việc | Trạng thái |
|---|------|------------|
| 4.1 | KPI `memberCount` / `taskCount` / `projectCount` | [x] `clientStats.ts` enrich client-side |
| 4.2 | Badge `commentCount` luôn 0 | [x] Ẩn badge (BE không trả field) |
| 4.5 | Deep link notification → task sheet | [x] `?task=` + `navigateFromNotification` |
| 4.6 | Dashboard click task | [x] `TaskDetailSheet` trên Dashboard |
| 4.9 | Pagination notifications | [x] skip/limit + prev/next + `unreadCount` |
| 4.10 | Copy lỗi notification | [x] `formatNotificationsError()` |

---

## Phase 4 — Hiển thị sai / thiếu dữ liệu (lịch sử)

Không crash nhưng UI **lệch contract** hoặc **gây hiểu nhầm**.

| # | Vấn đề | File FE | Ghi chú / sửa đề xuất |
|---|--------|---------|------------------------|
| 4.1 | `memberCount` / `taskCount` / `projectCount` luôn 0 | `src/app/api/mappers.ts`, `DashboardPage.tsx`, `ProjectListPage.tsx` | BE không trả count trên workspace/project DTO — tính client-side từ `members` / `tasks` hoặc bỏ KPI |
| 4.2 | Badge `commentCount` luôn 0 | `KanbanBoardPage.tsx`, `TaskListView.tsx`, `mappers.ts` | BE task DTO không có `commentCount` — ẩn badge đến khi Phase 3.2 xong |
| 4.3 | Presence luôn `offline` | `usersApi.ts`, `AuthContext.tsx`, `mappers.ts` | Gọi `GET /users/me/status` khi load profile; `PATCH /users/me/status` đã đúng (`busy` → `dnd`) |
| 4.4 | Thiếu type `comment_mentioned` | `mappers.ts`, `NotificationsPage.tsx`, `TopBar.tsx` | BE emit `COMMENT_MENTIONED` — thêm icon, filter, label |
| 4.5 | Deep link notification task | `mappers.ts` | `targetId` = task UUID; link cần mở board + task sheet (có thể cần fetch task lấy `projectId`) |
| 4.6 | Dashboard navigate task khi `projectId` null | `DashboardPage.tsx` | Hiện navigate `/workspaces/{ws}/projects/tasks` — không phải UUID hợp lệ |
| 4.7 | Invitation mapping fragile | `workspaceApi.ts` | Chỉ map snake_case (`invitee_email`); nên hỗ trợ cả `inviteeEmail`, `createdAt` |
| 4.8 | Profile UI field ảo | `MyProfilePage.tsx`, `mappers.ts` | Hiển thị Job Title / Department / Location — BE không lưu; gộp với Phase 2.2 |
| 4.9 | `notificationsApi` bỏ qua pagination | `notificationsApi.ts` | BE trả `{ notifications, total, unreadCount }` — dùng `skip`/`limit`, hiển thị `unreadCount` |
| 4.10 | Copy “notifications unavailable” cũ | `notificationsApi.ts`, `NotificationsPage.tsx`, `TopBar.tsx`, `AdminWorkspaceLayout.tsx` | Thu hẹp `NotificationsUnavailableError` (404); cập nhật copy sau Phase 3.3 |

---

## Phase 5 — Nice-to-have (sau MVP) ✅

| # | Mục | File | Ghi chú |
|---|-----|------|---------|
| 5.1 | `taskApi` board / delete / attachments | `taskApi.ts` | [x] `getBoard`, `delete`, `uploadAttachment`, `deleteAttachment`, `updateDetails` đủ field |
| 5.2 | Kanban dùng board API | `KanbanBoardPage.tsx` | [x] `GET /tasks/board?workspaceId=` |
| 5.3 | Create task status gửi BE | `CreateTaskModal.tsx` | [x] `TODO/DOING/DONE` + `updateStatus` sau create |
| 5.4 | Task detail đủ field + delete | `TaskDetailSheet.tsx` | [x] priority, dueDate, labels, attachments, delete |
| 5.5 | Global search TopBar | `TopBar.tsx` | [x] `GET /users/search?q=` debounced popover |
| 5.6 | `logoutAll` UI | `MyProfilePage.tsx` | [x] Sessions tab — Logout All Devices |
| 5.7 | ~~Admin RBAC mock~~ | `AdminPage.tsx` | Chuyển sang **Phase Admin** — BE đã có `/admin/*` |
| 5.8 | Delete workspace / đổi role member (end-user) | — | End-user API chưa expose — UI disabled **đúng** |
| 5.9 | `healthApi` task/notification | `healthApi.ts` | [x] Đã có probe (Phase Admin) |
| 5.10 | Dead code `mockData.ts` | — | [x] Đã xóa |

---

## Technical debt & engineering (2026-06-17)

Không chặn demo MVP; ưu tiên sau polish UI trong [fe-backlog.md](./fe-backlog.md).

| # | Mục | Trạng thái FE | Effort | Ghi chú |
|---|-----|---------------|--------|---------|
| T1 | Route code-splitting (`React.lazy`) | Chưa có — `App.tsx` import tĩnh | Thấp | `AdminPage`, `KanbanBoardPage`, `TaskDetailSheet` |
| T2 | `React.memo` Kanban cards/columns | Chưa có | Thấp | Re-render board khi drag/drop |
| T3 | `ErrorBoundary` | Chưa có | Thấp | Render error → white screen |
| T4 | Unit / E2E tests | 0 test files | Cao | Chưa có Vitest/Playwright |
| T5 | TanStack Query | Dùng `useAsyncData` + 3 context + `requestCache` 3s | Cao | Không stale-while-revalidate tự động |
| T6 | JWT trong `localStorage` | `session.ts` | Cao (cần BE) | httpOnly cookie hoặc tối thiểu harden XSS |
| T7 | FormData sau 401 refresh | Throw, không retry upload | Trung bình | `httpClient.ts` — avatar/attachment UX |
| T8 | `AdminPage.tsx` monolith | ~981 dòng, 4 tab | Trung bình | Tách sub-pages khi refactor |
| T9 | `as any` casts | `taskApi.ts`, `KanbanBoardPage` (react-dnd refs) | Thấp | — |

**Ưu tiên đề xuất:** T3 ErrorBoundary → T1 lazy routes → T2 Kanban memo → T7 FormData retry → T5 Query (refactor lớn).

---

## Thứ tự implement (cập nhật 2026-06-17)

```text
[Done] Phase 2–6 + Admin  →  [Now] fe-backlog polish (A/B/C/D)  →  [Next] Technical debt T1–T3  →  [Later] T5 Query, T6 cookie
```

| Ưu tiên | Hạng mục | Impact |
|---------|----------|--------|
| 1 | [fe-backlog](./fe-backlog.md) P0 — dashboard KPI (B9), workspace stats (A7/A8), admin overview (C9) | Hiển thị dữ liệu đúng |
| 2 | Technical debt T3, T1, T2 | Ổn định + performance |
| 3 | Invite validation **BE** + map lỗi FE | Tránh invite sai rule |
| 4 | TanStack Query migration | Maintainability dài hạn |

---

## Checklist nhanh theo mức độ

| Mức | Số mục | Ý nghĩa |
|-----|--------|---------|
| Bug 400 | 3 | Sửa ngay |
| Thiếu API/UI (end-user) | 5 | Chặn demo end-to-end |
| Hiển thị sai | 10 | Misleading, không crash |
| **Phase Admin** | 6 nhóm | Admin UI + USER-T1 pickers |
| Optional | 8 | Sau MVP |

---

## Cấu hình FE

Dev (`npm run dev`) — **dùng Vite proxy**, không gọi thẳng URL backend từ trình duyệt:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost
```

Prod Droplet / domain từ máy dev:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=https://collabspace.ngocanh2005it.site
```

Build prod deploy cùng domain với API: có thể giữ `VITE_API_BASE_URL=/api/v1` (relative). Static host khác domain: cần CORS đúng trên gateway backend.

---

## Tài liệu liên quan

| Tài liệu | Repo |
|----------|------|
| [features.md](../../collabspace/docs/features.md) | collabspace |
| [api-routes.md](../../collabspace/docs/api-routes.md) | collabspace |
| [mvp-demo-scope.md](../../collabspace/docs/mvp-demo-scope.md) | collabspace |
| [admin-backlog.md](../../collabspace/docs/team/admin-backlog.md) | collabspace — Platform Admin API (BE Done) |
| [README.md](../README.md) | collabspace-fe |
