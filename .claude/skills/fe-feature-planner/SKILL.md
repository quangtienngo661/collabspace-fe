---
name: fe-feature-planner
description: Plan or implement the next CollabSpace frontend feature slice and close gaps vs the backend MVP. Use when continuing FE work, prioritizing UI gaps, or aligning with the demo scope.
---

# FE Feature Planner Skill

Use to pick and implement the next frontend slice against backend MVP.

## Required context

- `docs/fe-be-alignment.md` — canonical gap list
- `docs/features.md` — FE coverage summary
- `collabspace/docs/mvp-demo-scope.md` — demo acceptance
- `collabspace/docs/features.md` — BE Done status
- `.claude/docs/frontend-architecture.md`

## Prioritization

1. **Blocks demo** — missing API client or broken 400 flow
2. **Demo polish** — activity feed, board, notifications (mostly Done)
3. **Intentional BE gap** — do not build UI; keep disabled + tooltip
4. **Nice-to-have** — presence polling, threaded comments, create-task dueDate/labels

## Current known gaps (check doc for latest)

| Gap | Notes |
|-----|-------|
| DELETE workspace | BE `DELETE /workspaces/:id` owner-only; FE disabled wrongly |
| Notification archive | No BE endpoint |
| Member role / remove | No BE end-user endpoints |
| Threaded comments | `parentId` in API; flat UI |
| Live presence | `GET /users/presence` not wired on load |
| `commentCount` on cards | BE board may not return field |

## Implementation slice template

1. Confirm BE endpoint in `collabspace`
2. API layer (`fe-api-integration` skill)
3. UI page/modal
4. Route + nav if needed
5. Update `fe-be-alignment.md` + `docs/features.md`
6. `npm run build` + manual demo step

## Do not

- Implement admin unassign permission (BE missing)
- Add mock data files — use real API or empty states
- Fork BE contract docs into FE — link instead

## Output

When planning only: ordered list with files and APIs.  
When implementing: code + doc updates in same change.
