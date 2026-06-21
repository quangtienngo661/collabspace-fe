import { Card } from "../../ui/card";
import { AdminOverviewCharts } from "./AdminOverviewCharts";
import { AdminOverviewSkeleton } from "./AdminOverviewSkeleton";
import { useAdminWorkspace } from "./AdminContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { analyticsApi } from "../../../api/analyticsApi";

export function AdminOverviewPage() {
  const { workspacesState } = useAdminWorkspace();
  const overviewState = useAsyncData(() => analyticsApi.getOverview(), []);
  const loading = overviewState.loading;

  if (loading && overviewState.data === null) {
    return <AdminOverviewSkeleton />;
  }

  const overview = overviewState.data;
  const users = overview?.users;
  const workspaces = overview?.workspaces;
  const tasks = overview?.tasks;
  const projects = overview?.projects;

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Platform Users</p>
          <p className="text-2xl font-bold">{users?.total ?? "—"}</p>
          <p className="mt-auto pt-2 text-[10px] leading-relaxed text-slate-400">
            {users?.withoutWorkspace ?? 0} without workspace
            <br />
            {users?.activeLast30d ?? 0} active (30d)
          </p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-2 text-xs font-semibold text-slate-500">Account status</p>
          <div className="flex gap-5">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{users?.active ?? "—"}</p>
              <p className="text-[10px] text-slate-400">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">{users?.banned ?? "—"}</p>
              <p className="text-[10px] text-slate-400">Banned</p>
            </div>
          </div>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Total Workspaces</p>
          <p className="text-2xl font-bold">{workspaces?.total ?? "—"}</p>
          <p className="mt-auto pt-2 text-[10px] text-slate-400">
            Avg {workspaces?.avgMembersPerWorkspace?.toFixed(1) ?? "—"} members each
          </p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Workspace Members</p>
          <p className="text-2xl font-bold">{workspaces?.totalMembers ?? "—"}</p>
          <p className="mt-auto pt-2 text-[10px] text-slate-400">Across all workspaces</p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Total Projects</p>
          <p className="text-2xl font-bold">{projects?.total ?? "—"}</p>
          <p className="mt-auto pt-2 text-[10px] text-slate-400">Non-deleted projects</p>
        </Card>
        <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold text-slate-500">Total Tasks</p>
          <p className="text-2xl font-bold">{tasks?.total ?? "—"}</p>
          <p className="mt-auto pt-2 text-[10px] leading-relaxed text-slate-400">
            {tasks?.byStatus.TODO ?? 0} todo · {tasks?.byStatus.DOING ?? 0} doing
            <br />
            {tasks?.byStatus.DONE ?? 0} done
          </p>
        </Card>
      </div>

      <AdminOverviewCharts
        overview={overview}
        workspaces={workspacesState.data}
        loading={loading || workspacesState.loading}
      />
    </>
  );
}
