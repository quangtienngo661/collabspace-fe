import { ApiError } from "./httpClient";

const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  PLATFORM_ADMIN_REQUIRED: "Platform admin access required. Sign in with an admin account.",
  IDEMPOTENCY_KEY_REQUIRED: "Broadcast requires an Idempotency-Key header.",
  ROLE_IN_USE: "This role cannot be deleted while it is protected or assigned to users.",
  ROLE_PERMISSION_NOT_FOUND: "This permission is not assigned to the selected role.",
  PERMISSION_ALREADY_EXISTS: "A permission with this name already exists.",
  DIRECTORY_QUERY_REQUIRED: "User directory search requires a query parameter.",
  BROADCAST_ALREADY_ENQUEUED: "A broadcast with this idempotency key was already submitted.",
};

export function getApiErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const data = payload as Record<string, unknown>;
  if (typeof data.code === "string") return data.code;
  if (typeof data.error === "string" && data.error in ADMIN_ERROR_MESSAGES) return data.error;
  return undefined;
}

export function formatAdminApiError(error: unknown, fallback = "Admin request failed"): string {
  if (error instanceof ApiError) {
    const code = getApiErrorCode(error.payload);
    if (code && ADMIN_ERROR_MESSAGES[code]) {
      return ADMIN_ERROR_MESSAGES[code];
    }
    if (code) {
      return `${error.message} (${code})`;
    }
    if (error.status === 403) {
      return "Access denied — platform admin privileges required.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
