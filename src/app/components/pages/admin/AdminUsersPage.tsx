import { Ban, Trash2, UserCheck, Lock } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { RoleBadge } from "../../shared/StatusBadge";import { UserAvatar } from "../../shared/UserAvatar";
import { ErrorState } from "../../shared/EmptyState";
import { Input } from "../../ui/input";
import { DateDisplay } from "../../shared/DateDisplay";
import { adminUserDisplayName } from "../../../api/mappers";
import { useAdminWorkspace } from "./AdminContext";
import { isPlatformAdminUser } from "./adminUserStats";
import type { Role } from "../../../api/types";

export function AdminUsersPage() {
  const {
    usersState,
    rolesLoading,
    roles,
    filteredUsers,
    userSearch,
    setUserSearch,
    isProtectedRole,
    requestRoleChange,
    setToggleActiveTarget,
    setDeleteUserTarget,
  } = useAdminWorkspace();
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">User Account Directory</p>
          <p className="text-xs text-slate-400">
            Manage platform roles and ban status. Promoting to admin requires confirmation — workspace membership is not removed automatically.
          </p>        </div>
        <div className="relative w-full sm:max-w-xs">
          <Input
            placeholder="Search user profiles..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="h-8 text-xs bg-slate-50 dark:bg-slate-900"
          />
        </div>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
        {usersState.error ? (
          <ErrorState title="Unable to load user accounts" description={usersState.error} />
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/75 dark:bg-slate-900/40">
              <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-700">
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">User Profile</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Account Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Workspaces</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Role</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Update Role</TableHead>
                <TableHead className="w-20 text-xs font-semibold text-slate-500 dark:text-slate-400" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersState.loading && filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    Retrieving user records...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    {userSearch ? "No profiles match search query." : "No platform user accounts registered."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => {
                  const userRoleName = user.roles?.[0] || "user";
                  const roleObj = roles.find(r => r.name === userRoleName);
                  const currentRoleId = roleObj?.id || "";
                  const displayName = adminUserDisplayName(user);
                  const isAdmin = isPlatformAdminUser(user);
                  const platformRoles = roles.filter(role => isProtectedRole(role.name));
                  return (
                    <TableRow key={user.id} className="border-slate-100 hover:bg-slate-50/20 dark:border-slate-700 dark:hover:bg-slate-900/10">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            user={{
                              id: user.id,
                              userId: user.id,
                              name: displayName,
                              email: user.email,
                              avatarUrl: user.avatarUrl,
                              role: userRoleName as Role,
                              status: "offline",
                              joinedAt: "",
                            }}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {displayName}
                            </p>
                            {user.username && (
                              <p className="text-[10px] text-slate-400 font-mono">@{user.username}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{user.email}</p>
                        {user.lastLoginAt ? (
                          <p className="text-[9px] text-slate-400">
                            Last login: <DateDisplay date={user.lastLoginAt} format="relative" />
                          </p>
                        ) : (
                          <p className="text-[9px] text-slate-400">Never signed in</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            user.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {user.isActive ? "Active" : "Banned"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {user.workspaceCount ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.roles && user.roles.length > 0 ? user.roles : ["user"]).map(r => (
                            <RoleBadge key={r} role={r as Role} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-slate-400"
                            title="Platform admin role cannot be changed here"
                          >
                            <Lock className="size-3" />
                            View only
                          </span>
                        ) : (
                          <Select
                            value={currentRoleId}
                            onValueChange={(newId) => {
                              if (newId === currentRoleId) return;
                              requestRoleChange(user.id, newId, displayName);
                            }}
                            disabled={rolesLoading || platformRoles.length === 0}
                          >
                            <SelectTrigger className="h-7 w-28 text-xs">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {platformRoles.map(role => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-7 w-7 ${user.isActive ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}`}
                            onClick={() => setToggleActiveTarget({ id: user.id, name: user.displayName || user.fullName || "User", isActive: user.isActive })}
                            title={user.isActive ? "Ban account" : "Reactivate account"}
                            disabled={isAdmin}
                          >
                            {user.isActive ? <Ban className="size-3.5" /> : <UserCheck className="size-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => setDeleteUserTarget({ id: user.id, name: user.displayName || user.fullName || "User" })}
                            title="Delete & anonymize user data"
                            disabled={isAdmin}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
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
