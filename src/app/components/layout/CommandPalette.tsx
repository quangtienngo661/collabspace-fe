import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  CheckSquare,
  FolderOpen,
  LayoutDashboard,
  Plus,
  User,
  Shield,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../ui/command";
import { useWorkspaces } from "../../context/WorkspacesContext";
import { useAuth } from "../../auth/AuthContext";
import { usersApi } from "../../api/usersApi";
import { workspaceApi } from "../../api/workspaceApi";
import { taskApi } from "../../api/taskApi";
import type { Project, Task, User as DomainUser } from "../../api/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaces();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<DomainUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searching, setSearching] = useState(false);

  const go = useCallback(
    (path: string) => {
      onOpenChange(false);
      setQuery("");
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      setActiveWorkspace(workspaceId);
      go(`/workspaces/${workspaceId}`);
    },
    [go, setActiveWorkspace],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setUsers([]);
      setProjects([]);
      setTasks([]);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setUsers([]);
      setProjects([]);
      setTasks([]);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const userResult = await usersApi.search(q, 6).catch(() => ({ items: [] as DomainUser[] }));
          setUsers(userResult.items);

          if (isAdmin || !activeWorkspace) {
            setProjects([]);
            setTasks([]);
            return;
          }

          const [projectList, taskResult] = await Promise.all([
            workspaceApi.listProjects(activeWorkspace.id).catch(() => [] as Project[]),
            taskApi.search({ workspaceId: activeWorkspace.id, q, limit: 8 }).catch(() => [] as Task[]),
          ]);

          const lower = q.toLowerCase();
          setProjects(
            projectList
              .filter(
                p =>
                  p.name.toLowerCase().includes(lower)
                  || (p.description ?? "").toLowerCase().includes(lower),
              )
              .slice(0, 6),
          );
          setTasks(taskResult);
        } finally {
          setSearching(false);
        }
      })();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, activeWorkspace, isAdmin]);

  const filteredWorkspaces = !isAdmin && query.trim()
    ? workspaces.filter(ws => ws.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : !isAdmin ? workspaces.slice(0, 6) : [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Search or jump to…">
      <CommandInput
        placeholder={isAdmin ? "Search users…" : "Search tasks, projects, users, workspaces…"}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{searching ? "Searching…" : "No results found."}</CommandEmpty>

        {!query.trim() && (
          <CommandGroup heading="Quick actions">
            {isAdmin ? (
              <>
                <CommandItem onSelect={() => go("/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Platform Admin
                </CommandItem>
                <CommandItem onSelect={() => go("/admin?tab=users")}>
                  <Users className="mr-2 h-4 w-4" />
                  User accounts
                </CommandItem>
              </>
            ) : (
              <>
                <CommandItem onSelect={() => go("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Home
                </CommandItem>
                <CommandItem onSelect={() => go("/workspaces?create=1")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create workspace
                </CommandItem>
                {activeWorkspace && (
                  <CommandItem onSelect={() => go(`/workspaces/${activeWorkspace.id}/projects`)}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Browse projects in {activeWorkspace.name}
                  </CommandItem>
                )}
                <CommandItem onSelect={() => go("/users")}>
                  <Users className="mr-2 h-4 w-4" />
                  User directory
                </CommandItem>
              </>
            )}
          </CommandGroup>
        )}

        {filteredWorkspaces.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Workspaces">
              {filteredWorkspaces.map(ws => (
                <CommandItem key={ws.id} onSelect={() => switchWorkspace(ws.id)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {ws.name}
                  {ws.id === activeWorkspace?.id && (
                    <CommandShortcut className="text-[10px]">active</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projects.length > 0 && !isAdmin && activeWorkspace && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map(p => (
                <CommandItem
                  key={p.id}
                  onSelect={() => go(`/workspaces/${activeWorkspace.id}/projects/${p.id}`)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tasks.length > 0 && !isAdmin && activeWorkspace && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.map(task => (
                <CommandItem
                  key={task.id}
                  onSelect={() => {
                    const pid = task.projectId;
                    if (pid) {
                      go(`/workspaces/${activeWorkspace.id}/projects/${pid}?task=${task.id}`);
                    } else {
                      go(`/workspaces/${activeWorkspace.id}/projects?openTask=${task.id}`);
                    }
                  }}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {task.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {users.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Users">
              {users.map(user => (
                <CommandItem key={user.id} onSelect={() => go(`/users?q=${encodeURIComponent(user.name)}`)}>
                  <User className="mr-2 h-4 w-4" />
                  {user.name}
                  {user.email && <span className="ml-2 text-xs text-muted-foreground truncate">{user.email}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Registers ⌘K / Ctrl+K to open the command palette. */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
