---
paths:
  - "src/**"
  - "docs/**"
  - "vite.config.ts"
  - ".env.example"
  - "README.md"
---

# Docs & skills sync (bắt buộc khi cần)

Khi sửa code ảnh hưởng **hành vi UI, API client, env, hoặc FE↔BE alignment**, cập nhật **cùng PR** agent docs và skills liên quan.

## Khi nào phải sync

| Thay đổi code | Cập nhật tối thiểu |
|---------------|-------------------|
| API path, body, mapper field | `docs/fe-be-alignment.md`, `.claude/docs/api-integration.md` |
| Route / page mới | `.claude/docs/project-architecture.md`, `frontend-architecture.md` |
| `VITE_*` env / Vite proxy | `.env.example`, `README.md`, `development-workflows.md`, skill `local-dev-verify` |
| Auth/session flow | `api-integration.md`, `AuthContext` patterns in `frontend-architecture.md` |
| FE feature Done / gap | `docs/features.md`, `fe-be-alignment.md` |
| Verify workflow đổi | `development-workflows.md`, skill `local-dev-verify` |
| Skill workflow đổi | `.claude/skills/*/SKILL.md` → `scripts/sync-agent-docs.ps1` |

Refactor nội bộ không đổi contract/UI → không bắt buộc sync.

## Thứ tự làm

1. Sửa code.
2. `npm run build`.
3. Rà bảng trên; cập nhật doc/skill trong cùng thay đổi.
4. Completion message: liệt kê file doc đã cập nhật.
5. Sau sửa skills: chạy `scripts/sync-agent-docs.ps1`.

Chi tiết: `.claude/docs/agent-onboarding.md`.

## Backend docs

Contract truth stays in **collabspace** repo. FE chỉ mirror what UI consumes — link `collabspace/docs/api-routes.md`, không copy full route tables.
