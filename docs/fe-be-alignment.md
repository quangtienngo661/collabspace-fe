# CollabSpace FE ↔ BE — Backlog căn chỉnh API

Tài liệu này liệt kê các chỗ **frontend** (`collabspace-fe`) còn cần sửa để khớp **backend** (`collabspace`).  
Nguồn backend: [`docs/features.md`](../../collabspace/docs/features.md), [`docs/api-routes.md`](../../collabspace/docs/api-routes.md).

**Cập nhật:** 2026-06-15  
**Trạng thái backend MVP:** Auth, User, Workspace, Task, Comment, Notification — **Done**  
**Trạng thái Platform Admin API:** **Done** — xem [admin-backlog.md](../../collabspace/docs/team/admin-backlog.md)

**Trạng thái FE (branch `feat/re-enable-auth-flows`):** Phase 2 ✅ · Phase 3 ✅ · Phase Admin ✅ · Phase 6 (USER-T1 pickers) ✅ · Phase 4 một phần (comment_mentioned, activity feed, invitation mapping) · Phase 5 chưa làm

---

## Đã khớp (không cần sửa thêm)

| Vùng | Ghi chú |
|------|---------|
| Auth cơ bản | Login, register, verify email, forgot/reset password, change password, logout, sessions |
| Workspace / Project | CRUD, invite member, list members |
| Task cơ bản | List, create, assign, đổi status; priority đã normalize (Phase 1) |
| User | Avatar upload, list/bulk, preferences |
| HTTP client | Unwrap `{ data }` đúng pattern task-service |
| Admin gate (FE) | `AuthContext.isAdmin` — `role === admin` hoặc `permissions` có `auth.manage` (khớp `PlatformAdminGuard`) |

---

## Phase 2 — Bug gây lỗi API (400)

Các flow **đang gọi BE nhưng body/request sai** → dễ trả `400 Bad Request` (`forbidNonWhitelisted: true`).

| # | Vấn đề | File FE | Backend mong đợi | Cách sửa |
|---|--------|---------|------------------|----------|
| 2.1 | Resend OTP gửi `userId` | `src/app/api/authApi.ts`, `src/app/components/pages/auth/OtpPage.tsx` | `POST /api/v1/auth/resend-verification-otp` body `{ email }` | Đổi `resendVerificationOtp(email)`; gửi email từ `sessionStorage` (`collabspace.pendingVerificationEmail`) |
| 2.2 | Profile save gửi field không hỗ trợ | `src/app/api/usersApi.ts`, `src/app/components/pages/profile/MyProfilePage.tsx` | `PATCH /api/v1/users/me` — chỉ `fullName`, `displayName`, `username`, `bio` | Bỏ `jobTitle`, `department`, `location`, `timezone` khỏi body; thêm input `username` (pattern `^[a-z0-9._-]+$`) |
| 2.3 | Sửa task title gửi thừa `taskId` | `src/app/api/taskApi.ts`, `src/app/components/pages/task/TaskDetailSheet.tsx` | `PATCH /api/v1/tasks/:id/details` — `{ title, description?, priority?, dueDate?, labels? }` | Bỏ `taskId` khỏi body PATCH |

---

## Phase 3 — Thiếu tích hợp API (chặn MVP demo)

Backend **đã có**; FE **chưa có client hoặc UI**.

Ánh xạ luồng demo [`docs/features.md` § Luồng demo end-to-end](../../collabspace/docs/features.md):

| # | Bước demo | File FE thiếu / disabled | API backend |
|---|-----------|--------------------------|-------------|
| 3.1 | User B accept/reject lời mời | `src/app/api/workspaceApi.ts`, không có route/page | `POST /api/v1/invitations/{id}/accept`, `POST /api/v1/invitations/{id}/reject` |
| 3.2 | Comment + `@mention` trên task | Không có comment API; `TaskDetailSheet.tsx` không có UI comment | `POST/GET/PATCH/DELETE /api/v1/tasks/{taskId}/comments` — body `{ content, parentId? }` |
| 3.3 | Mark notification read | `src/app/api/notificationsApi.ts` (chỉ list); `NotificationsPage.tsx`, `TopBar.tsx` disabled + toast | `PATCH /api/v1/notifications/{id}/read`, `PATCH /api/v1/notifications/read-all` |
| 3.4 | Workspace activity feed | `DashboardPage.tsx` dựng activity từ task `updatedAt` | `GET /api/v1/workspaces/{id}/activity?limit=&offset=` |
| 3.5 | Task activity trong detail | `TaskDetailSheet.tsx` | `GET /api/v1/tasks/{id}/activity?limit=&offset=` |

### Chi tiết Phase 3

#### 3.1 Invitation accept/reject

```ts
// workspaceApi.ts — đề xuất thêm
acceptInvitation(id: string)  → POST /invitations/{id}/accept
rejectInvitation(id: string)   → POST /invitations/{id}/reject
```

UI: trang `/invitations` hoặc action trên `NotificationsPage` khi `type === workspace_invited`.

#### 3.2 Comments

```ts
// taskApi.ts — đề xuất thêm
listComments(taskId)
createComment(taskId, { content, parentId? })
updateComment(taskId, commentId, { content })
deleteComment(taskId, commentId)
```

Cần `username` trên profile (`PATCH /users/me`) để `@mention` hoạt động.

#### 3.3 Notifications mark-read

```ts
// notificationsApi.ts — đề xuất thêm
markRead(id: string)     → PATCH /notifications/{id}/read
markAllRead()            → PATCH /notifications/read-all
list({ skip, limit })    → GET /notifications?skip=0&limit=20
```

Xóa toast *"Notification write API is not exposed yet"* ở `TopBar.tsx`, `NotificationsPage.tsx`.

---

## Phase Admin — Platform Administration API

Backend **Done** (A1–A7, AUTH-1→12, USER-1/2, WS-1→3, NOTIF-1, USER-T1).  
Nguồn: [admin-backlog.md](../../collabspace/docs/team/admin-backlog.md) · [features.md § Platform Administration](../../collabspace/docs/features.md) · [api-routes.md § Platform Admin API](../../collabspace/docs/api-routes.md).

**FE hiện tại:** `AdminPage.tsx` mock toàn bộ RBAC; chưa có client `/admin/*`; chưa có tab Workspaces / Broadcast.

### Tình trạng FE admin

| Thành phần | Hiện tại | Backend |
|------------|----------|---------|
| `AdminPage.tsx` — Roles & Permissions | Matrix + Save **mock** (`setTimeout` + toast) | `GET/POST/PUT/DELETE /auth/admin/roles`, permissions, assign |
| `AdminPage.tsx` — User Roles | `usersApi.list({ limit: 100 })` + dropdown local | `GET /users/admin/all`, `POST /auth/admin/users/:userId/roles` |
| Ban / unban user | Không có | `PATCH /auth/admin/users/:id/active-status` |
| `lastLoginAt` | Không hiển thị | `GET /auth/admin/users` |
| Workspace admin | Không có UI | `GET/DELETE /workspaces/admin/*`, `POST .../force-join` |
| System broadcast | Không có UI | `POST /notifications/admin/broadcast` + header `Idempotency-Key` |
| `AdminRoute` / `isAdmin` | ✅ Đúng | `PlatformAdminGuard` → `403 PLATFORM_ADMIN_REQUIRED` |

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
| Dropdown `admin` / `member` / `viewer` (local state) | `POST /auth/admin/users/{userId}/roles` với `roleId` từ `GET /auth/admin/roles` |
| Không có ban/unban | Toggle `PATCH /auth/admin/users/{id}/active-status` `{ isActive }` |
| Không có cột đăng nhập | Hiển thị `lastLoginAt` từ `GET /auth/admin/users` |
| Không có xóa user | Nút + confirm → `DELETE /users/admin/{id}` (`204`) |

**Lưu ý:** Platform roles trên BE là entity có `id` + `name` — không map cứng `admin|member|viewer` của mock FE.

### Admin-3 — Tab Workspaces (mới)

| UI đề xuất | API |
|------------|-----|
| Bảng tất cả workspace | `GET /workspaces/admin/all` |
| Force delete | `DELETE /workspaces/admin/{id}` |
| Force join (audit) | `POST /workspaces/admin/{id}/force-join` — body `{ role: "admin", reason }` |

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
| 4 | Error codes (`PLATFORM_ADMIN_REQUIRED`, `IDEMPOTENCY_KEY_REQUIRED`, …) | [x] toast từ `ApiError.message` |

### Thứ tự implement Admin

```text
Admin-0 (adminApi) → Admin-1/2 (AdminPage RBAC + users) → Admin-3 (workspaces) → Admin-4 (broadcast) → Admin-5 (health) → Admin-6 (USER-T1 task pickers)
```

---

## Phase 4 — Hiển thị sai / thiếu dữ liệu

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

## Phase 5 — Nice-to-have (sau MVP)

| # | Mục | File | Ghi chú |
|---|-----|------|---------|
| 5.1 | `taskApi` thiếu board / delete / attachments | `taskApi.ts` | `GET /tasks/board`, `DELETE /tasks/:id`, `POST/DELETE /tasks/:id/attachments` |
| 5.2 | Kanban dùng list thay board API | `KanbanBoardPage.tsx` | `GET /tasks/board?workspaceId=` gom sẵn cột TODO/DOING/DONE |
| 5.3 | Create task form status không gửi BE | `CreateTaskModal.tsx` | Dropdown `in_progress`/`done` không map API; task luôn tạo `TODO` |
| 5.4 | Task detail thiếu priority/dueDate/labels/edit | `TaskDetailSheet.tsx` | `PATCH /tasks/:id/details` hỗ trợ đủ field |
| 5.5 | Global search TopBar | `TopBar.tsx` | Wire `GET /users/search?q=` hoặc filter task |
| 5.6 | `logoutAll` chưa có UI | `authApi.ts`, `MyProfilePage.tsx` | `POST /auth/logout-all` đã có client |
| 5.7 | ~~Admin RBAC mock~~ | `AdminPage.tsx` | Chuyển sang **Phase Admin** — BE đã có `/admin/*` |
| 5.8 | Delete workspace / đổi role member (end-user) | `WorkspaceDetailPage.tsx`, `WorkspaceListPage.tsx` | End-user API chưa expose — UI disabled **đúng**; platform admin dùng Phase Admin-3 |
| 5.9 | `healthApi` bỏ qua task/notification | `healthApi.ts` | Thêm probe `GET /tasks/health/live`, `GET /notifications/health/live` |
| 5.10 | Dead code `mockData.ts` | `src/app/data/mockData.ts` | Không được import — xóa hoặc giữ Storybook |

---

## Thứ tự implement đề xuất

```text
Phase 2 (fix 400)  →  Phase 3 (MVP demo)  →  Phase 4 (display)  →  Phase Admin  →  Phase 5 (polish)
```

| Ưu tiên | Phase | Impact |
|---------|-------|--------|
| 1 | Phase 2 | Sửa flow đang broken (OTP, profile, task edit) |
| 2 | Phase 3 | Hoàn thành demo 7 bước: invite → accept → comment → mark-read |
| 3 | Phase 4 | UX đúng dữ liệu thật |
| 4 | Phase Admin | Wire Admin UI với `/admin/*` (backend đã Done) |
| 5 | Phase 5 | Tùy chọn sau MVP |

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
