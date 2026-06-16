import { ApiError } from "./httpClient";

const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  AUTH_ADMIN_API_UNAVAILABLE: "User aggregate API is unavailable. Showing auth accounts only — fix user-service → auth-service on the backend.",
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

export function formatApiError(error: unknown, fallback = "Request failed"): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Cannot reach the API. Check VITE_API_PROXY_TARGET (e.g. https://collabspace.ngocanh2005it.site or http://167.172.77.110) and restart npm run dev.";
    }
    if (error.status === 503) {
      return "Backend service unavailable (503). On the server (167.172.77.110), run docker compose ps and check user-service / auth-service logs.";
    }
    if (error.status === 502 || error.status === 504) {
      return `Gateway error (${error.status}). The API proxy could not reach a backend service.`;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
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
    return formatApiError(error, fallback);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
