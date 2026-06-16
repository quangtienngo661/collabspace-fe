export type Role = "admin" | "member" | "viewer";
export type WorkspaceRole = "owner" | "member";
export type UserStatus = "online" | "away" | "busy" | "offline";
export type ApiUserStatus = "online" | "away" | "dnd" | "offline";
export type TaskStatus = "TODO" | "DOING" | "DONE";
export type Priority = "low" | "medium" | "high" | "critical";
export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface AuthUser {
  email: string;
  emailVerified: boolean;
  isActive?: boolean;
  permissions: string[];
  role?: string | null;
  roles: string[];
  userId: string;
  workspaceId?: string | null;
}

export interface AuthSession {
  accessToken: string;
  email: string;
  expiresIn: string;
  refreshToken: string;
  role?: string;
  roles: string[];
  userId: string;
  workspaceId?: string | null;
}

export interface User {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatar: string;
  avatarUrl?: string | null;
  role: Role;
  roles?: string[];
  status: UserStatus;
  title?: string;
  department?: string;
  joinedAt: string;
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone?: string | null;
  locale?: string | null;
  emailVerified?: boolean;
}

export interface UserPreferences {
  dateFormat: string;
  desktopNotificationsEnabled: boolean;
  digestFrequency: string;
  emailNotificationsEnabled: boolean;
  language: string;
  pushNotificationsEnabled: boolean;
  theme: "system" | "light" | "dark" | string;
  timeFormat: string;
  timezone: string | null;
  weekStartsOn: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt?: string;
  ownerId: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  profile?: User;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt?: string;
  taskCount: number;
  createdBy?: string;
}

export interface TaskUser {
  userId: string;
  email?: string;
  fullName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface Task {
  id: string;
  projectId: string | null;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority | null;
  assigneeId: string | null;
  creatorId: string;
  createdBy?: TaskUser;
  assignedTo?: TaskUser | null;
  createdAt: string;
  updatedAt?: string;
  dueDate: string | null;
  labels?: string[];
  attachments: Attachment[];
  attachmentCount: number;
  commentCount: number;
}

export interface ActivityTimelineItem {
  id: string;
  actorId: string | null;
  actorName: string;
  actorAvatarUrl: string | null;
  type: string;
  summary: string;
  occurredAt: string;
  meta?: Record<string, unknown>;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  deleted: boolean;
  parentId: string | null;
  mentions?: string[];
  reactionCount?: number;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  fileUrl?: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedById?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
  link: string;
  targetId?: string;
  targetType?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  familyId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
  isActive: boolean;
}

export interface HealthResult {
  name: string;
  status: "healthy" | "down" | "unknown";
  message: string;
  latency: number | null;
  lastCheck: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
}

export interface AdminAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: string[];
}

export interface AdminUserAggregate extends AdminAuthUser {
  fullName?: string | null;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  slug?: string;
  description: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminBroadcastResult {
  id: string;
  status: string;
}
