# Backlog team — chỉ mục

Phân công việc **theo repo** và **theo người**. Cập nhật khi đổi owner hoặc hoàn thành phase.

## Repo Frontend (`collabspace-fe`)

| Tài liệu | Phạm vi | Owner chính |
|----------|---------|-------------|
| [fe-backlog.md](../fe-backlog.md) | UI/UX, hiển thị dữ liệu, Admin polish, workspace/task pages | **Tiến** (workspace) · **Tín** (task/notification) · **Thọ** (admin/cross-cutting) |
| [fe-be-alignment.md](../fe-be-alignment.md) | Gap API ↔ FE, phase integration | Cả team FE |
| [features.md](../features.md) | Mức phủ tính năng trên UI | — |
| [roles-and-permissions.md](../roles-and-permissions.md) | Platform `admin`/`user` + workspace roles — **bản FE** | Tham chiếu khi làm gating UI |

### Phân công FE (tóm tắt)

| Người | Vùng |
|-------|------|
| **Ngô Quang Tiến** | `WorkspaceListPage`, `WorkspaceDetailPage`, `ProjectListPage` |
| **Võ Trung Tín** | `DashboardPage`, Kanban, `TaskDetailSheet`, `NotificationsPage` |
| **Phan Phú Thọ** | `AdminPage`, `UsersDirectoryPage`, `InvitationsPage`, UX chung |

## Repo Backend (`collabspace`)

| Tài liệu | Phạm vi | Owner chính |
|----------|---------|-------------|
| [application-backlog.md](https://github.com/lengocanh2005it/collabspace/blob/main/docs/team/application-backlog.md) | API, test, demo script | Anh · Tiến · Tín |
| [admin-backlog.md](https://github.com/lengocanh2005it/collabspace/blob/main/docs/team/admin-backlog.md) | Platform Admin API | Võ Trung Tín |
| [phan-phu-tho-infrastructure-backlog.md](https://github.com/lengocanh2005it/collabspace/blob/main/docs/team/phan-phu-tho-infrastructure-backlog.md) | Infra, CI/CD, K8s | Phan Phú Thọ |
| [roles-and-permissions.md](https://github.com/lengocanh2005it/collabspace/blob/main/docs/roles-and-permissions.md) | **Canonical** roles & ma trận quyền đầy đủ | — |

### Phân công BE (tóm tắt)

| Người | Service / vùng |
|-------|----------------|
| **Lê Ngọc Anh** | `auth-service`, `user-service`, Droplet deploy |
| **Ngô Quang Tiến** | `workspace-service`, tích hợp workspace ↔ task |
| **Võ Trung Tín** | `task-service`, `notification-service`, demo E2E |
| **Phan Phú Thọ** | Infra, gateway, observability |

## Đồng bộ tài liệu

Khi BE đổi **roles**, **API contract**, hoặc **seed demo**:

1. Cập nhật `collabspace/docs/…` (canonical).
2. Sync `collabspace-fe/docs/roles-and-permissions.md` + `fe-backlog.md` / `fe-be-alignment.md` nếu ảnh hưởng UI.
3. Sửa `src/app/api/types.ts`, `AuthContext`, `AdminPage` nếu đổi platform role model.
