import { apiRequest } from "./httpClient";
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

  /** Merges auth-only fields (e.g. lastLoginAt) when missing from the aggregate DTO. */
  async listAllUsersEnriched(): Promise<AdminUserAggregate[]> {
    const [aggregates, authUsers] = await Promise.all([
      adminApi.listAllUsers(),
      adminApi.listAuthUsers(),
    ]);
    const authById = new Map(authUsers.map(user => [user.id, user]));
    return aggregates.map(user => {
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
    });
  },

  async deleteUser(id: string): Promise<void> {
    await apiRequest(`/users/admin/${id}`, { method: "DELETE" });
  },

  async listAllWorkspaces(): Promise<AdminWorkspace[]> {
    const rows = await apiRequest<any[]>("/workspaces/admin/all");
    return rows.map(mapAdminWorkspace);
  },

  async deleteWorkspace(id: string): Promise<void> {
    await apiRequest(`/workspaces/admin/${id}`, { method: "DELETE" });
  },

  async forceJoin(id: string, role: string, reason: string): Promise<void> {
    await apiRequest(`/workspaces/admin/${id}/force-join`, {
      method: "POST",
      body: { role, reason },
    });
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
