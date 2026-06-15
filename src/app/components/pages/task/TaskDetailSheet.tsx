import { useEffect, useState } from "react";
import { X, Edit2, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader } from "../../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { StatusBadge, PriorityBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { TaskComments } from "./TaskComments";
import { TaskActivity } from "./TaskActivity";
import { cn } from "../../ui/utils";
import { toast } from "sonner";
import { taskApi } from "../../../api/taskApi";
import { workspaceApi } from "../../../api/workspaceApi";
import { usersApi } from "../../../api/usersApi";
import { initials } from "../../../api/mappers";
import { useAuth } from "../../../auth/AuthContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import type { Task, TaskStatus } from "../../../api/types";

interface TaskDetailSheetProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

const UNASSIGNED_VALUE = "unassigned";

export function TaskDetailSheet({ task, open, onClose, onUpdated }: TaskDetailSheetProps) {
  const { profile } = useAuth();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);

  const usersState = useAsyncData(async () => {
    const members = await workspaceApi.members(task.workspaceId);
    return usersApi.bulk(members.map(m => m.userId));
  }, [task.workspaceId]);
  const users = usersState.data?.map(u => ({ userId: u.id, name: u.name })) ?? [];

  useEffect(() => {
    setTitleVal(task.title);
  }, [task.id, task.title]);

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
      await taskApi.updateDetails(task.id, { title: titleVal, description: task.description });
      onUpdated({ ...task, title: titleVal });
      setEditingTitle(false);
      toast.success("Title updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update title");
    }
  }

  const assignee = task.assignedTo;
  const creator = task.createdBy;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[560px] p-0 flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 overflow-hidden">
        <SheetHeader className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-row items-center justify-between space-y-0">
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
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="details" className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="px-5 pt-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <TabsList className="bg-transparent border-b-0 p-0 h-auto gap-4">
                <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none pb-2 text-sm font-medium px-0">Details</TabsTrigger>
                <TabsTrigger value="comments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none pb-2 text-sm font-medium px-0">
                  Comments
                </TabsTrigger>
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
                  <PriorityBadge priority={task.priority} className="mt-2" />
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
                  {assignee && <p className="text-[10px] text-slate-400">{assignee.displayName || assignee.fullName}</p>}
                </div>
                <div className="space-y-1">
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
                          title: "",
                          department: "",
                          joinedAt: "",
                        }}
                        size="xs"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{creator.displayName || creator.fullName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{task.description || <span className="text-slate-400 italic">No description</span>}</p>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 overflow-hidden m-0">
              <TaskComments taskId={task.id} />
            </TabsContent>

            <TabsContent value="activity" className="flex-1 overflow-hidden m-0">
              <TaskActivity taskId={task.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
