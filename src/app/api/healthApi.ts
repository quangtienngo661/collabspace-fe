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
    const [auth, users, workspaces] = await Promise.all([
      check("Auth Service", "/auth/health"),
      check("User Service", "/users/health"),
      check("Workspace Service", "/workspaces/health"),
    ]);

    return [
      auth,
      users,
      workspaces,
      {
        name: "Task Service",
        status: "unknown",
        message: "No gateway health endpoint",
        latency: null,
        lastCheck: new Date().toISOString(),
      },
      {
        name: "Notification Service",
        status: "unknown",
        message: "No HTTP controller exposed",
        latency: null,
        lastCheck: new Date().toISOString(),
      },
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
