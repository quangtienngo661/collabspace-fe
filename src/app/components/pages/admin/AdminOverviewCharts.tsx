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
import type { AdminWorkspace, AnalyticsOverview } from "../../../api/types";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { analyticsApi } from "../../../api/analyticsApi";

const STATUS_COLORS = {
  active: "#22c55e",
  banned: "#ef4444",
};

const TASK_BAR_COLOR = "#f59e0b";

const TASK_STATUS_COLORS = {
  TODO: "#94a3b8",
  DOING: "#3b82f6",
  DONE: "#22c55e",
};

const ACTIVITY_COLORS = {
  users_registered: "#3b82f6",
  workspaces_created: "#06b6d4",
  tasks_created: "#f59e0b",
  tasks_completed: "#22c55e",
};

const ACTIVITY_LABELS = {
  users_registered: "Users registered",
  workspaces_created: "Workspaces created",
  tasks_created: "Tasks created",
  tasks_completed: "Tasks completed",
};

const tooltipStyle = { fontSize: 12, borderRadius: 6 };

interface AdminOverviewChartsProps {
  overview: AnalyticsOverview | null;
  workspaces: AdminWorkspace[] | null;
  loading?: boolean;
}

function ChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-xs text-slate-400">
      {message}
    </div>
  );
}

function truncateLabel(value: string, max = 14): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${month}/${day}`;
}

export function AdminOverviewCharts({ overview, workspaces, loading }: AdminOverviewChartsProps) {
  const activityState = useAsyncData(
    () => analyticsApi.getActivity({ metric: "tasks_created" }),
    [],
  );

  const users = overview?.users;
  const tasks = overview?.tasks;

  const userStatusData = useMemo(() => {
    if (!users) return [];
    return [
      { name: "Active", value: users.active, color: STATUS_COLORS.active },
      { name: "Banned", value: users.banned, color: STATUS_COLORS.banned },
    ].filter(item => item.value > 0);
  }, [users]);

  const taskStatusData = useMemo(() => {
    if (!tasks) return [];
    return [
      { name: "To do", value: tasks.byStatus.TODO, color: TASK_STATUS_COLORS.TODO },
      { name: "Doing", value: tasks.byStatus.DOING, color: TASK_STATUS_COLORS.DOING },
      { name: "Done", value: tasks.byStatus.DONE, color: TASK_STATUS_COLORS.DONE },
    ].filter(item => item.value > 0);
  }, [tasks]);

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

  const activityChartData = useMemo(() => {
    return (activityState.data?.data ?? []).map(point => ({
      date: formatDateLabel(point.date),
      value: point.value,
    }));
  }, [activityState.data]);

  const activityMetric = activityState.data?.metric ?? "tasks_created";
  const hasUsers = (users?.total ?? 0) > 0;
  const hasTasks = (tasks?.total ?? 0) > 0;
  const hasWorkspaces = (workspaces?.length ?? 0) > 0;
  const hasActivity = activityChartData.length > 0;

  return (
    <div className="mb-6 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Platform overview</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">End-user metrics — platform admin accounts are excluded.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="min-w-0 border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
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

        <Card className="min-w-0 border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Task status (platform)</h3>
          {loading && !hasTasks ? (
            <ChartPlaceholder message="Loading task metrics…" />
          ) : !hasTasks ? (
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

        <Card className="min-w-0 border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
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

        <Card className="min-w-0 border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {ACTIVITY_LABELS[activityMetric]} (last 30 days)
          </h3>
          {activityState.loading && !hasActivity ? (
            <ChartPlaceholder message="Loading activity data…" />
          ) : !hasActivity ? (
            <ChartPlaceholder message="No activity data yet." />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    className="text-slate-500"
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-slate-500" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={ACTIVITY_LABELS[activityMetric]}
                    stroke={ACTIVITY_COLORS[activityMetric]}
                    strokeWidth={2}
                    dot={false}
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
