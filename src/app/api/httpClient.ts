import { clearStoredSession, getStoredSession, setStoredSession } from "./session";
import type { AuthSession } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

const DEFAULT_BASE_URL = "/api/v1";

/** Same-origin `/api/v1` in dev is proxied by Vite (see `VITE_API_PROXY_TARGET`). Avoid absolute API URLs in dev — Traefik forward-auth blocks CORS preflight on protected routes. */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || DEFAULT_BASE_URL;

if (import.meta.env.DEV && /^https?:\/\//i.test(API_BASE_URL)) {
  console.warn(
    "[collabspace] VITE_API_BASE_URL is cross-origin. Use VITE_API_BASE_URL=/api/v1 and VITE_API_PROXY_TARGET instead to avoid CORS and spurious logouts.",
  );
}

let refreshPromise: Promise<AuthSession> | null = null;

function buildUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function isBodyInit(body: unknown): body is BodyInit {
  return body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams;
}

function unwrapResponse<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (data.message && Array.isArray(data.message)) return data.message.join(", ");
  }
  return fallback;
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return text.length ? text : null;
}

function logoutAfterRefreshFailure(): void {
  clearStoredSession();
  window.dispatchEvent(new Event("collabspace:session-expired"));
}

async function refreshSession(): Promise<AuthSession> {
  if (!refreshPromise) {
    const session = getStoredSession();

    if (!session?.refreshToken) {
      logoutAfterRefreshFailure();
      throw new ApiError(401, "Session expired");
    }

    refreshPromise = fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async response => {
        const payload = await parsePayload(response);
        if (!response.ok) {
          throw new ApiError(response.status, errorMessage(payload, "Unable to refresh session"), payload);
        }
        const nextSession = unwrapResponse<AuthSession>(payload);
        setStoredSession({
          ...nextSession,
          familyId: nextSession.familyId ?? session.familyId,
        });
        return {
          ...nextSession,
          familyId: nextSession.familyId ?? session.familyId,
        };
      })
      .catch(error => {
        // Network/CORS errors must not wipe session — only explicit auth rejection.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          logoutAfterRefreshFailure();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, retryOnUnauthorized = true, body, headers, ...init } = options;
  const session = getStoredSession();
  const requestHeaders = new Headers(headers);

  if (auth && session?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    if (isBodyInit(body)) {
      requestBody = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers: requestHeaders,
      body: requestBody,
    });
  } catch (error) {
    throw new ApiError(
      0,
      error instanceof Error ? error.message : "Network request failed",
      error,
    );
  }

  const payload = await parsePayload(response);

  if (response.status === 401 && auth && retryOnUnauthorized) {
    await refreshSession();
    // FormData body cannot be replayed after the first fetch attempt.
    if (body instanceof FormData) {
      throw new ApiError(401, "Session refreshed — retry the upload");
    }
    return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
  }

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(payload, response.statusText), payload);
  }

  return unwrapResponse<T>(payload);
}
