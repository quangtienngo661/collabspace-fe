import { type ElementType, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import { LayoutDashboard, Building2, FolderOpen, Bell, Settings, ChevronLeft, ChevronRight, ChevronDown, Plus, LogOut, Shield } from "lucide-react";
import { cn } from "../ui/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAuth } from "../../auth/AuthContext";

const navItems: { label: string; icon: ElementType; to: string | null }[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Workspaces", icon: Building2, to: "/workspaces" },
  { label: "Projects", icon: FolderOpen, to: null }, // dynamic — computed below
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "Settings", icon: Settings, to: "/profile" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [wsOpen, setWsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useAuth();
  const { workspaces } = useWorkspaces();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Extract workspaceId from URL if available
  const match = location.pathname.match(/\/workspaces\/([^/]+)/);
  const routeWorkspaceId = match ? match[1] : null;
  
  const currentId = activeId || routeWorkspaceId;
  const activeWs = workspaces.find(ws => ws.id === currentId) ?? workspaces[0] ?? null;
  const projectLink = activeWs ? `/workspaces/${activeWs.id}/projects` : "/no-workspace-projects";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside className={cn(
        "flex flex-col h-full bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out shrink-0 border-r border-slate-800/80",
        collapsed ? "w-[72px]" : "w-60"
      )}>
        {/* Logo + toggle */}
        <div className={cn(
          "flex items-center border-b border-slate-700/60",
          collapsed ? "h-16 justify-center px-2" : "justify-between px-3 py-3"
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className="group relative flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-xs font-bold text-white shadow-lg shadow-blue-950/30 ring-1 ring-blue-400/30 transition-all hover:bg-blue-500 hover:shadow-blue-900/40"
                  aria-label="Expand sidebar"
                >
                  CS
                  <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-slate-950 text-slate-300 ring-1 ring-slate-700 transition-colors group-hover:text-white">
                    <ChevronRight className="size-3" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <span className="flex items-center gap-2 font-bold text-white tracking-tight">
              <span className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">CS</span>
              CollabSpace
            </span>
          )}
          {!collapsed && (
            <button onClick={onToggle} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" aria-label="Collapse sidebar">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace switcher */}
        {!collapsed ? (
          <div className="px-2 py-2 border-b border-slate-700/60">
            <button
              onClick={() => setWsOpen(o => !o)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-700/60 text-left transition-colors"
            >
              <span className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {activeWs?.name[0] ?? "W"}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-100 truncate">{activeWs?.name ?? "No workspace"}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", wsOpen && "rotate-180")} />
            </button>
            {wsOpen && (
              <div className="mt-1 space-y-0.5">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setActiveId(ws.id); setWsOpen(false); navigate(`/workspaces/${ws.id}`); }}
                    className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-slate-700/60 transition-colors", activeWs?.id === ws.id && "bg-slate-700/80")}
                  >
                    <span className="w-5 h-5 rounded bg-indigo-500/70 flex items-center justify-center text-white text-xs font-bold shrink-0">{ws.name[0]}</span>
                    <span className="text-xs text-slate-300 truncate">{ws.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => navigate("/workspaces")}
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
                  onClick={() => navigate(activeWs ? `/workspaces/${activeWs.id}` : "/workspaces")}
                  className="flex size-11 items-center justify-center rounded-2xl bg-slate-800/80 text-white ring-1 ring-slate-700/80 transition-all hover:bg-slate-700 hover:ring-indigo-400/50"
                  aria-label={`Open ${activeWs?.name ?? "workspaces"}`}
                >
                  <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-500 text-xs font-bold shadow-sm shadow-indigo-950/30">
                    {activeWs?.name[0] ?? "W"}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{activeWs?.name ?? "Workspaces"}</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Nav items */}
        <nav className={cn(
          "flex-1 overflow-y-auto",
          collapsed ? "px-2.5 py-4 space-y-2" : "px-2 py-3 space-y-0.5"
        )}>
          {navItems.map(item => {
            const to = item.to === null ? projectLink : item.to;
            return (
            collapsed ? (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={to}
                    end
                    onClick={(e) => {
                      if (item.label === "Projects" && !activeWs) e.preventDefault();
                    }}
                    className={({ isActive }) => cn(
                      "group relative mx-auto flex size-11 items-center justify-center rounded-2xl transition-all duration-200",
                      isActive
                        ? "bg-blue-500/15 text-blue-300 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.28)] before:absolute before:-left-2.5 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-blue-400"
                        : "text-slate-400 hover:bg-slate-800/90 hover:text-slate-100 hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]",
                      item.label === "Projects" && !activeWs && "opacity-50 pointer-events-none"
                    )}
                  >
                    <item.icon className="size-5 transition-transform group-hover:scale-105" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <NavLink
                key={item.label}
                to={to}
                end
                onClick={(e) => {
                  if (item.label === "Projects" && !activeWs) e.preventDefault();
                }}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-100",
                  item.label === "Projects" && !activeWs && "opacity-50 pointer-events-none"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          )})}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-700/60 p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="mx-auto flex size-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 transition-colors hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
                  aria-label="Logout"
                >
                  <LogOut className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
            >
              <LogOut className="size-3.5" />
              Logout
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
