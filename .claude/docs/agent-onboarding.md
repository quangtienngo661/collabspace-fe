# CollabSpace Frontend — Agent Onboarding

Hướng dẫn cho AI agents (Claude Code, Cursor, Codex) làm việc trên repo **collabspace-fe**.

## Bắt đầu nhanh

1. Đọc `CLAUDE.md` ở root — quy tắc cốt lõi, env, commands.
2. Xác định vùng sửa: API layer, page, layout, auth, admin.
3. Đọc doc trong `.claude/docs/` tương ứng.
4. Dùng skill phù hợp (`/collabspace-fe-codebase`, `/fe-api-integration`, …).
5. Chỉnh code, chạy `npm run build`, **cập nhật docs** nếu contract/route/env đổi.

## Cấu trúc agent docs (đa công cụ)

**Nguồn chính (canonical):** `.claude/` — Claude Code và Cursor. Codex đọc cùng docs; skills mirror tại `.agents/skills/`.

```text
CLAUDE.md                    # Entry Claude/Cursor
AGENTS.md                    # Entry cross-tool
.claude/
├── settings.json            # Permissions (deny .env)
├── agents/                  # fe-reviewer, fe-be-alignment
├── rules/                   # api-layer, pages-and-layout, docs-and-skills-sync
├── skills/                  # collabspace-fe-codebase, fe-api-integration, …
└── docs/                    # Reference docs
.agents/skills/              # Codex mirror — sync từ .claude/skills/
.codex/agents/               # Codex subagents (*.toml)
scripts/sync-agent-docs.*    # Copy skills .claude → .agents
src/app/CLAUDE.md            # Cheat sheet vùng app
docs/                        # fe-be-alignment.md, features.md
```

## Ownership map (FE)

| Domain | API module | Pages / components |
|--------|------------|-------------------|
| Auth, sessions | `authApi.ts` | `pages/auth/*`, `AuthContext.tsx` |
| Profile, search, presence | `usersApi.ts` | `MyProfilePage`, `TopBar` search |
| Workspace, project, invite | `workspaceApi.ts` | `workspace/*`, `InvitationsPage` |
| Task, board, comments | `taskApi.ts` | `task/*`, `TaskComments`, `TaskActivity` |
| Notifications | `notificationsApi.ts` | `NotificationsPage`, `TopBar`, `NotificationsContext` |
| Platform admin | `adminApi.ts`, `healthApi.ts` | `admin/*` |
| Layout / shell | — | `AppShell`, `Sidebar`, `MobileNav` |
| Global workspace list | `WorkspacesContext` | Sidebar, Dashboard, workspace pickers |

Backend sở hữu business rules — khi nghi ngờ contract, đọc repo `collabspace`.

## Doc map — đọc file nào?

| Task | Read first |
|------|------------|
| Orient, stack, routes | `.claude/docs/project-architecture.md` |
| **Thêm page / component / hook** | `.claude/docs/frontend-architecture.md` |
| Thêm/sửa API call | `.claude/docs/api-integration.md`, `docs/fe-be-alignment.md` |
| Env, proxy, dev, build | `.claude/docs/development-workflows.md` |
| Style, naming | `.claude/docs/coding-conventions.md` |
| FE thiếu gì so với BE | `docs/fe-be-alignment.md` |
| BE route/DTO thật | `collabspace/docs/api-routes.md` |

## Skills

| Skill | When |
|-------|------|
| `/collabspace-fe-codebase` | Onboarding, architecture, ownership |
| `/fe-api-integration` | httpClient, mappers, new endpoints |
| `/fe-feature-planner` | Tiếp tục MVP UI, đóng gap FE↔BE |
| `/local-dev-verify` | build, dev server, proxy smoke |

## Subagents

| Agent | When |
|-------|------|
| `fe-reviewer` | Review React/API changes before finishing |
| `fe-be-alignment` | Verify FE client khớp BE routes/DTO |

Invoke: *"Use the fe-be-alignment agent to check my API changes."*

## Working rules

- **Scope:** Giữ thay đổi trong `src/app/` trừ khi task chạm `vite.config`, env docs, hoặc agent docs.
- **API:** Mọi HTTP call qua `apiRequest` — không `fetch` rải rác trong components.
- **Types:** Domain types trong `api/types.ts`; map BE snake/camel trong `mappers.ts`.
- **Secrets:** Không commit `.env`; chỉ `.env.example`.
- **Proxy:** Dev dùng `VITE_API_BASE_URL=/api/v1` + `VITE_API_PROXY_TARGET`.
- **Tests:** Repo chưa có test runner — verify bằng `npm run build` + manual smoke.
- **BE sync:** Đổi request/response → cập nhật `docs/fe-be-alignment.md`.

## Docs & skills sync khi sửa code

Rule tự load: `.claude/rules/docs-and-skills-sync.md`.

### Bắt buộc cập nhật khi

- Thêm/đổi route React (`App.tsx`)
- Thêm/đổi API path, body, mapper field
- Biến môi trường Vite (`VITE_*`)
- Auth/session flow
- Trạng thái FE↔BE (Done / gap / disabled UI)

### Bản đồ doc theo loại thay đổi

| Loại thay đổi | Cập nhật |
|---------------|----------|
| API client / mapper | `api-integration.md`, `fe-be-alignment.md`, skill `fe-api-integration` |
| Route / page mới | `frontend-architecture.md`, `project-architecture.md` |
| Env / proxy | `development-workflows.md`, `README.md`, `.env.example`, skill `local-dev-verify` |
| Feature status | `docs/features.md`, `fe-be-alignment.md` |
| Skill workflow đổi | `.claude/skills/*/SKILL.md` → chạy `scripts/sync-agent-docs.ps1` |

### Completion message

Ghi rõ file doc/skill đã cập nhật hoặc "không cần — không đổi contract/UI surface".
