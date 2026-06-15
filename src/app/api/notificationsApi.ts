import { ApiError, apiRequest } from "./httpClient";
import { mapNotification } from "./mappers";
import type { Notification } from "./types";

export class NotificationsUnavailableError extends Error {
  constructor() {
    super("Notifications API is unavailable");
    this.name = "NotificationsUnavailableError";
  }
}

async function available<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new NotificationsUnavailableError();
    }
    throw error;
  }
}

export const notificationsApi = {
  async list(params?: { skip?: number; limit?: number }): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const search = new URLSearchParams();
    if (params?.skip !== undefined) search.set("skip", params.skip.toString());
    if (params?.limit !== undefined) search.set("limit", params.limit.toString());

    const result = await available(apiRequest<{ notifications: any[]; total: number; unreadCount: number }>(`/notifications?${search}`));
    return {
      notifications: (result.notifications ?? []).map(mapNotification),
      total: result.total ?? 0,
      unreadCount: result.unreadCount ?? 0,
    };
  },

  async markRead(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllRead(): Promise<void> {
    await apiRequest("/notifications/read-all", { method: "PATCH" });
  },
};
