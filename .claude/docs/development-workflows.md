# CollabSpace Frontend — Development Workflows

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS |
| npm | 10.x (bundled) |
| Docker Desktop | For backend stack |

Backend repo **collabspace** must run before meaningful API testing.

## First-time setup

```powershell
cd collabspace-fe
npm install
Copy-Item .env.example .env
```

Default `.env`:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost
```

For prod API from local machine:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=https://collabspace.ngocanh2005it.site
```

Restart dev server after any `.env` change.

## Start backend (summary)

From `collabspace/infrastructure/docker`:

```powershell
docker compose -f docker-compose.yml -f docker-compose.db.yml -f docker-compose.traefik.yml up -d
```

Migrate + seed per backend `README.md`. Verify:

```powershell
curl http://localhost/api/v1/auth/health/ready
```

Full steps: `collabspace-fe/README.md` (Vietnamese) or `collabspace/.claude/docs/development-workflows.md`.

## Start frontend

```powershell
npm run dev
```

Open http://localhost:5173

Vite logs proxy target on startup:

```text
[vite] API proxy target: http://localhost (only when VITE_API_BASE_URL=/api/v1)
```

## Verify changes (agent checklist)

| Step | Command | When |
|------|---------|------|
| Typecheck + bundle | `npm run build` | Always before PR |
| Dev smoke | `npm run dev` + login | UI/routing changes |
| Preview | `npm run preview` | Production build check |

No unit test script in `package.json` yet — manual demo flow:

1. Login `tho@collabspace.dev` / `collabspace123` (after seed)
2. Dashboard loads without KPI flicker
3. Create workspace → project → task
4. Kanban drag/status
5. Task detail: comment, notification mark read

Demo accounts: see `README.md`.

## Demo flow (MVP)

Maps to `collabspace/docs/mvp-demo-scope.md`:

1. Register / verify OTP (or use seeded user)
2. Create workspace
3. Invite member → accept on Notifications or `/invitations?id=`
4. Create project + tasks on board
5. Assign, comment with `@username`
6. Check notifications

## Troubleshooting

### ERR_CONNECTION_REFUSED / no available server

- Backend or Traefik down
- Wrong `VITE_API_PROXY_TARGET`
- Fix: `docker ps`, curl health URL, restart `npm run dev`

### CORS / 401 on OPTIONS

- `VITE_API_BASE_URL` points to remote origin in dev
- Fix: use `/api/v1` + proxy (see `.env.example`)

### Empty workspaces after login

- User has no memberships — not FE bug
- Verify: `GET /workspaces` returns `[]` for that account

### Port 5173 in use

```powershell
netstat -ano | findstr :5173
taskkill /PID <pid> /F
```

### Build errors (lucide vs types)

- Icon `User` clashes with domain `User` type — alias imports

## Production build

```powershell
npm run build    # output dist/
npm run preview  # local static serve + proxy
```

Deploy `dist/` to static host; ensure `/api/v1` routes to gateway or set `VITE_API_BASE_URL` at build time.

## Docs sync

If env vars, proxy behavior, or verify steps change → update:

- `README.md`
- `.env.example`
- This file
- Skill `/local-dev-verify`
