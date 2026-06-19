import type { AdminUserAggregate } from "../../../api/types";

export function isPlatformAdminUser(user: AdminUserAggregate): boolean {
  return user.roles?.some(role => role.toLowerCase() === "admin") ?? false;
}

/** End-user accounts only — excludes platform admin operator accounts from metrics. */
export function platformMemberUsers(users: AdminUserAggregate[] | null | undefined): AdminUserAggregate[] {
  return (users ?? []).filter(user => !isPlatformAdminUser(user));
}

/** Platform role assignable via admin UI — promote to admin is server/CLI only. */
export function isAssignablePlatformRole(roleName: string): boolean {
  return roleName.toLowerCase() === "user";
}
