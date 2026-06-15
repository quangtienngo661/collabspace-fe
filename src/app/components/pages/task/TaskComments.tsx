import { useState } from "react";
import { toast } from "sonner";
import { Send, MoreHorizontal, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { UserAvatar } from "../../shared/UserAvatar";
import { taskApi } from "../../../api/taskApi";
import { useAuth } from "../../../auth/AuthContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { timeAgo } from "../../../utils/format";
import type { Comment } from "../../../api/types";

export function TaskComments({ taskId }: { taskId: string }) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const commentsState = useAsyncData(() => taskApi.listComments(taskId), [taskId]);
  const comments = commentsState.data ?? [];

  async function handleSend() {
    if (!content.trim()) return;
    try {
      setLoading(true);
      await taskApi.createComment(taskId, { content });
      setContent("");
      void commentsState.reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await taskApi.deleteComment(taskId, commentId);
      void commentsState.reload();
      toast.success("Comment deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete comment");
    }
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  async function handleSaveEdit(commentId: string) {
    if (!editContent.trim()) return;
    try {
      setEditLoading(true);
      await taskApi.updateComment(taskId, commentId, { content: editContent.trim() });
      setEditingId(null);
      setEditContent("");
      void commentsState.reload();
      toast.success("Comment updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update comment");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex-1 space-y-4 overflow-y-auto min-h-[300px] mb-4">
        {commentsState.loading && <div className="text-sm text-slate-500">Loading comments...</div>}
        {!commentsState.loading && comments.length === 0 && (
          <div className="text-sm text-slate-500">No comments yet.</div>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-3 group">
            <UserAvatar
              user={{
                id: c.authorId,
                userId: c.authorId,
                name: c.authorName ?? "Unknown",
                email: "",
                avatar: (c.authorName ?? "U").slice(0, 2).toUpperCase(),
                avatarUrl: c.authorAvatarUrl,
                role: "member",
                status: "offline",
                title: "",
                joinedAt: "",
              }}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.authorName}</span>
                  <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                </div>
                {profile?.id === c.authorId && editingId !== c.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-opacity">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(c)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => void handleDelete(c.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {editingId === c.id ? (
                <div className="mt-2 space-y-2">
                  <Input
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    disabled={editLoading}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSaveEdit(c.id);
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditContent("");
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 gap-1" disabled={editLoading || !editContent.trim()} onClick={() => void handleSaveEdit(c.id)}>
                      <Check className="w-3.5 h-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1" disabled={editLoading} onClick={() => { setEditingId(null); setEditContent(""); }}>
                      <X className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
              <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">
                {c.content}
              </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto flex gap-2 items-center">
        <Input
          placeholder="Write a comment..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          disabled={loading}
          className="flex-1"
        />
        <Button size="icon" disabled={!content.trim() || loading} onClick={handleSend}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
