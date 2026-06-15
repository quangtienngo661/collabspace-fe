import { ApiError, apiRequest } from "./httpClient";
import { mapNotification } from "./mappers";
import { cachedRequest, invalidateCachedRequestPrefix } from "./requestCache";
import type { Notification } from "./types";

export class NotificationsUnavailableError extends Error {
  constructor() {
    super("Notifications service is not available");
    this.name = "NotificationsUnavailableError";
  }
}

export function formatNotificationsError(error: unknown, fallback = "Unable to load notifications"): string {
  if (error instanceof NotificationsUnavailableError) {
    return "Notifications service is not available. Try again later.";
  }
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sign in to view notifications.";
    if (error.status === 403) return "You do not have access to notifications.";
    if (error.status >= 500) return "Notifications service is temporarily unavailable.";
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
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
    const query = search.toString();
    const cacheKey = `notifications:list:${query || "default"}`;

    return cachedRequest(cacheKey, async () => {
      const result = await available(apiRequest<{ notifications: any[]; total: number; unreadCount: number }>(`/notifications?${search}`));
      return {
        notifications: (result.notifications ?? []).map(mapNotification),
        total: result.total ?? 0,
        unreadCount: result.unreadCount ?? 0,
      };
    });
  },

  async markRead(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
    invalidateCachedRequestPrefix("notifications:");
  },

  async markAllRead(): Promise<void> {
    await apiRequest("/notifications/read-all", { method: "PATCH" });
    invalidateCachedRequestPrefix("notifications:");
  },
};
