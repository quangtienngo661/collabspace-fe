# CollabSpace Frontend — Feature Coverage

Tóm tắt **chức năng UI** đã có, API phụ thuộc, và **việc nào chỉ cần FE** vs **việc nào cần backend**.

| Tài liệu liên quan | Mục đích |
|--------------------|----------|
| [fe-be-alignment.md](./fe-be-alignment.md) | Gap API, phase đã khớp |
| [fe-backlog.md](./fe-backlog.md) | Task polish theo người (P0–P3) |
| [roles-and-permissions.md](./roles-and-permissions.md) | Platform vs workspace role |
| BE `collabspace/docs/features.md` | Product canonical (microservices) |

**Cập nhật:** 2026-06-18

---

## Phân công team

| Thành viên | Vùng phụ trách | Pages / modules chính |
|------------|----------------|------------------------|
| **Ngô Quang Tiến** | Workspace & project | `WorkspaceListPage`, `WorkspaceDetailPage`, `ProjectListPage`, invite dialog trên WS detail |
| **Võ Trung Tín** | Task, board, dashboard, notification | `DashboardPage`, `KanbanBoardPage`, `TaskDetailSheet`, `NotificationsPage`, comments |
| **Phan Phú Thọ** | Admin, directory, invitations, UX chung | `AdminPage`, `InvitationsPage`, `UsersDirectoryPage`, shell polish, error mapping |

Chi tiết task ID: [fe-backlog.md](./fe-backlog.md) (đồng bộ 2 chiều với doc này). Bảng dưới ghi **Owner** cho phần **Partial** / việc còn lại.

---

## Ký hiệu

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **Done** | Flow end-to-end qua API thật |
| **Partial** | API có; UX / số liệu / polish còn thiếu |
| **FE-only** | Chỉ sửa UI/client — không cần endpoint mới |
| **Needs BE** | Cần thay đổi hoặc endpoint mới ở `collabspace` |

**Nguyên tắc:** FE chỉ **hiển thị, validate sớm, map lỗi, gọi API**. Không tự “bịa” dữ liệu nghiệp vụ (member count, admin check, invite rules…) nếu BE chưa trả hoặc chưa reject request.

---

## Tổng quan nhanh

| Vùng | Trạng thái | Owner | Chủ yếu FE-only hay cần BE? |
|------|------------|-------|-----------------------------|
| Auth & sessions | **Done** | Thọ *(polish nhỏ)* | Done — BE auth-service |
| Profile & preferences | **Done** | Thọ *(polish nhỏ)* | Done |
| Workspace & project | **Done** | **Tiến** | FE polish **Done** (A1–A9, D2); invite rules **Needs BE** |
| Task & board | **Partial** | **Tín** | Kanban **Done**; Dashboard KPI **FE-only** (B9) |
| Comments | **Done** | **Tín** | Done |
| Notifications | **Done** | **Tín** (B7, B8) · **Thọ** (C7) | Done |
| Invitations | **Partial** | **Thọ** (+ Tiến: invite dialog) | Accept/reject **Done**; validation **Needs BE** |
| Activity | **Done** | **Tín** *(dashboard)* · Tiến *(WS tab nếu tách)* | Done |
| Platform admin | **Partial** | **Thọ** | 4 tab **Done**; overview KPI **FE-only** (C9); `force-join` UI planned |
| Presence & directory | **Done** | **Thọ** | Done |
| Shell UX | **Partial** | **Thọ** *(D1, D2, C7)* | Breadcrumb **Done**; lazy load / ErrorBoundary **chưa** — xem [fe-be-alignment § Technical debt](./fe-be-alignment.md#technical-debt--engineering-2026-06-17) |

---

## Auth & sessions — **Done**

| Chức năng | Route / UI | API | Ghi chú |
|-----------|------------|-----|---------|
| Login / Register | `/login`, `/register` | `POST /auth/login`, `/auth/register` | |
| Email OTP | `/otp` | `POST /auth/verify-email`, resend OTP | |
| Forgot / reset password | `/forgot-password`, `/reset-password` | `/auth/forgot-password`, `/auth/reset-password` | |
| Session refresh | (auto) | `httpClient` 401 → refresh | |
| Sessions list / revoke | `MyProfilePage` | `GET /auth/sessions`, revoke, logout-all | |
| Route guards | `AuthContext` | `GET /auth/me` | `isAdmin` = `admin` hoặc `auth.manage` |

**Owner:** **Phan Phú Thọ** — polish nhỏ (copy lỗi, skeleton form) khi rảnh; không ưu tiên.

---

## Profile & preferences — **Done**

**Owner:** **Phan Phú Thọ** — format ngày, validation `username` (P2).

| Chức năng | Route | API |
|-----------|-------|-----|
| Xem / sửa profile | `/profile` | `GET/PATCH /users/me` |
| Avatar | `/profile` | `POST /users/me/avatar` |
| Preferences | `/profile` | `GET/PATCH /users/preferences` |
| Đổi mật khẩu | `/profile` | `POST /auth/change-password` |
| Username cho `@mention` | `/profile` | `PATCH /users/me` (`username`) |

---

## Workspace & project — **Done** (FE polish)

**Owner:** **Ngô Quang Tiến**

| Chức năng | Route | API | Trạng thái | Việc còn (owner) |
|-----------|-------|-----|------------|------------------|
| Danh sách workspace | `/workspaces` | `GET /workspaces` | **Done** | A7 skeleton stats ✅ · A5 empty → `/invitations` ✅ |
| Tạo / xóa workspace | `/workspaces` | `POST/DELETE /workspaces` | **Done** | — |
| Chi tiết workspace | `/workspaces/:id` | `GET/PATCH /workspaces/:id` | **Done** | A8 member count ✅ · A2/A3 ✅ |
| Members tab | tab `members` | `GET .../members`, `DELETE`, `PATCH` role | **Done** | A1/A4 dropdown ✅ · D2 mobile scroll ✅ |
| Mời thành viên | dialog Invite | `POST .../invite` | **Partial** | **Tiến** UI ✅ · **Thọ** map lỗi ✅ · **BE** validation |
| Projects CRUD | `.../projects` | project endpoints | **Done** | A6 ẩn ⋯ ✅ · A9 format `createdAt` ✅ |
| Activity feed | Dashboard | `GET .../activity` | **Done** | *(widget dashboard → **Tín**)* |
| Active workspace context | Sidebar, ⌘K | context + cache | **Done** | — |

### Invite member — **Partial**

| Hành vi | Ai xử lý | Ghi chú |
|---------|----------|---------|
| Email trống | **FE** (+ BE) | Toast `Email is required` |
| Đã có lời mời pending | **FE** pre-check + **BE** `INVITE_ALREADY_PENDING` | FE chỉ bắt được nếu đã load `invitations` |
| Đã là member | **BE** chính (`INVITE_ALREADY_MEMBER`) | FE pre-check khi `profile.email` có trong list members |
| Email là platform admin | **BE** (`INVITE_PLATFORM_ADMIN`) | Cần auth internal lookup — **chưa merge/deploy BE** tại thời điểm doc |
| Map lỗi tiếng Anh | **FE** | `workspaceInviteErrors.ts` → toast |

**Không gửi email SMTP:** invite chỉ tạo bản ghi + notification in-app nếu email khớp user đã đăng ký (BE).

**Tiến (fe-backlog A):** ✅ **Done** — A1–A9, D2 (WS). Invite BE validation (`INVITE_*`) vẫn **Needs BE** (xem § Invite member).

---

## Task & board — **Partial**

**Owner:** **Võ Trung Tín**

| Chức năng | Route | API | Trạng thái | Việc còn (owner) |
|-----------|-------|-----|------------|------------------|
| Kanban board | `.../projects/:pid` | `GET /tasks/board` | **Done** | — |
| Tạo / sửa / xóa task | sheet + board | task CRUD, assign, status | **Done** | B6 assignee avatar trong sheet |
| Priority, labels, due date | task UI | `PATCH` task | **Done** | — |
| Attachments | task sheet | upload/delete attachment | **Done** | — |
| Server search | ⌘K / filters | `GET /tasks?q=` | **Done** | — |
| Dashboard KPI + chart | `/dashboard` | `GET /tasks` (list) | **Partial** | **Tín P0** — B9: `total` / `getBoard` |
| Task activity | `TaskDetailSheet` | `GET /tasks/:id/activity` | **Done** | D4 copy link `?task=` |
| `commentCount` trên card | Kanban | board API | **Partial** | Hiện badge khi BE trả `commentCount > 0`; có thể thiếu trên board DTO |

**Tín (fe-backlog B):** B2 dashboard empty state, B3 stat cards context, B6 assignee avatar, B7 notification labels *(shared với Notifications)*, B8 unread highlight, D4 task link.

---

## Comments — **Done**

**Owner:** **Võ Trung Tín** (trong `TaskDetailSheet`)

| Chức năng | UI | API |
|-----------|-----|-----|
| List / create / edit / delete | `TaskDetailSheet` | `/tasks/:id/comments` |
| Thread reply | UI | `parentId` |
| `@mention` autocomplete | editor | `users/search` + `username` trên profile |

---

## Notifications — **Done**

**Owner:** **Võ Trung Tín** (list, labels, unread) · **Phan Phú Thọ** (sidebar bell C7)

| Chức năng | Route | API | Việc còn |
|-----------|-------|-----|----------|
| List + unread count | `/notifications`, TopBar poll | `GET /notifications` | B8 unread row style — **Tín** |
| Mark read / read all | UI actions | `PATCH .../read`, `read-all` | — |
| Archive | UI | `PATCH .../archive` | — |
| Type labels | list UI | — | **Tín** — B7 |
| Sidebar bell badge | `Sidebar.tsx` | poll unread | **Thọ** — C7 |

---

## Invitations (người được mời) — **Done** (+ validation **Partial**)

**Owner:** **Phan Phú Thọ** (`InvitationsPage`, error mapping) · **Ngô Quang Tiến** (invite dialog trên WS detail)

| Chức năng | Route | API | Việc còn |
|-----------|-------|-----|----------|
| Lời mời của tôi | `/invitations` | `GET /invitations/me` | C5 fallback tên WS ✅ |
| Accept / reject | `/invitations`, notifications | `POST /invitations/:id/accept|reject` | — |
| Deep link từ notification | notifications UI | cùng API | **Tín** nối action từ notification |
| Invite validation toast | WS detail dialog | `POST .../invite` | **Thọ** `formatInviteError` ✅ · **BE** admin/member rules |

**Needs BE:** rule chặn invite admin / member trùng (workspace-service).

---

## Platform admin — **Partial**

**Owner:** **Phan Phú Thọ**

| Chức năng | Tab / route | API | Trạng thái | Việc còn |
|-----------|-------------|-----|------------|----------|
| Roles & permissions CRUD | `/admin` Roles | `/auth/admin/roles`, permissions | **Done** | C12, C13; unassign permission **Needs BE** |
| Users | Users | admin user APIs | **Partial** | C11 Last login label, C14 multi-role |
| Workspaces | Workspaces | `/workspaces/admin/all` | **Done** | C10 owner name (P1) |
| Broadcast | Broadcast | `POST .../broadcast` | **Done** | — |
| Health probe | — | per-service `/health/*` | **N/A** | Không có route `/admin/health` trên FE |
| Overview KPI | (chưa có) | aggregate list APIs | **Partial** | **Thọ P0** — C9 |

**Thọ (fe-backlog C):** C9 overview, C10–C14 admin polish, C2 users workspace count (P3), C8 friendly errors (invite ✅).

---

## Presence & user directory — **Done**

**Owner:** **Phan Phú Thọ**

| Chức năng | Route | API | Việc còn |
|-----------|-------|-----|----------|
| Online status poll | members, Kanban, directory | `POST /users/presence` | — |
| User directory | `/users` | `GET /users?q=` | C4 helper non-admin ✅ |
| Admin browse all | → `/admin?tab=users` | admin APIs | — |

---

## Shell & cross-cutting — **Partial**

**Owner:** **Phan Phú Thọ** (chính) · **Võ Trung Tín** (bell unread)

| Chức năng | Trạng thái | Owner | Loại |
|-----------|------------|-------|------|
| Sidebar + mobile nav | **Done** | Thọ | — |
| TopBar breadcrumb | **Done** (D3) | Thọ | FE-only ✅ |
| Command palette ⌘K | **Done** | Thọ | — |
| Dark mode | **Done** | Thọ | FE-only |
| Idempotency headers | **Done** | shared | FE + BE |
| Friendly API errors | invite ✅, admin | **Thọ** | FE-only |
| Loading skeleton (D1) | thiếu vài page | **Thọ** | FE-only |
| Mobile table scroll (D2) | **Done** | **Thọ** + **Tiến** (WS + Users) | FE-only ✅ |
| ErrorBoundary | chưa có | **Thọ** | FE-only — [fe-be-alignment T3](./fe-be-alignment.md#technical-debt--engineering-2026-06-17) |
| Route lazy loading | chưa có | **Thọ** | FE-only — T1 |
| Automated tests | 0 files | shared | Vitest/Playwright backlog |

---

## Việc chỉ cần FE — theo người

Tổng hợp từ [fe-backlog.md](./fe-backlog.md). Làm song song, không chờ BE.

### Ngô Quang Tiến · Workspace — ✅ Done

| Ưu tiên | ID | Việc | Trạng thái |
|---------|-----|------|------------|
| P0 | A7, A8 | Stats skeleton; tách members vs pending | ✅ |
| P1 | A6 | Ẩn ⋯ project card khi `!canManageProjects` | ✅ |
| P2 | A2, A3, A9 | Joined, pending badge, `createdAt` format | ✅ |
| P3 | A4, A5, D2 | Remove label; empty → invitations; mobile scroll | ✅ |

> Invite dialog validation (admin/member trùng) → **BE** — không thuộc backlog A.

### Võ Trung Tín · Task & Notification

| Ưu tiên | ID | Việc | File |
|---------|-----|------|------|
| **P0** | B9 | Dashboard KPI/chart — `total` hoặc `getBoard`, không cắt 50 task | `DashboardPage.tsx` |
| P0 | B2 | Dashboard empty state + link invitations | `DashboardPage.tsx` |
| P1 | B7 | Notification type labels đầy đủ | `NotificationsPage.tsx` |
| P1 | B8 | Unread visual trong list | `NotificationsPage.tsx` |
| P2 | B3 | Stat cards có workspace context | `DashboardPage.tsx` |
| P2 | B6 | Assignee avatar đủ trong task sheet | `TaskDetailSheet.tsx` |
| P3 | D4 | Copy link `?task={id}` | `TaskDetailSheet.tsx` |

### Phan Phú Thọ · Admin & cross-cutting

| Ưu tiên | ID | Việc | File |
|---------|-----|------|------|
| **P0** | C9 | Admin overview KPI (users, workspaces, …) | `AdminPage.tsx` |
| P1 | C10 | Resolve `ownerId` → tên/email | `AdminPage.tsx` |
| P1 | C11 | Sửa label `lastLoginAt` (không ghi “Active:”) | `AdminPage.tsx` |
| P1 | C12 | Role select chỉ platform `admin` / `user` | `AdminPage.tsx` |
| P1 | C13 | Permission matrix — row `admin` implicit all | `AdminPage.tsx` |
| P1 | C7 | Sidebar bell badge unread | `Sidebar.tsx` |
| P2 | C14 | Hiện đủ roles (badges), không chỉ `roles[0]` | `AdminPage.tsx` |
| P2 | C6 | Date format nhất quán (admin + shared) | `AdminPage.tsx`, utils |
| P3 | C1, C2 | Workspace info modal; users tab số workspace | `AdminPage.tsx` |
| P3 | D1 | Loading skeleton Notifications, Invitations, Users | các page tương ứng |
| P3 | D2 | Mobile scroll bảng `UsersDirectoryPage` | `UsersDirectoryPage.tsx` |

---

## Việc cần backend (FE không tự làm đủ)

| Mục | Lý do | BE / ghi chú |
|-----|--------|--------------|
| Invite: chặn admin / member trùng | Cần tra auth account + membership | workspace-service + auth internal lookup |
| Gỡ permission khỏi role | Không có HTTP unassign đầy đủ | auth-service |
| Gửi email SMTP cho invite | Ngoài MVP | notification / mailer |
| `force-join` workspace (admin) | Chưa có UI | `POST /workspaces/admin/...` nếu expose |

Sau khi BE merge invite validation: FE đã sẵn `formatInviteError` — chỉ cần deploy cả hai repo.

---

## Routes (App.tsx)

```
/login · /register · /otp · /forgot-password · /reset-password
/dashboard · /workspaces · /workspaces/:id · .../projects · .../projects/:pid
/notifications · /invitations · /users · /profile · /admin
/403 · 404
```

Platform `admin` → home redirect `/admin`. User thường → `/dashboard`. `CollaborationRoute` chặn admin vào luồng workspace collaboration.

---

## API clients (src/app/api)

| Module | Phạm vi chính |
|--------|----------------|
| `authApi` | login, register, OTP, password, sessions |
| `usersApi` | profile, avatar, preferences, presence, search |
| `workspaceApi` | workspaces, members, invite, invitations, projects, activity |
| `taskApi` | tasks, board, comments, activity, attachments |
| `notificationsApi` | list, read, archive |
| `adminApi` | roles, permissions, users, workspaces, broadcast |
| `healthApi` | admin health probe |

Chi tiết contract: `.claude/docs/api-integration.md` · BE `api-routes.md`.
