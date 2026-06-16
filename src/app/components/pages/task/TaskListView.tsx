import type { Task } from "../../../api/types";
import { StatusBadge, PriorityBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Paperclip } from "lucide-react";
import { initials } from "../../../api/mappers";
import { formatDueDate } from "../../../utils/format";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent">
            <TableHead className="text-xs text-slate-500">Task</TableHead>
            <TableHead className="text-xs text-slate-500 hidden md:table-cell">Status</TableHead>
            <TableHead className="text-xs text-slate-500 hidden md:table-cell">Priority</TableHead>
            <TableHead className="text-xs text-slate-500 hidden lg:table-cell">Assignee</TableHead>
            <TableHead className="text-xs text-slate-500 hidden lg:table-cell">Due</TableHead>
            <TableHead className="text-xs text-slate-500 w-16 hidden md:table-cell"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-400">No tasks found</TableCell>
            </TableRow>
          ) : tasks.map(task => {
            const assignee = task.assignedTo;
            return (
              <TableRow key={task.id} className="border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30" onClick={() => onTaskClick(task)}>
                <TableCell className="py-2.5">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{task.title}</span>
                </TableCell>
                <TableCell className="py-2.5 hidden md:table-cell"><StatusBadge status={task.status} /></TableCell>
                <TableCell className="py-2.5 hidden md:table-cell"><PriorityBadge priority={task.priority} /></TableCell>
                <TableCell className="py-2.5 hidden lg:table-cell">
                  {assignee ? (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar
                        user={{
                          id: assignee.userId,
                          userId: assignee.userId,
                          name: assignee.displayName || assignee.fullName,
                          email: assignee.email,
                          avatar: initials(assignee.displayName || assignee.fullName),
                          avatarUrl: assignee.avatarUrl,
                          role: "member",
                          status: "offline",
                          title: "",
                          department: "",
                          joinedAt: "",
                        }}
                        size="xs"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{assignee.displayName || assignee.fullName}</span>
                    </div>
                  ) : <span className="text-xs text-slate-400">Unassigned</span>}
                </TableCell>
                <TableCell className="py-2.5 hidden lg:table-cell text-xs text-slate-500">{task.dueDate ? formatDueDate(task.dueDate) : "—"}</TableCell>
                <TableCell className="py-2.5 hidden md:table-cell">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    {task.attachmentCount > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{task.attachmentCount}</span>}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
