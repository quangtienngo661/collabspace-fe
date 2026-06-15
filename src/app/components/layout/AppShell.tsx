import { useState } from "react";
import { Outlet } from "react-router";
import { NotificationsProvider } from "../../context/NotificationsContext";
import { WorkspacesProvider } from "../../context/WorkspacesContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileDrawer, BottomNav } from "./MobileNav";
interface AppShellProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function AppShell({ dark, onToggleDark }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <WorkspacesProvider>
      <NotificationsProvider>
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} dark={dark} onToggleDark={onToggleDark} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
      </NotificationsProvider>
    </WorkspacesProvider>
  );
}
