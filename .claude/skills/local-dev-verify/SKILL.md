---
name: local-dev-verify
description: Run the right build, dev server, proxy, and smoke-test workflow for collabspace-fe. Use when verifying UI changes, debugging env/proxy/CORS, or preparing a demo.
---

# Local Dev Verify Skill (Frontend)

## Required context

- `.claude/docs/development-workflows.md`
- `README.md`
- `.env.example` / local `.env` (do not commit)
- Backend running for API smoke tests

## Scope decision

| Change type | Verify |
|-------------|--------|
| Docs only | No build unless commands changed |
| TSX/TS code | `npm run build` |
| Env / vite.config | Restart `npm run dev`, check proxy log |
| API integration | build + login smoke + Network tab |

## Commands

```powershell
npm install          # if deps changed
npm run build        # required before PR
npm run dev          # http://localhost:5173
npm run preview      # after build
```

## Env check

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost
```

After editing `.env` → restart dev server.

Backend health:

```powershell
curl http://localhost/api/v1/auth/health/ready
```

## Smoke checklist

- [ ] Login succeeds (seeded user)
- [ ] Dashboard loads (skeleton → data, no infinite spinner)
- [ ] Workspaces list matches API (empty state OK)
- [ ] Kanban loads `GET /tasks/board`
- [ ] No duplicate storm of `/me` on login (check Network)
- [ ] Admin routes 403 for non-admin

## Common failures

| Symptom | Fix |
|---------|-----|
| Connection refused | Start Docker backend / fix proxy target |
| CORS on `/users/me` | Use relative `/api/v1` + proxy |
| 404 on `users/me/status` | Remove call — endpoint N/A |
| Build: duplicate `User` | Alias lucide import |

## Docs sync

If verify steps or env vars change → update `development-workflows.md`, `README.md`, `.env.example`, this skill.
