import { Check, ShieldCheck, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { RoleBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { ErrorState } from "../../shared/EmptyState";
import { usersApi } from "../../../api/usersApi";
import type { Role } from "../../../api/types";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { AdminWorkspaceLayout } from "./AdminWorkspaceLayout";
import { toast } from "sonner";
import { useState } from "react";

const ROLES: Role[] = ["admin", "member", "viewer"];

const permissions = [
  { id: "auth.manage", name: "auth.manage", description: "Manage authentication, roles, and permissions" },
  { id: "users.read", name: "users.read", description: "Read user directory and profiles" },
  { id: "users.write", name: "users.write", description: "Update user records" },
  { id: "workspaces.read", name: "workspaces.read", description: "Read workspaces and members" },
  { id: "workspaces.write", name: "workspaces.write", description: "Create and update workspaces" },
  { id: "tasks.read", name: "tasks.read", description: "Read tasks, comments, and attachments" },
  { id: "tasks.write", name: "tasks.write", description: "Create and update tasks" },
  { id: "notifications.read", name: "notifications.read", description: "Read notification inbox" },
];

function permissionChecked(role: Role, permissionId: string) {
  if (role === "admin") return true;
  if (role === "viewer") return permissionId.endsWith(".read");
  return permissionId !== "auth.manage";
}

interface AdminPageProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function AdminPage({ dark, onToggleDark }: AdminPageProps) {
  const usersState = useAsyncData(() => usersApi.list({ limit: 100 }), []);
  const users = usersState.data?.items ?? [];
  
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    ROLES.forEach(role => {
      initial[role] = {};
      permissions.forEach(p => {
        initial[role][p.id] = permissionChecked(role, p.id);
      });
    });
    return initial;
  });
  
  const [saving, setSaving] = useState(false);
  const [localRoles, setLocalRoles] = useState<Record<string, string>>({});

  function togglePermission(role: string, permId: string) {
    setLocalPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [permId]: !prev[role][permId] }
    }));
  }

  function saveChanges() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Permissions saved successfully");
    }, 600);
  }

  function changeUserRole(userId: string, newRole: string) {
    setLocalRoles(prev => ({ ...prev, [userId]: newRole }));
    toast.success(`Role updated to ${newRole}`);
  }

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
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Permission Matrix</p>
              <p className="text-xs text-slate-400">Manage permissions for each role. (Currently mocked frontend-only)</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Permission</th>
                  {ROLES.map(role => (
                    <th key={role} className="px-4 py-2.5 text-center">
                      <RoleBadge role={role as Role} />
                    </th>
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
                    {ROLES.map(role => (
                      <td key={role} className="px-4 py-2.5 text-center">
                        <Checkbox 
                          checked={localPermissions[role]?.[permission.id] ?? false} 
                          onCheckedChange={() => togglePermission(role, permission.id)}
                          className="mx-auto" 
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700 flex justify-end">
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={saveChanges} disabled={saving}>
                <Check className="mr-1.5 size-3.5" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">User Directory</p>
              <p className="text-xs text-slate-400">Manage user roles. (Currently mocked frontend-only)</p>
            </div>
            {usersState.error ? (
              <ErrorState title="Unable to load users" description={usersState.error} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-700">
                    <TableHead className="text-xs text-slate-500">User</TableHead>
                    <TableHead className="text-xs text-slate-500">Email</TableHead>
                    <TableHead className="text-xs text-slate-500">Current Role</TableHead>
                    <TableHead className="text-xs text-slate-500">Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersState.loading && users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">Loading users...</TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">No users returned by the backend.</TableCell>
                    </TableRow>
                  ) : users.map(user => {
                    const currentRole = localRoles[user.id] || user.role;
                    return (
                      <TableRow key={user.id} className="border-slate-100 dark:border-slate-700">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar user={user} size="sm" />
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{user.email ?? "N/A"}</TableCell>
                        <TableCell><RoleBadge role={currentRole as Role} /></TableCell>
                        <TableCell>
                          <Select value={currentRole} onValueChange={(val) => changeUserRole(user.id, val)}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
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
    </AdminWorkspaceLayout>
  );
}
