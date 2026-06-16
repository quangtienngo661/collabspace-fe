# CollabSpace Frontend — Feature Coverage

Tóm tắt mức độ **UI** đã phủ backend MVP. Chi tiết API: [fe-be-alignment.md](./fe-be-alignment.md). Backend canonical: `collabspace/docs/features.md`.

**Cập nhật:** 2026-06-16

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
| Workspace & project | **Done** | CRUD, owner delete, members, invite, remove member |
| Task & board | **Done** | Board API, Kanban, priority filter, create w/ dueDate/labels |
| Comments | **Done** | CRUD, threads, `@mention` autocomplete |
| Notifications | **Done** | List, mark read, archive, 45s poll |
| Invitations | **Done** | `GET /invitations/me` list + notifications + `/invitations` |
| Activity | **Done** | Workspace + task timelines |
| Platform admin | **Done** | Roles, users, workspaces, broadcast, health |
| Presence | **Done** | Poll `/users/presence` — members, Kanban, directory |
| User directory | **Done** | `/users` — search-required for non-admin; admin browse-all; `?q=` deep link |
| Workspace UX | **Done** | Active workspace context, project sidebar, ⌘K palette, onboarding home |
| Idempotency | **Done** | Workspace create/invite, task create/assign |

## Còn lại (chờ BE)

- **List invitations by invitee** — Done (`GET /invitations/me`)
- **Notification archive** — Done (`PATCH /notifications/:id/archive`)
- **commentCount** trên Kanban — Done (board/list API)
- **Server task search** — Done (`GET /tasks?q=`)

Agent backlog chi tiết: [fe-be-alignment.md](./fe-be-alignment.md) · Roles: [roles-and-permissions.md](./roles-and-permissions.md).
