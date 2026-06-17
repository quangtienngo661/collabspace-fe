---
name: collabspace-fe-codebase
description: Understand the collabspace-fe repository, React architecture, routing, API layer, and FE↔BE alignment status. Use when starting work, onboarding, or deciding where to change the frontend.
---

# CollabSpace Frontend Codebase Skill

Orient before making changes to the React SPA.

## Required context

Read as needed:

- `CLAUDE.md`
- `.claude/docs/project-architecture.md`
- `.claude/docs/frontend-architecture.md`
- `docs/fe-be-alignment.md`
- `docs/features.md`
- Backend (sibling): `collabspace/docs/features.md`, `collabspace/docs/api-routes.md`

## Orientation steps

1. Classify request: auth, workspace, task, notification, admin, layout, API client, env/proxy.
2. Map to `src/app/api/*` and `components/pages/*`.
3. Check `docs/fe-be-alignment.md` for Done / gap / disabled UI.
4. Read target page + API module + mappers before editing.
5. Confirm BE endpoint exists in `collabspace` if adding new integration.

## Layer map

| Layer | Path |
|-------|------|
| HTTP | `src/app/api/` |
| Session | `src/app/api/session.ts`, `auth/AuthContext.tsx` |
| Global lists | `context/WorkspacesContext`, `context/NotificationsContext` |
| Routes | `App.tsx` |
| Screens | `components/pages/` |
| Shell | `components/layout/AppShell.tsx` |

## Hard facts

- npm (not pnpm); Vite port 5173
- `VITE_API_BASE_URL=/api/v1` + proxy in dev
- httpClient unwraps `{ data }`; refreshes JWT on 401 (FormData cannot auto-retry after refresh)
- No `GET /users/me/status` on BE
- MVP API integration Done; remaining work = polish (`fe-backlog`) + technical debt (`fe-be-alignment` § Technical debt)

## Output style

- Name exact files to change
- Note if gap is FE-only, BE-only, or intentional disable
- Smallest next step for implementation requests

## Docs sync

If routes, env, or FE↔BE status change → update `docs/fe-be-alignment.md` and relevant `.claude/docs/`. See `.claude/rules/docs-and-skills-sync.md`.

Before PR: `npm run build`.
