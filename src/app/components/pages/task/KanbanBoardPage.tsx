import { useState, useCallback } from "react";
import { useParams } from "react-router";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, List, Columns3, Search, MessageSquare, Paperclip, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { StatusBadge, PriorityBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { EmptyState, ErrorState } from "../../shared/EmptyState";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { TaskListView } from "./TaskListView";
import { toast } from "sonner";
import { cn } from "../../ui/utils";
import { taskApi } from "../../../api/taskApi";
import { workspaceApi } from "../../../api/workspaceApi";
import { usersApi } from "../../../api/usersApi";
import { initials } from "../../../api/mappers";
import { useAsyncData } from "../../../hooks/useAsyncData";
import type { Task, TaskStatus } from "../../../api/types";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "TODO", label: "To Do", color: "border-t-slate-400" },
  { status: "DOING", label: "In Progress", color: "border-t-blue-500" },
  { status: "DONE", label: "Done", color: "border-t-green-500" },
];

const ITEM_TYPE = "TASK_CARD";

function KanbanCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const assignee = task.assignedTo;
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: task.id, status: task.status },
    collect: m => ({ isDragging: m.isDragging() }),
  }));

  return (
    <div
      ref={drag as any}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all space-y-2 group",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug">{task.title}</p>
      <div className="flex items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-slate-400">
          {task.commentCount > 0 && <span className="flex items-center gap-0.5 text-[10px]"><MessageSquare className="w-3 h-3" />{task.commentCount}</span>}
          {task.attachmentCount > 0 && <span className="flex items-center gap-0.5 text-[10px]"><Paperclip className="w-3 h-3" />{task.attachmentCount}</span>}
        </div>
        {assignee ? (
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
        ) : <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" />}
      </div>
    </div>
  );
}

function KanbanColumn({ status, label, color, tasks, onDrop, onCardClick, onAdd }: {
  status: TaskStatus; label: string; color: string; tasks: Task[]; onDrop: (taskId: string, newStatus: TaskStatus, fromStatus: TaskStatus) => void; onCardClick: (t: Task) => void; onAdd: () => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { id: string; status: TaskStatus }) => onDrop(item.id, status, item.status),
    collect: m => ({ isOver: m.isOver() }),
  }));

  return (
    <div ref={drop as any} className={cn("flex flex-col min-w-[280px] md:min-w-0 md:flex-1 rounded-lg border-t-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700", color, isOver && "ring-2 ring-blue-400/50 bg-blue-50/30 dark:bg-blue-900/10")}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs flex items-center justify-center">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Drop tasks here</div>
        ) : tasks.map(t => (
          <KanbanCard key={t.id} task={t} onClick={() => onCardClick(t)} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoardPage() {
  const { id: wsId, pid } = useParams<{ id: string; pid: string }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [invalidMove, setInvalidMove] = useState<string | null>(null);

  const projectState = useAsyncData(async () => {
    if (!wsId || !pid) return null;
    const projects = await workspaceApi.listProjects(wsId);
    return projects.find(project => project.id === pid) ?? null;
  }, [wsId, pid]);

  const taskState = useAsyncData(
    () => wsId ? taskApi.list({ workspaceId: wsId, projectId: pid }).then(result => result.tasks) : Promise.resolve([]),
    [wsId, pid],
  );

  const { data: members } = useAsyncData(
    () => wsId ? workspaceApi.members(wsId) : Promise.resolve([]),
    [wsId]
  );
  const usersState = useAsyncData(() => usersApi.list().then(result => result.items), []);
  const taskList = taskState.data ?? [];
  const users = usersState.data?.filter(u => members?.some(m => m.userId === u.id))
    .map(u => ({ userId: u.id, name: u.name })) ?? [];

  const filteredTasks = taskList.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchAssignee = filterAssignee === "all" || t.assigneeId === filterAssignee;
    return matchSearch && matchStatus && matchAssignee;
  });

  const handleDrop = useCallback(async (taskId: string, newStatus: TaskStatus, fromStatus: TaskStatus) => {
    if (fromStatus === newStatus) return;
    if (fromStatus === "DONE" && newStatus === "TODO") {
      setInvalidMove(taskId);
      toast.error("Cannot move a completed task back to Todo directly.");
      setTimeout(() => setInvalidMove(null), 2000);
      return;
    }

    const previous = taskState.data ?? [];
    taskState.setData(prev => (prev ?? []).map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskApi.updateStatus(taskId, newStatus);
      toast.success(`Task moved to ${newStatus === "TODO" ? "To Do" : newStatus === "DOING" ? "In Progress" : "Done"}`);
    } catch (error) {
      taskState.setData(previous);
      toast.error(error instanceof Error ? error.message : "Unable to change task status");
    }
  }, [taskState]);

  const handleTaskUpdated = (updated: Task) => {
    taskState.setData(prev => (prev ?? []).map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const handleTaskCreated = (task: Task) => {
    taskState.setData(prev => [...(prev ?? []), task]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-wrap">
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 mr-2">{projectState.data?.name || "Workspace Tasks"}</h1>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
            <button onClick={() => setView("kanban")} className={cn("p-1.5 rounded transition-colors", view === "kanban" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
              <Columns3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded transition-colors", view === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Search tasks..." className="pl-8 h-7 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="DOING">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {users.map(user => <SelectItem key={user.userId} value={user.userId}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs px-3" onClick={() => void taskState.reload()}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs px-3" onClick={() => setCreateOpen(true)} disabled={!wsId}>
            <Plus className="w-3.5 h-3.5" /> Task
          </Button>
        </div>

        {invalidMove && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-700 dark:text-red-400">Invalid transition: cannot move DONE -&gt; TODO directly</p>
          </div>
        )}

        {taskState.error && (
          <div className="p-4">
            <ErrorState title="Unable to load tasks" description={taskState.error} />
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {!taskState.error && filteredTasks.length === 0 && !taskState.loading ? (
            <EmptyState icon={List} title="No tasks found" description="Create a task or adjust the filters." action={{ label: "New Task", onClick: () => setCreateOpen(true) }} />
          ) : view === "kanban" ? (
            <div className="flex gap-4 min-w-max md:min-w-0 h-full">
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.status}
                  {...col}
                  tasks={filteredTasks.filter(t => t.status === col.status)}
                  onDrop={handleDrop}
                  onCardClick={setSelectedTask}
                  onAdd={() => setCreateOpen(true)}
                />
              ))}
            </div>
          ) : (
            <TaskListView tasks={filteredTasks} onTaskClick={setSelectedTask} />
          )}
        </div>

        <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} projectId={pid ?? null} workspaceId={wsId || ""} onCreated={handleTaskCreated} />

        {selectedTask && (
          <TaskDetailSheet task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} onUpdated={handleTaskUpdated} />
        )}
      </div>
    </DndProvider>
  );
}
