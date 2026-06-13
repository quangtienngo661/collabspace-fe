import { cn } from "../ui/utils";
import type { User } from "../../api/types";
import { PresenceDot } from "./StatusBadge";

const COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-indigo-500",
];

function colorForId(id: string) {
  const idx = id.charCodeAt(id.length - 1) % COLORS.length;
  return COLORS[idx];
}

interface UserAvatarProps {
  user: User;
  size?: "xs" | "sm" | "md" | "lg";
  showPresence?: boolean;
  className?: string;
}

const sizes = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function UserAvatar({ user, size = "md", showPresence = false, className }: UserAvatarProps) {
  const label = user.avatar || user.name.slice(0, 2).toUpperCase();

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className={cn("rounded-full object-cover", sizes[size])} />
      ) : (
        <span className={cn("rounded-full flex items-center justify-center font-semibold text-white", colorForId(user.id), sizes[size])}>
          {label}
        </span>
      )}
      {showPresence && (
        <PresenceDot status={user.status} className="absolute -bottom-0.5 -right-0.5" />
      )}
    </span>
  );
}

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarGroup({ users, max = 3, size = "sm" }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const rest = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map(u => (
        <span key={u.id} className={cn("rounded-full flex items-center justify-center font-semibold text-white border-2 border-white dark:border-slate-900", colorForId(u.id), sizes[size])}>
          {u.avatar || u.name.slice(0, 2).toUpperCase()}
        </span>
      ))}
      {rest > 0 && (
        <span className={cn("rounded-full flex items-center justify-center font-semibold bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 border-2 border-white dark:border-slate-900", sizes[size])}>
          +{rest}
        </span>
      )}
    </div>
  );
}
