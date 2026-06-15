import type { NavigateFunction } from "react-router";
import { getNotificationInvitationId } from "../api/mappers";
import { taskApi } from "../api/taskApi";
import type { Notification } from "../api/types";

function isTaskNotification(notification: Notification): boolean {
  const type = notification.type.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return (
    notification.targetType === "task"
    || type === "task_assigned"
    || type === "comment_added"
    || type === "comment_mentioned"
  );
}

export async function navigateFromNotification(
  navigate: NavigateFunction,
  notification: Notification,
): Promise<void> {
  if (isTaskNotification(notification) && notification.targetId) {
    const metadata = notification.metadata ?? {};
    const workspaceId = typeof metadata.workspaceId === "string" ? metadata.workspaceId : undefined;
    const projectId = typeof metadata.projectId === "string" ? metadata.projectId : undefined;

    try {
      const task = projectId && workspaceId ? null : await taskApi.get(notification.targetId);
      const ws = workspaceId ?? task?.workspaceId;
      const pid = projectId ?? task?.projectId ?? null;

      if (ws && pid) {
        navigate(`/workspaces/${ws}/projects/${pid}?task=${notification.targetId}`);
        return;
      }
      if (ws) {
        navigate(`/workspaces/${ws}/projects?openTask=${notification.targetId}`);
        return;
      }
    } catch {
      // Fall through to default link.
    }
  }

  if (getNotificationInvitationId(notification)) {
    navigate(notification.link);
    return;
  }

  navigate(notification.link || "/notifications");
}
