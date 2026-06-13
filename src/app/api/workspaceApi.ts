import { apiRequest } from "./httpClient";
import { mapProject, mapWorkspace, mapWorkspaceMember } from "./mappers";
import type { Project, Workspace, WorkspaceMember } from "./types";

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

  async invitations(id: string): Promise<{ id: string; email: string; status: string; createdAt: string }[]> {
    const rows = await apiRequest<any[]>(`/workspaces/${id}/invitations`);
    return rows.map(row => ({
      id: row.id,
      email: row.invitee_email,
      status: row.status,
      createdAt: row.created_at,
    }));
  },

  async invite(id: string, email: string) {
    return apiRequest(`/workspaces/${id}/invite`, {
      method: "POST",
      body: { email },
    });
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
