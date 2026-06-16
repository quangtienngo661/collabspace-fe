import { apiRequest } from "./httpClient";
import { idempotencyHeaders } from "./idempotency";
import { mapActivityTimelineItem, mapProject, mapWorkspace, mapWorkspaceMember } from "./mappers";
import { cachedRequest, invalidateCachedRequestPrefix } from "./requestCache";
import type { ActivityTimelineItem, Project, Workspace, WorkspaceMember } from "./types";

export const workspaceApi = {
  async list(): Promise<Workspace[]> {
    return cachedRequest("workspaces:list", async () => {
      const rows = await apiRequest<unknown>("/workspaces");
      const list = Array.isArray(rows) ? rows : (rows as { items?: unknown[] })?.items ?? [];
      return list.map(row => mapWorkspace(row as Record<string, unknown>));
    });
  },

  async create(input: { name: string; description?: string }): Promise<Workspace> {
    const workspace = mapWorkspace(await apiRequest("/workspaces", {
      method: "POST",
      body: input,
      headers: idempotencyHeaders(),
    }));
    invalidateCachedRequestPrefix("workspaces:");
    return workspace;
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/workspaces/${id}`, { method: "DELETE" });
    invalidateCachedRequestPrefix("workspaces:");
  },

  async get(id: string): Promise<Workspace> {
    return cachedRequest(`workspaces:get:${id}`, async () => mapWorkspace(await apiRequest(`/workspaces/${id}`)));
  },

  async update(id: string, input: { name?: string; description?: string }): Promise<Workspace> {
    return mapWorkspace(await apiRequest(`/workspaces/${id}`, { method: "PATCH", body: input }));
  },

  async members(id: string): Promise<WorkspaceMember[]> {
    if (!id) return [];
    return cachedRequest(`workspaces:members:${id}`, async () => {
      const rows = await apiRequest<any[]>(`/workspaces/${id}/members`);
      return rows.map(row => mapWorkspaceMember(row));
    });
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await apiRequest(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
    invalidateCachedRequestPrefix(`workspaces:members:${workspaceId}`);
    invalidateCachedRequestPrefix("workspaces:list");
  },

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    input: { role: "manager" | "member" },
  ): Promise<void> {
    await apiRequest(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      body: input,
    });
    invalidateCachedRequestPrefix(`workspaces:members:${workspaceId}`);
    invalidateCachedRequestPrefix("workspaces:list");
  },

  async listMyInvitations(): Promise<
    { id: string; workspaceId: string; workspaceName: string | null; inviteeEmail: string; createdAt: string; expiresAt: string }[]
  > {
    const rows = await apiRequest<any[]>("/invitations/me");
    return rows.map(row => ({
      id: row.id,
      workspaceId: row.workspaceId ?? row.workspace_id,
      workspaceName: row.workspaceName ?? row.workspace_name ?? null,
      inviteeEmail: row.inviteeEmail ?? row.invitee_email ?? row.email,
      createdAt: row.createdAt ?? row.created_at,
      expiresAt: row.expiresAt ?? row.expires_at,
    }));
  },

  async invitations(id: string): Promise<{ id: string; email: string; status: string; createdAt: string }[]> {
    const rows = await apiRequest<any[]>(`/workspaces/${id}/invitations`);
    return rows.map(row => ({
      id: row.id,
      email: row.invitee_email ?? row.inviteeEmail ?? row.email,
      status: row.status,
      createdAt: row.created_at ?? row.createdAt,
    }));
  },

  async invite(id: string, email: string) {
    return apiRequest(`/workspaces/${id}/invite`, {
      method: "POST",
      body: { email },
      headers: idempotencyHeaders(),
    });
  },

  async acceptInvitation(invitationId: string): Promise<{ status: string; workspaceId: string }> {
    return apiRequest(`/invitations/${invitationId}/accept`, {
      method: "POST",
    });
  },

  async rejectInvitation(invitationId: string) {
    return apiRequest(`/invitations/${invitationId}/reject`, {
      method: "POST",
    });
  },

  async listProjects(workspaceId: string): Promise<Project[]> {
    return cachedRequest(`workspaces:projects:${workspaceId}`, async () => {
      const rows = await apiRequest<any[]>(`/workspaces/${workspaceId}/projects`);
      return rows.map(row => mapProject(row, workspaceId));
    });
  },

  async createProject(workspaceId: string, input: { name: string; description?: string }): Promise<Project> {
    return mapProject(await apiRequest(`/workspaces/${workspaceId}/projects`, { method: "POST", body: input }), workspaceId);
  },

  async updateProject(workspaceId: string, projectId: string, input: { name?: string; description?: string }): Promise<Project> {
    return mapProject(await apiRequest(`/workspaces/${workspaceId}/projects/${projectId}`, { method: "PATCH", body: input }), workspaceId);
  },

  async deleteProject(workspaceId: string, projectId: string): Promise<void> {
    await apiRequest(`/workspaces/${workspaceId}/projects/${projectId}`, { method: "DELETE" });
  },

  async getActivity(
    workspaceId: string,
    offset = 0,
    limit = 20,
  ): Promise<{ items: ActivityTimelineItem[]; total: number }> {
    const res = await apiRequest<any>(`/workspaces/${workspaceId}/activity?offset=${offset}&limit=${limit}`);
    if (Array.isArray(res)) {
      return { items: res.map(mapActivityTimelineItem), total: res.length };
    }
    const items = (res?.items ?? []).map(mapActivityTimelineItem);
    return { items, total: res?.total ?? items.length };
  },
};
