# FE Backlog — CollabSpace Frontend

> **Status: Completed**
> All tasks assigned to Phan Phú Thọ (C2, C8, D1) have been implemented. Backend error handling mapping is integrated, the Workspaces admin column is prepared, and table loading states have been updated to use the SkeletonRow component.

> **Cập nhật:** 2026-06-17  
> **Đối chiếu codebase:** 2026-06-17 — MVP API integration Done; audit polish + technical debt  
> **Phân công:** đồng bộ với [`features.md`](./features.md) § Phân công team & checklist theo người  
> **Tham chiếu:** [`roles-and-permissions.md`](./roles-and-permissions.md), [`features.md`](./features.md), BE [canonical roles](https://github.com/lengocanh2005it/collabspace/blob/main/docs/roles-and-permissions.md)  
> **Hai lớp role cần nhớ:**  
> - **Platform:** `admin` · `user` (auth-service) — *đã bỏ `member`/`viewer`*  
> - **Workspace:** `owner` · `manager` · `member` (workspace-service)

**Ký hiệu:** ✅ Done · 🟡 Gần xong · ⬜ Còn lại

---

## Phân công team

| Thành viên | Vùng phụ trách | Pages / modules chính |
|------------|----------------|------------------------|
| **Ngô Quang Tiến** | Workspace & project | `WorkspaceListPage`, `WorkspaceDetailPage`, `ProjectListPage`, invite dialog trên WS detail |
| **Võ Trung Tín** | Task, board, dashboard, notification | `DashboardPage`, `KanbanBoardPage`, `TaskDetailSheet`, `NotificationsPage`, comments |
| **Phan Phú Thọ** | Admin, directory, invitations, UX chung | `AdminPage`, `InvitationsPage`, `UsersDirectoryPage`, `Sidebar`, error mapping, shell polish |

**Overlap có chủ đích**

| Việc | Owner chính | Ghi chú |
|------|-------------|---------|
| Invite dialog + validation toast | **Tiến** (UI) · **Thọ** (`formatInviteError` ✅) | Rule admin/member trùng → **BE** |
| Sidebar bell unread (C7) | **Thọ** | Data từ `NotificationsContext` |
| Notification list labels (B7, B8) | **Tín** | `NotificationsPage.tsx` |
| Mobile table scroll (D2) | **Tiến** (WS members) · **Thọ** (`UsersDirectoryPage`) | |
| Date format (C6) | **Thọ** | Dùng chung; Tiến/Tín áp dụng trên page của mình |

---

## Audit — Hiển thị dữ liệu & Admin (2026-06-16)

Rà soát toàn FE sau feedback “giao diện hiển thị dữ liệu sai sai”, đặc biệt **Admin** và **Dashboard thống kê**.

### Tóm tắt theo mức độ

| Mức | Mục | Vấn đề ngắn | Owner |
|-----|-----|-------------|-------|
| **P0** | B9 | Dashboard KPI + chart đếm trên tối đa **50 task** (BE default limit), bỏ qua `total` | **Tín** |
| **P0** | A7 | Workspace list flash **0 members / 0 projects** trước khi `enrichWorkspacesStats` (N+1) | **Tiến** |
| **P0** | A8 | Header “X Members” **gồm pending invitations** | **Tiến** |
| **P0** | C9 | Admin **không có overview** (tổng users, active, workspaces…) | **Thọ** |
| **P0** | B2 | Dashboard empty state — chưa đủ hướng dẫn user chỉ có pending invite | **Tín** |
| **P0** | C8 | Friendly error messages (toast raw BE) | **Thọ** — invite ✅; còn chỗ khác |
| **P1** | A6 | Project card vẫn hiện `⋯` disabled khi `!canManageProjects` | **Tiến** |
| **P1** | B7 | Notification type labels thiếu trong map | **Tín** |
| **P1** | B8 | Unread vs read khó phân biệt trong list | **Tín** |
| **P1** | C7 | Sidebar bell **không có** unread badge | **Thọ** |
| **P1** | C10 | Admin workspace tab: **Owner ID = UUID** thô | **Thọ** |
| **P1** | C11 | Admin users: `lastLoginAt` gắn nhãn **“Active:”** (sai nghĩa) | **Thọ** |
| **P1** | C12 | Role select hiện **cả custom RBAC role** — dễ gán nhầm platform role | **Thọ** |
| **P1** | C13 | Permission matrix: row `admin` disabled + unchecked → trông như **không có quyền** | **Thọ** |
| **P2** | A2 | Cột `joinedAt` thiếu / raw ISO | **Tiến** |
| **P2** | A3 | Pending invitation khó nhận ra trong bảng members | **Tiến** |
| **P2** | A9 | Project card tab Projects: `createdAt` **raw ISO** | **Tiến** |
| **P2** | B3 | Stat cards thiếu workspace context | **Tín** |
| **P2** | B6 | TaskDetail assignee thiếu avatar đầy đủ | **Tín** |
| **P2** | C6 | Date format không nhất quán toàn app | **Thọ** |
| **P2** | C14 | Users tab chỉ hiện `roles[0]` — bỏ qua multi-role | **Thọ** |
| **P3** | A4 | Dropdown “Remove manager” vs demote chưa rõ | **Tiến** |
| **P3** | A5 | Workspace list empty — chưa link `/invitations` | **Tiến** |
| **P3** | C1 | Admin workspace — không xem nhanh info (modal) | **Thọ** |
| **P3** | C2 | Admin users — không thấy số workspace | **Thọ** |
| **P3** | D1 | Loading skeleton thiếu vài page | **Thọ** |
| **P3** | D2 | Mobile table bị cắt (WS + Users) | **Tiến** · **Thọ** |
| **P3** | D4 | TaskDetail không có “Copy link” `?task=` | **Tín** |
| — | INV | Invite trùng admin / member / pending | **Thọ** FE map lỗi ✅ · **BE** validation |

### Ghi chú kỹ thuật (P0 Dashboard)

- `DashboardPage.tsx` gọi `taskApi.list({ workspaceId })` không `limit` → BE `TASK_LIST_DEFAULT_LIMIT = 50`.
- Response có `{ tasks, total }` nhưng FE chỉ `.then(r => r.tasks)` rồi `.filter()` đếm — **sai khi >50 task**.
- Kanban dùng `taskApi.getBoard` (limit cao hơn) nên **board đúng, dashboard sai** — dễ gây hiểu nhầm.

### Ghi chú kỹ thuật (P0 Admin)

- `AdminPage` có 4 tab CRUD; mô tả tab Workspaces nói “statistics” nhưng **chỉ là bảng list**, không có KPI tổng.
- `memberCount` từ `GET /workspaces/admin/all` qua `mapAdminWorkspace` — field này **ổn** nếu BE đúng; vấn đề chính là **thiếu context** (owner name, overview, label).

---

## A — Ngô Quang Tiến · Workspace pages

### A1 · WorkspaceDetailPage — Members tab — ✅ Done · **Tiến**

**Vấn đề:** Member không có quyền quản lý người khác vẫn thấy nút `⋯` trên hàng của người đó (dù bên trong chỉ có disabled text "Only owner or manager can edit"). Confusing.

**Fix:** Ẩn hoàn toàn nút `⋯` cho member khi `canRemoveMember(target) === false` **và** không có action nào khả dụng.

**Đã xử lý:** `WorkspaceDetailPage.tsx` chỉ render dropdown khi `canRemoveMember(member)` — không còn disabled text.

---

### A2 · WorkspaceDetailPage — Hiển thị ngày gia nhập — ✅ Done · **Tiến**

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

### A3 · WorkspaceDetailPage — Pending invitations dễ nhận ra hơn — ✅ Done · **Tiến**

**Vấn đề:** Pending invitations hiện trong cùng bảng members với role "member" và status "pending", nhưng không có visual indicator rõ ràng (chỉ `user.title = "Pending Invitation"`).

**Fix:**
- Thêm `<Badge variant="outline">Pending</Badge>` ở cột Role thay vì `RoleBadge` với role "member"
- Style khác biệt: row opacity thấp hơn, italic email
- Hiển thị ngày hết hạn invitation nếu có (`expiresAt`)

---

### A4 · WorkspaceDetailPage — Phân biệt hai loại "xóa" trong dropdown — ✅ Done · **Tiến**

**Vấn đề:** Khi owner nhìn vào dropdown của một manager, text chỉ là "Remove manager" nhưng không rõ đây là xóa khỏi workspace hay chỉ demote.

**Fix:** Tách thành 2 action riêng biệt trong dropdown:
- "Demote to member" (nếu `isOwner && target.role === "manager"`) — **đã có**
- "Remove from workspace" (luôn hiện nếu `canRemoveMember`) — **còn hiện "Remove manager" / "Remove member"**

---

### A5 · WorkspaceListPage — Empty state khi chưa có workspace — ✅ Done · **Tiến**

**Vấn đề:** User `user` chưa join workspace nào vào `/workspaces` thấy "No workspaces yet" — chưa gợi ý check invitations.

**Fix:** Trong empty state, thêm link `/invitations` và copy ngắn: "Waiting for an invite? Check your invitations."

> **Đã bỏ:** platform `viewer` — mọi `user` đều có thể tạo workspace (`canCreateWorkspace = !isAdmin`).

---

### A6 · ProjectListPage — "New Project" button khi member truy cập — ✅ Done · **Tiến**

**Vấn đề:** Khi member navigate vào workspace họ tham gia, nút "New Project" ẩn đúng nhưng dropdown `⋯` trên mỗi project card vẫn hiện với disabled text.

**Fix:** Ẩn hoàn toàn nút `⋯` trên project card nếu `!canManageProjects` (không cần show disabled text, đã có tooltip trên badge role).

---

### A7 · WorkspaceListPage — Stats flash “0 members / 0 projects” — ✅ Done · **Tiến**

**Vấn đề:** `workspaceApi.list()` thường không trả `memberCount`/`projectCount` → mapper default `0`. Card hiện `0` cho đến khi `enrichWorkspacesStats()` chạy xong (N+1 request mỗi workspace).

**Fix (chọn một):**
- Skeleton / `—` trên stats khi `enriched` chưa load
- Hoặc BE trả count trong list response
- Hoặc endpoint aggregate một lần thay vì N+1 trong `clientStats.ts`

---

### A8 · WorkspaceDetailPage — Đếm member gồm pending invite — ✅ Done · **Tiến**

**Vấn đề:** Header `{memberRows.length} Members` nhưng `memberRows` = members thật + pending invitations → số **cao hơn thực tế**.

**Fix:**
- Header: `{members.length} members` (+ `{invitations.length} pending` riêng nếu có)
- Kết hợp A3: badge Pending ở cột Role, không dùng `RoleBadge role="member"`

---

### A9 · WorkspaceDetailPage — Project `createdAt` raw ISO — ✅ Done · **Tiến**

**Vấn đề:** Tab Projects hiện `Created {p.createdAt}` — chuỗi ISO đầy đủ, không qua `timeAgo` / locale.

**Fix:** `timeAgo(p.createdAt)` + tooltip `toLocaleString()`, hoặc dùng `<DateDisplay format="absolute" />` (C6).

---

## B — Võ Trung Tín · Task & Notification

### B1 · DashboardPage — BarChart labels không thân thiện — ✅ Done

**Vấn đề:** XAxis của task status chart hiển thị `TODO`, `DOING`, `DONE` (enum values từ BE).

**Đã xử lý:** `DashboardPage.tsx` map `TODO`→`Todo`, `DOING`→`Doing`, `DONE`→`Done` trong `chartData`. (Có thể polish thêm thành "To Do" / "In Progress" nếu muốn đồng bộ với Kanban.)

---

### B2 · DashboardPage — Empty state khi chưa có workspace — P0 · **Tín** · 🟡 Gần xong

**Vấn đề:** Khi user chưa có workspace nào, Dashboard chỉ hiện 1 alert card mà không dẫn hướng rõ.

**Hiện trạng:** Đã có `EmptyState` + block pending invitations + link `/invitations`. Còn thiếu action "Browse Workspaces" / copy rõ cho user chỉ có pending invite (chưa accept).

---

### B3 · DashboardPage — Stat cards thiếu context — P2 · **Tín**

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

### B6 · TaskDetailSheet — Assignee không có avatar đầy đủ — P2 · **Tín**

**Vấn đề:** Khi task được assign, TaskDetailSheet hiển thị tên nhưng avatar có thể chỉ hiện initials (không load từ user-service).

**Fix:** Dùng `useWorkspaceMemberUsers` hook (đã có) để lookup user profile đầy đủ khi `workspaceId` available.

---

### B7 · NotificationsPage — Type label fallback — P1 · **Tín**

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

### B8 · NotificationsPage — Unread badge và grouping — P1 · **Tín**

**Vấn đề:** Notifications hiện dưới dạng flat list. Unread/Read/Archived tab có nhưng items không có visual phân biệt rõ giữa unread và read trong cùng 1 tab.

**Fix:**
- Unread items: left border `border-l-2 border-blue-500` + background `bg-blue-50/30`
- Read items: normal styling
- Thêm "Mark all as read" button ở top của tab Unread

---

### B9 · DashboardPage — KPI & chart sai khi >50 tasks — P0 · **Tín**

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

### C1 · AdminPage — Workspace tab không có link xem detail — P3 · **Thọ**

**Vấn đề:** Admin có thể list workspace nhưng không navigate được vào workspace detail (CollaborationRoute block admin). Không có cách xem nhanh info của workspace.

**Fix:** Thêm modal "View workspace info" khi admin click vào workspace row, hiện: tên, mô tả, ownerId, member count, created date. Không cần navigate sang route collaboration.

---

### C2 · AdminPage — Users tab: role badge hiện platform role, không rõ có workspace nào — P3 · **Thọ**

**Vấn đề:** Users tab chỉ hiện platform role (`admin`/`user`) nhưng không biết user đó thuộc workspace nào. Audit rất khó.

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

### C6 · Hiển thị ngày tháng nhất quán toàn app — P2 · **Thọ**

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

### C7 · Sidebar — Badge unread notifications — P1 · **Thọ**

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

### C8 · Error messages từ BE quá kỹ thuật — P0 · **Thọ** · 🟡 Gần xong

**Vấn đề:** Khi action thất bại, toast hiện raw BE error: "Validation failed (uuid is expected)" hay "ForbiddenException: Only workspace owner...".

**Đã xử lý (một phần):**
- Invite: `workspaceInviteErrors.ts` + `formatInviteError` trên `WorkspaceDetailPage` ✅
- Admin: `adminErrors.ts` + `getApiErrorCode` ✅

**Còn lại:** Dùng `friendlyError` / map tương tự cho workspace delete, task, profile, v.v.

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

---

### C9 · AdminPage — Thiếu overview / KPI tổng — P0 · **Thọ**

**Vấn đề:** Admin không có màn tổng quan. User kỳ vọng “thống kê” nhưng chỉ thấy bảng từng tab. Khó nắm quy mô platform một cái nhìn.

**Fix:** Thêm hàng stat cards phía trên tabs (derive từ data đã load):
- Total users · Active · Banned
- Total workspaces · Total members (sum `memberCount`)
- Custom roles / permissions count (optional)

Không cần API mới nếu aggregate client-side từ `usersState` + `workspacesState`.

---

### C10 · AdminPage — Workspace owner hiện UUID — P1 · **Thọ**

**Vấn đề:** Cột Owner hiện `ws.ownerId` (UUID) — không audit được.

**Fix:** Lookup owner từ `usersState.data` (hoặc `usersApi.bulk` một lần cho unique ownerIds): hiện tên + email, tooltip giữ UUID.

---

### C11 · AdminPage — Nhãn “Active:” cho lastLoginAt — P1 · **Thọ**

**Vấn đề:** `lastLoginAt` hiển thị với prefix **“Active:”** — user hiểu nhầm là trạng thái account (đã có cột Account Status riêng).

**Fix:** Đổi thành `Last login: {toLocaleString()}` hoặc `timeAgo(lastLoginAt)`.

---

### C12 · AdminPage — Role select lẫn custom RBAC roles — P1 · **Thọ**

**Vấn đề:** Dropdown “Update Role” liệt kê **mọi** role từ `listRoles()` (gồm custom). Platform user chỉ nên gán `admin` / `user`.

**Fix:** Filter `SelectItem` chỉ `isProtectedRole(r.name)` (`admin`, `user`) hoặc nhóm “Platform roles” vs “Custom roles” (read-only).

---

### C13 · AdminPage — Permission matrix row admin gây hiểu nhầm — P1 · **Thọ**

**Vấn đề:** Checkbox row `admin` bị `disabled` và thường **unchecked** → trông như admin không có permission (thực tế implicit wildcard).

**Fix:** Hiện badge “All permissions (implicit)” trên cột admin thay vì checkbox; hoặc check all + disabled + tooltip.

---

### C14 · AdminPage — Chỉ hiện roles[0] — P2 · **Thọ**

**Vấn đề:** `user.roles?.[0]` cho badge và role select — user nhiều role chỉ thấy role đầu.

**Fix:** Hiện tất cả roles dạng badges; select vẫn assign một platform role chính (nếu BE chỉ support single assign).

---

## F — Technical debt & engineering (2026-06-17)

Không chặn demo MVP. Chi tiết: [fe-be-alignment.md § Technical debt](./fe-be-alignment.md#technical-debt--engineering-2026-06-17).

| ID | Việc | Owner gợi ý | Ưu tiên |
|----|------|-------------|---------|
| F1 | `ErrorBoundary` bọc `App` / route shell | **Thọ** | P1 |
| F2 | `React.lazy` + `Suspense` cho `AdminPage`, `KanbanBoardPage`, task sheet | **Thọ** | P1 |
| F3 | `React.memo` + stable props `KanbanCard` / `KanbanColumn` | **Tín** | P1 |
| F4 | Retry FormData upload sau session refresh | **Thọ** | P2 |
| F5 | Vitest smoke (`httpClient`, mappers, `notificationNavigation`) | shared | P2 |
| F6 | Migrate data layer sang TanStack Query | shared | P3 |
| F7 | Tách `AdminPage.tsx` (~981 dòng) thành tab modules | **Thọ** | P3 |
| F8 | httpOnly cookie auth (cần BE + gateway) | BE + **Thọ** | P3 |

---

## E — Platform role sync (`admin` | `user`) — ✅ Done (2026-06-16)

BE đã gộp platform `member`/`viewer` → **`user`**. FE cần khớp JWT và UI.

| # | Việc | File | Trạng thái |
|---|------|------|------------|
| E1 | `Role` type `admin` \| `user` | `api/types.ts` | ✅ |
| E2 | `normalizeRole` — legacy `member`/`viewer` → `user` | `AuthContext.tsx` | ✅ |
| E3 | `canCreateWorkspace = !isAdmin` (bỏ check `viewer`) | `Sidebar.tsx`, `WorkspaceListPage.tsx` | ✅ |
| E4 | Protected roles `admin`, `user` | `AdminPage.tsx` | ✅ |
| E5 | `RoleBadge` label `user` | `StatusBadge.tsx` | ✅ |

---

---

## INV — Invite validation · **Thọ** (FE) + **BE**

| Mục | Owner | Trạng thái | Ghi chú |
|-----|-------|------------|---------|
| Map lỗi invite tiếng Anh | **Thọ** | ✅ | `workspaceInviteErrors.ts`, `formatInviteError` |
| Pre-check pending / member (local) | **Tiến** (dialog) | ✅ | `findLocalInviteConflict` trên `WorkspaceDetailPage` |
| Chặn platform admin | **BE** | ⬜ | `INVITE_PLATFORM_ADMIN` — auth internal lookup |
| Chặn member đã có trong WS | **BE** | ⬜ | `INVITE_ALREADY_MEMBER` |
| Chặn duplicate pending | **BE** (+ FE pre-check) | ⬜ | `INVITE_ALREADY_PENDING` |

Chi tiết flow: [`features.md`](./features.md) § Invite member.

---

## D — Shared (đã gán owner)

### D1 · Loading states không nhất quán — P3 · **Thọ**

**Vấn đề:** `DashboardPage` có `DashboardSkeleton` nhưng các trang khác (Notifications, Invitations, Users) chỉ hiện trống hoặc "Loading...".

**Fix:** Mỗi page nên có skeleton hoặc spinner nhất quán. Dùng `SkeletonCard` component đã có.

**File:** `NotificationsPage.tsx`, `InvitationsPage.tsx`, `UsersDirectoryPage.tsx`

---

### D2 · Mobile — bảng members/tasks bị cắt — P3 · **Tiến** + **Thọ**

**Vấn đề:** Các `<Table>` trong `WorkspaceDetailPage` và `UsersDirectoryPage` không có horizontal scroll trên mobile.

**Phân công:**
- **Tiến** — bảng members / invitations: `WorkspaceDetailPage.tsx`
- **Thọ** — `UsersDirectoryPage.tsx`

**Fix:**
```tsx
<div className="overflow-x-auto">
  <Table>...</Table>
</div>
```

---

### D3 · TopBar — Breadcrumb và workspace context — ✅ Done · **Thọ**

**Vấn đề:** TopBar hiện không hiện workspace name đang active hay breadcrumb route. User không biết mình đang ở workspace nào.

**Đã xử lý:** `TopBar.tsx` dùng `buildBreadcrumbSegments` + resolve workspace/project name từ `WorkspacesContext` / `listProjects`.

---

### D4 · TaskDetailSheet — Không có link "Open in full page" — P3 · **Tín**

**Vấn đề:** Task detail chỉ mở trong sheet (slide-in). Không có cách share URL của task trực tiếp (dù `?task=id` đã có).

**Fix:** Thêm button "Copy link" hoặc icon link ở header của TaskDetailSheet để copy URL có `?task={id}`.

---

## Checklist ưu tiên — theo người

Đồng bộ với [`features.md`](./features.md) § Việc chỉ cần FE — theo người.

### Đã xong (chung)

```
[x] A1 · Ẩn ⋯ menu với member không có quyền — Tiến
[x] B1 · BarChart labels (Todo / Doing / Done) — Tín
[x] B4 · Column header KanbanBoard có số task — Tín
[x] B5 · Kanban task card: avatar, due date color — Tín
[x] C3 · Admin confirm destructive actions — Thọ
[x] C4 · UsersDirectory helper cho non-admin — Thọ
[x] C5 · InvitationsPage workspace name fallback — Thọ
[x] D3 · TopBar breadcrumb — Thọ
[x] INV · Invite error mapping (formatInviteError) — Thọ
[x] E1–E5 · Platform role sync admin | user — Thọ
```

### Ngô Quang Tiến · Workspace

```
P0
[x] A7 · Workspace list — không flash 0 members/projects
[x] A8 · Workspace detail — tách đếm members vs pending

P1
[x] A6 · Ẩn ⋯ trên project card khi !canManageProjects

P2
[x] A2 · joinedAt hiển thị timeAgo
[x] A3 · Pending invitation visual khác biệt
[x] A9 · Project createdAt format (không raw ISO)

P3
[x] A4 · Đổi "Remove manager" → "Remove from workspace"
[x] A5 · Workspace empty state — link invitations
[ ] D2 · Mobile table scroll — WorkspaceDetailPage
```

### Võ Trung Tín · Task & Notification

```
P0
[ ] B9 · Dashboard KPI + chart — không bị cắt 50 tasks
[ ] B2 · Dashboard empty state — copy/link invitations

P1
[ ] B7 · Notification type labels đầy đủ
[ ] B8 · Unread visual trong NotificationsPage

P2
[ ] B3 · Stat cards có workspace context
[ ] B6 · Assignee avatar đầy đủ trong TaskDetailSheet

P3
[ ] D4 · TaskDetailSheet copy link ?task=
```

### Phan Phú Thọ · Admin & cross-cutting

```
P0
[ ] C9 · Admin overview KPI cards (users, workspaces, …)
[ ] C8 · Friendly errors — còn chỗ ngoài invite/admin

P1
[ ] C10 · Admin resolve ownerId → tên/email
[ ] C11 · Admin sửa label Last login
[ ] C12 · Admin role select chỉ platform roles (admin/user)
[ ] C13 · Admin permission matrix — admin row implicit all
[ ] C7 · Sidebar bell badge unread count

P2
[ ] C6 · Date format nhất quán toàn app
[ ] C14 · Admin hiện đủ roles (không chỉ roles[0])

P3
[ ] C1 · Admin workspace info modal
[ ] C2 · Admin users: số workspace
[ ] D1 · Loading skeleton nhất quán
[ ] D2 · Mobile table scroll — UsersDirectoryPage
```

### Technical debt (§ F)

```
P1
[ ] F1 · ErrorBoundary — Thọ
[ ] F2 · React.lazy routes — Thọ
[ ] F3 · React.memo Kanban — Tín

P2
[ ] F4 · FormData retry after refresh — Thọ
[ ] F5 · Vitest smoke tests — shared

P3
[ ] F6 · TanStack Query migration — shared
[ ] F7 · Split AdminPage tabs — Thọ
[ ] F8 · httpOnly cookie (BE+FE) — shared
```

### Backend (không gán FE owner — coordinate với BE team)

```
[ ] INV · workspace-service invite validation (admin / member / pending)
```
