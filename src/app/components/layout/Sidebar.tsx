import { type ElementType, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  LogOut,
  Shield,
  Users,
  Settings2,
  Activity,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAuth } from "../../auth/AuthContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { workspaceApi } from "../../api/workspaceApi";

const primaryNav: { label: string; icon: ElementType; to: string }[] = [
  { label: "Home", icon: LayoutDashboard, to: "/dashboard" },
  { label: "All workspaces", icon: Building2, to: "/workspaces" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "Users", icon: Users, to: "/users" },
];

function projectsPath(workspaceId: string) {
  return `/workspaces/${workspaceId}/projects`;
}

function workspaceSettingsPath(workspaceId: string) {
  return `/workspaces/${workspaceId}?tab=settings`;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [wsOpen, setWsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaces();

  const projectsState = useAsyncData(
    () => (activeWorkspace ? workspaceApi.listProjects(activeWorkspace.id) : Promise.resolve([])),
    [activeWorkspace?.id],
    { enabled: Boolean(activeWorkspace) },
  );
  const projects = projectsState.data ?? [];

  const onProjectsRoute = location.pathname.includes("/projects");

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function switchWorkspace(id: string) {
    setActiveWorkspace(id);
    setWsOpen(false);
    navigate(`/workspaces/${id}`);
  }

  function navLinkClass(collapsedView: boolean, extra?: string) {
    return ({ isActive }: { isActive: boolean }) =>
      cn(
        collapsedView
          ? "group relative mx-auto flex size-11 items-center justify-center rounded-2xl transition-all duration-200"
          : "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isActive
          ? collapsedView
            ? "bg-blue-500/15 text-blue-300 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.28)] before:absolute before:-left-2.5 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-blue-400"
            : "bg-blue-600 text-white"
          : collapsedView
            ? "text-slate-400 hover:bg-slate-800/90 hover:text-slate-100"
            : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-100",
        extra,
      );
  }

  function renderNavItem(item: { label: string; icon: ElementType; to: string }, end = true) {
    if (collapsed) {
      return (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>
            <NavLink to={item.to} end={end} className={navLinkClass(true)}>
              <item.icon className="size-5" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return (
      <NavLink key={item.label} to={item.to} end={end} className={navLinkClass(false)}>
        <item.icon className="w-4 h-4 shrink-0" />
        {item.label}
      </NavLink>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "flex flex-col h-full bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out shrink-0 border-r border-slate-800/80",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-slate-700/60",
            collapsed ? "h-16 justify-center px-2" : "justify-between px-3 py-3",
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className="group relative flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-xs font-bold text-white"
                  aria-label="Expand sidebar"
                >
                  CS
                  <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-slate-950 text-slate-300 ring-1 ring-slate-700">
                    <ChevronRight className="size-3" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <span className="flex items-center gap-2 font-bold text-white tracking-tight">
                <span className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  CS
                </span>
                CollabSpace
              </span>
              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {!collapsed ? (
          <div className="px-2 py-2 border-b border-slate-700/60">
            <button
              onClick={() => setWsOpen(o => !o)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-700/60 text-left transition-colors"
            >
              <span className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {activeWorkspace?.name[0] ?? "W"}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-100 truncate">
                {activeWorkspace?.name ?? "No workspace"}
              </span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", wsOpen && "rotate-180")} />
            </button>
            {wsOpen && (
              <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => switchWorkspace(ws.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-slate-700/60 transition-colors",
                      activeWorkspace?.id === ws.id && "bg-slate-700/80",
                    )}
                  >
                    <span className="w-5 h-5 rounded bg-indigo-500/70 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {ws.name[0]}
                    </span>
                    <span className="text-xs text-slate-300 truncate">{ws.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => navigate("/workspaces?create=1")}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-slate-700/60 transition-colors"
                >
                  <span className="w-5 h-5 rounded border border-dashed border-slate-500 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="text-xs text-slate-400">Add workspace</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center px-2 py-3 border-b border-slate-700/60">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => navigate(activeWorkspace ? `/workspaces/${activeWorkspace.id}` : "/workspaces")}
                  className="flex size-11 items-center justify-center rounded-2xl bg-slate-800/80 text-white ring-1 ring-slate-700/80"
                >
                  <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-500 text-xs font-bold">
                    {activeWorkspace?.name[0] ?? "W"}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{activeWorkspace?.name ?? "Workspaces"}</TooltipContent>
            </Tooltip>
          </div>
        )}

        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "px-2.5 py-4 space-y-2" : "px-2 py-3 space-y-0.5")}>
          {primaryNav.map(item => renderNavItem(item))}

          {activeWorkspace && (
            <div className={cn(collapsed ? "pt-2" : "pt-3 mt-2 border-t border-slate-700/50")}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setProjectsOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  <span>Projects</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", projectsOpen && "rotate-180")} />
                </button>
              )}

              {(collapsed || projectsOpen) && (
                <div className={cn(collapsed ? "space-y-2" : "space-y-0.5")}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={projectsPath(activeWorkspace.id)}
                          className={({ isActive }) =>
                            navLinkClass(true)({ isActive: isActive || onProjectsRoute })
                          }
                        >
                          <FolderOpen className="size-5" />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="right">Projects</TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      <NavLink
                        to={projectsPath(activeWorkspace.id)}
                        className={({ isActive }) =>
                          navLinkClass(false, "text-xs")({
                            isActive: isActive && !/\/projects\/[^/]+/.test(location.pathname),
                          })
                        }
                      >
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        All projects
                      </NavLink>
                      {projects.slice(0, 8).map(project => (
                        <NavLink
                          key={project.id}
                          to={`/workspaces/${activeWorkspace.id}/projects/${project.id}`}
                          className={navLinkClass(false, "pl-8 text-xs")}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </NavLink>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={cn(collapsed ? "pt-2 space-y-2" : "pt-3 mt-2 border-t border-slate-700/50 space-y-0.5")}>
            {activeWorkspace && renderNavItem({
              label: "Workspace settings",
              icon: Settings2,
              to: workspaceSettingsPath(activeWorkspace.id),
            })}
            {renderNavItem({ label: "Profile", icon: User, to: "/profile" })}
            {isAdmin && (
              <>
                {renderNavItem({ label: "Platform Admin", icon: Shield, to: "/admin" })}
                {renderNavItem({ label: "System Health", icon: Activity, to: "/admin/health" })}
              </>
            )}
          </div>
        </nav>

        <div className="border-t border-slate-700/60 p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="mx-auto flex size-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300"
                  aria-label="Logout"
                >
                  <LogOut className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
