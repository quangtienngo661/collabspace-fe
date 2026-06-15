---
paths:
  - "src/app/components/pages/**"
  - "src/app/components/layout/**"
  - "src/app/App.tsx"
  - "src/app/context/**"
  - "src/app/hooks/**"
---

# Pages & layout rules

When editing routes, pages, or layout:

1. Register new routes in `App.tsx` — use `ProtectedRoute`, `AdminRoute`, or public as appropriate.
2. Shared workspace/notification data → `WorkspacesContext` / `NotificationsContext`, not per-page `list()`.
3. Page-local data → `useAsyncData` with correct dependency array; use `enabled` for lazy modals.
4. Mutations → toast + reload context or `invalidateCachedRequestPrefix`.
5. Disabled actions need `title` when BE lacks endpoint (see `docs/fe-be-alignment.md`).

Structure:

- Smart logic in `pages/`
- Reuse `shared/` and `ui/`
- No direct `fetch` in pages

After new routes or major screens, update:

- `.claude/docs/project-architecture.md` (routing table)
- `.claude/docs/frontend-architecture.md`

Reference: `.claude/docs/frontend-architecture.md`.
