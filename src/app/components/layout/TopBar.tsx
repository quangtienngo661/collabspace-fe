import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Search, Bell, ChevronRight, Menu, Sun, Moon, User, Settings, Key, LogOut, Monitor, ClipboardList, MessageSquare, Building2, AlertTriangle, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "../ui/utils";
import { UserAvatar } from "../shared/UserAvatar";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { notificationsApi } from "../../api/notificationsApi";
import { workspaceApi } from "../../api/workspaceApi";
import { navigateFromNotification } from "../../utils/notificationNavigation";
import { usersApi } from "../../api/usersApi";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { Notification, UserStatus } from "../../api/types";
import { buildBreadcrumbSegments } from "../../utils/breadcrumbs";
import { timeAgo } from "../../utils/format";

interface TopBarProps {
  onMenuClick: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onOpenCommandPalette?: () => void;
}

export function TopBar({ onMenuClick, dark, onToggleDark, onOpenCommandPalette }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout, setProfile } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  
  const { getById: getWorkspaceById } = useWorkspaces();
  const { data: notifData, error: notifError, setData: setNotifs, unreadCount: unreadBadgeCount } = useNotifications();

  const matchWs = location.pathname.match(/\/workspaces\/([^\/]+)/);
  const wsId = matchWs ? matchWs[1] : null;
  const onWorkspaceRoute = location.pathname.includes("/workspaces/");

  const { data: projects } = useAsyncData(
    () => wsId ? workspaceApi.listProjects(wsId) : Promise.resolve([]),
    [wsId],
    { enabled: onWorkspaceRoute && Boolean(wsId) },
  );

  const notifs = (notifData?.notifications ?? []).slice(0, 8);

  const breadcrumbSegments = buildBreadcrumbSegments(location.pathname, (id, index, segments) => {
    const prev = segments[index - 1];
    if (prev === "workspaces" || id === wsId) {
      const ws = getWorkspaceById(id);
      if (ws) return ws.name;
    }
    const proj = projects?.find(pr => pr.id === id);
    if (proj) return proj.name;
    return null;
  });

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifs(prev => prev ? { ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })), unreadCount: 0 } : prev);
      toast.success("All marked as read");
    } catch (e: any) {
      toast.error("Failed to mark all as read");
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleStatusChange(status: UserStatus) {
    if (!profile) return;
    try {
      await usersApi.updateStatus(status);
      setProfile({ ...profile, status });
      toast.success(`Status updated to ${status}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  }

  async function handleNotificationClick(notification: Notification) {
    setNotifOpen(false);
    await navigateFromNotification(navigate, notification);
  }

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

      <nav className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-1 min-w-0">
        {breadcrumbSegments.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
            {crumb.path ? (
              <button
                type="button"
                onClick={() => navigate(crumb.path!)}
                className="truncate hover:text-slate-700 dark:hover:text-slate-200"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="truncate text-slate-900 dark:text-slate-100 font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="md:hidden p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search…</span>
        <kbd className="ml-2 text-[10px] text-slate-400">⌘K</kbd>
      </button>

      {/* Dark mode toggle */}
      <button onClick={onToggleDark} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <Popover open={notifOpen} onOpenChange={setNotifOpen}>
        <PopoverTrigger asChild>
          <button className="relative p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <Bell className="w-4 h-4" />
            {unreadBadgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadBadgeCount > 9 ? "9+" : unreadBadgeCount}
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
                {notifError}
              </div>
            )}
            {!notifError && notifs.filter(n => !n.archived).slice(0, 8).map(n => {
              const Icon = notificationIconMap[n.type] || Bell;

              return (
                <div
                  key={n.id}
                  onClick={() => void handleNotificationClick(n)}
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
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Status</div>
            <DropdownMenuItem onClick={() => void handleStatusChange("online")}><span className="w-2 h-2 rounded-full bg-green-500 mr-2"/>Online</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleStatusChange("busy")}><span className="w-2 h-2 rounded-full bg-red-500 mr-2"/>Busy</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleStatusChange("away")}><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"/>Away</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleStatusChange("offline")}><span className="w-2 h-2 rounded-full border-2 border-slate-300 dark:border-slate-500 mr-2"/>Offline</DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400"><LogOut className="w-4 h-4 mr-2" />Logout</DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
