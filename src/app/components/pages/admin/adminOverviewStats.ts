import type { AdminUserAggregate, AdminWorkspace } from "../../../api/types";

export function sumWorkspaceMetric(
  workspaces: AdminWorkspace[] | null | undefined,
  key: "memberCount" | "projectCount" | "taskCount",
): number {
  return (workspaces ?? []).reduce((sum, workspace) => sum + (workspace[key] ?? 0), 0);
}

export function averageMembersPerWorkspace(workspaces: AdminWorkspace[] | null | undefined): number {
  const list = workspaces ?? [];
  if (list.length === 0) return 0;
  return Math.round((sumWorkspaceMetric(list, "memberCount") / list.length) * 10) / 10;
}

export function usersWithoutWorkspace(users: AdminUserAggregate[]): number {
  return users.filter(user => (user.workspaceCount ?? 0) === 0).length;
}

export function usersActiveWithinDays(users: AdminUserAggregate[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return users.filter(user => {
    if (!user.lastLoginAt) return false;
    const time = new Date(user.lastLoginAt).getTime();
    return !Number.isNaN(time) && time >= cutoff;
  }).length;
}
