---
paths:
  - "src/app/api/**"
  - "src/app/auth/**"
  - "vite.config.ts"
  - ".env.example"
---

# API layer rules

When editing `src/app/api/` or auth session:

1. All HTTP through `apiRequest` in `httpClient.ts`.
2. Map BE JSON in `mappers.ts` — UI uses `types.ts` only.
3. Whitelist PATCH/POST bodies to match NestJS DTOs (no extra keys).
4. Use `cachedRequest` / `invalidateCachedRequestPrefix` for list endpoints.
5. Never call `GET /users/me/status` — does not exist on BE.
6. Dev: `VITE_API_BASE_URL=/api/v1` — do not hardcode prod URLs in source.

After contract changes, update:

- `.claude/docs/api-integration.md`
- `docs/fe-be-alignment.md`
- Skill `fe-api-integration` if workflow changes

Reference: `.claude/docs/api-integration.md`, backend `collabspace/docs/api-routes.md`.
