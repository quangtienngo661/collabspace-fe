---
name: fe-api-integration
description: Add or fix CollabSpace frontend API clients, mappers, auth, and request caching. Use when wiring new backend endpoints, fixing 400/401 API errors, or aligning request bodies with NestJS DTOs.
---

# FE API Integration Skill

Use when changing `src/app/api/` or debugging API mismatches.

## Required context

- `.claude/docs/api-integration.md`
- `docs/fe-be-alignment.md`
- Target `*Api.ts` + `mappers.ts` + `types.ts`
- Backend: `collabspace/docs/api-routes.md` and controller DTO for the endpoint

## Workflow

1. **Verify BE contract** — method, path, body whitelist, response shape.
2. **Add method** on domain `*Api.ts` using `apiRequest<T>()`.
3. **Map response** in `mappers.ts` if non-trivial.
4. **Add/update types** in `types.ts`.
5. **Cache** — use `cachedRequest` for hot reads; `invalidateCachedRequestPrefix` on mutations.
6. **Wire UI** — page calls API module only.
7. **Update** `docs/fe-be-alignment.md` — mark Done or document gap.

## httpClient rules

- Paths start with `/` relative to `VITE_API_BASE_URL`
- `auth: false` only for login/register/public routes
- `FormData` for avatar — do not set Content-Type manually
- Do not duplicate refresh logic — httpClient handles 401

## Common BE constraints

- NestJS `forbidNonWhitelisted` — extra JSON keys → 400
- task-service wraps success in `{ data }`
- workspace invite body: `{ email }` only
- `PATCH /tasks/:id/details` — no `taskId` in body
- Admin broadcast: header `Idempotency-Key`

## Anti-patterns

- Raw `fetch` in components
- `GET /users/me/status`
- Absolute backend URL in dev without proxy
- Mapping in every component instead of `mappers.ts`

## Verify

```powershell
npm run build
```

Manual: Network tab — correct URL, 2xx, expected JSON shape.

Invoke `fe-be-alignment` agent for cross-check against BE repo.
