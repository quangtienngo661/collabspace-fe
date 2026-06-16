# FE Backlog — CollabSpace Frontend

> **Cập nhật:** 2026-06-16  
> **Đối chiếu codebase:** 2026-06-16 — audit hiển thị dữ liệu + Admin  
> **Tham chiếu:** [`roles-and-permissions.md`](../../collabspace/docs/roles-and-permissions.md), [`features.md`](../../collabspace/docs/features.md)  
> **Hai lớp role cần nhớ:**  
> - **Platform:** `admin` · `member` · `viewer` (quản lý trong auth-service)  
> - **Workspace:** `owner` · `manager` · `member` (quản lý trong workspace-service)

**Ký hiệu:** ✅ Done · 🟡 Gần xong · ⬜ Còn lại

---

## Phân công đề xuất

| Người | Vùng phụ trách |
|-------|----------------|
| **Ngô Quang Tiến** | Workspace pages (WorkspaceDetail, ProjectList, WorkspaceList) |
| **Võ Trung Tín** | Task & Notification (Dashboard, KanbanBoard, TaskDetail, Notifications) |
| **Phan Phú Thọ** | Cross-cutting (Admin, UsersDirectory, Invitations, UX chung) |

---

## Audit — Hiển thị dữ liệu & Admin (2026-06-16)

Rà soát toàn FE sau feedback “giao diện hiển thị dữ liệu sai sai”, đặc biệt **Admin** và **Dashboard thống kê**.

### Tóm tắt theo mức độ

| Mức | Mục | Vấn đề ngắn | Owner |
|-----|-----|-------------|-------|
| **P0** | B9 | Dashboard KPI + chart đếm trên tối đa **50 task** (BE default limit), bỏ qua `total` | Tín |
| **P0** | A7 | Workspace list flash **0 members / 0 projects** trước khi `enrichWorkspacesStats` (N+1) | Tiến |
| **P0** | A8 | Header “X Members” **gồm pending invitations** | Tiến |
| **P0** | C9 | Admin **không có overview** (tổng users, active, workspaces…) | Thọ |
| **P1** | C10 | Admin workspace tab: **Owner ID = UUID** thô | Thọ |
| **P1** | C11 | Admin users: `lastLoginAt` gắn nhãn **“Active:”** (sai nghĩa) | Thọ |
| **P1** | C12 | Role select hiện **cả custom RBAC role** — dễ gán nhầm platform role | Thọ |
| **P1** | C13 | Permission matrix: row `admin` disabled + unchecked → trông như **không có quyền** | Thọ |
| **P2** | A9 | Project card tab Projects: `createdAt` **raw ISO** | Tiến |
| **P2** | C14 | Users tab chỉ hiện `roles[0]` — bỏ qua multi-role | Thọ |

### Ghi chú kỹ thuật (P0 Dashboard)

- `DashboardPage.tsx` gọi `taskApi.list({ workspaceId })` không `limit` → BE `TASK_LIST_DEFAULT_LIMIT = 50`.
- Response có `{ tasks, total }` nhưng FE chỉ `.then(r => r.tasks)` rồi `.filter()` đếm — **sai khi >50 task**.
- Kanban dùng `taskApi.getBoard` (limit cao hơn) nên **board đúng, dashboard sai** — dễ gây hiểu nhầm.

### Ghi chú kỹ thuật (P0 Admin)

- `AdminPage` có 4 tab CRUD; mô tả tab Workspaces nói “statistics” nhưng **chỉ là bảng list**, không có KPI tổng.
- `memberCount` từ `GET /workspaces/admin/all` qua `mapAdminWorkspace` — field này **ổn** nếu BE đúng; vấn đề chính là **thiếu context** (owner name, overview, label).

---

## A — Ngô Quang Tiến · Workspace pages

### A1 · WorkspaceDetailPage — Members tab — ✅ Done

**Vấn đề:** Member không có quyền quản lý người khác vẫn thấy nút `⋯` trên hàng của người đó (dù bên trong chỉ có disabled text "Only owner or manager can edit"). Confusing.

**Fix:** Ẩn hoàn toàn nút `⋯` cho member khi `canRemoveMember(target) === false` **và** không có action nào khả dụng.

**Đã xử lý:** `WorkspaceDetailPage.tsx` chỉ render dropdown khi `canRemoveMember(member)` — không còn disabled text.

---

### A2 · WorkspaceDetailPage — Hiển thị ngày gia nhập

**Vấn đề:** Cột `joinedAt` trong bảng members không hiển thị hoặc hiển thị raw ISO string.

**Fix:** Thêm cột "Joined" với `timeAgo(member.joinedAt)` và tooltip full date.

```tsx
// Thêm vào TableHead
<TableHead className="text-xs text-slate-500 hidden lg:table-cell">Joined</TableHead>

// Thêm vào TableCell
<TableCell className="hidden lg:table-cell text-xs text-slate-400">
  <span title={new Date(member.joinedAt).toLocaleString()}>{timeAgo(member.joinedAt)}</span>
</TableCell>
```

---

### A3 · WorkspaceDetailPage — Pending invitations dễ nhận ra hơn

**Vấn đề:** Pending invitations hiện trong cùng bảng members với role "member" và status "pending", nhưng không có visual indicator rõ ràng (chỉ `user.title = "Pending Invitation"`).

**Fix:**
- Thêm `<Badge variant="outline">Pending</Badge>` ở cột Role thay vì `RoleBadge` với role "member"
- Style khác biệt: row opacity thấp hơn, italic email
- Hiển thị ngày hết hạn invitation nếu có (`expiresAt`)

---

### A4 · WorkspaceDetailPage — Phân biệt hai loại "xóa" trong dropdown — 🟡 Gần xong

**Vấn đề:** Khi owner nhìn vào dropdown của một manager, text chỉ là "Remove manager" nhưng không rõ đây là xóa khỏi workspace hay chỉ demote.

**Fix:** Tách thành 2 action riêng biệt trong dropdown:
- "Demote to member" (nếu `isOwner && target.role === "manager"`) — **đã có**
- "Remove from workspace" (luôn hiện nếu `canRemoveMember`) — **còn hiện "Remove manager" / "Remove member"**

---

### A5 · WorkspaceListPage — Viewer thấy trang nhưng không có context

**Vấn đề:** User với platform role `viewer` truy cập `/workspaces` sẽ thấy empty state "No workspaces yet" + không có nút tạo. Không có giải thích tại sao.

**Fix:** Trong empty state, thêm note cho viewer:
```tsx
{!canCreateWorkspace && (
  <p className="text-xs text-slate-400 mt-2">
    Your account is read-only. Contact an admin to get workspace access.
  </p>
)}
```

---

### A6 · ProjectListPage — "New Project" button khi member truy cập

**Vấn đề:** Khi member navigate vào workspace họ tham gia, nút "New Project" ẩn đúng nhưng dropdown `⋯` trên mỗi project card vẫn hiện với disabled text.

**Fix:** Ẩn hoàn toàn nút `⋯` trên project card nếu `!canManageProjects` (không cần show disabled text, đã có tooltip trên badge role).

---

### A7 · WorkspaceListPage — Stats flash “0 members / 0 projects” — P0

**Vấn đề:** `workspaceApi.list()` thường không trả `memberCount`/`projectCount` → mapper default `0`. Card hiện `0` cho đến khi `enrichWorkspacesStats()` chạy xong (N+1 request mỗi workspace).

**Fix (chọn một):**
- Skeleton / `—` trên stats khi `enriched` chưa load
- Hoặc BE trả count trong list response
- Hoặc endpoint aggregate một lần thay vì N+1 trong `clientStats.ts`

---

### A8 · WorkspaceDetailPage — Đếm member gồm pending invite — P0

**Vấn đề:** Header `{memberRows.length} Members` nhưng `memberRows` = members thật + pending invitations → số **cao hơn thực tế**.

**Fix:**
- Header: `{members.length} members` (+ `{invitations.length} pending` riêng nếu có)
- Kết hợp A3: badge Pending ở cột Role, không dùng `RoleBadge role="member"`

---

### A9 · WorkspaceDetailPage — Project `createdAt` raw ISO — P2

**Vấn đề:** Tab Projects hiện `Created {p.createdAt}` — chuỗi ISO đầy đủ, không qua `timeAgo` / locale.

**Fix:** `timeAgo(p.createdAt)` + tooltip `toLocaleString()`, hoặc dùng `<DateDisplay format="absolute" />` (C6).

---

## B — Võ Trung Tín · Task & Notification

### B1 · DashboardPage — BarChart labels không thân thiện — ✅ Done

**Vấn đề:** XAxis của task status chart hiển thị `TODO`, `DOING`, `DONE` (enum values từ BE).

**Đã xử lý:** `DashboardPage.tsx` map `TODO`→`Todo`, `DOING`→`Doing`, `DONE`→`Done` trong `chartData`. (Có thể polish thêm thành "To Do" / "In Progress" nếu muốn đồng bộ với Kanban.)

---

### B2 · DashboardPage — Empty state khi chưa có workspace — 🟡 Gần xong

**Vấn đề:** Khi user chưa có workspace nào, Dashboard chỉ hiện 1 alert card mà không dẫn hướng rõ.

**Hiện trạng:** Đã có `EmptyState` + block pending invitations + link `/invitations`. Còn thiếu action "Browse Workspaces" rõ ràng cho user không tạo được workspace (viewer / chỉ có invite).

---

### B3 · DashboardPage — Stat cards thiếu context

**Vấn đề:** 6 stat cards chỉ hiện số, không có tooltip hay sparkline. "15 tasks" — của workspace nào? Khoảng thời gian nào?

**Fix:**
- Thêm tên workspace đang active vào tiêu đề trang: `Dashboard · {activeWorkspace?.name}`
- Thêm subtitle nhỏ cho mỗi card: "in {activeWorkspace.name}" hoặc "this workspace"
- Tasks overdue card: highlight màu đỏ nếu `count > 0`

---

### B4 · KanbanBoardPage — Column header thiếu số task — ✅ Done

**Vấn đề:** Column header chỉ hiện "TODO / DOING / DONE" mà không có badge đếm số task.

**Đã xử lý:** `KanbanColumn` hiển thị label ("To Do", "In Progress", "Done") + badge `{tasks.length}`.

---

### B5 · KanbanBoardPage — Task cards thiếu visual — ✅ Done

**Vấn đề:** Task card trên kanban thiếu: assignee avatar, due date indicator, priority color.

**Đã xử lý:** `KanbanCard` có `PriorityBadge`, `UserAvatar` assignee, due date với màu từ `dueDateStatus()`.

---

### B6 · TaskDetailSheet — Assignee không có avatar đầy đủ

**Vấn đề:** Khi task được assign, TaskDetailSheet hiển thị tên nhưng avatar có thể chỉ hiện initials (không load từ user-service).

**Fix:** Dùng `useWorkspaceMemberUsers` hook (đã có) để lookup user profile đầy đủ khi `workspaceId` available.

---

### B7 · NotificationsPage — Type label fallback

**Vấn đề:** Một số notification types mới (ví dụ `workspace_deleted`, `comment_created`) không có trong `notifTypeLabel` map → hiện raw type string.

**Fix:** Bổ sung vào map:
```ts
const notifTypeLabel: Record<string, string> = {
  ...existing,
  workspace_deleted: "Workspace Deleted",
  workspace_invited: "Workspace Invite",
  comment_created: "New Comment",
  comment_mentioned: "You were mentioned",
  user_registered: "New Member",
  user_profile_updated: "Profile Updated",
  task_assigned: "Task Assigned",
};
```

---

### B8 · NotificationsPage — Unread badge và grouping

**Vấn đề:** Notifications hiện dưới dạng flat list. Unread/Read/Archived tab có nhưng items không có visual phân biệt rõ giữa unread và read trong cùng 1 tab.

**Fix:**
- Unread items: left border `border-l-2 border-blue-500` + background `bg-blue-50/30`
- Read items: normal styling
- Thêm "Mark all as read" button ở top của tab Unread

---

### B9 · DashboardPage — KPI & chart sai khi >50 tasks — P0

**Vấn đề:** `taskApi.list({ workspaceId })` không truyền `limit`. BE default **50** bản ghi. FE bỏ qua `result.total`, chỉ đếm trên `result.tasks` → KPI (Total / Completed / In Progress), bar chart, và “My Assigned Tasks” **sai** khi workspace có nhiều task.

**Fix:**
```tsx
// Option A — KPI từ total (cần thêm query theo status hoặc aggregate BE)
const { tasks, total } = await taskApi.list({ workspaceId, limit: 1 });
// dùng total cho "Total Tasks"; status counts cần list theo status hoặc getBoard

// Option B — chart + KPI từ board (đã có limit cao phía BE)
const boardTasks = await taskApi.getBoard({ workspaceId });
// đếm status trên boardTasks; myTasks filter assigneeId từ boardTasks
```

**Ưu tiên:** `getBoard` cho chart/KPI workspace-scope; giữ `list` có pagination cho “My Assigned Tasks” nếu cần.

---

## C — Phan Phú Thọ · Admin, Users, Cross-cutting

### C1 · AdminPage — Workspace tab không có link xem detail

**Vấn đề:** Admin có thể list workspace nhưng không navigate được vào workspace detail (CollaborationRoute block admin). Không có cách xem nhanh info của workspace.

**Fix:** Thêm modal "View workspace info" khi admin click vào workspace row, hiện: tên, mô tả, ownerId, member count, created date. Không cần navigate sang route collaboration.

---

### C2 · AdminPage — Users tab: role badge hiện platform role, không rõ có workspace nào

**Vấn đề:** Users tab chỉ hiện platform role (`admin`/`member`/`viewer`) nhưng không biết user đó thuộc workspace nào. Audit rất khó.

**Fix:** Thêm cột "Workspaces" với số workspace user đang là member (nếu API trả về). Hoặc thêm tooltip "Member of N workspaces".

---

### C3 · AdminPage — Destructive actions thiếu confirmation — ✅ Done

**Vấn đề:** Ban user / delete user / delete workspace trong AdminPage có thể thiếu ConfirmDialog.

**Đã xử lý:** `AdminPage.tsx` có `ConfirmDialog` cho ban/reactivate (`toggleActiveTarget`), delete & anonymize user, force delete workspace.

---

### C4 · UsersDirectoryPage — Non-admin không biết phải search — ✅ Done

**Vấn đề:** Non-admin user vào `/users` thấy empty state không có gì, không biết phải gõ gì. BE trả 403 nếu không có query param `q`.

**Đã xử lý:** `EmptyState` "Search the directory" + placeholder "Search by name or email..." khi `!hasQuery && !canBrowseAll`.

---

### C5 · InvitationsPage — Workspace name null — ✅ Done

**Vấn đề:** `invitation.workspaceName` có thể là `null` (nếu workspace bị xóa hoặc API không trả về). Hiện tại render `null` ra UI.

**Đã xử lý:** `invitation.workspaceName ?? "Workspace"`. (Có thể đổi thành "Unknown workspace" nếu muốn rõ hơn.)

---

### C6 · Hiển thị ngày tháng nhất quán toàn app

**Vấn đề:** Các trang dùng inconsistent formats:
- `member.joinedAt` → raw ISO string hoặc không hiện
- `invitation.createdAt` → `timeAgo()`
- `task.dueDate` → `formatDueDate()`
- `notification.createdAt` → `timeAgo()`

**Fix:** Chuẩn hóa:
- **Relative (events, notifications, joins):** `timeAgo()` + tooltip là full date
- **Due dates:** `formatDueDate()` với color từ `dueDateStatus()`
- **Absolute (created/updated timestamps):** `toLocaleDateString("vi-VN")` hoặc `en-US`

Tạo 1 component `<DateDisplay date={iso} format="relative|absolute|due" />` dùng chung.

---

### C7 · Sidebar — Badge unread notifications

**Vấn đề:** Bell icon trong Sidebar không có unread count badge, phải click vào mới biết có notification mới.

**Fix:**
```tsx
// Trong renderNavItem hoặc custom cho bell
{item.to === "/notifications" && unreadCount > 0 && (
  <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 min-w-[18px] text-center">
    {unreadCount > 99 ? "99+" : unreadCount}
  </span>
)}
```
`unreadCount` đã có từ `useNotifications()` context.

---

### C8 · Error messages từ BE quá kỹ thuật

**Vấn đề:** Khi action thất bại, toast hiện raw BE error: "Validation failed (uuid is expected)" hay "ForbiddenException: Only workspace owner...".

**Fix:** Tạo util `friendlyError(err)` map các error phổ biến:
```ts
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Forbidden") || msg.includes("403")) return "You don't have permission to do this.";
  if (msg.includes("Not Found") || msg.includes("404")) return "The item was not found.";
  if (msg.includes("Conflict") || msg.includes("409")) return "This action conflicts with existing data.";
  if (msg.includes("Validation")) return "Please check your input and try again.";
  return msg;
}
```
Dùng `toast.error(friendlyError(err))` thay vì `err.message` trực tiếp.

---

### C9 · AdminPage — Thiếu overview / KPI tổng — P0

**Vấn đề:** Admin không có màn tổng quan. User kỳ vọng “thống kê” nhưng chỉ thấy bảng từng tab. Khó nắm quy mô platform một cái nhìn.

**Fix:** Thêm hàng stat cards phía trên tabs (derive từ data đã load):
- Total users · Active · Banned
- Total workspaces · Total members (sum `memberCount`)
- Custom roles / permissions count (optional)

Không cần API mới nếu aggregate client-side từ `usersState` + `workspacesState`.

---

### C10 · AdminPage — Workspace owner hiện UUID — P1

**Vấn đề:** Cột Owner hiện `ws.ownerId` (UUID) — không audit được.

**Fix:** Lookup owner từ `usersState.data` (hoặc `usersApi.bulk` một lần cho unique ownerIds): hiện tên + email, tooltip giữ UUID.

---

### C11 · AdminPage — Nhãn “Active:” cho lastLoginAt — P1

**Vấn đề:** `lastLoginAt` hiển thị với prefix **“Active:”** — user hiểu nhầm là trạng thái account (đã có cột Account Status riêng).

**Fix:** Đổi thành `Last login: {toLocaleString()}` hoặc `timeAgo(lastLoginAt)`.

---

### C12 · AdminPage — Role select lẫn custom RBAC roles — P1

**Vấn đề:** Dropdown “Update Role” liệt kê **mọi** role từ `listRoles()` (gồm custom). Platform user chỉ nên gán `admin` / `member` / `viewer`.

**Fix:** Filter `SelectItem` chỉ `isProtectedRole(r.name)` hoặc nhóm “Platform roles” vs “Custom roles” (read-only).

---

### C13 · AdminPage — Permission matrix row admin gây hiểu nhầm — P1

**Vấn đề:** Checkbox row `admin` bị `disabled` và thường **unchecked** → trông như admin không có permission (thực tế implicit wildcard).

**Fix:** Hiện badge “All permissions (implicit)” trên cột admin thay vì checkbox; hoặc check all + disabled + tooltip.

---

### C14 · AdminPage — Chỉ hiện roles[0] — P2

**Vấn đề:** `user.roles?.[0]` cho badge và role select — user nhiều role chỉ thấy role đầu.

**Fix:** Hiện tất cả roles dạng badges; select vẫn assign một platform role chính (nếu BE chỉ support single assign).

---

## D — Shared / Bất kỳ ai rảnh

### D1 · Loading states không nhất quán

**Vấn đề:** `DashboardPage` có `DashboardSkeleton` nhưng các trang khác (Notifications, Invitations, Users) chỉ hiện trống hoặc "Loading...".

**Fix:** Mỗi page nên có skeleton hoặc spinner nhất quán. Dùng `SkeletonCard` component đã có.

---

### D2 · Mobile — bảng members/tasks bị cắt

**Vấn đề:** Các `<Table>` trong `WorkspaceDetailPage` và `UsersDirectoryPage` không có horizontal scroll trên mobile.

**Fix:**
```tsx
<div className="overflow-x-auto">
  <Table>...</Table>
</div>
```

---

### D3 · TopBar — Breadcrumb và workspace context — ✅ Done

**Vấn đề:** TopBar hiện không hiện workspace name đang active hay breadcrumb route. User không biết mình đang ở workspace nào.

**Đã xử lý:** `TopBar.tsx` dùng `buildBreadcrumbSegments` + resolve workspace/project name từ `WorkspacesContext` / `listProjects`.

---

### D4 · TaskDetailSheet — Không có link "Open in full page"

**Vấn đề:** Task detail chỉ mở trong sheet (slide-in). Không có cách share URL của task trực tiếp (dù `?task=id` đã có).

**Fix:** Thêm button "Copy link" hoặc icon link ở header của TaskDetailSheet để copy URL có `?task={id}`.

---

## Checklist ưu tiên

```
Đã xong (đối chiếu 2026-06-16)
[x] A1 · Ẩn ⋯ menu với member không có quyền
[x] B1 · BarChart labels (Todo / Doing / Done)
[x] B4 · Column header KanbanBoard có số task
[x] B5 · Kanban task card: avatar, due date color
[x] C3 · Admin confirm destructive actions
[x] C4 · UsersDirectory helper cho non-admin
[x] C5 · InvitationsPage workspace name fallback
[x] D3 · TopBar breadcrumb

P0 — Số liệu sai / Admin overview (audit 2026-06-16)
[ ] B9 · Dashboard KPI + chart — không bị cắt 50 tasks
[ ] A7 · Workspace list — không flash 0 members/projects
[ ] A8 · Workspace detail — tách đếm members vs pending
[ ] C9 · Admin overview KPI cards (users, workspaces, …)

P0 — UX blocker (cũ)
[ ] B2 · Dashboard empty state — thêm "Browse Workspaces" cho viewer/invite-only
[ ] C8 · Friendly error messages

P1 — Admin polish + UX
[ ] C10 · Admin resolve ownerId → tên/email
[ ] C11 · Admin sửa label Last login
[ ] C12 · Admin role select chỉ platform roles
[ ] C13 · Admin permission matrix — admin row implicit all
[ ] B7 · Notification type labels đầy đủ
[ ] B8 · Unread visual trong NotificationsPage
[ ] C7 · Sidebar bell badge unread count
[ ] A6 · Ẩn ⋯ trên project card khi !canManageProjects

P2 — Polish
[ ] A2 · joinedAt hiển thị timeAgo
[ ] A3 · Pending invitation visual khác biệt
[ ] A9 · Project createdAt format (không raw ISO)
[ ] B3 · Stat cards có workspace context
[ ] C6 · Date format nhất quán toàn app
[ ] C14 · Admin hiện đủ roles (không chỉ roles[0])

P3 — Nice-to-have
[ ] A4 · Đổi "Remove manager" → "Remove from workspace"
[ ] A5 · Viewer empty state message
[ ] B6 · Assignee avatar đầy đủ trong TaskDetailSheet
[ ] C1 · Admin workspace info modal
[ ] C2 · Admin users: số workspace
[ ] D1 · Loading skeleton nhất quán
[ ] D2 · Mobile table scroll
[ ] D4 · TaskDetailSheet copy link
```
