import { memo, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, List, Columns3, Search, Paperclip, MessageSquare, RefreshCw, Calendar } from "lucide-react";
import { formatDueDate, dueDateStatus, labelColorClass } from "../../../utils/format";
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
import { useWorkspaceMemberUsers } from "../../../hooks/useWorkspaceMemberUsers";
import { useCurrentWorkspaceRole } from "../../../hooks/useCurrentWorkspaceRole";
import { initials } from "../../../api/mappers";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { useTaskDeepLink } from "../../../hooks/useTaskDeepLink";
import { usePresenceMap } from "../../../hooks/usePresenceMap";
import { useAuth } from "../../../auth/AuthContext";
import type { Task, TaskStatus, UserStatus } from "../../../api/types";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "TODO", label: "To Do", color: "border-t-slate-400" },
  { status: "DOING", label: "In Progress", color: "border-t-blue-500" },
  { status: "DONE", label: "Done", color: "border-t-green-500" },
];

const ITEM_TYPE = "TASK_CARD";

const KanbanCard = memo(function KanbanCard({ task, onClick, presenceStatus }: { task: Task; onClick: (task: Task) => void; presenceStatus?: UserStatus }) {
  const assignee = task.assignedTo;
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: task.id, status: task.status },
    collect: m => ({ isDragging: m.isDragging() }),
  }));

  return (
    <div
      ref={drag as any}
      onClick={() => onClick(task)}
      className={cn(
        "group cursor-pointer space-y-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-black/10 dark:hover:border-slate-600",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{task.title}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {task.labels && task.labels.length > 0 && (
          <>
            {task.labels.slice(0, 3).map(label => (
              <span key={label} className={cn("text-[9px] px-1 py-0.5 rounded-full font-medium", labelColorClass(label))}>
                {label}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="text-[9px] text-slate-400">+{task.labels.length - 3}</span>
            )}
          </>
        )}
      </div>
      {task.dueDate && (
        <div className={cn("flex items-center gap-1 text-[10px]",
          dueDateStatus(task.dueDate) === "overdue" ? "text-red-500 dark:text-red-400" :
          dueDateStatus(task.dueDate) === "today" ? "text-amber-500 dark:text-amber-400" :
          dueDateStatus(task.dueDate) === "soon" ? "text-yellow-600 dark:text-yellow-400" :
          "text-slate-400"
        )}>
          <Calendar className="w-3 h-3" />
          {formatDueDate(task.dueDate)}
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-slate-400">
          {task.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="w-3 h-3" />
              {task.commentCount}
            </span>
          )}
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
              status: presenceStatus ?? "offline",
              title: "",
              department: "",
              joinedAt: "",
            }}
            size="xs"
            showPresence={Boolean(assignee)}
          />
        ) : <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" />}
      </div>
    </div>
  );
});

const KanbanColumn = memo(function KanbanColumn({ status, label, color, tasks, presenceMap, onDrop, onCardClick, onAdd }: {
  status: TaskStatus; label: string; color: string; tasks: Task[];
  presenceMap: Record<string, UserStatus>;
  onDrop: (taskId: string, newStatus: TaskStatus, fromStatus: TaskStatus) => void; onCardClick: (t: Task) => void; onAdd: (status: TaskStatus) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { id: string; status: TaskStatus }) => onDrop(item.id, status, item.status),
    collect: m => ({ isOver: m.isOver() }),
  }));
  const handleAdd = useCallback(() => onAdd(status), [onAdd, status]);

  return (
    <div ref={drop as any} className={cn("flex min-w-[300px] flex-col rounded-3xl border border-white/70 border-t-4 bg-white/60 shadow-sm shadow-slate-200/70 backdrop-blur md:min-w-0 md:flex-1 dark:border-slate-800 dark:bg-slate-950/50 dark:shadow-black/10", color, isOver && "ring-2 ring-blue-400/50 bg-blue-50/70 dark:bg-blue-900/10")}>
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={handleAdd} aria-label={`Add task to ${label}`}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 max-h-[calc(100vh-300px)]">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-8 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900/50">Drop tasks here</div>
        ) : tasks.map(t => (
          <KanbanCard
            key={t.id}
            task={t}
            presenceStatus={t.assigneeId ? presenceMap[t.assigneeId] : undefined}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
});

export function KanbanBoardPage() {
  const { id: wsId, pid } = useParams<{ id: string; pid: string }>();
  const { profile } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("TODO");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const projectState = useAsyncData(async () => {
    if (!wsId || !pid) return null;
    const projects = await workspaceApi.listProjects(wsId);
    return projects.find(project => project.id === pid) ?? null;
  }, [wsId, pid]);

  const taskState = useAsyncData(
    () => wsId ? taskApi.getBoard({ workspaceId: wsId, projectId: pid }) : Promise.resolve([]),
    [wsId, pid],
  );
  const { data: taskData, setData: setTaskData } = taskState;

  const currentUserRole = useCurrentWorkspaceRole(wsId, profile?.id);
  const canDeleteAnyTask = currentUserRole === "owner" || currentUserRole === "manager";

  const usersState = useWorkspaceMemberUsers(wsId, Boolean(wsId));
  const users = useMemo(
    () => (usersState.data ?? []).map(u => ({ userId: u.id, name: u.name })),
    [usersState.data],
  );
  const taskList = taskData ?? [];

  const assigneeIds = useMemo(
    () => [...new Set(taskList.map(t => t.assigneeId).filter(Boolean) as string[])],
    [taskList],
  );
  const presenceMap = usePresenceMap(assigneeIds, Boolean(wsId));

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return taskList.filter(t => {
      const matchSearch = !normalizedSearch || t.title.toLowerCase().includes(normalizedSearch);
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchAssignee = filterAssignee === "all" || t.assigneeId === filterAssignee;
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      return matchSearch && matchStatus && matchAssignee && matchPriority;
    });
  }, [taskList, search, filterStatus, filterAssignee, filterPriority]);

  const tasksByStatus = useMemo(() => ({
    TODO: filteredTasks.filter(t => t.status === "TODO"),
    DOING: filteredTasks.filter(t => t.status === "DOING"),
    DONE: filteredTasks.filter(t => t.status === "DONE"),
  }), [filteredTasks]);

  const handleDrop = useCallback(async (taskId: string, newStatus: TaskStatus, fromStatus: TaskStatus) => {
    if (fromStatus === newStatus) return;

    const previous = taskData ?? [];
    setTaskData(prev => (prev ?? []).map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskApi.updateStatus(taskId, newStatus);
      toast.success(`Task moved to ${newStatus === "TODO" ? "To Do" : newStatus === "DOING" ? "In Progress" : "Done"}`);
    } catch (error) {
      setTaskData(previous);
      toast.error(error instanceof Error ? error.message : "Unable to change task status");
    }
  }, [taskData, setTaskData]);

  const handleTaskUpdated = useCallback((updated: Task) => {
    setTaskData(prev => (prev ?? []).map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  }, [setTaskData]);

  const handleTaskCreated = useCallback((task: Task) => {
    setTaskData(prev => [...(prev ?? []), task]);
  }, [setTaskData]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTaskData(prev => (prev ?? []).filter(task => task.id !== taskId));
    setSelectedTask(null);
  }, [setTaskData]);

  const handleAddTask = useCallback((status: TaskStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  }, []);

  useTaskDeepLink({
    workspaceId: wsId,
    projectId: pid,
    onOpen: setSelectedTask,
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full flex-col">
        <div className="border-b border-white/70 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-black/10">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 dark:text-white">{projectState.data?.name || "Workspace Tasks"}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Plan work, rebalance owners, and move tasks between stages.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <button aria-label="Show kanban view" onClick={() => setView("kanban")} className={cn("rounded-lg p-2 transition-colors", view === "kanban" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
              <Columns3 className="w-3.5 h-3.5" />
            </button>
            <button aria-label="Show list view" onClick={() => setView("list")} className={cn("rounded-lg p-2 transition-colors", view === "list" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 xl:w-72 xl:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Search tasks..." className="h-9 rounded-xl bg-white pl-9 text-xs dark:bg-slate-900" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-32 rounded-xl bg-white text-xs dark:bg-slate-900"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="DOING">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-9 w-40 rounded-xl bg-white text-xs dark:bg-slate-900"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {users.map(user => <SelectItem key={user.userId} value={user.userId}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-9 w-32 rounded-xl bg-white text-xs dark:bg-slate-900"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" className="h-9 gap-1 rounded-xl px-3 text-xs" onClick={() => void taskState.reload()}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" className="h-9 gap-1 rounded-xl bg-blue-600 px-3 text-xs text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700" onClick={() => setCreateOpen(true)} disabled={!wsId}>
            <Plus className="w-3.5 h-3.5" /> Task
          </Button>
            </div>
          </div>
        </div>

        {taskState.error && (
          <div className="p-4">
            <ErrorState title="Unable to load tasks" description={taskState.error} />
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-5">
          {!taskState.error && filteredTasks.length === 0 && !taskState.loading ? (
            <EmptyState icon={List} title="No tasks found" description="Create a task or adjust the filters." action={{ label: "New Task", onClick: () => setCreateOpen(true) }} />
          ) : view === "kanban" ? (
            <div className="flex h-full min-w-max gap-4 md:min-w-0">
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.status}
                  {...col}
                  tasks={tasksByStatus[col.status]}
                  presenceMap={presenceMap}
                  onDrop={handleDrop}
                  onCardClick={setSelectedTask}
                  onAdd={handleAddTask}
                />
              ))}
            </div>
          ) : (
            <TaskListView tasks={filteredTasks} onTaskClick={setSelectedTask} />
          )}
        </div>

        <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} projectId={pid ?? null} workspaceId={wsId || ""} onCreated={handleTaskCreated} initialStatus={createStatus} />

        {selectedTask && (
          <TaskDetailSheet task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} canDeleteAnyTask={canDeleteAnyTask} />
        )}
      </div>
    </DndProvider>
  );
}
