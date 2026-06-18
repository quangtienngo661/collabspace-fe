import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { adminApi } from "../../../api/adminApi";
import { formatAdminApiError } from "../../../api/adminErrors";
import { adminUserDisplayName } from "../../../api/mappers";
import type { AdminRole, AdminWorkspace, AdminPermission, AdminUserAggregate } from "../../../api/types";

interface AdminWorkspaceContextValue {
  rolesState: ReturnType<typeof useAsyncData<AdminRole[]>>;
  permissionsState: ReturnType<typeof useAsyncData<AdminPermission[]>>;
  usersState: ReturnType<typeof useAsyncData<AdminUserAggregate[]>>;
  workspacesState: ReturnType<typeof useAsyncData<AdminWorkspace[]>>;
  rolesLoading: boolean;
  roles: AdminRole[];
  permissions: AdminPermission[];
  filteredUsers: AdminUserAggregate[];
  filteredWorkspaces: AdminWorkspace[];
  isProtectedRole: (name: string) => boolean;
  reloadAll: () => Promise<void>;
  createRoleOpen: boolean;
  setCreateRoleOpen: (open: boolean) => void;
  newRoleName: string;
  setNewRoleName: (name: string) => void;
  newRoleDesc: string;
  setNewRoleDesc: (desc: string) => void;
  creatingRole: boolean;
  createPermissionOpen: boolean;
  setCreatePermissionOpen: (open: boolean) => void;
  newPermName: string;
  setNewPermName: (name: string) => void;
  newPermDesc: string;
  setNewPermDesc: (desc: string) => void;
  creatingPermission: boolean;
  editRoleTarget: AdminRole | null;
  setEditRoleTarget: (role: AdminRole | null) => void;
  editRoleName: string;
  setEditRoleName: (name: string) => void;
  editRoleDesc: string;
  setEditRoleDesc: (desc: string) => void;
  updatingRole: boolean;
  deleteRoleTarget: { id: string; name: string } | null;
  setDeleteRoleTarget: (target: { id: string; name: string } | null) => void;
  toggleActiveTarget: { id: string; name: string; isActive: boolean } | null;
  setToggleActiveTarget: (target: { id: string; name: string; isActive: boolean } | null) => void;
  deleteUserTarget: { id: string; name: string } | null;
  setDeleteUserTarget: (target: { id: string; name: string } | null) => void;
  deleteWorkspaceTarget: { id: string; name: string } | null;
  setDeleteWorkspaceTarget: (target: { id: string; name: string } | null) => void;
  viewWorkspaceTarget: AdminWorkspace | null;
  setViewWorkspaceTarget: (ws: AdminWorkspace | null) => void;
  broadcastTitle: string;
  setBroadcastTitle: (title: string) => void;
  broadcastMessage: string;
  setBroadcastMessage: (message: string) => void;
  broadcastSending: boolean;
  userSearch: string;
  setUserSearch: (search: string) => void;
  workspaceSearch: string;
  setWorkspaceSearch: (search: string) => void;
  handleCreateRole: () => Promise<void>;
  handleCreatePermission: () => Promise<void>;
  openEditRole: (role: AdminRole) => void;
  handleUpdateRole: () => Promise<void>;
  handleDeleteRole: () => Promise<void>;
  handlePermissionToggle: (
    roleId: string,
    roleName: string,
    permissionId: string,
    permissionName: string,
    checked: boolean,
  ) => Promise<void>;
  promoteAdminTarget: { id: string; name: string; roleId: string } | null;
  setPromoteAdminTarget: (target: { id: string; name: string; roleId: string } | null) => void;
  requestRoleChange: (userId: string, newRoleId: string, userName: string) => void;
  confirmPromoteAdmin: () => Promise<void>;
  handleToggleUserActive: () => Promise<void>;
  handleDeleteUser: () => Promise<void>;
  handleDeleteWorkspace: () => Promise<void>;
  handleSendBroadcast: (e: React.FormEvent) => Promise<void>;
}

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const rolesState = useAsyncData(() => adminApi.listRoles(), []);
  const permissionsState = useAsyncData(() => adminApi.listPermissions(), []);
  const usersState = useAsyncData(() => adminApi.listAllUsersEnriched(), []);
  const workspacesState = useAsyncData(() => adminApi.listAllWorkspaces(), []);

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

  const [toggleActiveTarget, setToggleActiveTarget] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; name: string } | null>(null);

  const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewWorkspaceTarget, setViewWorkspaceTarget] = useState<AdminWorkspace | null>(null);
  const [promoteAdminTarget, setPromoteAdminTarget] = useState<{
    id: string;
    name: string;
    roleId: string;
  } | null>(null);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [workspaceSearch, setWorkspaceSearch] = useState("");

  const isProtectedRole = (name: string) => ["admin", "user"].includes(name.toLowerCase());

  async function reloadAll() {
    toast.promise(
      Promise.all([
        rolesState.reload(),
        permissionsState.reload(),
        usersState.reload(),
        workspacesState.reload(),
      ]),
      {
        loading: "Refreshing admin workspace data...",
        success: "Admin workspace data reloaded",
        error: "Unable to reload admin data",
      },
    );
  }

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
    checked: boolean,
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

  async function assignPlatformRole(userId: string, newRoleId: string) {
    await adminApi.assignRole(userId, newRoleId);
    toast.success("User role updated successfully");
    await usersState.reload();
  }

  function requestRoleChange(userId: string, newRoleId: string, userName: string) {
    const role = (rolesState.data ?? []).find(entry => entry.id === newRoleId);
    if (!role) return;

    if (role.name.toLowerCase() === "admin") {
      setPromoteAdminTarget({ id: userId, name: userName, roleId: newRoleId });
      return;
    }

    void assignPlatformRole(userId, newRoleId).catch(err => {
      toast.error(formatAdminApiError(err, "Unable to update user role"));
    });
  }

  async function confirmPromoteAdmin() {
    if (!promoteAdminTarget) return;
    try {
      await assignPlatformRole(promoteAdminTarget.id, promoteAdminTarget.roleId);
      setPromoteAdminTarget(null);
    } catch (err) {
      toast.error(formatAdminApiError(err, "Unable to grant platform admin"));
    }
  }

  async function handleToggleUserActive() {
    if (!toggleActiveTarget) return;
    try {
      await adminApi.setActiveStatus(toggleActiveTarget.id, !toggleActiveTarget.isActive);
      toast.success(
        `User '${toggleActiveTarget.name}' ${toggleActiveTarget.isActive ? "banned/deactivated" : "reactivated"} successfully`,
      );
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

  const rolesLoading = rolesState.loading || permissionsState.loading;
  const roles = rolesState.data ?? [];
  const permissions = permissionsState.data ?? [];

  const filteredUsers = (usersState.data ?? []).filter(u => {
    const search = userSearch.toLowerCase();
    const label = adminUserDisplayName(u).toLowerCase();
    return (
      label.includes(search) ||
      (u.email || "").toLowerCase().includes(search) ||
      (u.username || "").toLowerCase().includes(search)
    );
  });

  const filteredWorkspaces = (workspacesState.data ?? []).filter(w => {
    const search = workspaceSearch.toLowerCase();
    return (
      w.name.toLowerCase().includes(search) ||
      (w.slug || "").toLowerCase().includes(search) ||
      (w.description || "").toLowerCase().includes(search)
    );
  });

  const value = useMemo<AdminWorkspaceContextValue>(
    () => ({
      rolesState,
      permissionsState,
      usersState,
      workspacesState,
      rolesLoading,
      roles,
      permissions,
      filteredUsers,
      filteredWorkspaces,
      isProtectedRole,
      reloadAll,
      createRoleOpen,
      setCreateRoleOpen,
      newRoleName,
      setNewRoleName,
      newRoleDesc,
      setNewRoleDesc,
      creatingRole,
      createPermissionOpen,
      setCreatePermissionOpen,
      newPermName,
      setNewPermName,
      newPermDesc,
      setNewPermDesc,
      creatingPermission,
      editRoleTarget,
      setEditRoleTarget,
      editRoleName,
      setEditRoleName,
      editRoleDesc,
      setEditRoleDesc,
      updatingRole,
      deleteRoleTarget,
      setDeleteRoleTarget,
      toggleActiveTarget,
      setToggleActiveTarget,
      deleteUserTarget,
      setDeleteUserTarget,
    deleteWorkspaceTarget,
    setDeleteWorkspaceTarget,
    viewWorkspaceTarget,
    setViewWorkspaceTarget,
    promoteAdminTarget,
    setPromoteAdminTarget,
    broadcastTitle,
      setBroadcastTitle,
      broadcastMessage,
      setBroadcastMessage,
      broadcastSending,
      userSearch,
      setUserSearch,
      workspaceSearch,
      setWorkspaceSearch,
      handleCreateRole,
      handleCreatePermission,
      openEditRole,
      handleUpdateRole,
      handleDeleteRole,
      handlePermissionToggle,
      requestRoleChange,
      confirmPromoteAdmin,
      handleToggleUserActive,
      handleDeleteUser,
      handleDeleteWorkspace,
      handleSendBroadcast,
    }),
    [
      rolesState,
      permissionsState,
      usersState,
      workspacesState,
      rolesLoading,
      roles,
      permissions,
      filteredUsers,
      filteredWorkspaces,
      createRoleOpen,
      newRoleName,
      newRoleDesc,
      creatingRole,
      createPermissionOpen,
      newPermName,
      newPermDesc,
      creatingPermission,
      editRoleTarget,
      editRoleName,
      editRoleDesc,
      updatingRole,
      deleteRoleTarget,
      toggleActiveTarget,
      deleteUserTarget,
      deleteWorkspaceTarget,
      viewWorkspaceTarget,
      promoteAdminTarget,
      broadcastTitle,
      broadcastMessage,
      broadcastSending,
      userSearch,
      workspaceSearch,
    ],
  );

  return <AdminWorkspaceContext.Provider value={value}>{children}</AdminWorkspaceContext.Provider>;
}

export function useAdminWorkspace() {
  const ctx = useContext(AdminWorkspaceContext);
  if (!ctx) {
    throw new Error("useAdminWorkspace must be used within AdminProvider");
  }
  return ctx;
}
