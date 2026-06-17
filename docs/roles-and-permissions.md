# Vai trò & phân quyền CollabSpace

> **Repo:** `collabspace-fe` — bản đồng bộ với backend [`collabspace/docs/roles-and-permissions.md`](https://github.com/lengocanh2005it/collabspace/blob/main/docs/roles-and-permissions.md).  
> **Cập nhật:** 2026-06-16 · Platform **`admin` | `user`** · Workspace **`owner` | `manager` | `member`**

CollabSpace dùng **hai lớp role độc lập**. Mỗi tài khoản có **đúng một platform role**; trong từng workspace họ tham gia lại có **một workspace role riêng**.

**Liên quan (FE):** [features.md](./features.md) · [fe-be-alignment.md](./fe-be-alignment.md) · [fe-backlog.md](./fe-backlog.md)  
**Liên quan (BE):** [api-routes](https://github.com/lengocanh2005it/collabspace/blob/main/docs/api-routes.md) · [service-contracts](https://github.com/lengocanh2005it/collabspace/blob/main/.claude/docs/service-contracts.md)

---

## Tổng quan: 5 role trên 2 lớp

| Lớp | Service | Số role | Tên role |
|-----|---------|---------|----------|
| **Platform** | `auth-service` | **2** | `admin`, `user` |
| **Workspace** | `workspace-service` | **3** | `owner`, `manager`, `member` |

```
┌──────────────────── PLATFORM (auth-service) ────────────────────┐
│   admin                          user                            │
│   Vận hành hệ thống              Người dùng thông thường         │
└──────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌────────────────── WORKSPACE (workspace-service) ────────────────┐
│   owner              manager              member                 │
└──────────────────────────────────────────────────────────────────┘
```

### Quy tắc vàng

1. **Hai lớp hoàn toàn độc lập.** Platform `admin` ≠ workspace `owner`.
2. **Platform `user` ≠ “chưa có workspace”.** Empty state UI — không phải role riêng.
3. **Workspace `member` ≠ platform `user`.** Khác lớp, khác phạm vi.
4. **Quyền collaboration** = platform permissions + workspace role trong ngữ cảnh workspace.

---

## Platform roles

| Hành động | `admin` | `user` |
|-----------|:-------:|:------:|
| Collaboration UI (`/dashboard`, `/workspaces`, …) | ❌* | ✅ |
| Tạo workspace | ❌* | ✅ |
| `/admin` | ✅ | ❌ |
| Browse user directory không query | ✅ | ❌ |

\* FE `CollaborationRoute` redirect `admin` → `/admin`.

### `admin`

Vận hành platform: users, workspaces, RBAC, broadcast. **Không** dùng UI collaboration thông thường.

### `user`

Mọi tài khoản đăng ký. Có thể chưa có workspace, hoặc `owner`/`manager`/`member` tùy workspace.

> **Đã bỏ:** platform `member` (trùng tên workspace) và `viewer`. JWT cũ `member`/`viewer` nên map → `user` ở FE cho đến khi user login lại.

---

## Workspace roles

| Hành động | owner | manager | member |
|-----------|:-----:|:-------:|:------:|
| Project CRUD | ✅ | ✅ | ❌ |
| Mời / remove member | ✅ | ✅* | ❌ |
| Task CRUD / comment | ✅ | ✅ | ✅ |
| Sửa / xóa workspace | ✅ | ❌ | ❌ |
| Promote / demote | ✅ | ❌ | ❌ |

\* Manager chỉ remove workspace `member`.

Chi tiết đầy đủ (permissions RBAC, invitation flow, demo accounts): xem bản backend linked ở đầu file.

---

## Frontend — enforcement & file map

| Kiểm tra | File / hook | Logic |
|----------|-------------|--------|
| Admin vs collaboration | `AuthContext.tsx` — `CollaborationRoute`, `AdminRoute` | `isAdmin` = `admin` hoặc `auth.manage` |
| Platform role normalize | `AuthContext.normalizeRole()` | `admin` · `user` (+ legacy `member`/`viewer` → `user`) |
| Chặn admin khỏi workspace pages | `CollaborationRoute` | Redirect `/admin` |
| Tạo workspace | `Sidebar.tsx`, `WorkspaceListPage.tsx` | `canCreateWorkspace = !isAdmin` |
| Workspace role UI | `WorkspaceDetailPage`, `ProjectListPage` | `owner` / `manager` / `member` từ membership API |
| Admin role assign | `AdminPage.tsx` | Protected roles: `admin`, `user` |
| Type platform role | `api/types.ts` — `Role` | `"admin" \| "user"` |
| Badge platform | `StatusBadge.tsx` — `RoleBadge` | `admin`, `user` (+ workspace roles) |

---

## Tài khoản demo

Password: `collabspace123` — nguồn BE `scripts/demo-seed-data.json`

| Email | Platform | Ghi chú FE |
|-------|----------|------------|
| `tho@collabspace.dev`, `trungtin@collabspace.dev` | admin | Vào `/admin` |
| `ngocanh@collabspace.dev` | user | MVP flow — workspace owner |
| `viewer.only@collabspace.dev` | user | Empty state — không workspace |
| `dev.eve@collabspace.dev` | user | Pending invite — `/invitations` |

---

## Tài liệu liên quan

- [fe-backlog.md](./fe-backlog.md) — việc FE theo owner (Tiến / Tín / Thọ)
- [team/README.md](./team/README.md) — chỉ mục backlog đa repo
- [fe-be-alignment.md](./fe-be-alignment.md) — gap API ↔ UI
