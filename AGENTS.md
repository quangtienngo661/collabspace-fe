# CollabSpace Frontend — Agent Instructions

Cross-tool index for **Claude Code**, **Cursor**, and **Codex**. Canonical agent docs live in `.claude/`; `CLAUDE.md` is the primary entry point.

## Multi-tool layout

| Tool | Entry | Skills | Subagents | Path rules |
|------|-------|--------|-----------|------------|
| Claude Code / Cursor | `CLAUDE.md` | `.claude/skills/` | `.claude/agents/*.md` | `.claude/rules/` |
| Codex | `AGENTS.md` (this file) | `.agents/skills/` (mirror) | `.codex/agents/*.toml` | — (read `.claude/rules/` when relevant) |

**Canonical source:** `.claude/docs/`, `.claude/rules/`, `.claude/skills/`, `.claude/agents/`.

After editing `.claude/skills/`, run `bash scripts/sync-agent-docs.sh` (or `pwsh scripts/sync-agent-docs.ps1`) to refresh `.agents/skills/`. After editing `.claude/agents/*.md`, update matching `.codex/agents/*.toml` manually.

## Start here

1. [CLAUDE.md](./CLAUDE.md) — core rules, env, commands (loaded every session)
2. [.claude/docs/agent-onboarding.md](./.claude/docs/agent-onboarding.md) — full agent guide and doc map

## Deep reference (read when relevant)

| Doc | Purpose |
|-----|---------|
| `.claude/docs/project-architecture.md` | FE stack, routing, state, BE topology |
| `.claude/docs/frontend-architecture.md` | **Folder layout, patterns, where to add code** |
| `.claude/docs/api-integration.md` | httpClient, mappers, auth, caching |
| `.claude/docs/development-workflows.md` | npm, Vite proxy, env, troubleshoot |
| `.claude/docs/coding-conventions.md` | React/TS/UI conventions |
| `docs/fe-be-alignment.md` | FE ↔ BE gap backlog & status |
| `docs/features.md` | FE feature coverage (human) |
| `README.md` | Human quick start (Vietnamese) |
| **Backend (sibling repo)** `collabspace/docs/features.md` | Canonical product status |
| **Backend** `collabspace/docs/api-routes.md` | HTTP routes |
| **Backend** `collabspace/.claude/docs/service-contracts.md` | API contracts |

## When changing code — sync docs & skills

If a change affects **API client shapes, routes, env, auth flow, or FE↔BE alignment**, update related agent docs and skills in the **same PR** when necessary.

- Guide: [.claude/docs/agent-onboarding.md](./.claude/docs/agent-onboarding.md) → **Docs & skills sync**
- Auto rule (loads on `src/app/api/**`, pages, etc.): [.claude/rules/docs-and-skills-sync.md](./.claude/rules/docs-and-skills-sync.md)

Report which doc/skill files were updated in the completion summary (or state that sync was not required).

## Automation

- **Skills** (`.claude/skills/`; Codex mirror `.agents/skills/`): `/collabspace-fe-codebase`, `/fe-api-integration`, `/fe-feature-planner`, `/local-dev-verify`
- **Subagents** — Claude/Cursor: `.claude/agents/`; Codex: `.codex/agents/` — `fe-reviewer`, `fe-be-alignment`
- **Path rules** (`.claude/rules/`): auto-load when editing matching paths
- **Sync script**: `scripts/sync-agent-docs.sh` / `.ps1` — copies `.claude/skills/` → `.agents/skills/`

## Area cheat sheet

- `src/app/CLAUDE.md` — quick map for `src/app/`

Path rules (auto-load when editing): `.claude/rules/api-layer.md`, `.claude/rules/pages-and-layout.md`
