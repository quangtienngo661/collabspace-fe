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
import { usersApi } from "../../../api/usersApi";
import type { Task, TaskStatus } from "../../../api/types";
import { useAsyncData } from "../../../hooks/useAsyncData";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string | null;
  workspaceId: string;
  onCreated?: (task: Task) => void;
}

const UNASSIGNED_VALUE = "unassigned";

export function CreateTaskModal({ open, onClose, workspaceId, projectId = null, onCreated }: CreateTaskModalProps) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "TODO" as TaskStatus, assigneeId: UNASSIGNED_VALUE });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: memberUsers } = useAsyncData(async () => {
    const members = await workspaceApi.members(workspaceId);
    const ids = members.map(member => member.userId).filter(Boolean);
    if (ids.length === 0) return [];
    return usersApi.bulk(ids);
  }, [workspaceId]);
  const users = memberUsers?.map(u => ({ id: u.id, name: u.name })) ?? [];

  // BUG-006 fix: reset form khi dialog đóng
  useEffect(() => {
    if (!open) {
      setForm({ title: "", description: "", priority: "medium", status: "TODO", assigneeId: UNASSIGNED_VALUE });
      setError("");
    }
  }, [open]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit() {
    if (!form.title.trim()) { setError("Task title is required"); return; }
    if (!workspaceId) { setError("Workspace is required"); return; }
    setError("");
    setLoading(true);
    try {
      const created = await taskApi.create({
        title: form.title,
        description: form.description,
        workspaceId,
        projectId,
        priority: form.priority,
      });
      if (form.assigneeId !== UNASSIGNED_VALUE) {
        await taskApi.assign(created.taskId, form.assigneeId);
      }
      if (form.status !== "TODO") {
        await taskApi.updateStatus(created.taskId, form.status);
      }
      const task = await taskApi.get(created.taskId);
      setLoading(false);
      onCreated?.({ ...task, projectId, priority: form.priority as Task["priority"] });
      toast.success("Task created successfully");
      setForm({ title: "", description: "", priority: "medium", status: "TODO", assigneeId: UNASSIGNED_VALUE });
      onClose();
    } catch (err) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Unable to create task");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
