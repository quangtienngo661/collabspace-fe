# CollabSpace Enterprise Dashboard — Implementation Plan

## Context

The user wants a complete high-fidelity UI for "CollabSpace", a Jira + Notion + Slack hybrid enterprise dashboard. The design spec covers authentication, workspace/project/task management, comments, attachments, notifications, admin/RBAC, and a service health panel. All built as a dense, modern, technical-style SPA.

## Tech Stack Available

- **React 18 + React Router 7** — multi-page SPA routing
- **Tailwind CSS v4** — utility classes + existing `theme.css` tokens
- **47 Radix/Shadcn UI components** in `src/app/components/ui/` — Button, Dialog, Table, Tabs, Avatar, Badge, Sheet, Drawer, Select, Popover, etc.
- **react-dnd** — drag-and-drop for Kanban
- **vaul** — bottom drawer for mobile
- **sonner** — toast notifications
- **recharts** — KPI charts on dashboard
- **motion** — subtle animations
- **No @make-kits** packages — use existing ui/ components directly

## Approach

Build a single-page React Router app with a persistent app shell. All screens are implemented as route pages. Mock data throughout (no real backend).

### Design Tokens Override (theme.css / inline CSS vars)

Extend the palette for the enterprise blue/cyan/indigo accent system:

- Background: `#0a0d14` (dark mode default), `#f4f5f7` (light)
- Accent/primary: `#3b82f6` (blue-500), `#06b6d4` (cyan-400)
- Success: `#22c55e`, Warning: `#f59e0b`, Error: `#ef4444`

### Architecture

```
src/app/
├── App.tsx                  — Router setup, ThemeProvider, Toaster
├── components/
│   ├── ui/                  — existing 47 components (untouched)
│   ├── layout/
│   │   ├── AppShell.tsx     — sidebar + topbar + content wrapper
│   │   ├── Sidebar.tsx      — collapsible, workspace switcher, nav items
│   │   ├── TopBar.tsx       — search, notification bell, user menu, presence
│   │   └── MobileNav.tsx    — bottom nav bar / drawer for mobile
│   ├── shared/
│   │   ├── StatusBadge.tsx  — TODO/DOING/DONE/role chips
│   │   ├── UserAvatar.tsx   — avatar with presence ring
│   │   ├── ConfirmDialog.tsx — reusable confirm modal
│   │   ├── EmptyState.tsx   — empty/error/403 states
│   │   └── SkeletonCard.tsx — loading skeleton
│   └── pages/               — one file per major screen
│       ├── auth/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── OtpPage.tsx
│       │   ├── ForgotPasswordPage.tsx
│       │   ├── ResetPasswordPage.tsx
│       │   ├── ChangePasswordPage.tsx
│       │   └── SessionsPage.tsx
│       ├── DashboardPage.tsx
│       ├── workspace/
│       │   ├── WorkspaceListPage.tsx
│       │   ├── WorkspaceDetailPage.tsx
│       │   └── WorkspaceSettingsPage.tsx
│       ├── project/
│       │   ├── ProjectListPage.tsx
│       │   └── ProjectSettingsPage.tsx
│       ├── task/
│       │   ├── KanbanBoardPage.tsx
│       │   ├── TaskListPage.tsx
│       │   └── TaskDetailDrawer.tsx
│       ├── NotificationsPage.tsx
│       ├── profile/
│       │   ├── MyProfilePage.tsx
│       │   └── UserDirectoryPage.tsx
│       ├── admin/
│       │   ├── RolePage.tsx
│       │   └── HealthPage.tsx
│       └── ErrorPages.tsx   — 403, 404
```

### Routing (React Router 7)

```
/ → redirect to /dashboard
/login, /register, /otp, /forgot-password, /reset-password → auth layout (no sidebar)
/dashboard → AppShell wrapping DashboardPage
/workspaces → WorkspaceListPage
/workspaces/:id → WorkspaceDetailPage (members tab, settings tab)
/workspaces/:id/projects → ProjectListPage
/workspaces/:id/projects/:pid → KanbanBoardPage (with list toggle)
/workspaces/:id/projects/:pid/tasks/:tid → TaskDetailDrawer (opens over kanban)
/notifications → NotificationsPage
/profile → MyProfilePage (tabs: profile, preferences, sessions, change-password)
/admin → RolePage
/admin/health → HealthPage
/403 → access denied
```

### Key Screen Details

**App Shell**

- Desktop: 240px sidebar (collapsible to 64px icon-only), `sticky` topbar
- Mobile: sidebar becomes vaul Drawer triggered by hamburger; bottom nav with 5 icons

**Dashboard**

- KPI cards: Total Tasks, Done, In Progress, Members, Unread Notifications
- Recharts BarChart of task status breakdown
- Recent activity feed
- Quick action buttons (New Task, Invite Member)

**Kanban Board**

- 3 columns: TODO / DOING / DONE with column header counts
- react-dnd drag between columns
- Task cards with title, assignee avatar, priority chip
- Horizontal scroll on mobile

**Task Detail**

- Opens as Sheet (right drawer) on desktop, full page on mobile
- Sections: title, status selector, assignee picker, description, attachments (drag-drop upload zone + list), comments thread with reply/edit/delete

**Comments**

- Composer with textarea + submit
- Threaded replies (1 level)
- Edit/delete for author only (soft-delete shows "[deleted]")

**Notifications Bell**

- Popover dropdown with unread count badge
- Items: task-assigned, comment-added, workspace-invited, system-alert
- Mark all read, link to /notifications page

**Admin / RBAC**

- Roles table (Admin, Member, Viewer) with permission checkboxes
- Assign role to user via user-select dropdown
- 403 page when non-admin accesses

**Auth Pages**

- Login: email/password, "remember me", link to register/forgot
- Register: name, email, password, confirm
- OTP: 6-digit input using input-otp component
- Forgot/Reset/Change password forms

### Mock Data

All data in `src/app/data/mockData.ts`: users, workspaces, projects, tasks, comments, notifications, roles.

### Interaction States Coverage

Every component includes: default, hover (`group-hover` / Tailwind hover:), focus (ring), disabled (opacity-50 + pointer-events-none), loading (Skeleton), empty (EmptyState), error (alert variant=destructive), success (green badge/toast).

## Files to Create/Modify

| File                                | Action                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `src/app/App.tsx`                   | Rewrite — Router + ThemeProvider + Toaster                                |
| `src/styles/theme.css`              | Add enterprise color overrides (blue accent, sidebar dark tokens)         |
| `src/app/data/mockData.ts`          | Create — all mock data                                                    |
| `src/app/components/layout/*.tsx`   | Create — AppShell, Sidebar, TopBar, MobileNav                             |
| `src/app/components/shared/*.tsx`   | Create — StatusBadge, UserAvatar, ConfirmDialog, EmptyState, SkeletonCard |
| `src/app/components/pages/**/*.tsx` | Create — ~20 page components                                              |

## Verification

1. App renders without errors in the preview
2. Navigate between all routes; active nav item highlights correctly
3. Sidebar collapses/expands on desktop; drawer opens on mobile viewport
4. Kanban drag-and-drop moves cards between columns
5. Task detail Sheet opens from kanban card click
6. Comment add/edit/delete works in mock state
7. Notification bell shows unread badge, popover opens
8. Auth pages render with form validation (react-hook-form)
9. Dark mode toggle works via next-themes
10. Toasts appear on actions (sonner)