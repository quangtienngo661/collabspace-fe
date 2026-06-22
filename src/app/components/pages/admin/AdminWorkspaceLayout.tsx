import { type ReactNode } from "react";
import { Settings2 } from "lucide-react";

interface AdminWorkspaceLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}

export function AdminWorkspaceLayout({
  title,
  description,
  children,
  action,
}: AdminWorkspaceLayoutProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1440px] px-4 py-5 md:px-6">
        <div className="relative mb-5 overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/20">
          <div className="absolute -right-16 -top-24 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/30">
                <Settings2 className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Admin Workspace</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          {action}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
