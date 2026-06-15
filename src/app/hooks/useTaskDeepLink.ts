import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { taskApi } from "../api/taskApi";
import type { Task } from "../api/types";

type UseTaskDeepLinkOptions = {
  workspaceId?: string;
  projectId?: string;
  onOpen: (task: Task) => void;
};

export function useTaskDeepLink({ workspaceId, projectId, onOpen }: UseTaskDeepLinkOptions) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const taskId = searchParams.get("task");

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    void (async () => {
      try {
        const task = await taskApi.get(taskId);
        if (cancelled) return;

        if (task.projectId && projectId && task.projectId !== projectId) {
          navigate(
            `/workspaces/${task.workspaceId}/projects/${task.projectId}?task=${taskId}`,
            { replace: true },
          );
          return;
        }

        if (task.projectId && !projectId && workspaceId) {
          navigate(
            `/workspaces/${task.workspaceId}/projects/${task.projectId}?task=${taskId}`,
            { replace: true },
          );
          return;
        }

        onOpen(task);
        setSearchParams(
          prev => {
            const next = new URLSearchParams(prev);
            next.delete("task");
            return next;
          },
          { replace: true },
        );
      } catch {
        if (!cancelled) {
          toast.error("Unable to open task from link");
          setSearchParams(
            prev => {
              const next = new URLSearchParams(prev);
              next.delete("task");
              return next;
            },
            { replace: true },
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId, workspaceId, projectId, navigate, onOpen, setSearchParams]);
}

export function useOpenTaskRedirect(workspaceId?: string) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get("openTask");

  useEffect(() => {
    if (!openTaskId || !workspaceId) return;

    let cancelled = false;

    void (async () => {
      try {
        const task = await taskApi.get(openTaskId);
        if (cancelled) return;

        if (task.projectId) {
          navigate(
            `/workspaces/${workspaceId}/projects/${task.projectId}?task=${openTaskId}`,
            { replace: true },
          );
          return;
        }

        toast.error("This task is not linked to a project board yet.");
      } catch {
        if (!cancelled) {
          toast.error("Unable to open task from notification");
        }
      } finally {
        if (!cancelled) {
          setSearchParams(
            prev => {
              const next = new URLSearchParams(prev);
              next.delete("openTask");
              return next;
            },
            { replace: true },
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [openTaskId, workspaceId, navigate, setSearchParams]);
}

export function useNotificationOpenTaskRedirect() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openTaskId = searchParams.get("openTask");

  useEffect(() => {
    if (!openTaskId) return;

    let cancelled = false;

    void (async () => {
      try {
        const task = await taskApi.get(openTaskId);
        if (cancelled) return;

        if (task.projectId) {
          navigate(
            `/workspaces/${task.workspaceId}/projects/${task.projectId}?task=${openTaskId}`,
            { replace: true },
          );
          return;
        }

        toast.error("This task is not linked to a project board yet.");
      } catch {
        if (!cancelled) {
          toast.error("Unable to open task from notification");
        }
      } finally {
        if (!cancelled) {
          setSearchParams(
            prev => {
              const next = new URLSearchParams(prev);
              next.delete("openTask");
              return next;
            },
            { replace: true },
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [openTaskId, navigate, setSearchParams]);
}
