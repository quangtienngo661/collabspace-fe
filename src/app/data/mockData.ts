export type UserStatus = "online" | "away" | "busy" | "offline";
export type TaskStatus = "TODO" | "DOING" | "DONE";
export type Priority = "low" | "medium" | "high" | "critical";
export type Role = "admin" | "member" | "viewer";
export type NotifType = "task_assigned" | "comment_added" | "workspace_invited" | "system_alert";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  status: UserStatus;
  title: string;
  department: string;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  ownerId: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "active" | "archived";
  createdAt: string;
  taskCount: number;
}

export interface Task {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  dueDate: string | null;
  attachmentCount: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  deleted: boolean;
  parentId: string | null;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedById: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
  link: string;
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export const CURRENT_USER_ID = "u1";

export const users: User[] = [
  { id: "u1", name: "Alex Chen", email: "alex.chen@collabspace.io", avatar: "AC", role: "admin", status: "online", title: "Engineering Lead", department: "Engineering", joinedAt: "2023-01-15" },
  { id: "u2", name: "Maria Santos", email: "maria.santos@collabspace.io", avatar: "MS", role: "member", status: "online", title: "Product Manager", department: "Product", joinedAt: "2023-02-20" },
  { id: "u3", name: "James Wilson", email: "james.wilson@collabspace.io", avatar: "JW", role: "member", status: "away", title: "Senior Developer", department: "Engineering", joinedAt: "2023-03-10" },
  { id: "u4", name: "Priya Patel", email: "priya.patel@collabspace.io", avatar: "PP", role: "viewer", status: "busy", title: "Designer", department: "Design", joinedAt: "2023-04-05" },
  { id: "u5", name: "Tom Bradley", email: "tom.bradley@collabspace.io", avatar: "TB", role: "member", status: "offline", title: "QA Engineer", department: "QA", joinedAt: "2023-05-12" },
  { id: "u6", name: "Lisa Nguyen", email: "lisa.nguyen@collabspace.io", avatar: "LN", role: "member", status: "online", title: "Backend Developer", department: "Engineering", joinedAt: "2023-06-01" },
];

export const workspaces: Workspace[] = [
  { id: "ws1", name: "Acme Corp", slug: "acme-corp", description: "Main workspace for Acme Corp projects", memberCount: 12, projectCount: 4, createdAt: "2023-01-10", ownerId: "u1" },
  { id: "ws2", name: "Beta Labs", slug: "beta-labs", description: "R&D workspace for experimental projects", memberCount: 6, projectCount: 2, createdAt: "2023-03-20", ownerId: "u2" },
  { id: "ws3", name: "Gamma Team", slug: "gamma-team", description: "Design and marketing team workspace", memberCount: 8, projectCount: 3, createdAt: "2023-05-15", ownerId: "u4" },
];

export const projects: Project[] = [
  { id: "p1", workspaceId: "ws1", name: "Platform Redesign", description: "Complete redesign of the core platform", status: "active", createdAt: "2023-02-01", taskCount: 24 },
  { id: "p2", workspaceId: "ws1", name: "Mobile App", description: "Native mobile application development", status: "active", createdAt: "2023-03-15", taskCount: 18 },
  { id: "p3", workspaceId: "ws1", name: "API v2", description: "Next generation REST API", status: "active", createdAt: "2023-04-01", taskCount: 31 },
  { id: "p4", workspaceId: "ws1", name: "Legacy Migration", description: "Migrate from legacy systems", status: "archived", createdAt: "2022-11-01", taskCount: 12 },
  { id: "p5", workspaceId: "ws2", name: "AI Research", description: "Machine learning experiments", status: "active", createdAt: "2023-03-25", taskCount: 9 },
  { id: "p6", workspaceId: "ws2", name: "Data Pipeline", description: "ETL pipeline infrastructure", status: "active", createdAt: "2023-04-10", taskCount: 15 },
];

export const tasks: Task[] = [
  { id: "t1", projectId: "p1", workspaceId: "ws1", title: "Design new navigation component", description: "Create a responsive navigation component with collapsible sidebar support. Must support mobile breakpoints and keyboard navigation.", status: "DONE", priority: "high", assigneeId: "u4", creatorId: "u1", createdAt: "2024-01-10", dueDate: "2024-01-20", attachmentCount: 2, commentCount: 5 },
  { id: "t2", projectId: "p1", workspaceId: "ws1", title: "Implement authentication flow", description: "Build login, register, OTP verification, and password reset flows using JWT tokens.", status: "DONE", priority: "critical", assigneeId: "u3", creatorId: "u1", createdAt: "2024-01-12", dueDate: "2024-01-25", attachmentCount: 0, commentCount: 3 },
  { id: "t3", projectId: "p1", workspaceId: "ws1", title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing, linting, and deployment to staging and production environments.", status: "DOING", priority: "high", assigneeId: "u6", creatorId: "u2", createdAt: "2024-01-15", dueDate: "2024-02-01", attachmentCount: 1, commentCount: 2 },
  { id: "t4", projectId: "p1", workspaceId: "ws1", title: "Write API documentation", description: "Document all REST API endpoints using OpenAPI 3.0 specification.", status: "DOING", priority: "medium", assigneeId: "u3", creatorId: "u2", createdAt: "2024-01-18", dueDate: "2024-02-10", attachmentCount: 3, commentCount: 8 },
  { id: "t5", projectId: "p1", workspaceId: "ws1", title: "Performance audit", description: "Run Lighthouse audits and optimize Core Web Vitals scores.", status: "TODO", priority: "medium", assigneeId: null, creatorId: "u1", createdAt: "2024-01-20", dueDate: "2024-02-15", attachmentCount: 0, commentCount: 0 },
  { id: "t6", projectId: "p1", workspaceId: "ws1", title: "Accessibility improvements", description: "Ensure WCAG 2.1 AA compliance across all components.", status: "TODO", priority: "high", assigneeId: "u4", creatorId: "u2", createdAt: "2024-01-22", dueDate: "2024-02-20", attachmentCount: 0, commentCount: 1 },
  { id: "t7", projectId: "p1", workspaceId: "ws1", title: "Database schema migration", description: "Migrate existing schema to support multi-tenancy.", status: "TODO", priority: "critical", assigneeId: "u6", creatorId: "u1", createdAt: "2024-01-23", dueDate: "2024-03-01", attachmentCount: 2, commentCount: 4 },
  { id: "t8", projectId: "p2", workspaceId: "ws1", title: "Setup React Native project", description: "Initialize React Native project with Expo, configure build variants.", status: "DONE", priority: "high", assigneeId: "u3", creatorId: "u2", createdAt: "2024-01-05", dueDate: "2024-01-15", attachmentCount: 0, commentCount: 2 },
  { id: "t9", projectId: "p2", workspaceId: "ws1", title: "Push notification integration", description: "Integrate Firebase Cloud Messaging for iOS and Android.", status: "DOING", priority: "high", assigneeId: "u5", creatorId: "u2", createdAt: "2024-01-15", dueDate: "2024-02-05", attachmentCount: 1, commentCount: 3 },
  { id: "t10", projectId: "p2", workspaceId: "ws1", title: "Offline sync mechanism", description: "Implement offline-first data sync using SQLite and conflict resolution.", status: "TODO", priority: "medium", assigneeId: null, creatorId: "u1", createdAt: "2024-01-25", dueDate: "2024-03-10", attachmentCount: 0, commentCount: 0 },
];

export const comments: Comment[] = [
  { id: "c1", taskId: "t1", authorId: "u2", content: "Great work on the initial designs! The responsive behavior looks solid.", createdAt: "2024-01-11T09:30:00Z", deleted: false, parentId: null },
  { id: "c2", taskId: "t1", authorId: "u4", content: "Thanks! I'll update the mobile breakpoints based on feedback.", createdAt: "2024-01-11T10:15:00Z", deleted: false, parentId: "c1" },
  { id: "c3", taskId: "t1", authorId: "u1", content: "Can we also add keyboard navigation support per our a11y requirements?", createdAt: "2024-01-12T14:20:00Z", deleted: false, parentId: null },
  { id: "c4", taskId: "t1", authorId: "u4", content: "Absolutely, I'll add ARIA labels and keyboard handlers in the next iteration.", createdAt: "2024-01-12T15:00:00Z", deleted: false, parentId: "c3" },
  { id: "c5", taskId: "t1", authorId: "u3", content: "This comment was removed.", createdAt: "2024-01-13T08:00:00Z", deleted: true, parentId: null },
  { id: "c6", taskId: "t4", authorId: "u6", content: "I've started documenting the auth endpoints. Should I use Swagger UI or Redoc?", createdAt: "2024-01-19T11:00:00Z", deleted: false, parentId: null },
  { id: "c7", taskId: "t4", authorId: "u2", content: "Let's go with Redoc, the team prefers its layout.", createdAt: "2024-01-19T11:45:00Z", deleted: false, parentId: "c6" },
];

export const attachments: Attachment[] = [
  { id: "a1", taskId: "t1", filename: "navigation-mockup-v2.fig", size: 2450000, type: "application/figma", uploadedAt: "2024-01-10T10:00:00Z", uploadedById: "u4" },
  { id: "a2", taskId: "t1", filename: "responsive-specs.pdf", size: 890000, type: "application/pdf", uploadedAt: "2024-01-11T09:00:00Z", uploadedById: "u4" },
  { id: "a3", taskId: "t4", filename: "api-schema-draft.yaml", size: 45000, type: "text/yaml", uploadedAt: "2024-01-18T14:00:00Z", uploadedById: "u3" },
  { id: "a4", taskId: "t7", filename: "schema-migration-plan.md", size: 78000, type: "text/markdown", uploadedAt: "2024-01-23T16:00:00Z", uploadedById: "u6" },
  { id: "a5", taskId: "t7", filename: "erd-diagram.png", size: 1200000, type: "image/png", uploadedAt: "2024-01-23T16:30:00Z", uploadedById: "u6" },
];

export const notifications: Notification[] = [
  { id: "n1", userId: "u1", type: "task_assigned", title: "Task Assigned", body: "Maria Santos assigned you to 'Performance audit'", read: false, archived: false, createdAt: "2024-01-25T10:00:00Z", link: "/workspaces/ws1/projects/p1" },
  { id: "n2", userId: "u1", type: "comment_added", title: "New Comment", body: "Lisa Nguyen commented on 'Write API documentation'", read: false, archived: false, createdAt: "2024-01-25T09:30:00Z", link: "/workspaces/ws1/projects/p1" },
  { id: "n3", userId: "u1", type: "workspace_invited", title: "Workspace Invitation", body: "You've been invited to join 'Delta Corp' workspace", read: false, archived: false, createdAt: "2024-01-24T15:00:00Z", link: "/workspaces" },
  { id: "n4", userId: "u1", type: "system_alert", title: "System Alert", body: "Scheduled maintenance on Jan 28 from 2am-4am UTC", read: true, archived: false, createdAt: "2024-01-24T12:00:00Z", link: "/admin/health" },
  { id: "n5", userId: "u1", type: "task_assigned", title: "Task Assigned", body: "Alex Chen assigned you to 'Database schema migration'", read: true, archived: false, createdAt: "2024-01-23T11:00:00Z", link: "/workspaces/ws1/projects/p1" },
  { id: "n6", userId: "u1", type: "comment_added", title: "New Comment", body: "James Wilson replied to your comment on 'Design new navigation'", read: true, archived: true, createdAt: "2024-01-22T16:00:00Z", link: "/workspaces/ws1/projects/p1" },
];

export const sessions: Session[] = [
  { id: "s1", device: "MacBook Pro 16\"", browser: "Chrome 121", ip: "192.168.1.1", location: "San Francisco, US", lastActive: "2024-01-25T10:30:00Z", current: true },
  { id: "s2", device: "iPhone 15 Pro", browser: "Safari 17", ip: "192.168.1.2", location: "San Francisco, US", lastActive: "2024-01-24T20:15:00Z", current: false },
  { id: "s3", device: "Windows PC", browser: "Firefox 122", ip: "10.0.0.5", location: "New York, US", lastActive: "2024-01-23T09:00:00Z", current: false },
];

export const permissions: Permission[] = [
  { id: "perm1", name: "task.create", description: "Create new tasks" },
  { id: "perm2", name: "task.edit", description: "Edit existing tasks" },
  { id: "perm3", name: "task.delete", description: "Delete tasks" },
  { id: "perm4", name: "task.assign", description: "Assign tasks to users" },
  { id: "perm5", name: "project.create", description: "Create new projects" },
  { id: "perm6", name: "project.edit", description: "Edit project settings" },
  { id: "perm7", name: "project.delete", description: "Delete projects" },
  { id: "perm8", name: "member.invite", description: "Invite workspace members" },
  { id: "perm9", name: "member.remove", description: "Remove workspace members" },
  { id: "perm10", name: "role.manage", description: "Manage roles and permissions" },
  { id: "perm11", name: "workspace.settings", description: "Edit workspace settings" },
  { id: "perm12", name: "admin.access", description: "Access admin panel" },
];

export const rolePermissions: Record<Role, string[]> = {
  admin: ["perm1","perm2","perm3","perm4","perm5","perm6","perm7","perm8","perm9","perm10","perm11","perm12"],
  member: ["perm1","perm2","perm4","perm5"],
  viewer: [],
};

export const activityFeed = [
  { id: "act1", userId: "u3", action: "completed task", target: "Design new navigation component", time: "2024-01-25T10:00:00Z" },
  { id: "act2", userId: "u6", action: "commented on", target: "Write API documentation", time: "2024-01-25T09:30:00Z" },
  { id: "act3", userId: "u4", action: "uploaded attachment to", target: "Design new navigation component", time: "2024-01-25T09:00:00Z" },
  { id: "act4", userId: "u2", action: "created task", target: "Performance audit", time: "2024-01-24T16:00:00Z" },
  { id: "act5", userId: "u5", action: "moved task to DOING", target: "Push notification integration", time: "2024-01-24T14:30:00Z" },
  { id: "act6", userId: "u1", action: "invited", target: "Tom Bradley to Acme Corp workspace", time: "2024-01-23T11:00:00Z" },
];

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function getTasksByProject(projectId: string): Task[] {
  return tasks.filter(t => t.projectId === projectId);
}

export function getCommentsByTask(taskId: string): Comment[] {
  return comments.filter(c => c.taskId === taskId);
}

export function getAttachmentsByTask(taskId: string): Attachment[] {
  return attachments.filter(a => a.taskId === taskId);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
