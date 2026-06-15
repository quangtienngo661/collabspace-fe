import type { AuthSession } from "./types";

const STORAGE_KEY = "collabspace.session";

export function getStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession, options?: { emit?: boolean }): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  if (options?.emit !== false) {
    window.dispatchEvent(new Event("collabspace:session-changed"));
  }
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("collabspace:session-changed"));
}
