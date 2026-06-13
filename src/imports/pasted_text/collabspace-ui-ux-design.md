Design a complete high-fidelity UI/UX system for “CollabSpace”, an enterprise collaboration dashboard for workspace, project, task, user, and notification management.

Product context:
CollabSpace is a modern collaboration platform similar to a lightweight Jira + Notion + Slack hybrid. It supports authentication, user profiles, workspaces, projects, task boards, task comments, file attachments, notifications, user presence, session management, and admin RBAC.

Design direction:
Create a compact enterprise dashboard UI, optimized for dense information and fast workflows. The visual style should feel modern, technical, professional, and clean. Use a technology-inspired palette with neutral backgrounds, blue/cyan/indigo accents, clear semantic colors for success/warning/error/info, and excellent contrast. Avoid playful, overly decorative, or marketing-style layouts.

Target platforms:
Design both desktop web and mobile responsive versions from the beginning.
Desktop frame: 1440px wide.
Mobile frame: 390px wide.
Use responsive behavior for sidebars, tables, kanban boards, modals, and forms.

Language:
All UI text, labels, buttons, validation messages, empty states, and navigation must be in English.

Create a design system first:
Include color tokens, typography scale, spacing scale, border radius, elevation, icons, form controls, buttons, badges, status chips, avatars, tables, tabs, dropdowns, sidebars, top bars, modals, drawers, cards, kanban cards, notification items, file attachment items, comment composer, toast messages, skeleton loaders, empty states, error states, and permission-denied states.

Main layout:
Create an authenticated app shell with:
- Collapsible left sidebar
- Workspace switcher
- Project navigation
- Main content area
- Top bar with global search, notification bell, user presence, and profile menu
- Breadcrumbs for deep pages
- Mobile bottom navigation or drawer navigation

Required screens:

1. Authentication
- Login
- Register
- Email verification OTP
- Forgot password
- Reset password
- Change password
- Session management page with revoke session, logout others, logout all

2. Workspace Management
- Workspace list
- Create workspace modal/page
- Workspace detail
- Workspace settings
- Members table
- Invite member modal
- Invitation accept/reject page
- Access denied when user is not a workspace member

3. Project Management
- Project list inside a workspace
- Create project modal
- Project settings/edit project
- Delete project confirmation
- Empty project state

4. Task Management
- Task kanban board with TODO, DOING, DONE columns
- Task list/table view
- Task filters by status, assignee, workspace, and search keyword
- Create task modal
- Task detail page/drawer
- Edit task title and description
- Change task status control
- Assign/unassign user picker
- Delete task confirmation state, even if backend route may be added later
- Error state for invalid transition such as DONE to TODO

5. Attachments
- Attachment upload area inside task detail
- Drag-and-drop upload state
- Upload progress
- File size validation error for files over 5MB
- Attachment list with file name, size, open/download, delete
- Delete attachment confirmation

6. Comments
- Comment thread in task detail
- Comment composer
- Reply UI using parent comment relationship
- Edit comment state
- Soft-delete comment state
- Author-only edit/delete actions
- Empty comments state
- Validation for empty comment and long comment

7. Users and Profiles
- My profile page
- Edit profile page/modal
- User preferences page
- Notification preferences section
- Presence/status editor
- User directory with search and pagination
- Public user profile/summary view
- Bulk user selection pattern for assignee picker

8. Notifications
- Notification bell dropdown with unread badge
- Notification center page
- Notification item variants: task assigned, comment added, workspace invited, system alert
- Unread/read/archived visual states
- Mark as read, archive, and filter by unread/type
- Empty notification state

9. Admin and RBAC
- Role management page
- Permission management page
- Assign permissions to role
- Assign role to user
- Admin-only access state
- 403 forbidden page

10. Operational/health optional admin views
- Service health overview
- Queue/event status summary
- Basic system status cards for Auth, User, Workspace, Task, Notification services

Interaction states:
For every important screen and component, include:
- Default
- Hover
- Focus
- Disabled
- Loading
- Empty
- Error
- Success
- Validation error
- Permission denied
- Mobile collapsed layout

Information architecture:
Primary sidebar items:
Dashboard, Workspaces, Projects, Tasks, Members, Notifications, Admin, Settings.

User menu items:
My Profile, Preferences, Sessions, Change Password, Logout.

Dashboard screen:
Include KPI cards for tasks by status, recent activity, assigned tasks, workspace members, unread notifications, and quick actions.

Task detail should be highly usable:
Show task title, status, assignee, creator, workspace/project context, description, attachments, comments, activity timeline, and key actions in a dense but readable layout.

Mobile requirements:
Convert sidebar into drawer navigation.
Convert dense tables into stacked cards.
Kanban board should become horizontally scrollable or column tabs.
Task detail should become a full-screen mobile sheet/page.
Forms and modals should be mobile-friendly.

Deliverables:
Generate a complete Figma design with reusable components, variants, auto layout, desktop and mobile frames, and consistent naming. Prioritize practical enterprise usability, dense data presentation, accessibility, and clear visual hierarchy.