import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Plus, FolderOpen, Trash2, MoreHorizontal, CheckSquare, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { EmptyState, ErrorState } from "../../shared/EmptyState";
import { workspaceApi } from "../../../api/workspaceApi";
import { enrichProjectsTaskCounts } from "../../../api/clientStats";
import { useOpenTaskRedirect } from "../../../hooks/useTaskDeepLink";
import { useAsyncData } from "../../../hooks/useAsyncData";
import type { Project } from "../../../api/types";
import { toast } from "sonner";

export function ProjectListPage() {
  const { id: wsId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workspaceState = useAsyncData(() => wsId ? workspaceApi.get(wsId) : Promise.reject(new Error("Workspace id is missing")), [wsId]);
  const projectState = useAsyncData(
    () => wsId ? workspaceApi.listProjects(wsId).then(enrichProjectsTaskCounts) : Promise.resolve([]),
    [wsId],
  );
  const projectList = (projectState.data ?? []).filter(p => p.workspaceId === wsId);
  const ws = workspaceState.data?.id === wsId ? workspaceState.data : null;
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  useOpenTaskRedirect(wsId);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setCreateOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setForm({ name: project.name, description: project.description });
    setCreateOpen(true);
  }

  async function handleSave() {
    if (!wsId) return;
    if (!form.name.trim()) { toast.error("Project name is required"); return; }
    setLoading(true);
    try {
      if (editing) {
        const updated = await workspaceApi.updateProject(wsId, editing.id, form);
        projectState.setData(prev => (prev ?? []).map(project => project.id === updated.id ? updated : project));
        toast.success(`Project "${form.name}" updated`);
      } else {
        const created = await workspaceApi.createProject(wsId, form);
        projectState.setData(prev => [...(prev ?? []), created]);
        toast.success(`Project "${form.name}" created`);
      }
      setForm({ name: "", description: "" });
      setEditing(null);
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save project");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!wsId || !deleteId) return;
    try {
      await workspaceApi.deleteProject(wsId, deleteId);
      projectState.setData(prev => (prev ?? []).filter(project => project.id !== deleteId));
      setDeleteId(null);
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete project");
    }
  }

  const error = workspaceState.error || projectState.error;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{workspaceState.data?.name ?? "Workspace"} · {projectList.length} projects</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { void workspaceState.reload(); void projectState.reload(); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New Project
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState title="Unable to load projects" description={error} />
      ) : projectList.length === 0 && !projectState.loading ? (
        <EmptyState icon={FolderOpen} title="No projects yet" description="Create your first project to start organizing tasks." action={{ label: "New Project", onClick: openCreate }} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectList.map(project => (
            <Card key={project.id} className="p-5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/workspaces/${wsId}/projects/${project.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <FolderOpen className="size-[18px] text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                    {project.status}
                  </span>
                  <div onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(project); }}>Settings</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteId(project.id); }} className="text-red-600 dark:text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{project.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{project.description || "No description"}</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <CheckSquare className="w-3.5 h-3.5" />
                {project.taskCount} tasks
              </div>
            </Card>
          ))}

          <button onClick={openCreate} className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors text-slate-400 hover:text-blue-500">
            <Plus className="w-7 h-7" />
            <span className="text-sm font-medium">New project</span>
          </button>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Update Project" : "Create Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Project name *</Label>
              <Input placeholder="e.g. Mobile App v2" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="What is this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">{loading ? "Saving..." : editing ? "Save Project" : "Create Project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Project" description="This will delete the project in workspace-service." confirmLabel="Delete Project" onConfirm={handleDelete} destructive />
    </div>
  );
}
