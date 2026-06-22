import { Card } from "../../ui/card";
import { Building2, CheckCircle2, ClipboardList, FolderOpen, ShieldCheck, Users } from "lucide-react";
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
  const statCards = [
    {
      label: "Platform Users",
      value: users?.total ?? "—",
      note: `${users?.withoutWorkspace ?? 0} without workspace · ${users?.activeLast30d ?? 0} active (30d)`,
      icon: Users,
      tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      label: "Account Status",
      value: `${users?.active ?? "—"} / ${users?.banned ?? "—"}`,
      note: "Active / banned accounts",
      icon: ShieldCheck,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      label: "Total Workspaces",
      value: workspaces?.total ?? "—",
      note: `Avg ${workspaces?.avgMembersPerWorkspace?.toFixed(1) ?? "—"} members each`,
      icon: Building2,
      tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300",
    },
    {
      label: "Workspace Members",
      value: workspaces?.totalMembers ?? "—",
      note: "Across all workspaces",
      icon: CheckCircle2,
      tone: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300",
    },
    {
      label: "Total Projects",
      value: projects?.total ?? "—",
      note: "Non-deleted projects",
      icon: FolderOpen,
      tone: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      label: "Total Tasks",
      value: tasks?.total ?? "—",
      note: `${tasks?.byStatus.TODO ?? 0} todo · ${tasks?.byStatus.DOING ?? 0} doing · ${tasks?.byStatus.DONE ?? 0} done`,
      icon: ClipboardList,
      tone: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
    },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="min-w-0 gap-3 overflow-hidden border-white/70 bg-white/85 p-4 shadow-sm shadow-slate-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
            <div className={`flex size-9 items-center justify-center rounded-xl ${stat.tone}`}>
              <stat.icon className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{stat.value}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{stat.note}</p>
            </div>
          </Card>
        ))}
      </div>

      <AdminOverviewCharts
        overview={overview}
        workspaces={workspacesState.data}
        loading={loading || workspacesState.loading}
      />
    </>
  );
}
