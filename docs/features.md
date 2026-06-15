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
| Workspace & project | **Done** | CRUD, members, invite |
| Task & board | **Done** | Board API, Kanban, detail, attachments, delete |
| Comments | **Partial** | CRUD flat; chưa thread `parentId` |
| Notifications | **Partial** | List + mark read; archive **Disabled** |
| Invitations | **Done** | Notifications + `/invitations`; không list-by-user BE |
| Activity | **Done** | Workspace + task timelines |
| Platform admin | **Done** | Roles, users, workspaces, broadcast, health |
| Presence | **Partial** | Status từ profile; chưa poll `/users/presence` |

## Còn lại (ưu tiên thấp / chờ BE)

- Wire **DELETE workspace** (BE owner-only — FE chưa có `workspaceApi.delete`)
- **Threaded comments** UI (`parentId`)
- **dueDate / labels** trên Create Task modal
- **commentCount** trên thẻ Kanban (BE không trả field)
- **Notification archive** khi BE có endpoint
- **Đổi role / remove member** khi BE có end-user API

Agent backlog chi tiết: [fe-be-alignment.md](./fe-be-alignment.md).
