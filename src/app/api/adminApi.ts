import { apiRequest } from "./httpClient";
import { usersApi } from "./usersApi";
import {
  mapAdminAuthUser,
  mapAdminPermission,
  mapAdminRole,
  mapAdminUserAggregate,
  mapAdminWorkspace,
} from "./mappers";
import type {
  AdminAuthUser,
  AdminBroadcastResult,
  AdminPlatformTaskStats,
  AdminPermission,
  AdminRole,
  AdminUserAggregate,
  AdminWorkspace,
} from "./types";

export const adminApi = {
  async listRoles(): Promise<AdminRole[]> {
    const rows = await apiRequest<any[]>("/auth/admin/roles");
    return rows.map(mapAdminRole);
  },

  async createRole(name: string, description = ""): Promise<AdminRole> {
    return mapAdminRole(await apiRequest("/auth/admin/roles", {
      method: "POST",
      body: { name, description },
    }));
  },

  async updateRole(id: string, input: { name?: string; description?: string }): Promise<AdminRole> {
    return mapAdminRole(await apiRequest(`/auth/admin/roles/${id}`, {
      method: "PUT",
      body: input,
    }));
  },

  async deleteRole(id: string): Promise<void> {
    await apiRequest(`/auth/admin/roles/${id}`, { method: "DELETE" });
  },

  async listPermissions(): Promise<AdminPermission[]> {
    const rows = await apiRequest<any[]>("/auth/admin/permissions");
    return rows.map(mapAdminPermission);
  },

  async createPermission(name: string, description: string): Promise<AdminPermission> {
    return mapAdminPermission(await apiRequest("/auth/admin/permissions", {
      method: "POST",
      body: { name, description },
    }));
  },

  async assignPermission(roleId: string, permissionId: string): Promise<AdminRole> {
    return mapAdminRole(
      await apiRequest(`/auth/admin/roles/${roleId}/permissions`, {
        method: "POST",
        body: { permissionId },
      }),
    );
  },

  async unassignPermission(roleId: string, permissionId: string): Promise<AdminRole> {
    return mapAdminRole(
      await apiRequest(`/auth/admin/roles/${roleId}/permissions/${permissionId}`, {
        method: "DELETE",
      }),
    );
  },

  async listAuthUsers(): Promise<AdminAuthUser[]> {
    const rows = await apiRequest<any[]>("/auth/admin/users");
    return rows.map(mapAdminAuthUser);
  },

  async setActiveStatus(userId: string, isActive: boolean): Promise<AdminAuthUser> {
    return mapAdminAuthUser(
      await apiRequest(`/auth/admin/users/${userId}/active-status`, {
        method: "PATCH",
        body: { isActive },
      }),
    );
  },

  async assignRole(userId: string, roleId: string): Promise<AdminAuthUser> {
    return mapAdminAuthUser(
      await apiRequest(`/auth/admin/users/${userId}/roles`, {
        method: "POST",
        body: { roleId },
      }),
    );
  },

  async listAllUsers(): Promise<AdminUserAggregate[]> {
    const rows = await apiRequest<any[]>("/users/admin/all");
    return rows.map(mapAdminUserAggregate);
  },

  async listMembershipCountsByUser(): Promise<Record<string, number>> {
    return apiRequest<Record<string, number>>("/workspaces/admin/membership-counts");
  },

  /** Merges auth-only fields (e.g. lastLoginAt) when missing from the aggregate DTO. */
  async listAllUsersEnriched(): Promise<AdminUserAggregate[]> {
    const [aggregateResult, authResult, countsResult] = await Promise.allSettled([
      adminApi.listAllUsers(),
      adminApi.listAuthUsers(),
      adminApi.listMembershipCountsByUser(),
    ]);

    const membershipCounts = countsResult.status === "fulfilled" ? countsResult.value : null;
    const authUsers = authResult.status === "fulfilled" ? authResult.value : [];
    const authById = new Map(authUsers.map(user => [user.id, user]));

    const attachWorkspaceCounts = (users: AdminUserAggregate[]) =>
      users.map(user => ({
        ...user,
        workspaceCount:
          membershipCounts !== null
            ? membershipCounts[user.id] ?? 0
            : user.workspaceCount,
      }));

    if (aggregateResult.status === "fulfilled") {
      return attachWorkspaceCounts(
        aggregateResult.value.map(user => {
          const auth = authById.get(user.id);
          if (!auth) return user;
          return {
            ...user,
            emailVerified: user.emailVerified ?? auth.emailVerified,
            isActive: user.isActive ?? auth.isActive,
            lastLoginAt: user.lastLoginAt ?? auth.lastLoginAt,
            roles: user.roles.length > 0 ? user.roles : auth.roles,
            createdAt: user.createdAt || auth.createdAt,
          };
        }),
      );
    }

    if (authUsers.length > 0) {
      const profiles = await usersApi.bulk(authUsers.map(user => user.id)).catch(() => []);
      const profileById = new Map(profiles.map(profile => [profile.id, profile]));
      return attachWorkspaceCounts(
        authUsers.map(auth => {
          const profile = profileById.get(auth.id);
          return {
            ...auth,
            fullName: profile?.name ?? null,
            displayName: profile?.displayName ?? null,
            username: profile?.username ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            bio: profile?.bio ?? null,
          };
        }),
      );
    }

    throw aggregateResult.status === "rejected"
      ? aggregateResult.reason
      : authResult.status === "rejected"
        ? authResult.reason
        : new Error("Unable to load user accounts");
  },

  async deleteUser(id: string): Promise<void> {
    await apiRequest(`/users/admin/${id}`, { method: "DELETE" });
  },

  async listAllWorkspaces(): Promise<AdminWorkspace[]> {
    const [rows, taskCounts] = await Promise.all([
      apiRequest<any[]>("/workspaces/admin/all"),
      apiRequest<Record<string, number>>("/tasks/admin/workspace-counts").catch(() => ({})),
    ]);
    return rows.map((row) => {
      const workspace = mapAdminWorkspace(row);
      return {
        ...workspace,
        taskCount: taskCounts[workspace.id] ?? workspace.taskCount ?? 0,
      };
    });
  },

  async deleteWorkspace(id: string): Promise<void> {
    await apiRequest(`/workspaces/admin/${id}`, { method: "DELETE" });
  },

  async getPlatformTaskStats(): Promise<AdminPlatformTaskStats> {
    return apiRequest<AdminPlatformTaskStats>("/tasks/admin/platform-stats").catch(() => ({
      total: 0,
      byStatus: { TODO: 0, DOING: 0, DONE: 0 },
    }));
  },

  async broadcast(title: string, message: string): Promise<AdminBroadcastResult> {
    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return apiRequest<AdminBroadcastResult>("/notifications/admin/broadcast", {
      method: "POST",
      body: { title, body: message, target: "all" },
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },
};
