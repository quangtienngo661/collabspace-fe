import { useEffect, useState } from "react";
import { X, Edit2, Check, Send, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader } from "../../ui/sheet";
import { StatusBadge, PriorityBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { cn } from "../../ui/utils";
import { toast } from "sonner";
import { taskApi } from "../../../api/taskApi";
import { initials } from "../../../api/mappers";
import { useAuth } from "../../../auth/AuthContext";
import { useWorkspaceMemberUsers } from "../../../hooks/useWorkspaceMemberUsers";
import { useAsyncData } from "../../../hooks/useAsyncData";
import type { ActivityItem, Comment, Task, TaskStatus } from "../../../api/types";
import { timeAgo } from "../../../utils/format";

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
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const { data: memberUsers } = useWorkspaceMemberUsers(task.workspaceId);
  const users = memberUsers?.map(u => ({ userId: u.id, name: u.name })) ?? [];

  const commentsState = useAsyncData(
    () => open ? taskApi.listComments(task.id).then(r => r.comments) : Promise.resolve([]),
    [task.id, open],
  );
  const activityState = useAsyncData(
    () => open ? taskApi.activity(task.id, { limit: 20 }).then(r => r.items) : Promise.resolve([]),
    [task.id, open],
  );

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
      void activityState.reload();
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
      void activityState.reload();
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
      void activityState.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update title");
    }
  }

  async function handlePostComment() {
    const content = commentText.trim();
    if (!content) return;
    setPostingComment(true);
    try {
      await taskApi.createComment(task.id, { content });
      setCommentText("");
      await commentsState.reload();
      void activityState.reload();
      toast.success("Comment added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to post comment");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(comment: Comment) {
    try {
      await taskApi.deleteComment(task.id, comment.id);
      await commentsState.reload();
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete comment");
    }
  }

  const assignee = task.assignedTo;
  const creator = task.createdBy;
  const comments = commentsState.data ?? [];
  const activity = activityState.data ?? [];

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

        <div className="flex-1 overflow-y-auto">
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

          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Activity</p>
            {activity.length === 0 ? (
              <p className="text-xs text-slate-400">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {activity.map((item: ActivityItem) => (
                  <div key={item.id} className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.actorName ?? "System"}</span>
                    {" — "}{item.summary}
                    <span className="ml-2 text-slate-400">{timeAgo(item.occurredAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Comments ({comments.length})</p>
            <div className="space-y-3 mb-4">
              {comments.filter(c => !c.deleted).map(comment => (
                <div key={comment.id} className={cn("rounded-lg border border-slate-100 dark:border-slate-800 p-3", comment.authorId === profile?.userId && "bg-slate-50/50 dark:bg-slate-800/30")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{comment.authorName ?? "User"}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(comment.createdAt)}</p>
                    </div>
                    {comment.authorId === profile?.userId && (
                      <button type="button" onClick={() => void handleDeleteComment(comment)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment… Use @username to mention"
                className="min-h-[72px] text-sm"
              />
              <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" disabled={postingComment || !commentText.trim()} onClick={() => void handlePostComment()}>
                <Send className="w-3.5 h-3.5" /> {postingComment ? "Posting…" : "Post comment"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
