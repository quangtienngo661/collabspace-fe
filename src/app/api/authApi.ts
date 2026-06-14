import { apiRequest } from "./httpClient";
import type { AuthSession, AuthUser, Session } from "./types";
import { mapAuthUser, mapSession } from "./mappers";
import { getStoredSession } from "./session";

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    return apiRequest<AuthSession>("/auth/login", {
      auth: false,
      method: "POST",
      body: { email, password },
    });
  },

  async register(input: { fullName: string; email: string; password: string }) {
    return apiRequest<{ userId: string; email: string; otpExpiresInSeconds: number }>("/auth/register", {
      auth: false,
      method: "POST",
      body: input,
    });
  },

  async verifyEmail(userId: string, otp: string) {
    return apiRequest("/auth/verify-email", {
      auth: false,
      method: "POST",
      body: { userId, otp },
    });
  },

  async resendVerificationOtp(email: string) {
    return apiRequest("/auth/resend-verification-otp", {
      auth: false,
      method: "POST",
      body: { email },
    });
  },

  async forgotPassword(email: string) {
    return apiRequest("/auth/forgot-password", {
      auth: false,
      method: "POST",
      body: { email },
    });
  },

  async resetPassword(token: string, newPassword: string) {
    return apiRequest("/auth/reset-password", {
      auth: false,
      method: "POST",
      body: { token, newPassword },
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },

  async me(): Promise<AuthUser> {
    return mapAuthUser(await apiRequest("/auth/me"));
  },

  async sessions(): Promise<Session[]> {
    const session = getStoredSession();
    const rows = await apiRequest<any[]>("/auth/sessions");
    return rows.map(row => mapSession(row, session?.refreshToken));
  },

  async revokeSession(familyId: string) {
    return apiRequest(`/auth/sessions/${familyId}`, { method: "DELETE" });
  },

  async logout(refreshToken: string) {
    return apiRequest("/auth/logout", {
      auth: false,
      method: "POST",
      body: { refreshToken },
    });
  },

  async logoutAll() {
    return apiRequest("/auth/logout-all", { method: "POST" });
  },

  async logoutOthers(refreshToken: string) {
    return apiRequest("/auth/logout-others", {
      method: "POST",
      body: { refreshToken },
    });
  },
};
