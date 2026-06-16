import { useMemo } from "react";
import { workspaceApi } from "../api/workspaceApi";
import { useAsyncData } from "./useAsyncData";
import type { WorkspaceRole } from "../api/types";

/**
 * Returns the current user's workspace role, or null while loading / not a member.
 * Reuses the members API response (cached by workspaceApi.members).
 */
export function useCurrentWorkspaceRole(
  workspaceId: string | null | undefined,
  userId: string | null | undefined,
): WorkspaceRole | null {
  const membersState = useAsyncData(
    () => (workspaceId ? workspaceApi.members(workspaceId) : Promise.resolve([])),
    [workspaceId],
    { enabled: Boolean(workspaceId && userId) },
  );

  return useMemo(() => {
    if (!userId || !membersState.data) return null;
    return membersState.data.find((m) => m.userId === userId)?.role ?? null;
  }, [membersState.data, userId]);
}
