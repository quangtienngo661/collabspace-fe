import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  Activity,
  Bell,
  ChevronRight,
  Database,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Users,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { cn } from "../../ui/utils";
import { UserAvatar } from "../../shared/UserAvatar";
import { toast } from "sonner";
import { useAuth } from "../../../auth/AuthContext";
import { notificationsApi } from "../../../api/notificationsApi";
import type { User } from "../../../api/types";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { timeAgo } from "../../../utils/format";

interface AdminWorkspaceLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
  dark: boolean;
  onToggleDark: () => void;
}

const adminNavItems = [
  { label: "Access Control", description: "Roles and permissions", icon: ShieldCheck, to: "/admin", end: true },
  { label: "System Health", description: "Services and queues", icon: Activity, to: "/admin/health" },
];

const configItems = [
  { label: "Workspace Defaults", description: "Member roles, project defaults", icon: SlidersHorizontal },
  { label: "Directory & Teams", description: "People, departments, groups", icon: Users },
  { label: "Data & Storage", description: "Files, retention, backups", icon: Database },
  { label: "Audit Logs", description: "Security and activity trail", icon: FileText },
];

function fallbackUser(email?: string): User {
  return {
    id: "current-user",
    userId: "current-user",
    name: email ?? "Admin",
    email,
    avatar: (email ?? "A").slice(0, 2).toUpperCase(),
    role: "admin",
    status: "online",
    title: "",
    department: "",
    joinedAt: "",
  };
}

export function AdminWorkspaceLayout({ title, description, children, action, dark, onToggleDark }: AdminWorkspaceLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { authUser, profile, logout } = useAuth();
  const notificationsState = useAsyncData(() => notificationsApi.list(), []);
  const adminNotifications = (notificationsState.data ?? []).filter(n => !n.archived).slice(0, 5);
  const unreadCount = adminNotifications.filter(n => !n.read).length;
  const currentUser = profile ?? fallbackUser(authUser?.email);

  async function handleLogout(onClose?: () => void) {
    await logout();
    onClose?.();
    navigate("/login", { replace: true });
  }

  const sidebarContent = (onClose?: () => void) => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-3 py-3">
        <button
          type="button"
          onClick={() => { navigate("/admin"); onClose?.(); }}
          className="flex w-full items-center gap-3 rounded-xl text-left"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">CS</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-white">CollabSpace</span>
            <span className="block truncate text-xs text-slate-400">Admin workspace</span>
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <div className="space-y-1">
          {adminNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block font-semibold">{item.label}</span>
              </span>
            </NavLink>
          ))}
        </div>

        <div className="mt-5 border-t border-slate-800 pt-3">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Settings</p>
          <div className="space-y-1">
            {configItems.map(item => (
              <button
                key={item.label}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-colors"
                onClick={() => {
                  toast.info(`${item.label} is coming soon`);
                  onClose?.();
                }}
                type="button"
              >
                <item.icon className="size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={() => void handleLogout(onClose)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut className="size-3.5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden w-60 shrink-0 border-r border-slate-800 lg:block">
        {sidebarContent()}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 max-w-[85vw] gap-0 border-slate-800 bg-slate-950 p-0 text-slate-100">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
          </SheetHeader>
          {sidebarContent(() => setMobileOpen(false))}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open admin navigation">
            <Menu className="size-4" />
          </Button>

          <nav className="flex min-w-0 flex-1 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="hidden items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 sm:flex"
            >
              <Settings2 className="size-3.5" />
              Admin
            </button>
            <ChevronRight className="hidden size-3.5 shrink-0 sm:block" />
            <span className="truncate font-medium text-slate-900 dark:text-slate-100">{title}</span>
          </nav>

          <div className="hidden items-center md:flex">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search admin..." className="h-8 w-56 bg-slate-50 pl-8 text-xs dark:bg-slate-800" />
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onToggleDark} aria-label="Toggle theme">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">Notifications</div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {notificationsState.error ? (
                  <div className="px-4 py-5 text-xs text-slate-500 dark:text-slate-400">Notifications API unavailable.</div>
                ) : adminNotifications.length === 0 ? (
                  <div className="px-4 py-5 text-xs text-slate-500 dark:text-slate-400">No notifications.</div>
                ) : adminNotifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => navigate(n.link || "/notifications")}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800",
                      !n.read && "bg-blue-50/60 dark:bg-blue-900/10",
                    )}
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <Bell className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-slate-900 dark:text-slate-100">{n.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{n.body}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                <UserAvatar user={currentUser} size="xs" showPresence />
                <span className="hidden text-xs font-medium text-slate-700 dark:text-slate-300 md:block">{currentUser.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate("/dashboard")}><Home className="mr-2 size-4" />Back to App</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void handleLogout()} className="text-red-600 dark:text-red-400"><LogOut className="mr-2 size-4" />Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto">
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
        </main>
      </div>
    </div>
  );
}
