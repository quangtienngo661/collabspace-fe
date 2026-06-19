import { createContext, useContext, useEffect, useMemo, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { notificationsApi } from "../api/notificationsApi";
import { invalidateCachedRequestPrefix } from "../api/requestCache";
import { useAuth } from "../auth/AuthContext";
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
  const { session } = useAuth();
  const state = useAsyncData(() => notificationsApi.list(), []);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    let reconnectTimer: number | null = null;
    let fallbackPollTimer: number | null = null;
    let aborted = false;
    let reloadQueued = false;
    let streamAbortController: AbortController | null = null;

    const clearFallbackPolling = () => {
      if (fallbackPollTimer !== null) {
        window.clearInterval(fallbackPollTimer);
        fallbackPollTimer = null;
      }
    };

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReload = () => {
      if (reloadQueued) return;
      reloadQueued = true;
      window.setTimeout(() => {
        reloadQueued = false;
        invalidateCachedRequestPrefix("notifications:");
        void state.reload();
      }, 150);
    };

    const startFallbackPolling = () => {
      if (fallbackPollTimer !== null) return;
      fallbackPollTimer = window.setInterval(() => {
        invalidateCachedRequestPrefix("notifications:");
        void state.reload();
      }, NOTIFICATION_POLL_MS);
    };

    const scheduleReconnect = () => {
      if (aborted || reconnectTimer !== null) return;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, 5_000);
    };

    const connect = async () => {
      if (aborted) return;
      clearFallbackPolling();
      streamAbortController?.abort();
      streamAbortController = new AbortController();

      try {
        await notificationsApi.stream(streamAbortController.signal, (event) => {
          if (event.payload?.type === "notification.created") {
            scheduleReload();
          }
        });

        if (!aborted) {
          startFallbackPolling();
          scheduleReconnect();
        }
      } catch {
        if (!aborted && !streamAbortController.signal.aborted) {
          startFallbackPolling();
          scheduleReconnect();
        }
      }
    };

    invalidateCachedRequestPrefix("notifications:");
    void state.reload();
    void connect();

    return () => {
      aborted = true;
      streamAbortController?.abort();
      clearFallbackPolling();
      clearReconnectTimer();
    };
  }, [session?.accessToken, state.reload]);

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
