import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Plus, Building2, Users, FolderOpen, MoreHorizontal, Trash2, Settings, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { workspaceApi } from "../../../api/workspaceApi";
import { enrichWorkspacesStats } from "../../../api/clientStats";
import { useWorkspaces } from "../../../context/WorkspacesContext";
import { useAuth } from "../../../auth/AuthContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { EmptyState, ErrorState } from "../../shared/EmptyState";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { toast } from "sonner";

export function WorkspaceListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, isAdmin } = useAuth();
  const canCreateWorkspace = !isAdmin;
  const { workspaces, loading: loadingList, error, reload, setActiveWorkspace } = useWorkspaces();
  const { data: enriched, reload: reloadStats } = useAsyncData(
    () => enrichWorkspacesStats(workspaces),
    [workspaces],
    { enabled: workspaces.length > 0 },
  );
  const wsList = enriched ?? workspaces;
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open);
    if (!open && searchParams.get("create") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  }

  function isWorkspaceOwner(ws: { ownerId: string }) {
    return Boolean(profile?.id && ws.ownerId === profile.id);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await workspaceApi.delete(deleteTarget.id);
      await reload();
      void reloadStats();
      toast.success(`Workspace "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete workspace");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("Workspace name is required"); return; }
    setLoading(true);
    try {
      const created = await workspaceApi.create(form);
      await reload();
      void reloadStats();
      setForm({ name: "", description: "" });
      setCreateOpen(false);
      setActiveWorkspace(created.id);
      toast.success(`Workspace "${form.name}" created`);
      navigate(`/workspaces/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Workspaces</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{loadingList ? "Loading..." : `${wsList.length} workspaces you're a member of`}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { void reload(); void reloadStats(); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          {canCreateWorkspace && (
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> New Workspace
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState title="Unable to load workspaces" description={error} />
      ) : wsList.length === 0 && !loadingList ? (
        <EmptyState icon={Building2} title="No workspaces yet" description="Create your first workspace to start collaborating." action={canCreateWorkspace ? { label: "New Workspace", onClick: () => setCreateOpen(true) } : undefined} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wsList.map(ws => (
            <Card key={ws.id} className="p-5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setActiveWorkspace(ws.id); navigate(`/workspaces/${ws.id}`); }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">{ws.name[0]}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ws.name}</h3>
                    <p className="text-xs text-slate-400">{ws.slug}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/workspaces/${ws.id}`); }}>
                      <Settings className="w-4 h-4 mr-2" /> Settings
                    </DropdownMenuItem>
                    {isWorkspaceOwner(ws) && (
                      <DropdownMenuItem
                        onClick={e => { e.stopPropagation(); setDeleteTarget({ id: ws.id, name: ws.name }); }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete workspace
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{ws.description || "No description"}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{ws.memberCount} members</span>
                <span className="flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" />{ws.projectCount} projects</span>
              </div>
            </Card>
          ))}

          {canCreateWorkspace && (
            <button onClick={() => setCreateOpen(true)} className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors text-slate-400 hover:text-blue-500">
              <Building2 className="w-8 h-8" />
              <span className="text-sm font-medium">Create new workspace</span>
            </button>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Workspace</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Workspace name *</Label>
              <Input placeholder="e.g. Acme Engineering" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="What is this workspace for?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCreateOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">{loading ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => { if (!open) setDeleteTarget(null); }}
        title="Delete workspace?"
        description={deleteTarget ? `Permanently delete "${deleteTarget.name}"? This cannot be undone.` : ""}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        destructive
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
