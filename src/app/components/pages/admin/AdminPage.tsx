import { useState } from "react";
import { 
  Check, 
  ShieldCheck, 
  Users, 
  FolderOpen, 
  Send, 
  Trash2, 
  Plus, 
  Pencil,
  Info, 
  Ban, 
  ShieldAlert, 
  RefreshCw, 
  UserMinus, 
  UserCheck, 
  Lock, 
  Globe 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { RoleBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { ErrorState, EmptyState } from "../../shared/EmptyState";
import { AdminWorkspaceLayout } from "./AdminWorkspaceLayout";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { toast } from "sonner";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { adminApi } from "../../../api/adminApi";
import { formatAdminApiError } from "../../../api/adminErrors";
import type { AdminRole, Role } from "../../../api/types";

export function AdminPage() {
  // 1. Fetch data from backend admin API
  const rolesState = useAsyncData(() => adminApi.listRoles(), []);
  const permissionsState = useAsyncData(() => adminApi.listPermissions(), []);
  const usersState = useAsyncData(() => adminApi.listAllUsersEnriched(), []);
  const workspacesState = useAsyncData(() => adminApi.listAllWorkspaces(), []);

  // 2. Local state for Modals & Forms
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  const [createPermissionOpen, setCreatePermissionOpen] = useState(false);
  const [newPermName, setNewPermName] = useState("");
  const [newPermDesc, setNewPermDesc] = useState("");
  const [creatingPermission, setCreatingPermission] = useState(false);

  const [editRoleTarget, setEditRoleTarget] = useState<AdminRole | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  const [deleteRoleTarget, setDeleteRoleTarget] = useState<{ id: string; name: string } | null>(null);
  
  const [toggleActiveTarget, setToggleActiveTarget] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; name: string } | null>(null);

  const [forceJoinTarget, setForceJoinTarget] = useState<{ id: string; name: string } | null>(null);
  const [forceJoinReason, setForceJoinReason] = useState("");
  const [joiningWorkspace, setJoiningWorkspace] = useState(false);

  const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState<{ id: string; name: string } | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState("");
  // Workspace search
  const [workspaceSearch, setWorkspaceSearch] = useState("");

  // Helper check for protected roles
  const isProtectedRole = (name: string) => ["admin", "member", "viewer"].includes(name.toLowerCase());

  // Reload all datasets
  async function reloadAll() {
    toast.promise(
      Promise.all([
        rolesState.reload(),
        permissionsState.reload(),
        usersState.reload(),
        workspacesState.reload()
      ]),
      {
        loading: "Refreshing admin workspace data...",
        success: "Admin workspace data reloaded",
        error: "Unable to reload admin data"
      }
    );
  }

  // --- TAB 1: Roles handlers ---
  async function handleCreateRole() {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      setCreatingRole(true);
      await adminApi.createRole(newRoleName, newRoleDesc);
      toast.success(`Role '${newRoleName}' created successfully`);
      setNewRoleName("");
      setNewRoleDesc("");
      setCreateRoleOpen(false);
      await rolesState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to create role"));
    } finally {
      setCreatingRole(false);
    }
  }

  async function handleCreatePermission() {
    if (!newPermName.trim()) {
      toast.error("Permission name is required");
      return;
    }
    if (!newPermDesc.trim()) {
      toast.error("Permission description is required");
      return;
    }
    try {
      setCreatingPermission(true);
      await adminApi.createPermission(newPermName.trim(), newPermDesc.trim());
      toast.success(`Permission '${newPermName}' created`);
      setNewPermName("");
      setNewPermDesc("");
      setCreatePermissionOpen(false);
      await permissionsState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to create permission"));
    } finally {
      setCreatingPermission(false);
    }
  }

  function openEditRole(role: AdminRole) {
    setEditRoleTarget(role);
    setEditRoleName(role.name);
    setEditRoleDesc(role.description);
  }

  async function handleUpdateRole() {
    if (!editRoleTarget) return;
    if (!editRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      setUpdatingRole(true);
      await adminApi.updateRole(editRoleTarget.id, {
        name: editRoleName.trim(),
        description: editRoleDesc.trim(),
      });
      toast.success(`Role '${editRoleName}' updated`);
      setEditRoleTarget(null);
      await rolesState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to update role"));
    } finally {
      setUpdatingRole(false);
    }
  }

  async function handleDeleteRole() {
    if (!deleteRoleTarget) return;
    try {
      await adminApi.deleteRole(deleteRoleTarget.id);
      toast.success(`Role '${deleteRoleTarget.name}' deleted successfully`);
      setDeleteRoleTarget(null);
      await rolesState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to delete role"));
    }
  }

  async function handlePermissionToggle(
    roleId: string,
    roleName: string,
    permissionId: string,
    permissionName: string,
    checked: boolean
  ) {
    try {
      if (checked) {
        await adminApi.assignPermission(roleId, permissionId);
        toast.success(`Assigned permission '${permissionName}' to role '${roleName}'`);
      } else {
        await adminApi.unassignPermission(roleId, permissionId);
        toast.success(`Removed permission '${permissionName}' from role '${roleName}'`);
      }
      await rolesState.reload();
    } catch (err) {
      toast.error(
        formatAdminApiError(
          err,
          checked ? "Unable to assign permission" : "Unable to remove permission",
        ),
      );
    }
  }

  // --- TAB 2: Users handlers ---
  async function handleRoleChange(userId: string, newRoleId: string) {
    try {
      await adminApi.assignRole(userId, newRoleId);
      toast.success("User role updated successfully");
      await usersState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to update user role"));
    }
  }

  async function handleToggleUserActive() {
    if (!toggleActiveTarget) return;
    try {
      await adminApi.setActiveStatus(toggleActiveTarget.id, !toggleActiveTarget.isActive);
      toast.success(`User '${toggleActiveTarget.name}' ${toggleActiveTarget.isActive ? "banned/deactivated" : "reactivated"} successfully`);
      setToggleActiveTarget(null);
      await usersState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to update active status"));
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserTarget) return;
    try {
      await adminApi.deleteUser(deleteUserTarget.id);
      toast.success(`User '${deleteUserTarget.name}' anonymized and deactivated successfully`);
      setDeleteUserTarget(null);
      await usersState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to delete user"));
    }
  }

  // --- TAB 3: Workspaces handlers ---
  async function handleForceJoin() {
    if (!forceJoinTarget) return;
    if (!forceJoinReason.trim()) {
      toast.error("Audit reason is required to force-join workspaces");
      return;
    }
    try {
      setJoiningWorkspace(true);
      await adminApi.forceJoin(forceJoinTarget.id, "member", forceJoinReason);
      toast.success(`Joined workspace '${forceJoinTarget.name}' as member`);
      setForceJoinTarget(null);
      setForceJoinReason("");
      await workspacesState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to join workspace"));
    } finally {
      setJoiningWorkspace(false);
    }
  }

  async function handleDeleteWorkspace() {
    if (!deleteWorkspaceTarget) return;
    try {
      await adminApi.deleteWorkspace(deleteWorkspaceTarget.id);
      toast.success(`Workspace '${deleteWorkspaceTarget.name}' force-deleted`);
      setDeleteWorkspaceTarget(null);
      await workspacesState.reload();
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to delete workspace"));
    }
  }

  // --- TAB 4: Broadcast handler ---
  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Both title and message are required");
      return;
    }
    try {
      setBroadcastSending(true);
      const job = await adminApi.broadcast(broadcastTitle, broadcastMessage);
      toast.success(`Broadcast queued (${job.status}) — job ${job.id}`);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to send broadcast"));
    } finally {
      setBroadcastSending(false);
    }
  }

  // Merging roles & permissions loading states
  const rolesLoading = rolesState.loading || permissionsState.loading;
  const roles = rolesState.data ?? [];
  const permissions = permissionsState.data ?? [];
  
  // Filter users
  const filteredUsers = (usersState.data ?? []).filter(u => {
    const search = userSearch.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(search) ||
      (u.displayName || "").toLowerCase().includes(search) ||
      (u.email || "").toLowerCase().includes(search) ||
      (u.username || "").toLowerCase().includes(search)
    );
  });

  // Filter workspaces
  const filteredWorkspaces = (workspacesState.data ?? []).filter(w => {
    const search = workspaceSearch.toLowerCase();
    return (
      w.name.toLowerCase().includes(search) ||
      (w.slug || "").toLowerCase().includes(search) ||
      (w.description || "").toLowerCase().includes(search)
    );
  });

  return (
    <AdminWorkspaceLayout
      title="Platform Management"
      description="Administrative interface for Roles, Users, Workspaces, and Broadcasts."
      action={
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={reloadAll}>
          <RefreshCw className="size-3.5" /> Sync Data
        </Button>
      }
    >
      <Tabs defaultValue="roles">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="roles"><ShieldCheck className="mr-1.5 size-3.5" />Roles & Permissions</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1.5 size-3.5" />User Accounts</TabsTrigger>
          <TabsTrigger value="workspaces"><FolderOpen className="mr-1.5 size-3.5" />Workspaces</TabsTrigger>
          <TabsTrigger value="broadcast"><Send className="mr-1.5 size-3.5" />System Broadcast</TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: ROLES & PERMISSIONS */}
        {/* ======================================================== */}
        <TabsContent value="roles" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Permission Matrix</p>
              <p className="text-xs text-slate-400">Configure permission mappings for RBAC. System-level roles are protected.</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setCreatePermissionOpen(true)}>
                <Plus className="size-3.5" /> New Permission
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs" onClick={() => setCreateRoleOpen(true)}>
                <Plus className="size-3.5" /> New Custom Role
              </Button>
            </div>
          </div>

          {rolesState.error || permissionsState.error ? (
            <ErrorState title="Unable to load roles metadata" description={rolesState.error || permissionsState.error || ""} />
          ) : (
            <Card className="overflow-x-auto border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Permission Name</th>
                    {rolesLoading ? (
                      <th className="px-4 py-3 text-center text-xs text-slate-400">Loading roles...</th>
                    ) : (
                      roles.map(role => (
                        <th key={role.id} className="px-4 py-3 text-center min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <RoleBadge role={role.name as Role} />
                            {!isProtectedRole(role.name) && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <button
                                  type="button"
                                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
                                  onClick={() => openEditRole(role)}
                                >
                                  <Pencil className="size-2.5" /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-0.5 hover:underline"
                                  onClick={() => setDeleteRoleTarget({ id: role.id, name: role.name })}
                                >
                                  <Trash2 className="size-2.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rolesLoading ? (
                    <tr>
                      <td colSpan={roles.length + 1} className="py-12 text-center text-sm text-slate-400">
                        Loading RBAC Matrix...
                      </td>
                    </tr>
                  ) : permissions.length === 0 ? (
                    <tr>
                      <td colSpan={roles.length + 1} className="py-12 text-center text-sm text-slate-400">
                        No permissions found on the server.
                      </td>
                    </tr>
                  ) : (
                    permissions.map((perm, index) => (
                      <tr 
                        key={perm.id} 
                        className={`border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors ${
                          index % 2 === 0 ? "" : "bg-slate-50/20 dark:bg-slate-900/10"
                        }`}
                      >
                        <td className="px-4 py-3 max-w-sm">
                          <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{perm.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{perm.description || "No description provided."}</p>
                        </td>
                        {roles.map(role => {
                          const isAssigned = role.permissions?.includes(perm.name);
                          return (
                            <td key={role.id} className="px-4 py-3 text-center">
                              <Checkbox 
                                checked={isAssigned} 
                                onCheckedChange={(val) => 
                                  handlePermissionToggle(role.id, role.name, perm.id, perm.name, Boolean(val))
                                }
                                className="mx-auto" 
                                disabled={role.name.toLowerCase() === "admin"} // Admin has implicit wildcards
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: USER DIRECTORY & ROLES */}
        {/* ======================================================== */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">User Account Directory</p>
              <p className="text-xs text-slate-400">Manage global login credentials, roles, and ban status.</p>
            </div>
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
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Role</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Update Role</TableHead>
                    <TableHead className="w-20 text-xs font-semibold text-slate-500 dark:text-slate-400" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersState.loading && filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                        Retrieving user records...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                        {userSearch ? "No profiles match search query." : "No platform user accounts registered."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => {
                      const userRoleName = user.roles?.[0] || "member";
                      const roleObj = roles.find(r => r.name === userRoleName);
                      const currentRoleId = roleObj?.id || "";

                      return (
                        <TableRow key={user.id} className="border-slate-100 hover:bg-slate-50/20 dark:border-slate-700 dark:hover:bg-slate-900/10">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <UserAvatar
                                user={{
                                  id: user.id,
                                  userId: user.id,
                                  name: user.displayName || user.fullName || "User",
                                  email: user.email,
                                  avatarUrl: user.avatarUrl,
                                  role: "member",
                                  status: "offline",
                                  joinedAt: "",
                                }}
                                size="sm"
                              />
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {user.displayName || user.fullName || "User"}
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
                                Active: {new Date(user.lastLoginAt).toLocaleString()}
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
                            <RoleBadge role={userRoleName as Role} />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={currentRoleId} 
                              onValueChange={(newId) => handleRoleChange(user.id, newId)}
                              disabled={rolesLoading}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
                              <SelectContent>
                                {roles.map(r => (
                                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-7 w-7 ${user.isActive ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}`}
                                onClick={() => setToggleActiveTarget({ id: user.id, name: user.displayName || user.fullName || "User", isActive: user.isActive })}
                                title={user.isActive ? "Ban account" : "Reactivate account"}
                              >
                                {user.isActive ? <Ban className="size-3.5" /> : <UserCheck className="size-3.5" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => setDeleteUserTarget({ id: user.id, name: user.displayName || user.fullName || "User" })}
                                title="Delete & anonymize user data"
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
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: WORKSPACES MANAGEMENT */}
        {/* ======================================================== */}
        <TabsContent value="workspaces" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active Workspace Directory</p>
              <p className="text-xs text-slate-400">Perform auditing force-joins and deletions on platform workspaces.</p>
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
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Slug</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Owner ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">Members</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Created At</TableHead>
                    <TableHead className="w-20 text-xs font-semibold text-slate-500 dark:text-slate-400" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspacesState.loading && filteredWorkspaces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                        Retrieving workspace database...
                      </TableCell>
                    </TableRow>
                  ) : filteredWorkspaces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                        {workspaceSearch ? "No workspaces match filters." : "No active workspaces created."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkspaces.map(ws => (
                      <TableRow key={ws.id} className="border-slate-100 hover:bg-slate-50/20 dark:border-slate-700 dark:hover:bg-slate-900/10">
                        <TableCell>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ws.name}</p>
                            {ws.description && (
                              <p className="text-xs text-slate-400 truncate max-w-xs">{ws.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{ws.slug}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{ws.ownerId}</TableCell>
                        <TableCell className="text-center font-medium text-xs text-slate-700 dark:text-slate-300">
                          {ws.memberCount ?? 0}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                              onClick={() => setForceJoinTarget({ id: ws.id, name: ws.name })}
                            >
                              Join Admin
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => setDeleteWorkspaceTarget({ id: ws.id, name: ws.name })}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: BROADCAST PLATFORM NOTIFICATION */}
        {/* ======================================================== */}
        <TabsContent value="broadcast" className="mt-4">
          <Card className="max-w-xl border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 shadow-sm rounded-lg">
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 mb-6">
              <ShieldAlert className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Important Audit Notice</p>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                  System broadcasts dispatch real-time notifications to **every account** registered on this server. 
                  These actions are logged and are protected by idempotency tokens to prevent double-delivery.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">Broadcast Title</Label>
                <Input
                  id="title"
                  placeholder="System Maintenance Scheduled"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold">Broadcast Message Body</Label>
                <Textarea
                  id="message"
                  placeholder="We will be performing routine database optimizations on June 18th from 02:00 to 03:00 UTC. Some workflows may be degraded."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={broadcastSending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium text-xs py-2"
              >
                <Send className="size-3.5" />
                {broadcastSending ? "Sending Broadcast..." : "Dispatch Broadcast"}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* DIALOGS & CONFIRMATIONS */}
      {/* ======================================================== */}

      {/* DIALOG: Create Custom Role */}
      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name" className="text-xs font-semibold">Role Name</Label>
              <Input
                id="role-name"
                placeholder="developer"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc" className="text-xs font-semibold">Description</Label>
              <Input
                id="role-desc"
                placeholder="Engineering developer role"
                value={newRoleDesc}
                onChange={e => setNewRoleDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateRole} disabled={creatingRole}>
              {creatingRole ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Create Permission */}
      <Dialog open={createPermissionOpen} onOpenChange={setCreatePermissionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Permission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="perm-name" className="text-xs font-semibold">Permission Name</Label>
              <Input
                id="perm-name"
                placeholder="workspace:manage"
                value={newPermName}
                onChange={e => setNewPermName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perm-desc" className="text-xs font-semibold">Description</Label>
              <Input
                id="perm-desc"
                placeholder="Manage workspace settings"
                value={newPermDesc}
                onChange={e => setNewPermDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreatePermission} disabled={creatingPermission}>
              {creatingPermission ? "Creating..." : "Create Permission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Edit Role */}
      <Dialog open={!!editRoleTarget} onOpenChange={(open) => { if (!open) setEditRoleTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-role-name" className="text-xs font-semibold">Role Name</Label>
              <Input
                id="edit-role-name"
                placeholder="developer"
                value={editRoleName}
                onChange={e => setEditRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role-desc" className="text-xs font-semibold">Description</Label>
              <Input
                id="edit-role-desc"
                placeholder="Engineering developer role"
                value={editRoleDesc}
                onChange={e => setEditRoleDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUpdateRole} disabled={updatingRole}>
              {updatingRole ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Force Join Workspace */}
      <Dialog open={!!forceJoinTarget} onOpenChange={(open) => { if (!open) setForceJoinTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Force Join Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50">
              <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                You are forcing yourself into the workspace <strong>{forceJoinTarget?.name}</strong> as an <strong>Admin</strong>. 
                This bypasses membership invitations and will be logged.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="join-reason" className="text-xs font-semibold">Audit Justification / Reason</Label>
              <Textarea
                id="join-reason"
                placeholder="Compliance audit of workspace projects"
                value={forceJoinReason}
                onChange={e => setForceJoinReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleForceJoin} disabled={joiningWorkspace}>
              {joiningWorkspace ? "Joining..." : "Force Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: Delete custom role */}
      <ConfirmDialog
        open={!!deleteRoleTarget}
        onOpenChange={(open) => { if (!open) setDeleteRoleTarget(null); }}
        title="Delete Custom Role"
        description={`Are you sure you want to permanently delete the custom role '${deleteRoleTarget?.name}'? Custom permissions attached to this role will be discarded.`}
        confirmLabel="Delete Role"
        destructive
        onConfirm={handleDeleteRole}
      />

      {/* Confirm: Toggle Ban/Unban user */}
      <ConfirmDialog
        open={!!toggleActiveTarget}
        onOpenChange={(open) => { if (!open) setToggleActiveTarget(null); }}
        title={toggleActiveTarget?.isActive ? "Ban User Account" : "Reactivate User Account"}
        description={
          toggleActiveTarget?.isActive
            ? `Are you sure you want to ban and disable the user account '${toggleActiveTarget?.name}'? They will be signed out and unable to log back in.`
            : `Are you sure you want to reactivate the user account '${toggleActiveTarget?.name}'? They will be allowed to sign back in.`
        }
        confirmLabel={toggleActiveTarget?.isActive ? "Ban Account" : "Reactivate"}
        destructive={toggleActiveTarget?.isActive}
        onConfirm={handleToggleUserActive}
      />

      {/* Confirm: Anonymize user */}
      <ConfirmDialog
        open={!!deleteUserTarget}
        onOpenChange={(open) => { if (!open) setDeleteUserTarget(null); }}
        title="Delete & Anonymize User"
        description={`WARNING: This will permanently deactivate the login credentials and scrub/anonymize all personal profile information for user '${deleteUserTarget?.name}'. This action is irreversible.`}
        confirmLabel="Scrumb & Deactivate"
        destructive
        onConfirm={handleDeleteUser}
      />

      {/* Confirm: Force delete workspace */}
      <ConfirmDialog
        open={!!deleteWorkspaceTarget}
        onOpenChange={(open) => { if (!open) setDeleteWorkspaceTarget(null); }}
        title="Force Delete Workspace"
        description={`WARNING: This will permanently delete the workspace '${deleteWorkspaceTarget?.name}', discarding all of its projects, tasks, comments, and attachments. This action is irreversible.`}
        confirmLabel="Force Delete Workspace"
        destructive
        onConfirm={handleDeleteWorkspace}
      />
    </AdminWorkspaceLayout>
  );
}
