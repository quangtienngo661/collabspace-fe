import { useMemo } from "react";
import { workspaceApi } from "../api/workspaceApi";
import { useAsyncData } from "./useAsyncData";
import type { WorkspaceMember, WorkspaceRole } from "../api/types";

type WorkspaceRoleFlags = {
  isOwner: boolean;
  isManager: boolean;
  canManageProjects: boolean;
  currentRole: WorkspaceRole | null;
  members: WorkspaceMember[];
  loading: boolean;
};

/**
 * Resolves workspace role flags consistently across workspace pages.
 * Owner is detected via workspace.ownerId OR membership role "owner".
 */
export function useWorkspaceRoleFlags(
  workspaceId: string | null | undefined,
  userId: string | null | undefined,
  ownerId?: string | null,
): WorkspaceRoleFlags {
  const membersState = useAsyncData(
    () => (workspaceId ? workspaceApi.members(workspaceId) : Promise.resolve([])),
    [workspaceId],
    { enabled: Boolean(workspaceId && userId) },
  );

  const members = membersState.data ?? [];

  const currentRole = useMemo(() => {
    if (!userId || !membersState.data) return null;
    return membersState.data.find((member) => member.userId === userId)?.role ?? null;
  }, [membersState.data, userId]);

  const isOwner = useMemo(() => {
    if (!userId) return false;
    if (ownerId === userId) return true;
    return members.some((member) => member.userId === userId && member.role === "owner");
  }, [members, ownerId, userId]);

  const isManager = useMemo(() => {
    if (!userId || isOwner) return false;
    if (ownerId === userId) return false;
    return members.some((member) => member.userId === userId && member.role === "manager");
  }, [isOwner, members, ownerId, userId]);

  return {
    isOwner,
    isManager,
    canManageProjects: isOwner || isManager,
    currentRole,
    members,
    loading: membersState.loading,
  };
}
