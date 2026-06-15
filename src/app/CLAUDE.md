# src/app — Quick Reference

SPA application root. Full docs: `.claude/docs/frontend-architecture.md`.

## Add a feature checklist

1. `api/<domain>Api.ts` + `mappers.ts` + `types.ts`
2. Page under `components/pages/<area>/`
3. Route in `App.tsx`
4. Nav in `Sidebar` / `MobileNav` if user-facing
5. `docs/fe-be-alignment.md` if API alignment changes

## Key entrypoints

| File | Role |
|------|------|
| `App.tsx` | All routes |
| `auth/AuthContext.tsx` | Session, guards, `isAdmin` |
| `components/layout/AppShell.tsx` | Layout + contexts |
| `api/httpClient.ts` | All HTTP |

## Context providers (in AppShell)

- `WorkspacesContext` — workspace list once
- `NotificationsContext` — notification list + unread

Do not re-fetch these in child layout components.
