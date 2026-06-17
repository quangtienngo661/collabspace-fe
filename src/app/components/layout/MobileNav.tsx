import { NavLink, useNavigate } from "react-router";
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
  Mail,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAuth } from "../../auth/AuthContext";

const memberBottomItems = [
  { label: "Home", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Workspaces", icon: Building2, to: "/workspaces" },
  { label: "Notifs", icon: Bell, to: "/notifications" },
  { label: "Profile", icon: User, to: "/profile" },
];

const adminBottomItems = [
  { label: "Admin", icon: Shield, to: "/admin" },
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
  const navigate = useNavigate();

  const memberNavItems = [
    { label: "Home", icon: LayoutDashboard, to: "/dashboard" },
    { label: "All workspaces", icon: Building2, to: "/workspaces" },
    {
      label: "Projects",
      icon: FolderOpen,
      to: activeWorkspace ? `/workspaces/${activeWorkspace.id}/projects` : "/workspaces",
      requiresWorkspace: true,
    },
    { label: "Users", icon: Users, to: "/users" },
    { label: "Notifications", icon: Bell, to: "/notifications" },
    { label: "Invitations", icon: Mail, to: "/invitations" },
    {
      label: "Workspace settings",
      icon: Settings2,
      to: activeWorkspace ? `/workspaces/${activeWorkspace.id}?tab=settings` : "/workspaces",
      requiresWorkspace: true,
    },
    { label: "Profile", icon: User, to: "/profile" },
  ];

  const adminNavItems = [
    { label: "Platform Admin", icon: Shield, to: "/admin" },
    { label: "Notifications", icon: Bell, to: "/notifications" },
    { label: "Profile", icon: User, to: "/profile" },
  ];

  const navItems = isAdmin ? adminNavItems : memberNavItems;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 bg-slate-900 text-slate-100 border-slate-700">
        <SheetHeader className="px-4 py-3 border-b border-slate-700/60">
          <SheetTitle className="flex items-center gap-2 text-white">
            <span className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              CS
            </span>
            <span>
              CollabSpace
              {isAdmin && (
                <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Platform Admin
                </span>
              )}
            </span>
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

        {!isAdmin && (
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
        )}

        <nav className="px-2 py-3 space-y-0.5">
          {navItems.map(item => {
            const disabled = "requiresWorkspace" in item && item.requiresWorkspace && !activeWorkspace;
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
                    isActive
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
  const { isAdmin } = useAuth();
  const bottomItems = isAdmin ? adminBottomItems : memberBottomItems;

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
