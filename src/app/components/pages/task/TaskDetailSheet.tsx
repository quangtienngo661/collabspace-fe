import { useEffect, useRef, useState } from "react";
import { X, Edit2, Check, Trash2, Paperclip, Upload, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { StatusBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { TaskComments } from "./TaskComments";
import { TaskActivity } from "./TaskActivity";
import { toast } from "sonner";
import { taskApi } from "../../../api/taskApi";
import { useWorkspaceMemberUsers } from "../../../hooks/useWorkspaceMemberUsers";
import { initials } from "../../../api/mappers";
import type { Priority, Task, TaskStatus } from "../../../api/types";

interface TaskDetailSheetProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
}

const UNASSIGNED_VALUE = "unassigned";

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function TaskDetailSheet({ task, open, onClose, onUpdated, onDeleted }: TaskDetailSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);
  const [descriptionVal, setDescriptionVal] = useState(task.description);
  const [priorityVal, setPriorityVal] = useState<Priority | null>(task.priority);
  const [dueDateVal, setDueDateVal] = useState(toDatetimeLocalValue(task.dueDate));
  const [labelsVal, setLabelsVal] = useState(task.labels?.join(", ") ?? "");
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const usersState = useWorkspaceMemberUsers(task.workspaceId, open);
  const users = usersState.data?.map(u => ({ userId: u.id, name: u.name })) ?? [];

  useEffect(() => {
    setTitleVal(task.title);
    setDescriptionVal(task.description);
    setPriorityVal(task.priority);
    setDueDateVal(toDatetimeLocalValue(task.dueDate));
    setLabelsVal(task.labels?.join(", ") ?? "");
  }, [task.id, task.title, task.description, task.priority, task.dueDate, task.labels]);

  async function refreshTask() {
    const latest = await taskApi.get(task.id);
    onUpdated(latest);
  }

  async function handleStatusChange(val: string) {
    const nextStatus = val as TaskStatus;
    try {
      await taskApi.updateStatus(task.id, nextStatus);
      onUpdated({ ...task, status: nextStatus });
      toast.success(`Status changed to ${val}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update status");
    }
  }

  async function handleAssigneeChange(val: string) {
    const assigneeId = val === UNASSIGNED_VALUE ? null : val;
    try {
      await taskApi.assign(task.id, assigneeId);
      await refreshTask();
      toast.success("Assignee updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update assignee");
    }
  }

  async function handleTitleSave() {
    if (!titleVal.trim()) { setTitleVal(task.title); return; }
    try {
      await taskApi.updateDetails(task.id, {
        title: titleVal,
        description: descriptionVal,
        priority: priorityVal,
        dueDate: fromDatetimeLocalValue(dueDateVal),
        labels: labelsVal.split(",").map(label => label.trim()).filter(Boolean),
      });
      onUpdated({ ...task, title: titleVal });
      setEditingTitle(false);
      toast.success("Title updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update title");
    }
  }

  async function handleSaveDetails() {
    if (!titleVal.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      setSavingDetails(true);
      await taskApi.updateDetails(task.id, {
        title: titleVal.trim(),
        description: descriptionVal,
        priority: priorityVal,
        dueDate: fromDatetimeLocalValue(dueDateVal),
        labels: labelsVal.split(",").map(label => label.trim()).filter(Boolean),
      });
      await refreshTask();
      toast.success("Task details saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save details");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleUploadAttachment(file: File) {
    try {
      setUploading(true);
      await taskApi.uploadAttachment(task.id, file);
      await refreshTask();
      toast.success("Attachment uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload attachment");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAttachment(fileUrl: string) {
    try {
      await taskApi.deleteAttachment(task.id, fileUrl);
      await refreshTask();
      toast.success("Attachment removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove attachment");
    }
  }

  async function handleDeleteTask() {
    try {
      setDeleting(true);
      await taskApi.delete(task.id);
      toast.success("Task deleted");
      setDeleteOpen(false);
      onDeleted?.(task.id);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete task");
    } finally {
      setDeleting(false);
    }
  }

  const assignee = task.assignedTo;
  const creator = task.createdBy;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-[560px] p-0 flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 overflow-hidden">
          <SheetHeader className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-row items-center justify-between space-y-0">
            <SheetTitle className="sr-only">{task.title}</SheetTitle>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <StatusBadge status={task.status} />
              {editingTitle ? (
                <div className="flex items-center gap-1 flex-1">
                  <input className="text-sm font-semibold bg-transparent border-b border-blue-500 outline-none flex-1 text-slate-900 dark:text-slate-100" value={titleVal} onChange={e => setTitleVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter") void handleTitleSave(); if (e.key === "Escape") setEditingTitle(false); }} />
                  <button onClick={() => void handleTitleSave()} className="p-1 text-green-500 hover:text-green-600"><Check className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1 flex-1 min-w-0 group">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{task.title}</h2>
                  <button onClick={() => { setEditingTitle(true); setTitleVal(task.title); }} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="details" className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="px-5 pt-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <TabsList className="bg-transparent border-b-0 p-0 h-auto gap-4">
                  <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none pb-2 text-sm font-medium px-0">Details</TabsTrigger>
                  <TabsTrigger value="comments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none pb-2 text-sm font-medium px-0">Comments</TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none pb-2 text-sm font-medium px-0">Activity</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="flex-1 overflow-y-auto m-0">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Status</p>
                    <Select value={task.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="DOING">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Priority</p>
                    <Select
                      value={priorityVal ?? "medium"}
                      onValueChange={value => setPriorityVal(value as Priority)}
                    >
                      <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Assignee</p>
                    <Select value={task.assigneeId || UNASSIGNED_VALUE} onValueChange={handleAssigneeChange}>
                      <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                        {users.map(u => (
                          <SelectItem key={u.userId} value={u.userId}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Due date</p>
                    <Input
                      type="datetime-local"
                      className="h-8 text-xs"
                      value={dueDateVal}
                      onChange={e => setDueDateVal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Labels</p>
                    <Input
                      className="h-8 text-xs"
                      placeholder="bug, frontend, urgent"
                      value={labelsVal}
                      onChange={e => setLabelsVal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Created by</p>
                    {creator && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <UserAvatar
                          user={{
                            id: creator.userId,
                            userId: creator.userId,
                            name: creator.displayName || creator.fullName,
                            email: creator.email,
                            avatar: initials(creator.displayName || creator.fullName),
                            avatarUrl: creator.avatarUrl,
                            role: "member",
                            status: "offline",
                            joinedAt: "",
                          }}
                          size="xs"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{creator.displayName || creator.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">Description</Label>
                  <Textarea
                    value={descriptionVal}
                    onChange={e => setDescriptionVal(e.target.value)}
                    rows={4}
                    placeholder="Add a description..."
                    className="text-sm"
                  />
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => void handleSaveDetails()} disabled={savingDetails}>
                    {savingDetails ? "Saving..." : "Save details"}
                  </Button>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Attachments</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadAttachment(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {task.attachments.length === 0 ? (
                    <p className="text-sm text-slate-400">No attachments yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {task.attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{attachment.filename}</span>
                            {attachment.fileUrl && (
                              <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {attachment.fileUrl && (
                            <button
                              type="button"
                              className="text-xs text-red-500 hover:text-red-600"
                              onClick={() => void handleDeleteAttachment(attachment.fileUrl!)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="flex-1 overflow-hidden m-0">
                <TaskComments taskId={task.id} workspaceId={task.workspaceId} />
              </TabsContent>

              <TabsContent value="activity" className="flex-1 overflow-hidden m-0">
                <TaskActivity taskId={task.id} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete task"
        description={`Permanently delete "${task.title}"? This cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={() => void handleDeleteTask()}
        destructive
      />
    </>
  );
}
