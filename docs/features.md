# CollabSpace Frontend — Feature Coverage

Tóm tắt mức độ **UI** đã phủ backend MVP. Chi tiết API: [fe-be-alignment.md](./fe-be-alignment.md). Backend canonical: `collabspace/docs/features.md`.

**Cập nhật:** 2026-06-15

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **Done** | Flow end-to-end qua API thật |
| **Partial** | API có; UX còn thiếu polish |
| **Disabled** | UI cố ý tắt — BE chưa có hoặc chưa wire |
| **N/A** | Không thuộc phạm vi FE |

## Tổng quan

| Vùng | Trạng thái | Ghi chú |
|------|------------|---------|
| Auth & sessions | **Done** | Login, register, OTP, password, sessions, logout-all |
| Profile & preferences | **Done** | Avatar, username cho @mention |
| Workspace & project | **Done** | CRUD, owner delete, members, invite |
| Task & board | **Done** | Board API, Kanban, priority filter, create w/ dueDate/labels |
| Comments | **Done** | CRUD, threads, `@mention` autocomplete |
| Notifications | **Partial** | List, mark read, 45s poll; archive **Disabled** |
| Invitations | **Done** | Notifications + `/invitations` |
| Activity | **Done** | Workspace + task timelines |
| Platform admin | **Done** | Roles, users, workspaces, broadcast, health |
| Presence | **Done** | Poll `/users/presence` — members, Kanban, directory |
| User directory | **Done** | `/users` — search-required for non-admin; admin browse-all; `?q=` deep link |
| Workspace UX | **Done** | Active workspace context, project sidebar, ⌘K palette, onboarding home |
| Idempotency | **Done** | Workspace create/invite, task create/assign |

## Còn lại (chờ BE)

- **Notification archive** — không có HTTP endpoint
- **Đổi role / remove member** — không có end-user API
- **List invitations by invitee** — chỉ list theo workspace admin
- **commentCount** trên Kanban — board API không trả field
- **Admin unassign permission** — BE chỉ assign

Agent backlog chi tiết: [fe-be-alignment.md](./fe-be-alignment.md).
