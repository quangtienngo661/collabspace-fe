# CollabSpace Frontend — Coding Conventions

## Language & tooling

- **TypeScript** throughout `src/app/`
- **npm** — do not introduce pnpm/yarn without team decision
- **ESLint:** not configured at repo root — rely on `npm run build` (Vite + TS)
- **Formatting:** match surrounding file style; no repo-wide Biome yet

## Imports

- Path alias `@/` → `src/` (vite `resolve.alias`)
- API: `from "../../api/workspaceApi"` or `@/app/api/workspaceApi` — be consistent within a file
- Lucide icons: if name clashes with domain type, alias (`User as UserIcon` or `User as DomainUser`)

## React

- Functional components only
- Hooks at top level; `useCallback`/`useMemo` when passing to memoized children or context
- `void` prefix for floating promises in event handlers: `onClick={() => void save()}`
- Route guards in `auth/AuthContext.tsx` — not inline in every page

## State

| Data | Pattern |
|------|---------|
| Auth user / profile | `useAuth()` |
| Workspace list (global) | `useWorkspaces()` |
| Notifications (global) | `useNotifications()` |
| Page-local server data | `useAsyncData` |
| Form UI | `useState` or react-hook-form where already used |

Avoid prop drilling workspace list — use context.

## API layer

- All HTTP via `apiRequest`
- Return mapped domain types from `*Api` modules
- Throw `ApiError` — catch in UI, `toast.error(e.message)`
- Invalidate cache after writes

## UI components

- **pages/** — smart components (data + actions)
- **shared/** — dumb reusable pieces
- **ui/** — shadcn primitives; extend via `className` + `cn()` from `ui/utils.ts`
- Tailwind: dark mode via `dark:` variants; theme class on `html`

## Naming

| Item | Convention |
|------|------------|
| Page files | `*Page.tsx` |
| API modules | `camelCaseApi.ts` |
| Hooks | `use*.ts` |
| Types | PascalCase interfaces in `types.ts` |
| BE status enums | Uppercase `TODO`, `DOING`, `DONE` for tasks |

## User-visible strings

- English in UI copy (existing convention)
- Toast messages: short, actionable
- Disabled buttons: `title` explaining BE gap when applicable

## Files to avoid editing

- `src/components/ui/*` — only for deliberate design system changes
- `node_modules/`, `dist/`
- Generated lockfile unless dependency task

## When adding features

1. API + types + mapper
2. Page or extend existing page
3. Route in `App.tsx` if new screen
4. Update `docs/fe-be-alignment.md` if closing/opening gaps
5. `npm run build`

## Backend parity

Do not invent API fields. Read BE DTO or `docs/api-routes.md`. Whitelist PATCH bodies — NestJS `forbidNonWhitelisted` returns 400 on extra keys.
