import { apiRequest } from "./httpClient";
import {
  mapAdminAuthUser,
  mapAdminPermission,
  mapAdminRole,
  mapAdminUserAggregate,
  mapAdminWorkspace,
} from "./mappers";
import type { AdminAuthUser, AdminPermission, AdminRole, AdminUserAggregate, AdminWorkspace } from "./types";

export const adminApi = {
  // Auth admin
  async listRoles(): Promise<AdminRole[]> {
    const rows = await apiRequest<any[]>("/auth/admin/roles");
    return rows.map(mapAdminRole);
  },

  async listPermissions(): Promise<AdminPermission[]> {
    const rows = await apiRequest<any[]>("/auth/admin/permissions");
    return rows.map(mapAdminPermission);
  },

  async createRole(input: { name: string; description: string }): Promise<AdminRole> {
    return mapAdminRole(await apiRequest("/auth/admin/roles", { method: "POST", body: input }));
  },

  async updateRole(id: string, input: { name?: string; description?: string }): Promise<AdminRole> {
    return mapAdminRole(await apiRequest(`/auth/admin/roles/${id}`, { method: "PUT", body: input }));
  },

  async deleteRole(id: string): Promise<void> {
    await apiRequest(`/auth/admin/roles/${id}`, { method: "DELETE" });
  },

  async createPermission(input: { name: string; description: string }): Promise<AdminPermission> {
    return mapAdminPermission(await apiRequest("/auth/admin/permissions", { method: "POST", body: input }));
  },

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<AdminRole> {
    return mapAdminRole(
      await apiRequest(`/auth/admin/roles/${roleId}/permissions`, {
        method: "POST",
        body: { permissionId },
      }),
    );
  },

  async assignRoleToUser(userId: string, roleId: string): Promise<AdminAuthUser> {
    return mapAdminAuthUser(
      await apiRequest(`/auth/admin/users/${userId}/roles`, {
        method: "POST",
        body: { roleId },
      }),
    );
  },

  async listAuthUsers(): Promise<AdminAuthUser[]> {
    const rows = await apiRequest<any[]>("/auth/admin/users");
    return rows.map(mapAdminAuthUser);
  },

  async setUserActiveStatus(userId: string, isActive: boolean): Promise<AdminAuthUser> {
    return mapAdminAuthUser(
      await apiRequest(`/auth/admin/users/${userId}/active-status`, {
        method: "PATCH",
        body: { isActive },
      }),
    );
  },

  // User admin
  async listAllUsers(): Promise<AdminUserAggregate[]> {
    const rows = await apiRequest<any[]>("/users/admin/all");
    return rows.map(mapAdminUserAggregate);
  },

  async deleteUser(id: string): Promise<void> {
    await apiRequest(`/users/admin/${id}`, { method: "DELETE" });
  },

  // Workspace admin
  async listWorkspaces(): Promise<AdminWorkspace[]> {
    const rows = await apiRequest<any[]>("/workspaces/admin/all");
    return rows.map(mapAdminWorkspace);
  },

  async forceDeleteWorkspace(id: string): Promise<void> {
    await apiRequest(`/workspaces/admin/${id}`, { method: "DELETE" });
  },

  async forceJoinWorkspace(id: string, reason: string): Promise<void> {
    await apiRequest(`/workspaces/admin/${id}/force-join`, {
      method: "POST",
      body: { role: "admin", reason },
    });
  },

  // Notification admin
  async broadcast(input: { title: string; body: string }, idempotencyKey: string): Promise<{ id: string; status: string }> {
    return apiRequest("/notifications/admin/broadcast", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: { ...input, target: "all" },
    });
  },
};
