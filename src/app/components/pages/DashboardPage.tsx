import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CheckSquare, Users, Bell, FolderOpen, Plus, UserPlus, TrendingUp, Clock, RefreshCw, Mail, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { StatusBadge, PriorityBadge } from "../shared/StatusBadge";
import { CreateTaskModal } from "./task/CreateTaskModal";
import { TaskDetailSheet } from "./task/TaskDetailSheet";
import { EmptyState, ErrorState } from "../shared/EmptyState";
import { WorkspaceActivityFeed } from "../shared/WorkspaceActivityFeed";
import { getNotificationInvitationId } from "../../api/mappers";
import { workspaceApi } from "../../api/workspaceApi";
import { enrichProjectsTaskCounts } from "../../api/clientStats";
import { taskApi } from "../../api/taskApi";
import { useNotifications } from "../../context/NotificationsContext";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAuth } from "../../auth/AuthContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { formatDueDate } from "../../utils/format";
import type { ActivityTimelineItem, Task } from "../../api/types";

const statuses = ["TODO", "DOING", "DONE"] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="min-w-0 p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="mb-2 h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="mb-2 h-7 w-12 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="min-w-0 p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-[228px]" />
        <Card className="min-w-0 p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-[280px]" />
      </div>
      <Card className="min-w-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-48" />
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [createTask, setCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { workspaces, loading: workspacesLoading, error: workspacesError, reload: reloadWorkspaces, activeWorkspace } = useWorkspaces();
  const { data: notifData, error: notificationsError, reload: reloadNotifications, unreadCount } = useNotifications();
  const hasWorkspace = Boolean(activeWorkspace);

  const membersState = useAsyncData(
    () => workspaceApi.members(activeWorkspace!.id),
    [activeWorkspace?.id],
    { enabled: hasWorkspace },
  );

  const projectsState = useAsyncData(
    () => workspaceApi.listProjects(activeWorkspace!.id).then(enrichProjectsTaskCounts),
    [activeWorkspace?.id],
    { enabled: hasWorkspace },
  );

  const tasksState = useAsyncData(
    () => taskApi.list({ workspaceId: activeWorkspace!.id }).then(result => result.tasks),
    [activeWorkspace?.id],
    { enabled: hasWorkspace },
  );

  const activityState = useAsyncData(
    () => workspaceApi.getActivity(activeWorkspace!.id),
    [activeWorkspace?.id],
    { enabled: hasWorkspace },
  );

  const tasks = tasksState.data ?? [];
  const projects = projectsState.data ?? [];
  const notifications = notifData?.notifications ?? [];
  const currentUserRole = (membersState.data ?? []).find((m) => m.userId === profile?.id)?.role ?? null;
  const canDeleteAnyTask = currentUserRole === "owner" || currentUserRole === "manager";
  const inviteNotifications = (notifData?.notifications ?? []).filter(
    n => getNotificationInvitationId(n) && !n.archived,
  );

  function handleActivityClick(item: ActivityTimelineItem) {
    if (!activeWorkspace) return;
    const taskId =
      typeof item.meta?.taskId === "string"
        ? item.meta.taskId
        : typeof item.meta?.targetId === "string"
          ? item.meta.targetId
          : null;
    const projectId = typeof item.meta?.projectId === "string" ? item.meta.projectId : null;
    if (taskId && projectId) {
      navigate(`/workspaces/${activeWorkspace.id}/projects/${projectId}?task=${taskId}`);
      return;
    }
    if (taskId) {
      const existing = tasks.find(t => t.id === taskId);
      if (existing) setSelectedTask(existing);
    }
  }

  const activity = (activityState.data?.items ?? []).slice(0, 6);

  const workspaceLabel = activeWorkspace?.name ?? "your workspace";

  const chartData = useMemo(() => {
    return statuses.map(status => ({
      name: status === "TODO" ? "Todo" : status === "DOING" ? "Doing" : "Done",
      count: tasks.filter(task => task.status === status).length,
    }));
  }, [tasks]);

  const myTasks = tasks.filter(task => task.assigneeId === profile?.userId);
  const totalDone = tasks.filter(task => task.status === "DONE").length;
  const totalDoing = tasks.filter(task => task.status === "DOING").length;
  const memberCount = membersState.data?.length ?? 0;
  const unreadCountDisplay = notificationsError ? "N/A" : unreadCount;

  const kpis = [
    { label: "Total Tasks", value: tasks.length, icon: CheckSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Completed", value: totalDone, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "In Progress", value: totalDoing, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Team Members", value: memberCount, icon: Users, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
    { label: "Unread Notifs", value: unreadCountDisplay, icon: Bell, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    { label: "Projects", value: projects.length, icon: FolderOpen, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  ];

  function reloadAll() {
    void reloadWorkspaces();
    void reloadNotifications();
    void projectsState.reload();
    void tasksState.reload();
    void activityState.reload();
    void membersState.reload();
  }

  function addCreatedTask(task: Task) {
    tasksState.setData(prev => [...(prev ?? []), task]);
  }

  function handleTaskUpdated(updated: Task) {
    tasksState.setData(prev => (prev ?? []).map(task => task.id === updated.id ? updated : task));
    setSelectedTask(updated);
  }

  function handleTaskDeleted(taskId: string) {
    tasksState.setData(prev => (prev ?? []).filter(task => task.id !== taskId));
    setSelectedTask(null);
  }

  const topError = workspacesError || tasksState.error;

  const awaitingWorkspaceList = workspacesLoading;
  const awaitingWorkspaceData = hasWorkspace && (
    (tasksState.loading && tasksState.data === null) ||
    (projectsState.loading && projectsState.data === null) ||
    (membersState.loading && membersState.data === null)
  );
  const showDashboardSkeleton = awaitingWorkspaceList || awaitingWorkspaceData;
  const showEmptyWorkspaces = !workspacesError && !awaitingWorkspaceList && workspaces.length === 0;

  return (
    <div className="max-w-full overflow-x-hidden p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {profile?.name ?? "there"}.
            {hasWorkspace ? ` Overview for ${workspaceLabel}.` : " Get started by creating or joining a workspace."}
          </p>
        </div>
        <div className="flex w-full min-w-0 gap-2 sm:w-auto sm:justify-end">
          <Button size="sm" variant="outline" onClick={() => activeWorkspace && navigate(`/workspaces/${activeWorkspace.id}?tab=members`)} disabled={!activeWorkspace} className="hidden md:flex gap-1.5" title={!activeWorkspace ? "Create a workspace first" : undefined}>
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </Button>
          <Button size="sm" onClick={() => setCreateTask(true)} disabled={!activeWorkspace} className="w-full min-w-0 shrink gap-1.5 bg-blue-600 hover:bg-blue-700 text-white sm:w-auto sm:shrink-0">
            <Plus className="w-3.5 h-3.5" /> New Task
          </Button>
        </div>
      </div>

      {topError && (
        <Card className="p-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ErrorState title="Live data unavailable" description={topError} className="py-0 text-left sm:items-start" />
            <Button size="sm" variant="outline" onClick={reloadAll} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>
        </Card>
      )}

      {showDashboardSkeleton ? (
        <DashboardSkeleton />
      ) : showEmptyWorkspaces ? (
        <div className="space-y-6">
          <EmptyState
            icon={FolderOpen}
            title="No workspaces yet"
            description="Create a workspace or accept an invitation to unlock your team home."
            action={{ label: "Create workspace", onClick: () => navigate("/workspaces?create=1") }}
          />
          {inviteNotifications.length > 0 && (
            <Card className="p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Pending invitations
              </h2>
              <div className="space-y-2">
                {inviteNotifications.slice(0, 5).map(n => (
                  <div key={n.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 truncate">{n.body}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(n.link || "/invitations")}>
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="p-4 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex flex-wrap items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                Have an invite link? Open it from notifications or paste the invitation ID.
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate("/invitations")}>
                Enter invitation
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map(kpi => (
              <Card key={kpi.label} className="min-w-0 p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{kpi.label}</p>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="min-w-0 p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Status</h2>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-slate-500" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-slate-500" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={4} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </Card>

            <Card className="min-w-0 p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col h-[280px]">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 shrink-0">Recent Activity</h2>
              <div className="overflow-y-auto pr-2 flex-1">
                <WorkspaceActivityFeed
                  items={activity}
                  loading={activityState.loading}
                  onItemClick={handleActivityClick}
                />
              </div>
            </Card>
          </div>

          <Card className="min-w-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">My Assigned Tasks</h2>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => activeWorkspace && navigate(`/workspaces/${activeWorkspace.id}/projects`)}>View all</Button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {myTasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No tasks assigned to you</p>
              ) : myTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => setSelectedTask(task)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.dueDate ? formatDueDate(task.dueDate) : "No due date"}</p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <CreateTaskModal
        open={createTask}
        onClose={() => setCreateTask(false)}
        workspaceId={activeWorkspace?.id ?? ""}
        onCreated={addCreatedTask}
      />

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          canDeleteAnyTask={canDeleteAnyTask}
        />
      )}
    </div>
  );
}
