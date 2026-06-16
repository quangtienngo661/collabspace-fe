import { useEffect } from "react";
import { usersApi } from "../api/usersApi";
import { useAuth } from "../auth/AuthContext";

const HEARTBEAT_MS = 60_000;
const PRESENCE_CLAIM_KEY = "collabspace:session-presence";

/**
 * Claims online presence once per browser session (tab reload keeps away/busy/invisible).
 * Heartbeat updates lastSeenAt while online and tab is visible.
 */
export function useSessionPresence() {
  const { session, profile, setProfile } = useAuth();

  useEffect(() => {
    if (!session?.accessToken || !profile) return;
    if (sessionStorage.getItem(PRESENCE_CLAIM_KEY)) return;

    sessionStorage.setItem(PRESENCE_CLAIM_KEY, "1");
    if (profile.status !== "offline") return;

    void usersApi
      .declareOnline()
      .then(() => usersApi.me())
      .then(setProfile)
      .catch(() => undefined);
  }, [session?.accessToken, profile, setProfile]);

  useEffect(() => {
    if (!session?.accessToken || !profile) return;

    function heartbeat() {
      if (document.visibilityState !== "visible") return;
      if (profile.status !== "online") return;
      void usersApi.updateStatus("online").catch(() => undefined);
    }

    heartbeat();
    const timer = window.setInterval(heartbeat, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && profile.status === "online") {
        void usersApi.updateStatus("online").catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session?.accessToken, profile?.status, profile?.userId]);
}
