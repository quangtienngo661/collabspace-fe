import { Search, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { ErrorState } from "../../shared/EmptyState";
import { Input } from "../../ui/input";
import { DateDisplay } from "../../shared/DateDisplay";
import { useAdminWorkspace } from "./AdminContext";
import { adminWorkspaceOwnerLabel } from "./adminWorkspaceDisplay";

export function AdminWorkspacesPage() {
  const {
    usersState,
    workspacesState,
    filteredWorkspaces,
    workspaceSearch,
    setWorkspaceSearch,
    setViewWorkspaceTarget,
    setDeleteWorkspaceTarget,
  } = useAdminWorkspace();

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Active Workspace Directory</p>
          <p className="text-xs text-slate-400">View platform workspace statistics and perform force-deletions when required.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search workspaces..."
            value={workspaceSearch}
            onChange={e => setWorkspaceSearch(e.target.value)}
            className="h-9 rounded-xl bg-white pl-9 text-xs dark:bg-slate-950/70"
          />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden rounded-2xl border-white/70 bg-white/85 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
        {workspacesState.error ? (
          <ErrorState title="Unable to load workspaces" description={workspacesState.error} />
        ) : (
          <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-slate-50/90 dark:bg-slate-950/50">
              <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-700">
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Workspace Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Owner</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">Members</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">Projects</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">Tasks</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Created At</TableHead>
                <TableHead className="w-20 text-xs font-semibold text-slate-500 dark:text-slate-400" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspacesState.loading && filteredWorkspaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    Retrieving workspace database...
                  </TableCell>
                </TableRow>
              ) : filteredWorkspaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    {workspaceSearch ? "No workspaces match filters." : "No active workspaces created."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkspaces.map(ws => {
                  const owner = adminWorkspaceOwnerLabel(ws.ownerId, usersState.data);
                  return (
                    <TableRow key={ws.id} className="cursor-pointer border-slate-100 transition-colors hover:bg-blue-50/40 dark:border-slate-800 dark:hover:bg-slate-800/70" onClick={() => setViewWorkspaceTarget(ws)}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ws.name}</p>
                          {ws.description && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">{ws.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                        <span title={owner.id}>{owner.name}</span>
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs text-slate-700 dark:text-slate-300">
                        {ws.memberCount ?? 0}
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs text-slate-700 dark:text-slate-300">
                        {ws.projectCount ?? 0}
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs text-slate-700 dark:text-slate-300">
                        {ws.taskCount ?? 0}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {ws.createdAt ? <DateDisplay date={ws.createdAt} format="absolute" /> : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteWorkspaceTarget({ id: ws.id, name: ws.name });
                          }}
                          aria-label={`Delete workspace ${ws.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
