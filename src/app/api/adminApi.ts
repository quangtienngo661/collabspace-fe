import { apiRequest } from "./httpClient";

export const adminApi = {
  // Roles & Permissions
  async listRoles() {
    return apiRequest<any[]>("/auth/admin/roles");
  },
  async createRole(name: string, description?: string) {
    return apiRequest("/auth/admin/roles", {
      method: "POST",
      body: { name, description },
    });
  },
  async updateRole(id: string, input: { name?: string; description?: string }) {
    return apiRequest(`/auth/admin/roles/${id}`, {
      method: "PUT",
      body: input,
    });
  },
  async deleteRole(id: string) {
    return apiRequest(`/auth/admin/roles/${id}`, {
      method: "DELETE",
    });
  },
  async listPermissions() {
    return apiRequest<any[]>("/auth/admin/permissions");
  },
  async assignPermission(roleId: string, permissionId: string) {
    return apiRequest(`/auth/admin/roles/${roleId}/permissions`, {
      method: "POST",
      body: { permissionId },
    });
  },

  // Users Management
  async listAuthUsers() {
    return apiRequest<any[]>("/auth/admin/users");
  },
  async setActiveStatus(userId: string, isActive: boolean) {
    return apiRequest(`/auth/admin/users/${userId}/active-status`, {
      method: "PATCH",
      body: { isActive },
    });
  },
  async assignRole(userId: string, roleId: string) {
    return apiRequest(`/auth/admin/users/${userId}/roles`, {
      method: "POST",
      body: { roleId },
    });
  },
  async listAllUsers() {
    return apiRequest<any[]>("/users/admin/all");
  },
  async deleteUser(id: string) {
    return apiRequest(`/users/admin/${id}`, {
      method: "DELETE",
    });
  },

  // Workspace Management
  async listAllWorkspaces() {
    return apiRequest<any[]>("/workspaces/admin/all");
  },
  async deleteWorkspace(id: string) {
    return apiRequest(`/workspaces/admin/${id}`, {
      method: "DELETE",
    });
  },
  async forceJoin(id: string, role: string, reason: string) {
    return apiRequest(`/workspaces/admin/${id}/force-join`, {
      method: "POST",
      body: { role, reason },
    });
  },

  // Broadcast Notification
  async broadcast(title: string, message: string) {
    const uuid = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "broadcast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    return apiRequest<any>("/notifications/admin/broadcast", {
      method: "POST",
      body: { title, body: message, target: "all" },
      headers: { "Idempotency-Key": uuid },
    });
  },
};
