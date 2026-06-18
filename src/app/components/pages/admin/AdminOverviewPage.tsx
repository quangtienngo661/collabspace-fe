import { Card } from "../../ui/card";
import { AdminOverviewCharts } from "./AdminOverviewCharts";
import { useAdminWorkspace } from "./AdminContext";
import { platformMemberUsers } from "./adminUserStats";

export function AdminOverviewPage() {
  const { usersState, workspacesState } = useAdminWorkspace();
  const memberUsers = platformMemberUsers(usersState.data);
  const activeCount = memberUsers.filter(u => u.isActive).length;
  const bannedCount = memberUsers.length - activeCount;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Platform Users</p>
          <p className="text-2xl font-bold">{memberUsers.length}</p>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-2">Account status</p>
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
        <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Total Workspaces</p>
          <p className="text-2xl font-bold">{workspacesState.data?.length ?? 0}</p>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Workspace Members</p>
          <p className="text-2xl font-bold">
            {workspacesState.data?.reduce((sum, w) => sum + (w.memberCount ?? 0), 0) ?? 0}
          </p>
        </Card>
      </div>

      <AdminOverviewCharts
        users={usersState.data}
        workspaces={workspacesState.data}
        loading={usersState.loading || workspacesState.loading}
      />
    </>
  );
}
