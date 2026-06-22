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
        <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
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
