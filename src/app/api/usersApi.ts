import { apiRequest, ApiError } from "./httpClient";
import { apiStatusToUi, mapPreferences, mapUserProfile, mapUserSummary, uiStatusToApi } from "./mappers";
import { cachedRequest, invalidateCachedRequestPrefix } from "./requestCache";
import type { AuthUser, User, UserPreferences, UserStatus } from "./types";

async function fetchPresenceMap(userIds: string[]): Promise<Record<string, UserStatus>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return {};
  const search = new URLSearchParams({ userIds: unique.join(",") });
  const rows = await apiRequest<{ userId: string; status: string }[]>(`/users/presence?${search}`);
  const out: Record<string, UserStatus> = {};
  for (const row of rows) {
    out[row.userId] = apiStatusToUi(row.status);
  }
  return out;
}

export const usersApi = {
  async me(authUser?: Partial<AuthUser>): Promise<User> {
    return cachedRequest("users:me", async () => mapUserProfile(await apiRequest("/users/me"), authUser));
  },

  async updateMe(input: {
    fullName?: string;
    displayName?: string | null;
    username?: string | null;
    bio?: string | null;
  }): Promise<User> {
    return mapUserProfile(await apiRequest("/users/me", { method: "PATCH", body: input }));
  },

  async uploadAvatar(file: File): Promise<User> {
    async function send(retryOnUnauthorized: boolean) {
      const formData = new FormData();
      formData.append("file", file);
      return mapUserProfile(
        await apiRequest("/users/me/avatar", {
          method: "POST",
          body: formData,
          retryOnUnauthorized,
        }),
      );
    }

    try {
      const user = await send(true);
      invalidateCachedRequestPrefix("users:");
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const user = await send(false);
        invalidateCachedRequestPrefix("users:");
        return user;
      }
      throw error;
    }
  },

  async preferences(): Promise<UserPreferences> {
    return cachedRequest("users:preferences", async () => mapPreferences(await apiRequest("/users/me/preferences")));
  },

  async updatePreferences(input: Partial<UserPreferences>): Promise<UserPreferences> {
    return mapPreferences(await apiRequest("/users/me/preferences", { method: "PATCH", body: input }));
  },

  async updateStatus(status: UserStatus): Promise<void> {
    await apiRequest("/users/me/status", {
      method: "PATCH",
      body: { status: uiStatusToApi(status), lastSeenAt: new Date().toISOString() },
    });
    invalidateCachedRequestPrefix("users:");
  },

  /** Mark the current session as online (login / app resume). */
  async declareOnline(): Promise<void> {
    await this.updateStatus("online");
  },

  /** Mark offline before ending the session (logout). */
  async declareOffline(): Promise<void> {
    await apiRequest("/users/me/status", {
      method: "PATCH",
      body: { status: "offline", lastSeenAt: new Date().toISOString() },
    });
    invalidateCachedRequestPrefix("users:");
  },

  async status(userId: string): Promise<UserStatus> {
    const map = await fetchPresenceMap([userId]);
    return map[userId] ?? "offline";
  },

  async presenceBulk(userIds: string[]): Promise<Record<string, UserStatus>> {
    return fetchPresenceMap(userIds);
  },

  async get(id: string): Promise<User> {
    return mapUserProfile(await apiRequest(`/users/${id}`));
  },

  async getSummary(id: string): Promise<User> {
    return mapUserSummary(await apiRequest(`/users/${id}/summary`));
  },

  async list(params: { q?: string; limit?: number; offset?: number } = {}): Promise<{ items: User[]; total: number }> {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    search.set("limit", String(params.limit ?? 100));
    search.set("offset", String(params.offset ?? 0));
    const result = await apiRequest<{ items: any[]; total: number }>(`/users?${search}`);
    return { items: (result.items ?? []).map(mapUserSummary), total: result.total ?? 0 };
  },

  async search(q: string, limit = 10): Promise<{ items: User[]; total: number }> {
    const search = new URLSearchParams({ q, limit: String(limit), offset: "0" });
    const result = await apiRequest<{ items: any[]; total: number }>(`/users/search?${search}`);
    return { items: (result.items ?? []).map(mapUserSummary), total: result.total ?? 0 };
  },

  async bulk(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];
    const key = `users:bulk:${[...userIds].sort().join(",")}`;
    const rows = await cachedRequest(key, async () => apiRequest<any[]>("/users/bulk", {
      method: "POST",
      body: { userIds },
    }));
    return rows.map(mapUserProfile);
  },
};
