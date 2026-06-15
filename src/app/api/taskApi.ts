import { apiRequest } from "./httpClient";
import { mapActivityTimelineItem, mapAttachment, mapComment, mapTask } from "./mappers";
import type { ActivityTimelineItem, Attachment, Comment, Task, TaskStatus } from "./types";

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

  async create(input: {
    title: string;
    description?: string;
    workspaceId: string;
    projectId?: string | null;
    priority?: string;
    dueDate?: string | null;
    labels?: string[];
  }): Promise<{ taskId: string }> {
    return apiRequest("/tasks", {
      method: "POST",
      body: input,
    });
  },

  async getBoard(params: { workspaceId: string; projectId?: string }): Promise<Task[]> {
    const search = new URLSearchParams({ workspaceId: params.workspaceId });
    if (params.projectId) search.set("projectId", params.projectId);
    const result = await apiRequest<{ columns?: { status: string; tasks: any[] }[]; total?: number }>(
      `/tasks/board?${search}`,
    );
    return (result.columns ?? []).flatMap(column => (column.tasks ?? []).map(mapTask));
  },

  async delete(taskId: string): Promise<void> {
    await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
  },

  async updateDetails(
    taskId: string,
    input: {
      title: string;
      description?: string;
      priority?: string | null;
      dueDate?: string | null;
      labels?: string[];
    },
  ): Promise<void> {
    await apiRequest(`/tasks/${taskId}/details`, {
      method: "PATCH",
      body: {
        title: input.title,
        description: input.description ?? "",
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.labels !== undefined ? { labels: input.labels } : {}),
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
      body: { assigneeId: assigneeId === "" ? null : assigneeId },
    });
  },

  async uploadAttachment(taskId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    await apiRequest(`/tasks/${taskId}/attachments`, {
      method: "POST",
      body: formData,
    });
  },

  async deleteAttachment(taskId: string, fileUrl: string): Promise<void> {
    const search = new URLSearchParams({ fileUrl });
    await apiRequest(`/tasks/${taskId}/attachments?${search}`, { method: "DELETE" });
  },

  async listComments(taskId: string): Promise<Comment[]> {
    const result = await apiRequest<{ comments: any[]; total: number; skip: number; limit: number } | any[]>(`/tasks/${taskId}/comments`);
    const rows = Array.isArray(result) ? result : (result as any).comments ?? [];
    return rows.map(mapComment);
  },

  async createComment(taskId: string, input: { content: string; parentId?: string | null }): Promise<Comment> {
    const result = await apiRequest<any>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: { content: input.content, parentId: input.parentId ?? undefined },
    });
    return mapComment(result);
  },

  async updateComment(taskId: string, commentId: string, input: { content: string }): Promise<Comment> {
    return mapComment(await apiRequest(`/tasks/${taskId}/comments/${commentId}`, {
      method: "PATCH",
      body: input,
    }));
  },

  async deleteComment(taskId: string, commentId: string): Promise<void> {
    await apiRequest(`/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  async getActivity(
    taskId: string,
    offset = 0,
    limit = 20,
  ): Promise<{ items: ActivityTimelineItem[]; total: number }> {
    const res = await apiRequest<any>(`/tasks/${taskId}/activity?offset=${offset}&limit=${limit}`);
    if (Array.isArray(res)) {
      return { items: res.map(mapActivityTimelineItem), total: res.length };
    }
    const items = (res?.items ?? []).map(mapActivityTimelineItem);
    return { items, total: res?.total ?? items.length };
  },
};
