import {
  AlertTriangle,
  FolderOpen,
  LayoutDashboard,
  Send,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  icon: LucideIcon;
  to: string;
  end?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/admin", end: true },
  { label: "Roles & Permissions", icon: ShieldCheck, to: "/admin/roles" },
  { label: "User Accounts", icon: Users, to: "/admin/users" },
  { label: "Workspaces", icon: FolderOpen, to: "/admin/workspaces" },
  { label: "Broadcast", icon: Send, to: "/admin/broadcast" },
  { label: "Dead Letter Queue", icon: AlertTriangle, to: "/admin/dlq" },
];

export const ADMIN_TAB_REDIRECTS: Record<string, string> = {
  roles: "/admin/roles",
  users: "/admin/users",
  workspaces: "/admin/workspaces",
  broadcast: "/admin/broadcast",
  dlq: "/admin/dlq",
};

export const ADMIN_PAGE_META: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Platform Overview",
    description: "Live metrics and charts for users and workspaces on this server.",
  },
  "/admin/roles": {
    title: "Roles & Permissions",
    description: "Configure RBAC permission mappings. System-level roles are protected.",
  },
  "/admin/users": {
    title: "User Accounts",
    description: "Manage global login credentials, platform roles, and ban status.",
  },
  "/admin/workspaces": {
    title: "Workspaces",
    description: "View platform workspaces and perform force-deletions when required.",
  },
  "/admin/broadcast": {
    title: "System Broadcast",
    description: "Dispatch real-time notifications to every account on this server.",
  },
  "/admin/dlq": {
    title: "Dead Letter Queue",
    description: "Inspect and replay failed Kafka events. Requires dlq.read permission.",
  },
};

export function getAdminPageMeta(pathname: string) {
  return ADMIN_PAGE_META[pathname] ?? ADMIN_PAGE_META["/admin"];
}
