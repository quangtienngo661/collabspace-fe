import { cn } from "../ui/utils";
import { normalizeTaskPriority } from "../../api/mappers";
import type { TaskStatus, Priority, Role, UserStatus, WorkspaceRole } from "../../api/types";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const map: Record<TaskStatus, { label: string; cls: string }> = {
    TODO: { label: "Todo", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    DOING: { label: "In Progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    DONE: { label: "Done", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", cls, className)}>
      {label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority | null;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const map: Record<Priority, { label: string; cls: string; dot: string }> = {
    low: { label: "Low", cls: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400" },
    medium: { label: "Medium", cls: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400" },
    high: { label: "High", cls: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
    critical: { label: "Critical", cls: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  };
  const normalized = normalizeTaskPriority(priority);
  if (!normalized) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-slate-400", className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        N/A
      </span>
    );
  }
  const { label, cls, dot } = map[normalized];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", cls, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

interface RoleBadgeProps {
  role: Role | WorkspaceRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const map: Record<string, { label: string; cls: string }> = {
    owner: { label: "Owner", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    manager: { label: "Manager", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    admin: { label: "Admin", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
    user: { label: "User", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    member: { label: "Member", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    viewer: { label: "User", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  };
  const badge = map[role] || { label: role || "User", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  const { label, cls } = badge;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", cls, className)}>
      {label}
    </span>
  );
}

interface PresenceDotProps {
  status: UserStatus;
  className?: string;
}

export function PresenceDot({ status, className }: PresenceDotProps) {
  const cls: Record<UserStatus, string> = {
    online: "bg-green-500",
    away: "bg-amber-400",
    busy: "bg-red-500",
    offline: "bg-slate-400",
  };
  return <span className={cn("w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900", cls[status], className)} />;
}
