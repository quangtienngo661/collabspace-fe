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
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                <Settings2 className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Admin Workspace</p>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}
