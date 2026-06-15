import { apiRequest } from "./httpClient";
import { mapActivityItem, mapAttachment, mapComment, mapTask } from "./mappers";
import type { ActivityItem, Comment, Task, TaskStatus } from "./types";

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

  async updateDetails(taskId: string, input: { title: string; description?: string; priority?: string; dueDate?: string | null; labels?: string[] }): Promise<void> {
    await apiRequest(`/tasks/${taskId}/details`, {
      method: "PATCH",
      body: {
        title: input.title,
        description: input.description ?? "",
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.labels ? { labels: input.labels } : {}),
      },
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

  async listComments(taskId: string, params: { skip?: number; limit?: number } = {}): Promise<{ comments: Comment[]; total: number }> {
    const search = new URLSearchParams();
    search.set("skip", String(params.skip ?? 0));
    search.set("limit", String(params.limit ?? 50));
    const result = await apiRequest<{ comments?: any[]; total?: number }>(`/tasks/${taskId}/comments?${search}`);
    return {
      comments: (result.comments ?? []).map(mapComment),
      total: result.total ?? 0,
    };
  },

  async createComment(taskId: string, input: { content: string; parentId?: string | null }): Promise<Comment> {
    const result = await apiRequest<any>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: { content: input.content, parentId: input.parentId ?? undefined },
    });
    return mapComment(result.comment ?? result);
  },

  async updateComment(taskId: string, commentId: string, content: string): Promise<Comment> {
    const result = await apiRequest<any>(`/tasks/${taskId}/comments/${commentId}`, {
      method: "PATCH",
      body: { content },
    });
    return mapComment(result.comment ?? result);
  },

  async deleteComment(taskId: string, commentId: string): Promise<void> {
    await apiRequest(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
  },

  async activity(taskId: string, params: { limit?: number; offset?: number } = {}): Promise<{ items: ActivityItem[]; total: number }> {
    const search = new URLSearchParams();
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    if (params.offset !== undefined) search.set("offset", String(params.offset));
    const query = search.toString();
    const result = await apiRequest<{ items?: any[]; total?: number }>(`/tasks/${taskId}/activity${query ? `?${query}` : ""}`);
    return {
      items: (result.items ?? []).map(mapActivityItem),
      total: result.total ?? 0,
    };
  },
};
