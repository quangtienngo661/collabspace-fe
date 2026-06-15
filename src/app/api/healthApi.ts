import { ApiError, apiRequest } from "./httpClient";
import { mapHealth } from "./mappers";
import type { HealthResult } from "./types";

async function check(name: string, path: string): Promise<HealthResult> {
  const startedAt = Date.now();
  try {
    return mapHealth(name, startedAt, await apiRequest(path, { auth: false }));
  } catch (error) {
    return {
      name,
      status: error instanceof ApiError && error.status === 404 ? "unknown" : "down",
      message: error instanceof Error ? error.message : "Health check failed",
      latency: null,
      lastCheck: new Date().toISOString(),
    };
  }
}

export const healthApi = {
  async all(): Promise<HealthResult[]> {
    const [auth, users, workspaces, tasks, notifications] = await Promise.all([
      check("Auth Service", "/auth/health"),
      check("User Service", "/users/health"),
      check("Workspace Service", "/workspaces/health"),
      check("Task Service", "/tasks/health/live"),
      check("Notification Service", "/notifications/health/live"),
    ]);

    return [
      auth,
      users,
      workspaces,
      tasks,
      notifications,
      {
        name: "Queue Metrics",
        status: "unknown",
        message: "Queue metrics are not exposed by the backend",
        latency: null,
        lastCheck: new Date().toISOString(),
      },
    ];
  },
};
