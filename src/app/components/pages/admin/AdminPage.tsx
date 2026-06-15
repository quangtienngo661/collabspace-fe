import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { Switch } from "../../ui/switch";
import { UserAvatar } from "../../shared/UserAvatar";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { ErrorState } from "../../shared/EmptyState";
import { adminApi } from "../../../api/adminApi";
import type { AdminPermission, AdminRole, AdminUserAggregate } from "../../../api/types";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { AdminWorkspaceLayout } from "./AdminWorkspaceLayout";
import { toast } from "sonner";

function formatDate(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
}

interface AdminPageProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function AdminPage({ dark, onToggleDark }: AdminPageProps) {
  const rolesState = useAsyncData(() => adminApi.listRoles(), []);
  const permissionsState = useAsyncData(() => adminApi.listPermissions(), []);
  const usersState = useAsyncData(() => adminApi.listAllUsers(), []);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const roles = rolesState.data ?? [];
  const permissions = permissionsState.data ?? [];
  const users = usersState.data ?? [];

  const roleByName = useMemo(() => Object.fromEntries(roles.map(r => [r.name, r])), [roles]);

  async function togglePermission(role: AdminRole, permission: AdminPermission, checked: boolean) {
    if (!checked) {
      toast.info("Removing permissions is not supported by the API — only assign is available");
      return;
    }
    if (role.permissions.includes(permission.name)) return;
    try {
      await adminApi.assignPermissionToRole(role.id, permission.id);
      await rolesState.reload();
      toast.success(`Added ${permission.name} to ${role.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to assign permission");
    }
  }

  async function createRole() {
    const name = window.prompt("Role name (e.g. support):");
    if (!name?.trim()) return;
    const description = window.prompt("Description:") ?? "";
    try {
      await adminApi.createRole({ name: name.trim(), description });
      await rolesState.reload();
      toast.success("Role created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create role");
    }
  }

  async function changeUserRole(user: AdminUserAggregate, roleId: string) {
    setAssigning(user.id);
    try {
      await adminApi.assignRoleToUser(user.id, roleId);
      await usersState.reload();
      toast.success("Role updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to assign role");
    } finally {
      setAssigning(null);
    }
  }

  async function toggleUserActive(user: AdminUserAggregate, isActive: boolean) {
    try {
      await adminApi.setUserActiveStatus(user.id, isActive);
      await usersState.reload();
      toast.success(isActive ? "User activated" : "User deactivated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user status");
    }
  }

  async function confirmDeleteUser() {
    if (!deleteUserId) return;
    try {
      await adminApi.deleteUser(deleteUserId);
      setDeleteUserId(null);
      await usersState.reload();
      toast.success("User anonymized");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user");
    }
  }

  const matrixError = rolesState.error || permissionsState.error;

  return (
    <AdminWorkspaceLayout
      title="Access Control"
      description="View and manage users and RBAC controls."
      dark={dark}
      onToggleDark={onToggleDark}
    >
      <Tabs defaultValue="roles">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="roles"><ShieldCheck className="mr-1.5 size-3.5" />Roles & Permissions</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1.5 size-3.5" />User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4">
          <Card className="overflow-x-auto border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Permission Matrix</p>
                <p className="text-xs text-slate-400">Live data from /auth/admin/*</p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void createRole()}>
                <Plus className="w-3.5 h-3.5" /> New role
              </Button>
            </div>
            {matrixError ? (
              <ErrorState title="Unable to load RBAC" description={matrixError} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Permission</th>
                    {roles.map(role => (
                      <th key={role.id} className="px-4 py-2.5 text-center text-xs font-medium text-slate-500">{role.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission, index) => (
                    <tr key={permission.id} className={`border-b border-slate-100 dark:border-slate-800 ${index % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-800/30"}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{permission.name}</p>
                        <p className="text-[10px] text-slate-400">{permission.description}</p>
                      </td>
                      {roles.map(role => (
                        <td key={role.id} className="px-4 py-2.5 text-center">
                          <Checkbox
                            checked={role.permissions.includes(permission.name)}
                            onCheckedChange={checked => void togglePermission(role, permission, Boolean(checked))}
                            className="mx-auto"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">User Directory</p>
              <p className="text-xs text-slate-400">GET /users/admin/all — auth account + profile</p>
            </div>
            {usersState.error ? (
              <ErrorState title="Unable to load users" description={usersState.error} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Change role</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => {
                    const displayName = user.displayName || user.fullName || user.email;
                    const currentRoleName = user.roles[0] ?? "member";
                    const currentRoleId = roleByName[currentRoleName]?.id ?? roles[0]?.id;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              user={{
                                id: user.id,
                                userId: user.id,
                                name: displayName,
                                email: user.email,
                                avatar: displayName.slice(0, 2).toUpperCase(),
                                avatarUrl: user.avatarUrl,
                                role: "member",
                                status: "offline",
                                title: "",
                                department: "",
                                joinedAt: "",
                              }}
                              size="sm"
                            />
                            <span className="text-sm font-medium">{displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{user.email}</TableCell>
                        <TableCell className="text-xs">{user.roles.join(", ") || "—"}</TableCell>
                        <TableCell className="text-xs text-slate-500">{formatDate(user.lastLoginAt)}</TableCell>
                        <TableCell>
                          <Switch checked={user.isActive} onCheckedChange={checked => void toggleUserActive(user, checked)} />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentRoleId}
                            disabled={assigning === user.id}
                            onValueChange={val => void changeUserRole(user, val)}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {roles.map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => setDeleteUserId(user.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(deleteUserId)}
        onOpenChange={open => !open && setDeleteUserId(null)}
        title="Anonymize user?"
        description="Deletes profile data and deactivates the auth account."
        confirmLabel="Delete"
        onConfirm={() => void confirmDeleteUser()}
      />
    </AdminWorkspaceLayout>
  );
}
