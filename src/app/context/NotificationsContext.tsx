import { createContext, useContext, useEffect, useMemo, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { notificationsApi } from "../api/notificationsApi";
import { useAsyncData } from "../hooks/useAsyncData";
import type { Notification } from "../api/types";

export interface NotificationsSnapshot {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

interface NotificationsContextValue {
  data: NotificationsSnapshot | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<NotificationsSnapshot | null>>;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const NOTIFICATION_POLL_MS = 45_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const state = useAsyncData(() => notificationsApi.list(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void state.reload();
    }, NOTIFICATION_POLL_MS);
    return () => window.clearInterval(timer);
  }, [state.reload]);

  const value = useMemo<NotificationsContextValue>(() => ({
    data: state.data,
    loading: state.loading,
    error: state.error,
    reload: state.reload,
    setData: state.setData,
    unreadCount: state.data?.unreadCount ?? state.data?.notifications.filter(n => !n.read && !n.archived).length ?? 0,
  }), [state.data, state.loading, state.error, state.reload, state.setData]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return value;
}
