import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Send, MoreHorizontal, Trash2, Pencil, Check, X, Reply } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { UserAvatar } from "../../shared/UserAvatar";
import { MentionCommentInput } from "../../shared/MentionCommentInput";
import { taskApi } from "../../../api/taskApi";
import { useAuth } from "../../../auth/AuthContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { useWorkspaceMemberUsers } from "../../../hooks/useWorkspaceMemberUsers";
import { timeAgo } from "../../../utils/format";
import type { Comment, User } from "../../../api/types";

interface CommentNode extends Comment {
  children: CommentNode[];
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const c of comments) {
    nodes.set(c.id, { ...c, children: [] });
  }
  const roots: CommentNode[] = [];
  for (const c of comments) {
    const node = nodes.get(c.id)!;
    if (c.parentId && nodes.has(c.parentId)) {
      nodes.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function renderMentionContent(content: string) {
  const parts = content.split(/(@[a-z0-9._-]+)/gi);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-blue-600 dark:text-blue-400">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function CommentRow({
  comment,
  depth,
  profileId,
  editingId,
  editContent,
  editLoading,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReply,
  setEditContent,
}: {
  comment: CommentNode;
  depth: number;
  profileId?: string;
  editingId: string | null;
  editContent: string;
  editLoading: boolean;
  onStartEdit: (c: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (c: Comment) => void;
  setEditContent: (v: string) => void;
}) {
  return (
    <div className={depth > 0 ? "ml-6 border-l border-slate-200 pl-3 dark:border-slate-700" : ""}>
      <div className="flex gap-3 group py-2">
        <UserAvatar
          user={{
            id: comment.authorId,
            userId: comment.authorId,
            name: comment.authorName ?? "Unknown",
            email: "",
            avatar: (comment.authorName ?? "U").slice(0, 2).toUpperCase(),
            avatarUrl: comment.authorAvatarUrl,
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
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{comment.authorName}</span>
              <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
            </div>
            {profileId === comment.authorId && editingId !== comment.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-opacity">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onReply(comment)}>
                    <Reply className="w-4 h-4 mr-2" /> Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStartEdit(comment)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => void onDelete(comment.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {profileId !== comment.authorId && (
              <Button variant="ghost" size="sm" className="h-7 opacity-0 group-hover:opacity-100 text-xs" onClick={() => onReply(comment)}>
                <Reply className="w-3 h-3 mr-1" /> Reply
              </Button>
            )}
          </div>
          {editingId === comment.id ? (
            <div className="mt-2 space-y-2">
              <Input value={editContent} onChange={e => setEditContent(e.target.value)} disabled={editLoading} />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 gap-1" disabled={editLoading || !editContent.trim()} onClick={() => void onSaveEdit(comment.id)}>
                  <Check className="w-3.5 h-3.5" /> Save
                </Button>
                <Button size="sm" variant="outline" className="h-7 gap-1" disabled={editLoading} onClick={onCancelEdit}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">
              {renderMentionContent(comment.content)}
            </div>
          )}
        </div>
      </div>
      {comment.children.map(child => (
        <CommentRow
          key={child.id}
          comment={child}
          depth={depth + 1}
          profileId={profileId}
          editingId={editingId}
          editContent={editContent}
          editLoading={editLoading}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSaveEdit={onSaveEdit}
          onDelete={onDelete}
          onReply={onReply}
          setEditContent={setEditContent}
        />
      ))}
    </div>
  );
}

export function TaskComments({ taskId, workspaceId }: { taskId: string; workspaceId: string }) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const commentsState = useAsyncData(() => taskApi.listComments(taskId), [taskId]);
  const membersState = useWorkspaceMemberUsers(workspaceId, true);
  const members: User[] = membersState.data ?? [];
  const tree = useMemo(() => buildCommentTree(commentsState.data ?? []), [commentsState.data]);

  async function handleSend() {
    if (!content.trim()) return;
    try {
      setLoading(true);
      await taskApi.createComment(taskId, {
        content: content.trim(),
        parentId: replyTo?.id ?? null,
      });
      setContent("");
      setReplyTo(null);
      void commentsState.reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to post comment");
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete comment");
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update comment");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex-1 space-y-1 overflow-y-auto min-h-[300px] mb-4">
        {commentsState.loading && <div className="text-sm text-slate-500">Loading comments...</div>}
        {!commentsState.loading && tree.length === 0 && (
          <div className="text-sm text-slate-500">No comments yet. Use @username to mention someone.</div>
        )}
        {tree.map(c => (
          <CommentRow
            key={c.id}
            comment={c}
            depth={0}
            profileId={profile?.id}
            editingId={editingId}
            editContent={editContent}
            editLoading={editLoading}
            onStartEdit={startEdit}
            onCancelEdit={() => { setEditingId(null); setEditContent(""); }}
            onSaveEdit={handleSaveEdit}
            onDelete={handleDelete}
            onReply={setReplyTo}
            setEditContent={setEditContent}
          />
        ))}
      </div>

      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-slate-100 px-3 py-1.5 text-xs dark:bg-slate-800">
          <span>Replying to <strong>{replyTo.authorName}</strong></span>
          <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => setReplyTo(null)}>Cancel</button>
        </div>
      )}

      <div className="mt-auto flex gap-2 items-center">
        <MentionCommentInput
          value={content}
          onChange={setContent}
          members={members}
          placeholder={replyTo ? "Write a reply..." : "Write a comment... (@ to mention)"}
          disabled={loading}
          onSubmit={() => void handleSend()}
        />
        <Button size="icon" disabled={!content.trim() || loading} onClick={() => void handleSend()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
