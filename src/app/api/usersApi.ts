import { apiRequest } from "./httpClient";
import { mapPreferences, mapUserProfile, mapUserSummary, uiStatusToApi } from "./mappers";
import type { AuthUser, User, UserPreferences, UserStatus } from "./types";

export const usersApi = {
  async me(authUser?: Partial<AuthUser>): Promise<User> {
    return mapUserProfile(await apiRequest("/users/me"), authUser);
  },

  async updateMe(input: {
    fullName?: string;
    displayName?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    bio?: string | null;
    location?: string | null;
    timezone?: string | null;
  }): Promise<User> {
    return mapUserProfile(await apiRequest("/users/me", { method: "PATCH", body: input }));
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("file", file);

    const result = await apiRequest("/users/me/avatar", {
      method: "POST",
      body: formData,
    });
    return mapUserProfile(result);
  },

  async preferences(): Promise<UserPreferences> {
    return mapPreferences(await apiRequest("/users/me/preferences"));
  },

  async updatePreferences(input: Partial<UserPreferences>): Promise<UserPreferences> {
    return mapPreferences(await apiRequest("/users/me/preferences", { method: "PATCH", body: input }));
  },

  async updateStatus(status: UserStatus): Promise<void> {
    await apiRequest("/users/me/status", {
      method: "PATCH",
      body: { status: uiStatusToApi(status), lastSeenAt: new Date().toISOString() },
    });
  },

  async list(params: { q?: string; limit?: number; offset?: number } = {}): Promise<{ items: User[]; total: number }> {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    search.set("limit", String(params.limit ?? 100));
    search.set("offset", String(params.offset ?? 0));
    const result = await apiRequest<{ items: any[]; total: number }>(`/users?${search}`);
    return { items: (result.items ?? []).map(mapUserSummary), total: result.total ?? 0 };
  },

  async bulk(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];
    const rows = await apiRequest<any[]>("/users/bulk", {
      method: "POST",
      body: { userIds },
    });
    return rows.map(mapUserProfile);
  },
};
