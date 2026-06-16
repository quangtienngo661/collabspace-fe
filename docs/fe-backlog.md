# FE Backlog — CollabSpace Frontend

> **Cập nhật:** 2026-06-16  
> **Tham chiếu:** [`roles-and-permissions.md`](../../collabspace/docs/roles-and-permissions.md), [`features.md`](../../collabspace/docs/features.md)  
> **Hai lớp role cần nhớ:**  
> - **Platform:** `admin` · `member` · `viewer` (quản lý trong auth-service)  
> - **Workspace:** `owner` · `manager` · `member` (quản lý trong workspace-service)

---

## Phân công đề xuất

| Người | Vùng phụ trách |
|-------|----------------|
| **Ngô Quang Tiến** | Workspace pages (WorkspaceDetail, ProjectList, WorkspaceList) |
| **Võ Trung Tín** | Task & Notification (Dashboard, KanbanBoard, TaskDetail, Notifications) |
| **Lê Ngọc Anh** | Cross-cutting (Admin, UsersDirectory, Invitations, UX chung) |

---

## A — Ngô Quang Tiến · Workspace pages

### A1 · WorkspaceDetailPage — Members tab

**Vấn đề:** Member không có quyền quản lý người khác vẫn thấy nút `⋯` trên hàng của người đó (dù bên trong chỉ có disabled text "Only owner or manager can edit"). Confusing.

**Fix:** Ẩn hoàn toàn nút `⋯` cho member khi `canRemoveMember(target) === false` **và** không có action nào khả dụng.

```tsx
// WorkspaceDetailPage.tsx ~line 345
{member.userId && (canRemoveMember(member) || isOwner) ? (
  <DropdownMenu>...</DropdownMenu>
) : null}
```

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

### A4 · WorkspaceDetailPage — Phân biệt hai loại "xóa" trong dropdown

**Vấn đề:** Khi owner nhìn vào dropdown của một manager, text chỉ là "Remove manager" nhưng không rõ đây là xóa khỏi workspace hay chỉ demote.

**Fix:** Tách thành 2 action riêng biệt trong dropdown:
- "Demote to member" (nếu `isOwner && target.role === "manager"`)
- "Remove from workspace" (luôn hiện nếu `canRemoveMember`)

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

## B — Võ Trung Tín · Task & Notification

### B1 · DashboardPage — BarChart labels không thân thiện

**Vấn đề:** XAxis của task status chart hiển thị `TODO`, `DOING`, `DONE` (enum values từ BE).

**Fix:** Map labels trước khi pass vào chart:
```tsx
const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  DOING: "In Progress",
  DONE: "Done",
};

const chartData = statuses.map(s => ({
  name: TASK_STATUS_LABELS[s] ?? s,
  count: tasks.filter(t => t.status === s).length,
}));
```

---

### B2 · DashboardPage — Empty state khi chưa có workspace

**Vấn đề:** Khi user chưa có workspace nào, Dashboard chỉ hiện 1 alert card mà không dẫn hướng rõ.

**Fix:** Thay bằng `EmptyState` component có action:
```tsx
<EmptyState
  icon={Building2}
  title="No workspace selected"
  description="Join or create a workspace to see your tasks and activity."
  action={{ label: "Browse Workspaces", onClick: () => navigate("/workspaces") }}
/>
```

---

### B3 · DashboardPage — Stat cards thiếu context

**Vấn đề:** 6 stat cards chỉ hiện số, không có tooltip hay sparkline. "15 tasks" — của workspace nào? Khoảng thời gian nào?

**Fix:**
- Thêm tên workspace đang active vào tiêu đề trang: `Dashboard · {activeWorkspace?.name}`
- Thêm subtitle nhỏ cho mỗi card: "in {activeWorkspace.name}" hoặc "this workspace"
- Tasks overdue card: highlight màu đỏ nếu `count > 0`

---

### B4 · KanbanBoardPage — Column header thiếu số task

**Vấn đề:** Column header chỉ hiện "TODO / DOING / DONE" mà không có badge đếm số task.

**Fix:** Thêm badge count:
```tsx
<h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
  {TASK_STATUS_LABELS[status]}
  <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-1.5 py-0.5 rounded-full">
    {columnTasks.length}
  </span>
</h2>
```

---

### B5 · KanbanBoardPage — Task cards thiếu visual

**Vấn đề:** Task card trên kanban thiếu: assignee avatar, due date indicator, priority color.

**Fix:**
- Hiện assignee avatar nhỏ ở góc phải card
- Hiện due date với màu từ `dueDateStatus()`:
  - `overdue` → đỏ
  - `today` → cam
  - `soon` → vàng
  - `normal` → slate

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

## C — Lê Ngọc Anh · Admin, Users, Cross-cutting

### C1 · AdminPage — Workspace tab không có link xem detail

**Vấn đề:** Admin có thể list workspace nhưng không navigate được vào workspace detail (CollaborationRoute block admin). Không có cách xem nhanh info của workspace.

**Fix:** Thêm modal "View workspace info" khi admin click vào workspace row, hiện: tên, mô tả, ownerId, member count, created date. Không cần navigate sang route collaboration.

---

### C2 · AdminPage — Users tab: role badge hiện platform role, không rõ có workspace nào

**Vấn đề:** Users tab chỉ hiện platform role (`admin`/`member`/`viewer`) nhưng không biết user đó thuộc workspace nào. Audit rất khó.

**Fix:** Thêm cột "Workspaces" với số workspace user đang là member (nếu API trả về). Hoặc thêm tooltip "Member of N workspaces".

---

### C3 · AdminPage — Destructive actions thiếu confirmation

**Vấn đề:** Ban user / delete user / delete workspace trong AdminPage có thể thiếu ConfirmDialog.

**Fix:** Kiểm tra tất cả destructive actions trong `AdminPage.tsx`:
- `handleBanUser` → cần confirm
- `handleDeleteUser` → cần confirm với typing tên user
- `handleDeleteWorkspace` → cần confirm

---

### C4 · UsersDirectoryPage — Non-admin không biết phải search

**Vấn đề:** Non-admin user vào `/users` thấy empty state không có gì, không biết phải gõ gì. BE trả 403 nếu không có query param `q`.

**Fix:** Thêm placeholder và helper text rõ ràng:
```tsx
<Input
  placeholder="Search users by name or email..."
  // ...
/>
{!hasQuery && !isAdmin && (
  <p className="text-xs text-slate-400 mt-2 text-center">
    Type a name or email to find users.
  </p>
)}
```

---

### C5 · InvitationsPage — Workspace name null

**Vấn đề:** `invitation.workspaceName` có thể là `null` (nếu workspace bị xóa hoặc API không trả về). Hiện tại render `null` ra UI.

**Fix:**
```tsx
<span className="font-medium">{invitation.workspaceName ?? "Unknown workspace"}</span>
```

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

### D3 · TopBar — Breadcrumb và workspace context

**Vấn đề:** TopBar hiện không hiện workspace name đang active hay breadcrumb route. User không biết mình đang ở workspace nào.

**Fix:** Thêm breadcrumb đơn giản: `CollabSpace / {workspaceName} / Projects / {projectName}` dùng `useParams` và data từ WorkspacesContext.

---

### D4 · TaskDetailSheet — Không có link "Open in full page"

**Vấn đề:** Task detail chỉ mở trong sheet (slide-in). Không có cách share URL của task trực tiếp (dù `?task=id` đã có).

**Fix:** Thêm button "Copy link" hoặc icon link ở header của TaskDetailSheet để copy URL có `?task={id}`.

---

## Checklist ưu tiên

```
P0 (blocker UX)
[ ] B1 · BarChart labels: TODO → "To Do"
[ ] B2 · Dashboard empty state khi chưa có workspace
[ ] C5 · InvitationsPage: workspace name null crash
[ ] C8 · Friendly error messages

P1 (UX rõ ràng hơn)
[ ] A1 · Ẩn ⋯ menu với member không có quyền
[ ] B4 · Column header KanbanBoard có số task
[ ] B7 · Notification type labels đầy đủ
[ ] B8 · Unread visual trong NotificationsPage
[ ] C4 · UsersDirectory helper text cho non-admin
[ ] C7 · Sidebar bell badge unread count

P2 (polish)
[ ] A2 · joinedAt hiển thị timeAgo
[ ] A3 · Pending invitation visual khác biệt
[ ] B3 · Stat cards có workspace context
[ ] B5 · Kanban task card: avatar, due date color
[ ] C6 · Date format nhất quán toàn app
[ ] D3 · TopBar breadcrumb

P3 (nice-to-have)
[ ] A4 · Tách Demote / Remove action
[ ] A5 · Viewer empty state message
[ ] B6 · Assignee avatar đầy đủ
[ ] C1 · Admin workspace info modal
[ ] C2 · Admin users: số workspace
[ ] C3 · Admin confirm destructive actions
[ ] D1 · Loading skeleton nhất quán
[ ] D2 · Mobile table scroll
[ ] D4 · TaskDetailSheet copy link
```
