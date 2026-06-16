const STORAGE_KEY = "collabspace:activeWorkspaceId";

export function readStoredActiveWorkspaceId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredActiveWorkspaceId(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
