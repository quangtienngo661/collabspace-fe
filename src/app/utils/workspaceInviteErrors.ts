import { ApiError } from "../api/httpClient";
import { getApiErrorCode } from "../api/adminErrors";

const INVITE_ERROR_MESSAGES: Record<string, string> = {
  INVITE_ALREADY_PENDING: "An invitation is already pending for this email address.",
  INVITE_ALREADY_MEMBER: "This person is already a member of this workspace.",
  INVITE_PLATFORM_ADMIN: "Platform admin accounts cannot be invited to a workspace.",
  INVITE_EMAIL_REQUIRED: "Email is required.",
};

function extractApiErrorDetails(payload: unknown): { code?: string; message?: string } {
  if (!payload || typeof payload !== "object") return {};
  const data = payload as Record<string, unknown>;

  if (typeof data.code === "string") {
    return {
      code: data.code,
      message: typeof data.message === "string" ? data.message : undefined,
    };
  }

  const nested = data.message;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const obj = nested as Record<string, unknown>;
    return {
      code: typeof obj.code === "string" ? obj.code : undefined,
      message: typeof obj.message === "string" ? obj.message : undefined,
    };
  }

  if (typeof data.message === "string") {
    return { message: data.message };
  }

  return {};
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function formatInviteError(error: unknown, fallback = "Unable to send invitation"): string {
  if (error instanceof ApiError) {
    const { code, message } = extractApiErrorDetails(error.payload);
    if (code && INVITE_ERROR_MESSAGES[code]) {
      return INVITE_ERROR_MESSAGES[code];
    }
    const genericCode = getApiErrorCode(error.payload);
    if (genericCode && INVITE_ERROR_MESSAGES[genericCode]) {
      return INVITE_ERROR_MESSAGES[genericCode];
    }
    return message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function findLocalInviteConflict(
  email: string,
  members: { userId: string; profile?: { email?: string } | null }[],
  invitations: { email: string; status?: string }[],
): string | null {
  const normalized = normalizeInviteEmail(email);
  if (!normalized) return INVITE_ERROR_MESSAGES.INVITE_EMAIL_REQUIRED;

  const pending = invitations.some(
    inv => (inv.status ?? "pending") === "pending" && normalizeInviteEmail(inv.email) === normalized,
  );
  if (pending) return INVITE_ERROR_MESSAGES.INVITE_ALREADY_PENDING;

  const alreadyMember = members.some(
    member => member.profile?.email && normalizeInviteEmail(member.profile.email) === normalized,
  );
  if (alreadyMember) return INVITE_ERROR_MESSAGES.INVITE_ALREADY_MEMBER;

  return null;
}
