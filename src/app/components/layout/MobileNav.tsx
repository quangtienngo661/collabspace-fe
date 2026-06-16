import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Bell,
  User,
  FolderOpen,
  Settings2,
  Shield,
  Users,
  Search,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAuth } from "../../auth/AuthContext";

const bottomItems = [
  { label: "Home", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Workspaces", icon: Building2, to: "/workspaces" },
  { label: "Notifs", icon: Bell, to: "/notifications" },
  { label: "Profile", icon: User, to: "/profile" },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
}

export function MobileDrawer({ open, onClose, onOpenSearch }: MobileNavProps) {
  const { isAdmin } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaces();
  const location = useLocation();
  const navigate = useNavigate();

  const projectLink = activeWorkspace
    ? `/workspaces/${activeWorkspace.id}/projects`
    : "/workspaces";

  const navItems = [
    { label: "Home", icon: LayoutDashboard, to: "/dashboard" },
    { label: "All workspaces", icon: Building2, to: "/workspaces" },
    { label: "Projects", icon: FolderOpen, to: projectLink, requiresWorkspace: true },
    { label: "Users", icon: Users, to: "/users" },
    { label: "Notifications", icon: Bell, to: "/notifications" },
    {
      label: "Workspace settings",
      icon: Settings2,
      to: activeWorkspace ? `/workspaces/${activeWorkspace.id}?tab=settings` : "/workspaces",
      requiresWorkspace: true,
    },
    { label: "Profile", icon: User, to: "/profile" },
    ...(isAdmin ? [{ label: "Admin", icon: Shield, to: "/admin" }] : []),
  ];

  function isProjectsActive(path: string) {
    return path.includes("/projects");
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 bg-slate-900 text-slate-100 border-slate-700">
        <SheetHeader className="px-4 py-3 border-b border-slate-700/60">
          <SheetTitle className="flex items-center gap-2 text-white">
            <span className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              CS
            </span>
            CollabSpace
          </SheetTitle>
        </SheetHeader>

        {onOpenSearch && (
          <div className="px-3 py-2 border-b border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 text-sm text-slate-300"
            >
              <Search className="w-4 h-4" />
              Search…
              <span className="ml-auto text-[10px] text-slate-500">⌘K</span>
            </button>
          </div>
        )}

        <div className="px-2 py-2 border-b border-slate-700/60">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-2 mb-1">Active workspace</p>
          {workspaces.length === 0 ? (
            <p className="px-2 text-xs text-slate-400">No workspace yet</p>
          ) : (
            workspaces.map(ws => (
              <button
                key={ws.id}
                type="button"
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  navigate(`/workspaces/${ws.id}`);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                  activeWorkspace?.id === ws.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700/60",
                )}
              >
                <span className="w-5 h-5 rounded bg-indigo-500/70 flex items-center justify-center text-white text-xs font-bold">
                  {ws.name[0]}
                </span>
                {ws.name}
              </button>
            ))
          )}
        </div>

        <nav className="px-2 py-3 space-y-0.5">
          {navItems.map(item => {
            const disabled = item.requiresWorkspace && !activeWorkspace;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={e => {
                  if (disabled) e.preventDefault();
                  else onClose();
                }}
                end={item.label !== "Projects"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    (isActive || (item.label === "Projects" && isProjectsActive(location.pathname)))
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-100",
                    disabled && "opacity-50 pointer-events-none",
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex">
      {bottomItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors",
              isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400",
            )
          }
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
