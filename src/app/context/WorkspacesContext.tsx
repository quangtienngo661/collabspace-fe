import { createContext, useContext, useMemo, type ReactNode } from "react";
import { workspaceApi } from "../api/workspaceApi";
import { useAsyncData } from "../hooks/useAsyncData";
import type { Workspace } from "../api/types";

interface WorkspacesContextValue {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getById: (id: string) => Workspace | undefined;
}

const WorkspacesContext = createContext<WorkspacesContextValue | null>(null);

export function WorkspacesProvider({ children }: { children: ReactNode }) {
  const state = useAsyncData(() => workspaceApi.list(), []);

  const value = useMemo<WorkspacesContextValue>(() => ({
    workspaces: state.data ?? [],
    loading: state.loading,
    error: state.error,
    reload: state.reload,
    getById: (id: string) => (state.data ?? []).find(workspace => workspace.id === id),
  }), [state.data, state.loading, state.error, state.reload]);

  return <WorkspacesContext.Provider value={value}>{children}</WorkspacesContext.Provider>;
}

export function useWorkspaces() {
  const value = useContext(WorkspacesContext);
  if (!value) {
    throw new Error("useWorkspaces must be used within WorkspacesProvider");
  }
  return value;
}
