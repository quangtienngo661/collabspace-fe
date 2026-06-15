import { useEffect, useState } from "react";
import { usersApi } from "../api/usersApi";
import type { UserStatus } from "../api/types";

const PRESENCE_POLL_MS = 30_000;

/** Polls GET /users/presence for the given user ids (30s interval). */
export function usePresenceMap(userIds: string[], enabled = true): Record<string, UserStatus> {
  const key = [...new Set(userIds.filter(Boolean))].sort().join(",");
  const [map, setMap] = useState<Record<string, UserStatus>>({});

  useEffect(() => {
    if (!enabled || !key) {
      setMap({});
      return;
    }

    const ids = key.split(",");
    let cancelled = false;

    async function load() {
      try {
        const next = await usersApi.presenceBulk(ids);
        if (!cancelled) setMap(next);
      } catch {
        /* presence is best-effort */
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), PRESENCE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [key, enabled]);

  return map;
}
