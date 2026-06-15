import { apiRequest } from "./httpClient";
import { mapActivityItem, mapProject, mapWorkspace, mapWorkspaceMember } from "./mappers";
import type { ActivityItem, Project, Workspace, WorkspaceInvitation, WorkspaceMember } from "./types";

type AnyRecord = Record<string, unknown>;

function mapInvitation(raw: AnyRecord): WorkspaceInvitation {
  return {
    id: raw.id,
    workspaceId: raw.workspaceId ?? raw.workspace_id ?? "",
    email: raw.inviteeEmail ?? raw.invitee_email ?? raw.email ?? "",
    status: raw.status ?? "pending",
    createdAt: raw.createdAt ?? raw.created_at ?? "",
  };
}

export const workspaceApi = {
  async list(): Promise<Workspace[]> {
    const rows = await apiRequest<any[]>("/workspaces");
    return rows.map(mapWorkspace);
  },

  async create(input: { name: string; description?: string }): Promise<Workspace> {
    return mapWorkspace(await apiRequest("/workspaces", { method: "POST", body: input }));
  },

  async get(id: string): Promise<Workspace> {
    return mapWorkspace(await apiRequest(`/workspaces/${id}`));
  },

  async update(id: string, input: { name?: string; description?: string }): Promise<Workspace> {
    return mapWorkspace(await apiRequest(`/workspaces/${id}`, { method: "PATCH", body: input }));
  },

  async members(id: string): Promise<WorkspaceMember[]> {
    const rows = await apiRequest<any[]>(`/workspaces/${id}/members`);
    return rows.map(row => mapWorkspaceMember(row));
  },

  async invitations(id: string): Promise<WorkspaceInvitation[]> {
    const rows = await apiRequest<any[]>(`/workspaces/${id}/invitations`);
    return rows.map(mapInvitation);
  },

  async invite(id: string, email: string) {
    return apiRequest(`/workspaces/${id}/invite`, {
      method: "POST",
      body: { email },
    });
  },

  async acceptInvitation(invitationId: string): Promise<{ workspaceId: string; status: string }> {
    return apiRequest(`/invitations/${invitationId}/accept`, { method: "POST" });
  },

  async rejectInvitation(invitationId: string): Promise<void> {
    await apiRequest(`/invitations/${invitationId}/reject`, { method: "POST" });
  },

  async activity(workspaceId: string, params: { limit?: number; offset?: number } = {}): Promise<{ items: ActivityItem[]; total: number }> {
    const search = new URLSearchParams();
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    if (params.offset !== undefined) search.set("offset", String(params.offset));
    const query = search.toString();
    const result = await apiRequest<{ items?: any[]; total?: number }>(`/workspaces/${workspaceId}/activity${query ? `?${query}` : ""}`);
    return {
      items: (result.items ?? []).map(mapActivityItem),
      total: result.total ?? 0,
    };
  },

  async listProjects(workspaceId: string): Promise<Project[]> {
    const rows = await apiRequest<any[]>(`/workspaces/${workspaceId}/projects`);
    return rows.map(row => mapProject(row, workspaceId));
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
};
