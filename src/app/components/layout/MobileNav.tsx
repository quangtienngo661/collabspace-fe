import { NavLink, useNavigate } from "react-router";
import { LayoutDashboard, Building2, Bell, User, FolderOpen, Settings, Shield } from "lucide-react";
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

const allNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Workspaces", icon: Building2, to: "/workspaces" },
  { label: "Projects", icon: FolderOpen, to: "" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "Settings", icon: Settings, to: "/profile" },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileNavProps) {
  const { isAdmin } = useAuth();
  const { workspaces } = useWorkspaces();
  const projectLink = workspaces[0] ? `/workspaces/${workspaces[0].id}/projects` : "/workspaces/projects/none";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 bg-slate-900 text-slate-100 border-slate-700">
        <SheetHeader className="px-4 py-3 border-b border-slate-700/60">
          <SheetTitle className="flex items-center gap-2 text-white">
            <span className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">CS</span>
            CollabSpace
          </SheetTitle>
        </SheetHeader>

        <div className="px-2 py-2 border-b border-slate-700/60">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-2 mb-1">Workspaces</p>
          {workspaces.map(ws => (
            <NavLink
              key={ws.id}
              to={`/workspaces/${ws.id}`}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700/60"
              )}
            >
              <span className="w-5 h-5 rounded bg-indigo-500/70 flex items-center justify-center text-white text-xs font-bold">{ws.name[0]}</span>
              {ws.name}
            </NavLink>
          ))}
        </div>

        <nav className="px-2 py-3 space-y-0.5">
          {allNavItems.map(item => {
            const to = item.label === "Projects" ? projectLink : item.to;
            return (
            <NavLink
              key={item.label}
              to={to}
              onClick={(e) => {
                if (item.label === "Projects" && !workspaces[0]) e.preventDefault();
                else onClose();
              }}
              end
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-100",
                item.label === "Projects" && !workspaces[0] && "opacity-50 pointer-events-none"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          )})}
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
          className={({ isActive }) => cn(
            "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors",
            isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
          )}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
