import { useState } from "react";
import { Outlet } from "react-router";
import { NotificationsProvider } from "../../context/NotificationsContext";
import { WorkspacesProvider } from "../../context/WorkspacesContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileDrawer, BottomNav } from "./MobileNav";
import { ActiveWorkspaceSync } from "./ActiveWorkspaceSync";
import { CommandPalette, useCommandPaletteShortcut } from "./CommandPalette";
import { useSessionPresence } from "../../hooks/useSessionPresence";

interface AppShellProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function AppShell({ dark, onToggleDark }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useCommandPaletteShortcut(() => setCommandOpen(true));
  useSessionPresence();

  return (
    <WorkspacesProvider>
      <NotificationsProvider>
        <ActiveWorkspaceSync />
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
          <div className="hidden md:flex">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
          </div>

          <MobileDrawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onOpenSearch={() => setCommandOpen(true)}
          />

          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <TopBar
              onMenuClick={() => setMobileOpen(true)}
              dark={dark}
              onToggleDark={onToggleDark}
              onOpenCommandPalette={() => setCommandOpen(true)}
            />
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
              <Outlet />
            </main>
          </div>

          <BottomNav />
        </div>
      </NotificationsProvider>
    </WorkspacesProvider>
  );
}
