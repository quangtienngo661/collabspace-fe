import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { workspaceApi } from "../api/workspaceApi";
import { useAsyncData } from "../hooks/useAsyncData";
import type { Workspace } from "../api/types";
import { readStoredActiveWorkspaceId, writeStoredActiveWorkspaceId } from "../utils/activeWorkspaceStorage";

interface WorkspacesContextValue {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getById: (id: string) => Workspace | undefined;
  /** Canonical active workspace (Slack/Jira switcher scope). */
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  setActiveWorkspace: (id: string | null) => void;
}

const WorkspacesContext = createContext<WorkspacesContextValue | null>(null);

export function WorkspacesProvider({ children }: { children: ReactNode }) {
  const state = useAsyncData(() => workspaceApi.list(), []);
  const workspaces = state.data ?? [];
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(() =>
    readStoredActiveWorkspaceId(),
  );

  const setActiveWorkspace = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    writeStoredActiveWorkspaceId(id);
  }, []);

  useEffect(() => {
    if (state.loading) return;
    if (workspaces.length === 0) {
      if (activeWorkspaceId !== null) setActiveWorkspace(null);
      return;
    }
    if (activeWorkspaceId && workspaces.some(ws => ws.id === activeWorkspaceId)) return;
    setActiveWorkspace(workspaces[0].id);
  }, [workspaces, state.loading, activeWorkspaceId, setActiveWorkspace]);

  const activeWorkspace = useMemo(
    () => workspaces.find(ws => ws.id === activeWorkspaceId) ?? workspaces[0] ?? null,
    [workspaces, activeWorkspaceId],
  );

  const value = useMemo<WorkspacesContextValue>(
    () => ({
      workspaces,
      loading: state.loading,
      error: state.error,
      reload: state.reload,
      getById: (id: string) => workspaces.find(workspace => workspace.id === id),
      activeWorkspace,
      activeWorkspaceId: activeWorkspace?.id ?? null,
      setActiveWorkspace,
    }),
    [workspaces, state.loading, state.error, state.reload, activeWorkspace, setActiveWorkspace],
  );

  return <WorkspacesContext.Provider value={value}>{children}</WorkspacesContext.Provider>;
}

export function useWorkspaces() {
  const value = useContext(WorkspacesContext);
  if (!value) {
    throw new Error("useWorkspaces must be used within WorkspacesProvider");
  }
  return value;
}
