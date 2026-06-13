import type { LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", description = "An unexpected error occurred. Please try again.", className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
    </div>
  );
}

export function AccessDenied({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">Access Denied</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">You don't have permission to access this resource. Contact your workspace admin to request access.</p>
    </div>
  );
}
