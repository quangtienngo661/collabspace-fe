---
name: fe-feature-planner
description: Plan or implement the next CollabSpace frontend feature slice and close gaps vs the backend MVP. Use when continuing FE work, prioritizing UI gaps, or aligning with the demo scope.
---

# FE Feature Planner Skill

Use to pick and implement the next frontend slice against backend MVP.

## Required context

- `docs/fe-be-alignment.md` — canonical gap list + technical debt
- `docs/features.md` — FE coverage summary
- `docs/fe-backlog.md` — polish tasks by owner (A–F)
- `collabspace/docs/mvp-demo-scope.md` — demo acceptance
- `collabspace/docs/features.md` — BE Done status
- `.claude/docs/frontend-architecture.md`

## Prioritization (2026-06-18)

1. **P0 polish** — admin overview (C9) and friendly errors beyond invite/admin (C8) — see `fe-backlog.md`
2. **Quick engineering wins** — ErrorBoundary (F1), lazy routes (F2)
3. **Intentional BE gap** — invite validation rules, admin permission unassign — do not fake UI
4. **Large refactors** — TanStack Query (F6), httpOnly cookie (F8, needs BE)

**MVP demo 7-step API integration is Done** — do not re-implement mark-read, comments, invitations, activity.

## Current known gaps (check doc for latest)

| Gap | Notes |
|-----|-------|
| Dashboard KPI when >50 tasks | ✅ B9 Done — dashboard uses `getBoard` |
| Workspace list stats flash 0 | ✅ A7 Done — skeleton until enrich |
| Admin overview KPI | C9 — client aggregate |
| Notification archive | ✅ wired — `PATCH .../archive` |
| Invite accept/reject | ✅ `/invitations` + `GET /invitations/me` |
| Admin permission unassign | BE missing — toast on uncheck |
| `force-join` workspace (admin) | BE ready; no FE UI |
| `commentCount` on Kanban | Shows when BE returns field |
| Kanban memo | ✅ F3 Done — cards/columns memoized |
| Tests / ErrorBoundary / lazy routes | § F technical debt |

## Implementation slice template

1. Confirm BE endpoint in `collabspace`
2. API layer (`fe-api-integration` skill)
3. UI page/modal
4. Route + nav if needed
5. Update `fe-be-alignment.md` + `docs/features.md` + `fe-backlog.md` if status changes
6. `npm run build` + manual demo step

## Do not

- Implement admin unassign permission (BE missing)
- Add mock data files — use real API or empty states
- Fork BE contract docs into FE — link instead
- Treat mark-read / comments / invitations as missing (they are Done)

## Output

When planning only: ordered list with files and APIs.  
When implementing: code + doc updates in same change.
