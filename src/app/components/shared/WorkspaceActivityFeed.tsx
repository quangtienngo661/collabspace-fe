import { UserAvatar } from "./UserAvatar";
import { initials } from "../../api/mappers";
import { timeAgo } from "../../utils/format";
import type { ActivityTimelineItem } from "../../api/types";

interface WorkspaceActivityFeedProps {
  items: ActivityTimelineItem[];
  loading?: boolean;
  emptyMessage?: string;
  onItemClick?: (item: ActivityTimelineItem) => void;
  className?: string;
}

export function WorkspaceActivityFeed({
  items,
  loading,
  emptyMessage = "No activity yet",
  onItemClick,
  className,
}: WorkspaceActivityFeedProps) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-400">Loading activity...</p>;
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div className={className ?? "space-y-3"}>
      {items.map(act => {
        const taskId =
          typeof act.meta?.taskId === "string"
            ? act.meta.taskId
            : typeof act.meta?.targetId === "string"
              ? act.meta.targetId
              : null;
        const clickable = Boolean(onItemClick && taskId);

        return (
          <div
            key={act.id}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onItemClick?.(act) : undefined}
            onKeyDown={
              clickable
                ? e => {
                    if (e.key === "Enter" || e.key === " ") onItemClick?.(act);
                  }
                : undefined
            }
            className={
              clickable
                ? "flex items-start gap-2.5 rounded-md px-1 py-1 -mx-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                : "flex items-start gap-2.5"
            }
          >
            <UserAvatar
              user={{
                id: act.actorId ?? act.id,
                userId: act.actorId ?? act.id,
                name: act.actorName,
                email: "",
                avatar: initials(act.actorName),
                avatarUrl: act.actorAvatarUrl,
                role: "member",
                status: "offline",
                joinedAt: "",
              }}
              size="xs"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">{act.actorName}</span>{" "}
                <span>{act.summary}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(act.occurredAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
