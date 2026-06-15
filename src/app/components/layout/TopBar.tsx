import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Search, Bell, ChevronRight, Menu, Sun, Moon, User, Settings, Key, LogOut, Monitor, ClipboardList, MessageSquare, Building2, AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "../ui/utils";
import { UserAvatar } from "../shared/UserAvatar";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext";
import { notificationsApi, NotificationsUnavailableError } from "../../api/notificationsApi";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { Notification } from "../../api/types";
import { timeAgo } from "../../utils/format";

function isUuid(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const ROUTE_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  workspaces: "Workspaces",
  projects: "Projects",
  tasks: "Tasks",
  notifications: "Notifications",
  profile: "My Profile",
  settings: "Settings",
  admin: "Admin",
  login: "Login",
  register: "Register",
  otp: "Verify Email",
};

interface TopBarProps {
  onMenuClick: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

export function TopBar({ onMenuClick, dark, onToggleDark }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  
  const { data: workspaces } = useAsyncData(() => {
    // Only fetch if we are on a workspace route
    if (!location.pathname.includes("/workspaces/")) return Promise.resolve([]);
    return import("../../api/workspaceApi").then(m => m.workspaceApi.list());
  }, [location.pathname.includes("/workspaces/")]);

  const matchWs = location.pathname.match(/\/workspaces\/([^\/]+)/);
  const wsId = matchWs ? matchWs[1] : null;

  const { data: projects } = useAsyncData(() => {
    if (!wsId) return Promise.resolve([]);
    return import("../../api/workspaceApi").then(m => m.workspaceApi.listProjects(wsId));
  }, [wsId]);

  const { data: notifData, error: notifError, setData: setNotifs, reload: reloadNotifs } = useAsyncData<Notification[]>(
    () => notificationsApi.list().then(r => r.notifications),
    [],
  );
  const notifs = notifData ?? [];

  const breadcrumbs = location.pathname.split("/").filter(Boolean).map(p => {
    if (ROUTE_MAP[p]) return ROUTE_MAP[p];
    if (isUuid(p)) {
      if (wsId === p) {
        const ws = workspaces?.find(w => w.id === p);
        if (ws) return ws.name;
      }
      const proj = projects?.find(pr => pr.id === p);
      if (proj) return proj.name;
      return p.slice(0, 8) + "…";
    }
    return p.charAt(0).toUpperCase() + p.slice(1);
  });

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifs(prev => (prev ?? []).map(n => ({ ...n, read: true })));
      void reloadNotifs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark all as read");
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const unreadNotifs = notifs.filter(n => !n.read && !n.archived);

  const notificationIconMap: Record<string, LucideIcon> = {
    task_assigned: ClipboardList,
    comment_added: MessageSquare,
    comment_mentioned: MessageSquare,
    workspace_invited: Building2,
    system_alert: AlertTriangle,
  };

  return (
    <header className="h-12 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
      {/* Mobile menu */}
      <button onClick={onMenuClick} className="md:hidden p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
        <Menu className="w-4 h-4" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
            <span className={cn("truncate", i === breadcrumbs.length - 1 ? "text-slate-900 dark:text-slate-100 font-medium" : "hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer")}>{crumb}</span>
          </span>
        ))}
      </nav>

      {/* Global search */}
      <div className="hidden md:flex items-center relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
        <Input key={location.pathname} placeholder="Search..." className="pl-8 h-7 w-52 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
      </div>

      {/* Dark mode toggle */}
      <button onClick={onToggleDark} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <Popover open={notifOpen} onOpenChange={setNotifOpen}>
        <PopoverTrigger asChild>
          <button className="relative p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadNotifs.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">Mark all read</button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {notifError && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                {notifError.includes(new NotificationsUnavailableError().message) ? "Notifications API unavailable" : notifError}
              </div>
            )}
            {!notifError && notifs.filter(n => !n.archived).slice(0, 8).map(n => {
              const Icon = notificationIconMap[n.type] || Bell;

              return (
                <div
                  key={n.id}
                  onClick={() => { setNotifOpen(false); navigate(n.link); }}
                  className={cn("flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", !n.read && "bg-blue-50/60 dark:bg-blue-900/10")}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{n.body}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </div>
              );
            })}
            {!notifError && notifs.filter(n => !n.archived).length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">No notifications</div>
            )}
          </div>
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => { setNotifOpen(false); navigate("/notifications"); }} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 w-full text-center">
              View all notifications
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {profile && <UserAvatar user={profile} size="xs" showPresence />}
            <span className="hidden md:block text-xs font-medium text-slate-700 dark:text-slate-300">{profile?.name ?? "User"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate("/profile")}><User className="w-4 h-4 mr-2" />My Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile?tab=preferences")}><Settings className="w-4 h-4 mr-2" />Preferences</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile?tab=sessions")}><Monitor className="w-4 h-4 mr-2" />Sessions</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile?tab=password")}><Key className="w-4 h-4 mr-2" />Change Password</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400"><LogOut className="w-4 h-4 mr-2" />Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
