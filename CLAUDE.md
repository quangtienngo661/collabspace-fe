# CollabSpace Frontend — Claude / Cursor Guide

## Project Identity

**collabspace-fe** is the React SPA for [CollabSpace](https://github.com/lengocanh2005it/collabspace): workspace collaboration (Notion/Slack/Jira-style demo). It talks to the NestJS microservices backend via Traefik at `/api/v1`.

**Backend repo (separate):** `collabspace` — canonical API contracts, features, and infra docs live there.

## Agent Docs Map

Full onboarding: `.claude/docs/agent-onboarding.md`

Read before broad changes:

- FE architecture: `.claude/docs/project-architecture.md`
- **Folder layout & patterns:** `.claude/docs/frontend-architecture.md`
- API client & mappers: `.claude/docs/api-integration.md`
- Dev / env / proxy: `.claude/docs/development-workflows.md`
- Conventions: `.claude/docs/coding-conventions.md`
- FE ↔ BE gaps: `docs/fe-be-alignment.md`
- BE product & API (external): `../collabspace/docs/features.md`, `../collabspace/docs/api-routes.md`

Path-scoped rules load from `.claude/rules/` when editing matching files.

Subagents: `.claude/agents/` (`fe-reviewer`, `fe-be-alignment`); Codex mirror `.codex/agents/*.toml`. Cross-tool index: `AGENTS.md`.

## Repository Shape

```text
collabspace-fe/
├── src/app/
│   ├── api/           # httpClient, *Api.ts, mappers, types, requestCache
│   ├── auth/          # AuthContext, route guards
│   ├── context/       # WorkspacesContext, NotificationsContext
│   ├── components/
│   │   ├── layout/    # AppShell, Sidebar, TopBar, MobileNav
│   │   ├── pages/     # Route pages (auth, workspace, task, admin, …)
│   │   ├── shared/    # UserAvatar, EmptyState, …
│   │   └── ui/        # shadcn/Radix primitives
│   ├── hooks/         # useAsyncData, useWorkspaceMemberUsers, …
│   └── utils/
├── docs/              # Human + agent alignment docs
├── .claude/           # Agent docs, skills, rules (canonical)
└── vite.config.ts     # Dev proxy → VITE_API_PROXY_TARGET
```

## Hard Project Facts

- **Package manager:** `npm` (uses `package-lock.json`) — not pnpm.
- **Dev server:** Vite on port **5173** (`npm run dev`).
- **API base:** `VITE_API_BASE_URL` — default `/api/v1` (same-origin; Vite proxies to backend).
- **Proxy target:** `VITE_API_PROXY_TARGET` — default `http://localhost` (local Traefik). Prod: `https://collabspace.ngocanh2005it.site`.
- **Do not** point `VITE_API_BASE_URL` at a remote origin in dev — CORS preflight fails on protected routes (`/auth/me`, `/users/*`).
- **Response unwrap:** task-service wraps `{ data }`; `httpClient` unwraps automatically.
- **Auth:** JWT in `localStorage` via `session.ts`; `httpClient` refreshes on 401.
- **Admin gate:** `isAdmin` = `role === 'admin'` OR `permissions` includes `auth.manage` (matches BE `PlatformAdminGuard`).
- **MVP FE status:** Phases 2–6 ✅ per `docs/fe-be-alignment.md`. Remaining polish: see § Remaining gaps in that doc.

## Default Working Style

- Read nearby page, API module, and mappers before editing.
- New API calls → add to `src/app/api/<domain>Api.ts`, map in `mappers.ts`, types in `types.ts`.
- Prefer `useAsyncData` + context providers over duplicate fetches in layout children.
- Use `requestCache.ts` for short TTL dedupe on hot reads (`workspaces`, `users/me`, `preferences`).
- **Docs sync:** when routes, env, API shapes, or FE↔BE status change → update `docs/fe-be-alignment.md` and `.claude/docs/` in the same PR. See `.claude/rules/docs-and-skills-sync.md`.
- Do not commit `.env`; document vars in `.env.example`.
- Avoid unrelated refactors or dependency churn.

## Common Commands

```powershell
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle check
npm run preview  # preview build (proxy still applies)
```

Backend must be running first (Docker + Traefik). See `README.md` and `.claude/docs/development-workflows.md`.

## Skills

| Skill | When |
|-------|------|
| `/collabspace-fe-codebase` | Orient, architecture, where to change |
| `/fe-api-integration` | New/changed API client, mappers, auth |
| `/fe-feature-planner` | Next FE slice, gaps vs backend |
| `/local-dev-verify` | Build, dev server, proxy, smoke test |

## Backend Reference

When BE behavior is unclear, read the sibling repo:

- `collabspace/docs/features.md` — product status
- `collabspace/docs/api-routes.md` — HTTP route index
- `collabspace/.claude/docs/service-contracts.md` — contracts

Do not duplicate BE contracts in FE docs — link and mirror only what the UI consumes.
