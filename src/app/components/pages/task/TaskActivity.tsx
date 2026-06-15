import { Activity } from "lucide-react";
import { UserAvatar } from "../../../shared/UserAvatar";
import { taskApi } from "../../../api/taskApi";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { timeAgo } from "../../../utils/format";

export function TaskActivity({ taskId }: { taskId: string }) {
  const activityState = useAsyncData(() => taskApi.getActivity(taskId), [taskId]);
  const activities = activityState.data ?? [];

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex-1 space-y-6 overflow-y-auto">
        {activityState.loading && <div className="text-sm text-slate-500">Loading activity...</div>}
        {!activityState.loading && activities.length === 0 && (
          <div className="text-sm text-slate-500">No activity yet.</div>
        )}
        {activities.map(a => (
          <div key={a.id} className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Activity className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-slate-100">{a.user?.name ?? "Someone"}</span> {a.action}
              </p>
              {a.details && <p className="mt-1 text-xs text-slate-500">{a.details}</p>}
              <p className="mt-1 text-xs text-slate-400">{timeAgo(a.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
