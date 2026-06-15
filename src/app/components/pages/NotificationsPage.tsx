import { useState } from "react";
import { useNavigate } from "react-router";
import { Archive, Bell, Building2, Check, ClipboardList, MessageSquare, AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { EmptyState, ErrorState } from "../shared/EmptyState";
import { notificationsApi } from "../../api/notificationsApi";
import { getNotificationInvitationId } from "../../api/mappers";
import { workspaceApi } from "../../api/workspaceApi";
import { navigateFromNotification } from "../../utils/notificationNavigation";
import { useNotificationOpenTaskRedirect } from "../../hooks/useTaskDeepLink";
import { toast } from "sonner";
import type { Notification } from "../../api/types";
import { useAsyncData } from "../../hooks/useAsyncData";
import { timeAgo } from "../../utils/format";
import { cn } from "../ui/utils";


const notificationIconMap: Record<string, LucideIcon> = {
  task_assigned: ClipboardList,
  taskassigned: ClipboardList,
  comment_added: MessageSquare,
  commentadded: MessageSquare,
  comment_mentioned: MessageSquare,
  commentmentioned: MessageSquare,
  workspace_invited: Building2,
  workspaceinvited: Building2,
  system_alert: AlertTriangle,
  systemalert: AlertTriangle,
};

const notifTypeLabel: Record<string, string> = {
  task_assigned: "Task Assignment",
  taskassigned: "Task Assignment",
  comment_added: "Comment",
  commentadded: "Comment",
  comment_mentioned: "Mention",
  commentmentioned: "Mention",
  workspace_invited: "Workspace Invite",
  workspaceinvited: "Workspace Invite",
  system_alert: "System Alert",
  systemalert: "System Alert",
};

function normalizedType(type: string) {
  return type.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function NotifItem({ n, onRefresh }: { n: Notification; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState<'accepted' | 'rejected' | null>(null);
  const navigate = useNavigate();
  const type = normalizedType(n.type);
  const Icon = notificationIconMap[type] || Bell;
  const invitationId = getNotificationInvitationId(n);

  async function handleMarkRead() {
    try {
      setLoading(true);
      await notificationsApi.markRead(n.id);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to mark as read");
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!invitationId) {
      toast.error("Invitation id missing from notification");
      return;
    }
    try {
      setLoading(true);
      const result = await workspaceApi.acceptInvitation(invitationId);
      toast.success("Invitation accepted!");
      setActionDone("accepted");
      await notificationsApi.markRead(n.id);
      onRefresh();
      if (result.workspaceId) {
        navigate(`/workspaces/${result.workspaceId}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to accept invitation");
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!invitationId) {
      toast.error("Invitation id missing from notification");
      return;
    }
    try {
      setLoading(true);
      await workspaceApi.rejectInvitation(invitationId);
      toast.success("Invitation rejected");
      setActionDone('rejected');
      await notificationsApi.markRead(n.id);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject invitation");
      setLoading(false);
    }
  }

  return (
    <div 
      onClick={() => void navigateFromNotification(navigate, n)}
      className={cn(
        "flex gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30 cursor-pointer",
        !n.read && "bg-blue-50/50 dark:bg-blue-900/10",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {notifTypeLabel[type] ?? "Notification"}
            </span>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
            <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
          </div>
          {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />}
        </div>
        <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
          {type === "workspace_invited" && invitationId && !n.read && !actionDone && (
            <>
              <Button size="sm" variant="default" disabled={loading} onClick={handleAccept}>Accept</Button>
              <Button size="sm" variant="outline" disabled={loading} onClick={handleReject}>Reject</Button>
            </>
          )}
          {actionDone === 'accepted' && (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 self-center">Accepted</span>
          )}
          {actionDone === 'rejected' && (
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 self-center">Rejected</span>
          )}
          {!n.read && (
            <button
              type="button"
              disabled={loading}
              onClick={handleMarkRead}
              className="flex cursor-pointer items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Check className="size-3" /> Mark read
            </button>
          )}
          {!n.archived && (
            <button
              type="button"
              disabled
              title="Archive endpoint is not exposed by the backend yet"
              className="flex cursor-not-allowed items-center gap-1 text-xs text-slate-400"
            >
              <Archive className="size-3" /> Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [page, setPage] = useState(0);
  useNotificationOpenTaskRedirect();

  const notificationsState = useAsyncData<{ notifications: Notification[]; total: number; unreadCount: number }>(
    () => notificationsApi.list({ skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
    [page],
  );
  const notifs = notificationsState.data?.notifications ?? [];
  const total = notificationsState.data?.total ?? 0;
  const unreadCount = notificationsState.data?.unreadCount ?? 0;
  const active = notifs.filter(n => !n.archived);
  const archived = notifs.filter(n => n.archived);
  const unread = active.filter(n => !n.read);
  const pageStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = Math.min((page + 1) * PAGE_SIZE, total);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function filtered(list: Notification[]) {
    return list.filter(n => typeFilter === "all" || normalizedType(n.type) === typeFilter);
  }

  function handleTypeFilterChange(value: string) {
    setTypeFilter(value);
    setPage(0);
  }

  async function handleMarkAllRead() {
    try {
      setMarkAllLoading(true);
      await notificationsApi.markAllRead();
      notificationsState.reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to mark all as read");
    } finally {
      setMarkAllLoading(false);
    }
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {notificationsState.loading
              ? "Loading notifications..."
              : `${unreadCount} unread · ${total} total`}
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          <select
            value={typeFilter}
            onChange={e => handleTypeFilterChange(e.target.value)}
            className="h-8 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:w-36"
          >
            <option value="all">All types</option>
            <option value="task_assigned">Task assigned</option>
            <option value="comment_added">Comments</option>
            <option value="comment_mentioned">Mentions</option>
            <option value="workspace_invited">Workspace invites</option>
            <option value="system_alert">System alerts</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={markAllLoading || unreadCount === 0}
            onClick={handleMarkAllRead}
            className="h-8 w-full min-w-0 shrink gap-1.5 text-xs sm:w-auto sm:shrink-0"
          >
            <Check className="size-3.5" />
            Mark all read
          </Button>
        </div>
      </div>

      {notificationsState.error ? (
        <ErrorState
          title="Could not load notifications"
          description={notificationsState.error}
          className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
        />
      ) : (
        <Tabs defaultValue="inbox">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="inbox">
              Inbox
              {unreadCount > 0 && <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">{unreadCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-4">
            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              {notificationsState.loading ? (
                <EmptyState icon={Bell} title="Loading notifications..." />
              ) : filtered(unread).length === 0 ? (
                <EmptyState icon={Bell} title="All caught up" description="You have no unread notifications." />
              ) : filtered(unread).map(n => <NotifItem key={n.id} n={n} onRefresh={notificationsState.reload} />)}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              {filtered(active).length === 0 ? (
                <EmptyState icon={Bell} title="No notifications" description="The backend returned no active notifications." />
              ) : filtered(active).map(n => <NotifItem key={n.id} n={n} onRefresh={notificationsState.reload} />)}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="mt-4">
            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              {filtered(archived).length === 0 ? (
                <EmptyState icon={Archive} title="No archived notifications" />
              ) : filtered(archived).map(n => <NotifItem key={n.id} n={n} onRefresh={notificationsState.reload} />)}
            </div>
          </TabsContent>

          {!notificationsState.loading && total > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {pageStart}–{pageEnd} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0 || notificationsState.loading}
                  onClick={() => setPage(current => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= totalPages || notificationsState.loading}
                  onClick={() => setPage(current => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Tabs>
      )}
    </div>
  );
}
