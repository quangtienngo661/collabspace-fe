const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Home",
  workspaces: "Workspaces",
  projects: "Projects",
  tasks: "Tasks",
  notifications: "Notifications",
  profile: "Profile",
  users: "Users",
  invitations: "Invitations",
  admin: "Admin",
  roles: "Roles & Permissions",
  broadcast: "Broadcast",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export interface BreadcrumbSegment {
  label: string;
  path: string | null;
}

export function buildBreadcrumbSegments(
  pathname: string,
  resolveName: (id: string, segmentIndex: number, segments: string[]) => string | null,
): BreadcrumbSegment[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return [{ label: "Home", path: "/dashboard" }];
  }

  const result: BreadcrumbSegment[] = [];
  let cumulative = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    cumulative += `/${part}`;
    const isLast = i === parts.length - 1;

    let label = ROUTE_LABELS[part] ?? part.charAt(0).toUpperCase() + part.slice(1);
    if (isUuid(part)) {
      label = resolveName(part, i, parts) ?? `${part.slice(0, 8)}…`;
    }

    result.push({
      label,
      path: isLast ? null : cumulative,
    });
  }

  return result;
}
