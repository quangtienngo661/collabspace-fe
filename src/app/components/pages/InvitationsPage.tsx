import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Check, X, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { workspaceApi } from "../../api/workspaceApi";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { ErrorState, EmptyState } from "../shared/EmptyState";
import { SkeletonRow } from "../shared/SkeletonCard";
import { formatAdminApiError } from "../../utils/errorUtils";
import { formatInviteError } from "../../utils/workspaceInviteErrors";
import { timeAgo } from "../../utils/format";
import { toast } from "sonner";

export function InvitationsPage() {
  const navigate = useNavigate();
  const { setActiveWorkspace, reload: reloadWorkspaces } = useWorkspaces();
  const [actingId, setActingId] = useState<string | null>(null);

  const invitationsState = useAsyncData(() => workspaceApi.listMyInvitations(), []);

  async function accept(invitationId: string, workspaceId: string) {
    setActingId(invitationId);
    try {
      await workspaceApi.acceptInvitation(invitationId);
      await reloadWorkspaces();
      await invitationsState.reload();
      toast.success("Invitation accepted");
    } catch (error) {
      toast.error(formatInviteError(error, "Unable to accept invitation"));
    } finally {
      setActingId(null);
    }
  }

  async function reject(invitationId: string) {
    setActingId(invitationId);
    try {
      await workspaceApi.rejectInvitation(invitationId);
      await invitationsState.reload();
      toast.success("Invitation declined");
    } catch (error) {
      toast.error(formatInviteError(error, "Unable to reject invitation"));
    } finally {
      setActingId(null);
    }
  }

  const invitations = invitationsState.data ?? [];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Workspace invitations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pending invites sent to your account email.
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void invitationsState.reload()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {invitationsState.error ? (
        <ErrorState title="Unable to load invitations" description={invitationsState.error} />
      ) : invitationsState.loading && invitations.length === 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No pending invitations"
          description="When someone invites you to a workspace, it will appear here and in Notifications."
          action={{ label: "Open notifications", onClick: () => navigate("/notifications") }}
        />
      ) : (
        <div className="space-y-3">
          {invitations.map(invitation => (
            <Card
              key={invitation.id}
              className="p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {invitation.workspaceName ?? "Workspace"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Invited as {invitation.inviteeEmail}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Sent {timeAgo(invitation.createdAt)} · Expires {timeAgo(invitation.expiresAt)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  disabled={actingId === invitation.id}
                  onClick={() => void accept(invitation.id, invitation.workspaceId)}
                >
                  <Check className="w-4 h-4" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={actingId === invitation.id}
                  onClick={() => void reject(invitation.id)}
                >
                  <X className="w-4 h-4" /> Decline
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
