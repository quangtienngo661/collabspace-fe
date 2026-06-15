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
  async list(params: { skip?: number; limit?: number } = {}): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const search = new URLSearchParams();
    search.set("skip", String(params.skip ?? 0));
    search.set("limit", String(params.limit ?? 50));
    const result = await available(apiRequest<{ notifications?: any[]; total?: number; unreadCount?: number } | any[]>(`/notifications?${search}`));
    if (Array.isArray(result)) {
      const notifications = result.map(mapNotification);
      return {
        notifications,
        total: notifications.length,
        unreadCount: notifications.filter(n => !n.read && !n.archived).length,
      };
    }
    const notifications = (result.notifications ?? []).map(mapNotification);
    return {
      notifications,
      total: result.total ?? notifications.length,
      unreadCount: result.unreadCount ?? notifications.filter(n => !n.read && !n.archived).length,
    };
  },

  async markRead(id: string): Promise<void> {
    await available(apiRequest(`/notifications/${id}/read`, { method: "PATCH" }));
  },

  async markAllRead(): Promise<void> {
    await available(apiRequest("/notifications/read-all", { method: "PATCH" }));
  },
};
