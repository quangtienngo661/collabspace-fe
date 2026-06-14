import { apiRequest } from "./httpClient";
import { mapAttachment, mapComment, mapTask } from "./mappers";
import type { Attachment, Comment, Task, TaskStatus } from "./types";

export const taskApi = {
  async list(params: { workspaceId: string; projectId?: string; status?: string; assigneeId?: string }): Promise<{ tasks: Task[]; total: number }> {
    const search = new URLSearchParams({ workspaceId: params.workspaceId });
    if (params.projectId) search.set("projectId", params.projectId);
    if (params.status && params.status !== "all") search.set("status", params.status);
    if (params.assigneeId && params.assigneeId !== "all") search.set("assigneeId", params.assigneeId);
    const result = await apiRequest<{ tasks: any[]; total: number }>(`/tasks?${search}`);
    return {
      tasks: (result.tasks ?? []).map(mapTask),
      total: result.total ?? 0,
    };
  },

  async get(id: string): Promise<Task> {
    return mapTask(await apiRequest(`/tasks/${id}`));
  },

  async create(input: { title: string; description?: string; workspaceId: string; projectId?: string | null; priority?: string }): Promise<{ taskId: string }> {
    return apiRequest("/tasks", {
      method: "POST",
      body: input,
    });
  },

  async updateDetails(taskId: string, input: { title: string; description?: string }): Promise<void> {
    await apiRequest(`/tasks/${taskId}/details`, {
      method: "PATCH",
      body: { title: input.title, description: input.description ?? "" },
    });
  },

  async updateStatus(taskId: string, status: TaskStatus): Promise<void> {
    await apiRequest(`/tasks/${taskId}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async assign(taskId: string, assigneeId: string | null): Promise<void> {
    await apiRequest(`/tasks/${taskId}/assignee`, {
      method: "PATCH",
      body: { assigneeId: assigneeId ?? undefined },
    });
  },

};
