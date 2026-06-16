import { useEffect } from "react";
import { useLocation } from "react-router";
import { useWorkspaces } from "../../context/WorkspacesContext";

/** Keeps active workspace in sync when user navigates to workspace-scoped routes. */
export function ActiveWorkspaceSync() {
  const location = useLocation();
  const { workspaces, setActiveWorkspace } = useWorkspaces();

  useEffect(() => {
    const match = location.pathname.match(/\/workspaces\/([^/]+)/);
    const routeId = match?.[1];
    if (!routeId || !workspaces.some(ws => ws.id === routeId)) return;
    setActiveWorkspace(routeId);
  }, [location.pathname, workspaces, setActiveWorkspace]);

  return null;
}
