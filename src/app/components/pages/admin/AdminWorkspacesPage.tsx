import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Textarea } from "../../ui/textarea";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { ErrorState } from "../../shared/EmptyState";
import { adminApi } from "../../../api/adminApi";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { AdminWorkspaceLayout } from "./AdminWorkspaceLayout";
import { toast } from "sonner";

interface AdminWorkspacesPageProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function AdminWorkspacesPage({ dark, onToggleDark }: AdminWorkspacesPageProps) {
  const workspacesState = useAsyncData(() => adminApi.listWorkspaces(), []);
  const workspaces = workspacesState.data ?? [];
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState<string | null>(null);
  const [joinReason, setJoinReason] = useState("Platform admin audit join");

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await adminApi.forceDeleteWorkspace(deleteId);
      toast.success("Workspace deleted");
      setDeleteId(null);
      await workspacesState.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete workspace");
    }
  }

  async function confirmForceJoin() {
    if (!joinId) return;
    try {
      await adminApi.forceJoinWorkspace(joinId, joinReason.trim() || "Platform admin audit");
      toast.success("Joined workspace as admin");
      setJoinId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to force-join workspace");
    }
  }

  return (
    <AdminWorkspaceLayout
      title="Workspaces"
      description="Platform-wide workspace administration."
      dark={dark}
      onToggleDark={onToggleDark}
    >
      <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {workspacesState.error ? (
          <ErrorState title="Unable to load workspaces" description={workspacesState.error} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.map(ws => (
                <TableRow key={ws.id}>
                  <TableCell className="font-medium">{ws.name}</TableCell>
                  <TableCell>{ws.memberCount}</TableCell>
                  <TableCell className="font-mono text-xs">{ws.ownerId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(ws.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setJoinId(ws.id)}>
                      Force join
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setDeleteId(ws.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Force delete workspace?"
        description="This permanently removes the workspace and cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
      />

      {joinId && (
        <Card className="mt-4 p-4 space-y-3 border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium">Force join workspace {joinId.slice(0, 8)}…</p>
          <Textarea value={joinReason} onChange={e => setJoinReason(e.target.value)} rows={2} placeholder="Audit reason" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void confirmForceJoin()}>Confirm join</Button>
            <Button size="sm" variant="outline" onClick={() => setJoinId(null)}>Cancel</Button>
          </div>
        </Card>
      )}

    </AdminWorkspaceLayout>
  );
}
