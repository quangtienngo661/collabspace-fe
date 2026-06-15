import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Input } from "../ui/input";
import type { User } from "../../api/types";
import { cn } from "../ui/utils";

interface MentionCommentInputProps {
  value: string;
  onChange: (value: string) => void;
  members: User[];
  placeholder?: string;
  disabled?: boolean;
  onSubmit?: () => void;
  className?: string;
}

function mentionCandidates(members: User[], query: string): User[] {
  const q = query.toLowerCase();
  return members
    .filter(m => {
      const username = m.username?.toLowerCase() ?? "";
      const name = m.name.toLowerCase();
      return username.includes(q) || name.includes(q);
    })
    .slice(0, 8);
}

export function MentionCommentInput({
  value,
  onChange,
  members,
  placeholder = "Write a comment...",
  disabled,
  onSubmit,
  className,
}: MentionCommentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [highlight, setHighlight] = useState(0);

  const candidates = useMemo(
    () => (mentionOpen ? mentionCandidates(members, mentionQuery) : []),
    [members, mentionOpen, mentionQuery],
  );

  function updateMentionState(next: string, cursor: number) {
    const before = next.slice(0, cursor);
    const at = before.lastIndexOf("@");
    if (at >= 0 && (at === 0 || /\s/.test(before[at - 1]!))) {
      const query = before.slice(at + 1);
      if (!/\s/.test(query)) {
        setMentionOpen(true);
        setMentionQuery(query);
        setMentionStart(at);
        setHighlight(0);
        return;
      }
    }
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
  }

  function pick(user: User) {
    if (mentionStart < 0) return;
    const handle = user.username || user.name.replace(/\s+/g, "").toLowerCase();
    const before = value.slice(0, mentionStart);
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const after = value.slice(cursor);
    const next = `${before}@${handle} ${after}`;
    onChange(next);
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const pos = before.length + handle.length + 2;
      inputRef.current?.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (mentionOpen && candidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight(h => (h + 1) % candidates.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight(h => (h - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        pick(candidates[highlight]!);
        return;
      }
      if (e.key === "Escape") {
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className={cn("relative flex-1", className)}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={e => {
          onChange(e.target.value);
          updateMentionState(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={onKeyDown}
        onClick={e => updateMentionState(value, (e.target as HTMLInputElement).selectionStart ?? value.length)}
      />
      {mentionOpen && candidates.length > 0 && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-full max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {candidates.map((user, i) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700",
                i === highlight && "bg-slate-100 dark:bg-slate-700",
              )}
              onMouseDown={e => {
                e.preventDefault();
                pick(user);
              }}
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
              {user.username && <span className="text-xs text-slate-400">@{user.username}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
