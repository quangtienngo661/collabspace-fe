import type {
  ApiUserStatus,
  Attachment,
  AuthUser,
  Comment,
  HealthResult,
  Notification,
  Priority,
  Project,
  Role,
  Session,
  Task,
  TaskStatus,
  User,
  UserPreferences,
  UserStatus,
  Workspace,
  WorkspaceMember,
} from "./types";

type AnyRecord = Record<string, any>;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "U";
}

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function apiStatusToUi(status?: string | null): UserStatus {
  const normalized = (status || "offline") as ApiUserStatus;
  if (normalized === "dnd") return "busy";
  if (normalized === "online" || normalized === "away" || normalized === "offline") return normalized;
  return "offline";
}

export function uiStatusToApi(status: UserStatus): ApiUserStatus {
  return status === "busy" ? "dnd" : status;
}

export function mapAuthUser(raw: AnyRecord): AuthUser {
  return {
    email: raw.email ?? "",
    emailVerified: Boolean(raw.emailVerified),
    isActive: raw.isActive,
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    role: raw.role ?? raw.roles?.[0] ?? null,
    roles: Array.isArray(raw.roles) ? raw.roles : raw.role ? [raw.role] : [],
    userId: raw.userId ?? raw.id ?? "",
    workspaceId: raw.workspaceId ?? null,
  };
}

export function mapUserProfile(raw: AnyRecord, auth?: Partial<AuthUser>): User {
  const fullName = raw.fullName ?? raw.displayName ?? "Current User";
  const role = ((auth?.role ?? auth?.roles?.[0] ?? "member") as Role) || "member";
  return {
    id: raw.userId ?? raw.id ?? auth?.userId ?? "",
    userId: raw.userId ?? raw.id ?? auth?.userId ?? "",
    name: raw.displayName || fullName,
    email: auth?.email,
    avatar: initials(raw.displayName || fullName),
    avatarUrl: raw.avatarUrl ?? null,
    role,
    roles: auth?.roles,
    status: apiStatusToUi(raw.status),
    title: raw.jobTitle ?? "",
    department: raw.department ?? "",
    joinedAt: raw.createdAt ?? "",
    displayName: raw.displayName ?? null,
    username: raw.username ?? null,
    bio: raw.bio ?? null,
    location: raw.location ?? null,
    timezone: raw.timezone ?? null,
    locale: raw.locale ?? null,
    emailVerified: raw.emailVerified ?? auth?.emailVerified,
  };
}

export function mapUserSummary(raw: AnyRecord): User {
  const fullName = raw.fullName ?? raw.displayName ?? "Unknown User";
  return {
    id: raw.userId ?? raw.id ?? "",
    userId: raw.userId ?? raw.id ?? "",
    name: raw.displayName || fullName,
    avatar: initials(raw.displayName || fullName),
    avatarUrl: raw.avatarUrl ?? null,
    role: "member",
    status: apiStatusToUi(raw.status),
    title: raw.jobTitle ?? "",
    department: raw.department ?? "",
    joinedAt: raw.createdAt ?? "",
    displayName: raw.displayName ?? null,
    username: raw.username ?? null,
  };
}

export function mapPreferences(raw: AnyRecord): UserPreferences {
  return {
    dateFormat: raw.dateFormat ?? "YYYY-MM-DD",
    desktopNotificationsEnabled: raw.desktopNotificationsEnabled ?? true,
    digestFrequency: raw.digestFrequency ?? "daily",
    emailNotificationsEnabled: raw.emailNotificationsEnabled ?? true,
    language: raw.language ?? "en",
    pushNotificationsEnabled: raw.pushNotificationsEnabled ?? true,
    theme: raw.theme ?? "system",
    timeFormat: raw.timeFormat ?? "24h",
    timezone: raw.timezone ?? null,
    weekStartsOn: raw.weekStartsOn ?? "monday",
  };
}

export function mapWorkspace(raw: AnyRecord): Workspace {
  const name = raw.name ?? "Untitled Workspace";
  return {
    id: raw.id,
    name,
    slug: raw.slug ?? slugify(name),
    description: raw.description ?? "",
    memberCount: raw.memberCount ?? raw.members?.length ?? 0,
    projectCount: raw.projectCount ?? raw.projects?.length ?? 0,
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at,
    ownerId: raw.ownerId ?? raw.owner_id ?? "",
  };
}

export function mapWorkspaceMember(raw: AnyRecord, profile?: User): WorkspaceMember {
  return {
    id: raw.id ?? `${raw.workspace_id ?? raw.workspaceId}-${raw.user_id ?? raw.userId}`,
    workspaceId: raw.workspaceId ?? raw.workspace_id ?? "",
    userId: raw.userId ?? raw.user_id ?? "",
    role: raw.role ?? "member",
    joinedAt: raw.joinedAt ?? raw.joined_at ?? "",
    profile,
  };
}

export function mapProject(raw: AnyRecord, workspaceId?: string): Project {
  return {
    id: raw.id,
    workspaceId: raw.workspaceId ?? raw.workspace_id ?? workspaceId ?? "",
    name: raw.name ?? "Untitled Project",
    description: raw.description ?? "",
    status: raw.is_deleted ? "archived" : raw.status ?? "active",
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    updatedAt: raw.updatedAt ?? raw.updated_at,
    taskCount: raw.taskCount ?? 0,
    createdBy: raw.createdBy ?? raw.created_by,
  };
}

export function normalizeTaskPriority(value?: string | null): Priority | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "critical") return "high";
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return null;
}

export function mapAttachment(raw: string | AnyRecord, taskId: string): Attachment {
  if (typeof raw === "string") {
    const filename = raw.split("/").pop() || "Attachment";
    return {
      id: raw,
      taskId,
      filename,
      fileUrl: raw,
      size: 0,
      type: "application/octet-stream",
      uploadedAt: "",
    };
  }

  return {
    id: raw.id ?? raw.fileUrl ?? raw.url ?? crypto.randomUUID(),
    taskId,
    filename: raw.fileName ?? raw.filename ?? raw.name ?? "Attachment",
    fileUrl: raw.fileUrl ?? raw.url,
    size: raw.fileSize ?? raw.size ?? 0,
    type: raw.mimeType ?? raw.type ?? "application/octet-stream",
    uploadedAt: raw.uploadedAt ?? new Date().toISOString(),
    uploadedById: raw.uploadedBy ?? raw.uploadedById,
  };
}

export function mapTask(raw: AnyRecord): Task {
  const status = String(raw.status ?? "TODO").toUpperCase() as TaskStatus;
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map((attachment: string | AnyRecord) => mapAttachment(attachment, raw.id))
    : [];

  return {
    id: raw.id,
    projectId: raw.projectId ?? null,
    workspaceId: raw.workspaceId,
    title: raw.title ?? "Untitled Task",
    description: raw.description ?? "",
    status,
    priority: normalizeTaskPriority(raw.priority),
    assigneeId: raw.assigneeId ?? null,
    creatorId: raw.createdBy?.userId ?? raw.creatorId ?? "",
    createdBy: raw.createdBy,
    assignedTo: raw.assignedTo ?? null,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt,
    dueDate: raw.dueDate ?? null,
    attachments,
    attachmentCount: raw.attachmentCount ?? attachments.length,
    commentCount: raw.commentCount ?? 0,
  };
}

export function mapComment(raw: AnyRecord): Comment {
  return {
    id: raw.id,
    taskId: raw.taskId,
    authorId: raw.authorId,
    authorName: raw.authorName,
    authorAvatarUrl: raw.authorAvatarUrl,
    content: raw.content ?? "",
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt,
    deleted: Boolean(raw.isDeleted ?? raw.deleted),
    parentId: raw.parentId ?? null,
    mentions: raw.mentions ?? [],
    reactionCount: raw.reactionCount ?? 0,
  };
}

export function mapNotification(raw: AnyRecord): Notification {
  const status = String(raw.status ?? "").toUpperCase();
  const targetType = String(raw.targetType ?? "").toLowerCase();
  const targetId = raw.targetId;
  const link =
    targetType === "task" && targetId
      ? `/workspaces/${raw.metadata?.workspaceId ?? ""}/projects/${raw.metadata?.projectId ?? ""}`
      : targetType === "workspace" && targetId
        ? `/workspaces/${targetId}`
        : "/notifications";

  return {
    id: raw.id,
    userId: raw.recipientId ?? raw.userId ?? "",
    type: String(raw.type ?? "SYSTEM_ALERT").toLowerCase(),
    title: raw.title ?? "Notification",
    body: raw.message ?? raw.body ?? "",
    read: status === "READ",
    archived: status === "ARCHIVED",
    createdAt: raw.createdAt ?? "",
    link,
  };
}

export function mapSession(raw: AnyRecord, currentRefreshToken?: string): Session {
  const active = raw.isActive ?? !raw.revokedAt;
  return {
    id: raw.tokenId ?? raw.id ?? raw.familyId,
    familyId: raw.familyId ?? raw.id,
    device: "Refresh token session",
    browser: raw.workspaceId ? `Workspace ${raw.workspaceId}` : "Browser",
    ip: "N/A",
    location: "N/A",
    lastActive: raw.lastUsedAt ?? raw.expiresAt ?? "",
    current: Boolean(currentRefreshToken && raw.tokenId && currentRefreshToken.includes(raw.tokenId)),
    isActive: Boolean(active),
  };
}

export function mapHealth(name: string, startedAt: number, raw: AnyRecord): HealthResult {
  return {
    name,
    status: raw?.status === "ok" ? "healthy" : "unknown",
    message: raw?.status === "ok" ? "Service responded" : "Unknown response",
    latency: Date.now() - startedAt,
    lastCheck: new Date().toISOString(),
  };
}
