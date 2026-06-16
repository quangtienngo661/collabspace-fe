import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Building2, Check, X, Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { workspaceApi } from "../../api/workspaceApi";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { toast } from "sonner";

export function InvitationsPage() {
  const navigate = useNavigate();
  const { setActiveWorkspace, reload: reloadWorkspaces } = useWorkspaces();
  const [searchParams] = useSearchParams();
  const [invitationId, setInvitationId] = useState(searchParams.get("id") ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) setInvitationId(id);
  }, [searchParams]);

  async function accept() {
    if (!invitationId.trim()) {
      toast.error("Enter an invitation id");
      return;
    }
    setLoading(true);
    try {
      const result = await workspaceApi.acceptInvitation(invitationId.trim());
      await reloadWorkspaces();
      toast.success("Invitation accepted");
      if (result.workspaceId) {
        setActiveWorkspace(result.workspaceId);
        navigate(`/workspaces/${result.workspaceId}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept invitation");
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!invitationId.trim()) {
      toast.error("Enter an invitation id");
      return;
    }
    setLoading(true);
    try {
      await workspaceApi.rejectInvitation(invitationId.trim());
      toast.success("Invitation declined");
      setInvitationId("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="text-center">
        <span className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white mb-4">
          <Building2 className="w-6 h-6" />
        </span>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Workspace invitation</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Accept a workspace invite from your notification, email link, or paste the invitation ID below.
        </p>
      </div>

      <Card className="p-4 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex gap-3 items-start">
        <Bell className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Fastest path: open <button type="button" className="text-blue-600 underline" onClick={() => navigate("/notifications")}>Notifications</button> and tap Accept on a workspace invite.
        </p>
      </Card>

      <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="space-y-1.5">
          <Label>Invitation ID</Label>
          <Input value={invitationId} onChange={e => setInvitationId(e.target.value)} placeholder="uuid" />
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white" disabled={loading} onClick={() => void accept()}>
            <Check className="w-4 h-4" /> Accept
          </Button>
          <Button variant="outline" className="flex-1 gap-1.5" disabled={loading} onClick={() => void reject()}>
            <X className="w-4 h-4" /> Decline
          </Button>
        </div>
      </Card>
    </div>
  );
}
