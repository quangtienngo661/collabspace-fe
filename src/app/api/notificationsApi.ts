import { ApiError, apiRequest, buildApiUrl, refreshSession } from "./httpClient";
import { mapNotification } from "./mappers";
import { cachedRequest, invalidateCachedRequestPrefix } from "./requestCache";
import { getStoredSession } from "./session";
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

export interface NotificationStreamPayload {
  type: "connected" | "notification.created";
  notificationId?: string;
  unreadCount?: number;
}

type NotificationStreamEvent = {
  event: string;
  payload: NotificationStreamPayload | null;
};

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

function parseSseChunk(
  chunk: string,
): NotificationStreamEvent | null {
  const lines = chunk.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) return null;

  const rawData = dataLines.join("\n");
  try {
    return {
      event,
      payload: JSON.parse(rawData) as NotificationStreamPayload,
    };
  } catch {
    return {
      event,
      payload: null,
    };
  }
}

async function openStream(
  signal: AbortSignal,
  retryOnUnauthorized: boolean,
  onEvent: (event: NotificationStreamEvent) => void,
): Promise<void> {
  const session = getStoredSession();
  const headers = new Headers({
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
  });

  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(buildApiUrl("/notifications/stream"), {
    headers,
    method: "GET",
    signal,
  });

  if (response.status === 401 && retryOnUnauthorized) {
    await refreshSession();
    return openStream(signal, false, onEvent);
  }

  if (response.status === 404) {
    throw new NotificationsUnavailableError();
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Unable to open notifications stream (${response.status})`);
  }

  if (!response.body) {
    throw new Error("Notifications stream is unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const parsed = parseSseChunk(frame);
        if (parsed) {
          onEvent(parsed);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const notificationsApi = {
  async list(params?: { skip?: number; limit?: number; status?: "active" | "archived" }): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const search = new URLSearchParams();
    if (params?.skip !== undefined) search.set("skip", params.skip.toString());
    if (params?.limit !== undefined) search.set("limit", params.limit.toString());
    if (params?.status) search.set("status", params.status);
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

  async archive(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}/archive`, { method: "PATCH" });
    invalidateCachedRequestPrefix("notifications:");
  },

  async stream(
    signal: AbortSignal,
    onEvent: (event: NotificationStreamEvent) => void,
  ): Promise<void> {
    await openStream(signal, true, onEvent);
  },
};
