import { useState, useEffect } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";

import { Button } from "../../ui/button";

import { Input } from "../../ui/input";

import { Label } from "../../ui/label";

import { Textarea } from "../../ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

import { toast } from "sonner";

import { taskApi } from "../../../api/taskApi";

import { workspaceApi } from "../../../api/workspaceApi";

import { useWorkspaceMemberUsers } from "../../../hooks/useWorkspaceMemberUsers";

import { useAsyncData } from "../../../hooks/useAsyncData";

import type { Task, TaskStatus } from "../../../api/types";



interface CreateTaskModalProps {

  open: boolean;

  onClose: () => void;

  projectId?: string | null;

  workspaceId: string;

  onCreated?: (task: Task) => void;

}



const UNASSIGNED_VALUE = "unassigned";
const NO_PROJECT_VALUE = "none";



const EMPTY_FORM = {

  title: "",

  description: "",

  priority: "medium",

  status: "TODO" as TaskStatus,

  assigneeId: UNASSIGNED_VALUE,

  dueDate: "",

  labels: "",

  selectedProjectId: NO_PROJECT_VALUE,

};



export function CreateTaskModal({ open, onClose, workspaceId, projectId = null, onCreated }: CreateTaskModalProps) {

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    selectedProjectId: projectId ?? NO_PROJECT_VALUE,
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const { data: memberUsers } = useWorkspaceMemberUsers(workspaceId, open);

  const users = memberUsers?.map(u => ({ id: u.id, name: u.name })) ?? [];

  const { data: projects } = useAsyncData(

    () => workspaceId ? workspaceApi.listProjects(workspaceId) : Promise.resolve([]),

    [workspaceId],

    { enabled: open && Boolean(workspaceId) },

  );



  useEffect(() => {

    if (!open) {

      setForm({ ...EMPTY_FORM, selectedProjectId: projectId ?? NO_PROJECT_VALUE });

      setError("");

    }

  }, [open, projectId]);



  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }



  async function handleSubmit() {

    if (!form.title.trim()) { setError("Task title is required"); return; }

    if (!workspaceId) { setError("Workspace is required"); return; }

    setError("");

    setLoading(true);

    try {

      const labels = form.labels

        .split(",")

        .map(s => s.trim())

        .filter(Boolean);

      const dueDate = form.dueDate ? new Date(form.dueDate).toISOString() : null;



      const resolvedProjectId =
        form.selectedProjectId === NO_PROJECT_VALUE ? null : form.selectedProjectId;

      const created = await taskApi.create({

        title: form.title,

        description: form.description,

        workspaceId,

        projectId: resolvedProjectId,

        priority: form.priority,

        dueDate,

        labels: labels.length > 0 ? labels : undefined,

      });

      if (form.assigneeId !== UNASSIGNED_VALUE) {

        await taskApi.assign(created.taskId, form.assigneeId);

      }

      if (form.status !== "TODO") {

        await taskApi.updateStatus(created.taskId, form.status);

      }

      const task = await taskApi.get(created.taskId);

      setLoading(false);

      onCreated?.({ ...task, projectId: resolvedProjectId, priority: form.priority as Task["priority"] });

      toast.success("Task created successfully");

      setForm(EMPTY_FORM);

      onClose();

    } catch (err) {

      setLoading(false);

      toast.error(err instanceof Error ? err.message : "Unable to create task");

    }

  }



  return (

    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle>Create New Task</DialogTitle>

        </DialogHeader>

        <div className="space-y-4 py-2">

          <div className="space-y-1.5">

            <Label>Task title *</Label>

            <Input placeholder="e.g. Implement user authentication" value={form.title}

              onChange={e => set("title", e.target.value)}

              className={error ? "border-red-500" : ""}

            />

            {error && <p className="text-xs text-red-500">{error}</p>}

          </div>

          <div className="space-y-1.5">

            <Label>Description</Label>

            <Textarea placeholder="Describe the task..." value={form.description}

              onChange={e => set("description", e.target.value)} rows={3}

            />

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-1.5">

              <Label>Priority</Label>

              <Select value={form.priority} onValueChange={v => set("priority", v)}>

                <SelectTrigger><SelectValue /></SelectTrigger>

                <SelectContent>

                  <SelectItem value="low">Low</SelectItem>

                  <SelectItem value="medium">Medium</SelectItem>

                  <SelectItem value="high">High</SelectItem>

                  <SelectItem value="critical">Critical</SelectItem>

                </SelectContent>

              </Select>

            </div>

            <div className="space-y-1.5">

              <Label>Status</Label>

              <Select value={form.status} onValueChange={v => set("status", v)}>

                <SelectTrigger><SelectValue /></SelectTrigger>

                <SelectContent>

                  <SelectItem value="TODO">To Do</SelectItem>

                  <SelectItem value="DOING">In Progress</SelectItem>

                  <SelectItem value="DONE">Done</SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>

          <div className="space-y-1.5">

            <Label>Due date</Label>

            <Input
              type="datetime-local"
              value={form.dueDate}
              onChange={e => set("dueDate", e.target.value)}
              className="w-full"
            />

          </div>

          {projects && projects.length > 0 && (

            <div className="space-y-1.5">

              <Label>Project</Label>

              <Select value={form.selectedProjectId} onValueChange={v => set("selectedProjectId", v)}>

                <SelectTrigger><SelectValue placeholder="No project (workspace task)" /></SelectTrigger>

                <SelectContent>

                  <SelectItem value={NO_PROJECT_VALUE}>No project</SelectItem>

                  {projects.map(p => (

                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

          )}

          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-1.5">

              <Label>Assignee</Label>

              <Select value={form.assigneeId} onValueChange={v => set("assigneeId", v)}>

                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>

                <SelectContent>

                  <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>

                  {users.map(u => (

                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

            <div className="space-y-1.5">

              <Label>Labels</Label>

              <Input placeholder="bug, frontend" value={form.labels} onChange={e => set("labels", e.target.value)} />

            </div>

          </div>

        </div>

        <DialogFooter>

          <Button variant="outline" onClick={onClose}>Cancel</Button>

          <Button onClick={() => void handleSubmit()} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">

            {loading ? "Creating..." : "Create Task"}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

}

