import { usersApi } from "../api/usersApi";
import { workspaceApi } from "../api/workspaceApi";
import type { User } from "../api/types";
import { useAsyncData } from "./useAsyncData";

export function useWorkspaceMemberUsers(workspaceId: string | undefined) {
  return useAsyncData<User[]>(async () => {
    if (!workspaceId) return [];
    const members = await workspaceApi.members(workspaceId);
    const ids = members.map(member => member.userId).filter(Boolean);
    if (ids.length === 0) return [];
    return usersApi.bulk(ids);
  }, [workspaceId]);
}
