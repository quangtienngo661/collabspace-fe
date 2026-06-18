import { Trash2 } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active Workspace Directory</p>
          <p className="text-xs text-slate-400">View platform workspace statistics and perform force-deletions when required.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Input
            placeholder="Search workspaces..."
            value={workspaceSearch}
            onChange={e => setWorkspaceSearch(e.target.value)}
            className="h-8 text-xs bg-slate-50 dark:bg-slate-900"
          />
        </div>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
        {workspacesState.error ? (
          <ErrorState title="Unable to load workspaces" description={workspacesState.error} />
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/75 dark:bg-slate-900/40">
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
                    <TableRow key={ws.id} className="border-slate-100 hover:bg-slate-50/20 dark:border-slate-700 dark:hover:bg-slate-900/10 cursor-pointer" onClick={() => setViewWorkspaceTarget(ws)}>
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
        )}
      </Card>
    </div>
  );
}
