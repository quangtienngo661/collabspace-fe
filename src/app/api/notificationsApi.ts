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
  async list(): Promise<Notification[]> {
    const result = await available(apiRequest<{ notifications?: any[] } | any[]>("/notifications"));
    const rows = Array.isArray(result) ? result : result.notifications ?? [];
    return rows.map(mapNotification);
  },
};
