import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../../ui/card";
import type { AdminPlatformTaskStats, AdminUserAggregate, AdminWorkspace } from "../../../api/types";
import { platformMemberUsers } from "./adminUserStats";

const STATUS_COLORS = {
  active: "#22c55e",
  banned: "#ef4444",
};

const ENGAGEMENT_COLORS = {
  signedIn: "#3b82f6",
  neverSignedIn: "#94a3b8",
};

const TASK_BAR_COLOR = "#f59e0b";

const TASK_STATUS_COLORS = {
  TODO: "#94a3b8",
  DOING: "#3b82f6",
  DONE: "#22c55e",
};

const tooltipStyle = { fontSize: 12, borderRadius: 6 };

interface AdminOverviewChartsProps {
  users: AdminUserAggregate[] | null;
  workspaces: AdminWorkspace[] | null;
  taskStats: AdminPlatformTaskStats | null;
  loading?: boolean;
}

function monthKey(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${labels[Number(month) - 1]} '${year.slice(2)}`;
}

function truncateLabel(value: string, max = 14): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function ChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-xs text-slate-400">
      {message}
    </div>
  );
}

export function AdminOverviewCharts({ users, workspaces, taskStats, loading }: AdminOverviewChartsProps) {
  const memberUsers = useMemo(() => platformMemberUsers(users), [users]);

  const userStatusData = useMemo(() => {
    const active = memberUsers.filter(user => user.isActive).length;
    const banned = memberUsers.length - active;
    return [
      { name: "Active", value: active, color: STATUS_COLORS.active },
      { name: "Banned", value: banned, color: STATUS_COLORS.banned },
    ].filter(item => item.value > 0);
  }, [memberUsers]);

  const engagementData = useMemo(() => {
    const signedIn = memberUsers.filter(user => user.lastLoginAt).length;
    const neverSignedIn = memberUsers.length - signedIn;
    return [
      { name: "Signed in", value: signedIn, color: ENGAGEMENT_COLORS.signedIn },
      { name: "Never signed in", value: neverSignedIn, color: ENGAGEMENT_COLORS.neverSignedIn },
    ].filter(item => item.value > 0);
  }, [memberUsers]);

  const topWorkspacesByTasksData = useMemo(() => {
    return [...(workspaces ?? [])]
      .sort((a, b) => (b.taskCount ?? 0) - (a.taskCount ?? 0))
      .slice(0, 6)
      .map(workspace => ({
        name: truncateLabel(workspace.name),
        tasks: workspace.taskCount ?? 0,
      }))
      .filter(item => item.tasks > 0);
  }, [workspaces]);

  const taskStatusData = useMemo(() => {
    if (!taskStats) return [];
    return [
      { name: "To do", value: taskStats.byStatus.TODO, color: TASK_STATUS_COLORS.TODO },
      { name: "Doing", value: taskStats.byStatus.DOING, color: TASK_STATUS_COLORS.DOING },
      { name: "Done", value: taskStats.byStatus.DONE, color: TASK_STATUS_COLORS.DONE },
    ].filter(item => item.value > 0);
  }, [taskStats]);

  const growthData = useMemo(() => {
    const keys = new Set<string>();
    for (const user of memberUsers) {
      const key = monthKey(user.createdAt);
      if (key) keys.add(key);
    }
    for (const workspace of workspaces ?? []) {
      const key = monthKey(workspace.createdAt);
      if (key) keys.add(key);
    }

    return Array.from(keys)
      .sort()
      .slice(-6)
      .map(key => ({
        month: formatMonthLabel(key),
        users: memberUsers.filter(user => monthKey(user.createdAt) === key).length,
        workspaces: (workspaces ?? []).filter(workspace => monthKey(workspace.createdAt) === key).length,
      }));
  }, [memberUsers, workspaces]);

  const hasUsers = memberUsers.length > 0;
  const hasWorkspaces = (workspaces?.length ?? 0) > 0;
  const hasTaskStats = (taskStats?.total ?? 0) > 0;

  return (
    <div className="mb-6 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Platform overview</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">End-user metrics — platform admin accounts are excluded.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="min-w-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Account status</h3>
          {loading && !hasUsers ? (
            <ChartPlaceholder message="Loading user metrics…" />
          ) : !hasUsers ? (
            <ChartPlaceholder message="No user accounts yet." />
          ) : userStatusData.length === 0 ? (
            <ChartPlaceholder message="No status data available." />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={userStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {userStatusData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="min-w-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Sign-in activity</h3>
          {loading && !hasUsers ? (
            <ChartPlaceholder message="Loading engagement metrics…" />
          ) : !hasUsers ? (
            <ChartPlaceholder message="No user accounts yet." />
          ) : engagementData.length === 0 ? (
            <ChartPlaceholder message="No sign-in data available." />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={engagementData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {engagementData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="min-w-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Task status (platform)</h3>
          {loading && !hasTaskStats ? (
            <ChartPlaceholder message="Loading task metrics…" />
          ) : !hasTaskStats ? (
            <ChartPlaceholder message="No tasks created yet." />
          ) : taskStatusData.length === 0 ? (
            <ChartPlaceholder message="No task status data available." />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {taskStatusData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="min-w-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Top workspaces by tasks</h3>
          {loading && !hasWorkspaces ? (
            <ChartPlaceholder message="Loading workspace metrics…" />
          ) : topWorkspacesByTasksData.length === 0 ? (
            <ChartPlaceholder message="No workspaces with tasks yet." />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topWorkspacesByTasksData} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} className="text-slate-500" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fontSize: 10 }}
                    className="text-slate-500"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="tasks" fill={TASK_BAR_COLOR} radius={4} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="min-w-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Platform growth (last 6 months)</h3>
          {loading && growthData.length === 0 ? (
            <ChartPlaceholder message="Loading growth trends…" />
          ) : growthData.length === 0 ? (
            <ChartPlaceholder message="Not enough signup data yet." />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-slate-500" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-slate-500" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="New users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="workspaces"
                    name="New workspaces"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
