import { Card } from "../../ui/card";
import { AdminOverviewCharts } from "./AdminOverviewCharts";
import { AdminOverviewSkeleton } from "./AdminOverviewSkeleton";
import { useAdminWorkspace } from "./AdminContext";
import { platformMemberUsers } from "./adminUserStats";
import {
  averageMembersPerWorkspace,
  sumWorkspaceMetric,
  usersActiveWithinDays,
  usersWithoutWorkspace,
} from "./adminOverviewStats";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { adminApi } from "../../../api/adminApi";
import type { AdminPlatformTaskStats } from "../../../api/types";

const EMPTY_TASK_STATS: AdminPlatformTaskStats = {
  total: 0,
  byStatus: { TODO: 0, DOING: 0, DONE: 0 },
};

export function AdminOverviewPage() {
  const { usersState, workspacesState } = useAdminWorkspace();
  const taskStatsState = useAsyncData(() => adminApi.getPlatformTaskStats(), []);
  const loading = usersState.loading || workspacesState.loading;
  const awaitingData = usersState.data === null || workspacesState.data === null;

  if (loading && awaitingData) {
    return <AdminOverviewSkeleton />;
  }

  const memberUsers = platformMemberUsers(usersState.data);
  const activeCount = memberUsers.filter(user => user.isActive).length;
  const bannedCount = memberUsers.length - activeCount;
  const workspaces = workspacesState.data ?? [];
  const totalProjects = sumWorkspaceMetric(workspaces, "projectCount");
  const totalTasks = taskStatsState.data?.total ?? sumWorkspaceMetric(workspaces, "taskCount");
  const taskStats = taskStatsState.data ?? EMPTY_TASK_STATS;
  const withoutWorkspace = usersWithoutWorkspace(memberUsers);
  const activeLast30Days = usersActiveWithinDays(memberUsers, 30);
  const avgMembers = averageMembersPerWorkspace(workspaces);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Platform Users</p>
          <p className="text-2xl font-bold">{memberUsers.length}</p>
          <p className="mt-auto pt-2 text-[10px] leading-relaxed text-slate-400">
            {withoutWorkspace} without workspace
            <br />
            {activeLast30Days} active (30d)
          </p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-2 text-xs font-semibold text-slate-500">Account status</p>
          <div className="flex gap-5">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
              <p className="text-[10px] text-slate-400">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">{bannedCount}</p>
              <p className="text-[10px] text-slate-400">Banned</p>
            </div>
          </div>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Total Workspaces</p>
          <p className="text-2xl font-bold">{workspaces.length}</p>
          <p className="mt-auto pt-2 text-[10px] text-slate-400">Avg {avgMembers} members each</p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Workspace Members</p>
          <p className="text-2xl font-bold">{sumWorkspaceMetric(workspaces, "memberCount")}</p>
          <p className="mt-auto pt-2 text-[10px] text-slate-400">Across all workspaces</p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Total Projects</p>
          <p className="text-2xl font-bold">{totalProjects}</p>
          <p className="mt-auto pt-2 text-[10px] text-slate-400">Non-deleted projects</p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Total Tasks</p>
          <p className="text-2xl font-bold">{totalTasks}</p>
          <p className="mt-auto pt-2 text-[10px] leading-relaxed text-slate-400">
            {taskStats.byStatus.TODO} todo · {taskStats.byStatus.DOING} doing
            <br />
            {taskStats.byStatus.DONE} done
          </p>
        </Card>
      </div>

      <AdminOverviewCharts
        users={usersState.data}
        workspaces={workspacesState.data}
        taskStats={taskStatsState.data}
        loading={loading || taskStatsState.loading}
      />
    </>
  );
}
