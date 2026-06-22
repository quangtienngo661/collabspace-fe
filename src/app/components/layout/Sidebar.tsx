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
  Users,
  Settings2,
  Mail,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAuth } from "../../auth/AuthContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { workspaceApi } from "../../api/workspaceApi";
import { useNotifications } from "../../context/NotificationsContext";
import { ADMIN_NAV_ITEMS } from "../pages/admin/adminNav";

const memberPrimaryNav: { label: string; icon: ElementType; to: string }[] = [
  { label: "Home", icon: LayoutDashboard, to: "/dashboard" },
  { label: "All workspaces", icon: Building2, to: "/workspaces" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "Users", icon: Users, to: "/users" },
  { label: "Invitations", icon: Mail, to: "/invitations" },
];

const adminNotificationsNav = { label: "Notifications", icon: Bell, to: "/notifications" };

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
  const { logout, isAdmin, profile } = useAuth();
  const canCreateWorkspace = !isAdmin;
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaces();
  const { unreadCount } = useNotifications();

  const projectsState = useAsyncData(
    () => (activeWorkspace ? workspaceApi.listProjects(activeWorkspace.id) : Promise.resolve([])),
    [activeWorkspace?.id],
    { enabled: !isAdmin && Boolean(activeWorkspace) },
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
    const isNotifications = item.to === "/notifications";
    
    if (collapsed) {
      return (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>
            <NavLink to={item.to} end={end} className={navLinkClass(true)}>
              <div className="relative">
                <item.icon className="size-5" />
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-1 ring-slate-900">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return (
      <NavLink key={item.label} to={item.to} end={end} className={navLinkClass(false)}>
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {isNotifications && unreadCount > 0 && (
          <span className="ml-auto text-xs bg-red-500 text-white font-medium rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center text-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "flex flex-col h-full bg-slate-950 text-slate-100 transition-all duration-300 ease-in-out shrink-0 border-r border-slate-800/80 shadow-2xl shadow-slate-950/20",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-950",
            collapsed ? "h-16 justify-center px-2" : "justify-between px-3 py-3.5",
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className="group relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-blue-950/40"
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
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-950/40">
                  CS
                </span>
                <span className="min-w-0">
                  <span className="block">CollabSpace</span>
                  {isAdmin && (
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Platform Admin
                    </span>
                  )}
                </span>
              </span>
              <button
                onClick={onToggle}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {!isAdmin && (
          !collapsed ? (
              <div className="px-2.5 py-3 border-b border-slate-800/80">
              <button
                onClick={() => setWsOpen(o => !o)}
                  className="w-full flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-2 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/80"
              >
                  <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
                  {canCreateWorkspace && (
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
                  )}
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
          )
        )}

        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "px-2.5 py-4 space-y-2" : "px-2 py-3 space-y-0.5")}>
          {isAdmin ? (
            <div className={cn(collapsed ? "space-y-2" : "space-y-0.5")}>
              {!collapsed && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Administration
                </p>
              )}
              {ADMIN_NAV_ITEMS.map(item => renderNavItem(item, item.end ?? false))}
            </div>
          ) : (
            memberPrimaryNav.map(item => renderNavItem(item))
          )}

          {!isAdmin && activeWorkspace && (
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
            {!isAdmin && activeWorkspace && renderNavItem({
              label: "Workspace settings",
              icon: Settings2,
              to: workspaceSettingsPath(activeWorkspace.id),
            })}
            {isAdmin && renderNavItem(adminNotificationsNav)}
            {renderNavItem({ label: "Profile", icon: User, to: "/profile" })}
          </div>
        </nav>

        <div className="border-t border-slate-800/80 p-2.5 bg-slate-950/60">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
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
