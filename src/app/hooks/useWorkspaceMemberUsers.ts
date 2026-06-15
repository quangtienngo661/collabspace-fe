import { usersApi } from "../api/usersApi";
import { workspaceApi } from "../api/workspaceApi";
import { useAsyncData } from "./useAsyncData";
import type { User } from "../api/types";

/** Workspace members resolved to user profiles — fetched only when enabled. */
export function useWorkspaceMemberUsers(workspaceId: string | null | undefined, enabled = true) {
  return useAsyncData<User[]>(async () => {
    if (!workspaceId) return [];
    const members = await workspaceApi.members(workspaceId);
    const ids = members.map(member => member.userId).filter(Boolean);
    if (ids.length === 0) return [];
    return usersApi.bulk(ids);
  }, [workspaceId], { enabled: enabled && Boolean(workspaceId) });
}
