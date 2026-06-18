import { Button } from "../../ui/button";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { DateDisplay } from "../../shared/DateDisplay";
import { useAdminWorkspace } from "./AdminContext";

export function AdminDialogs() {
  const {
    createRoleOpen,
    setCreateRoleOpen,
    newRoleName,
    setNewRoleName,
    newRoleDesc,
    setNewRoleDesc,
    creatingRole,
    handleCreateRole,
    createPermissionOpen,
    setCreatePermissionOpen,
    newPermName,
    setNewPermName,
    newPermDesc,
    setNewPermDesc,
    creatingPermission,
    handleCreatePermission,
    editRoleTarget,
    setEditRoleTarget,
    editRoleName,
    setEditRoleName,
    editRoleDesc,
    setEditRoleDesc,
    updatingRole,
    handleUpdateRole,
    deleteRoleTarget,
    setDeleteRoleTarget,
    handleDeleteRole,
    toggleActiveTarget,
    setToggleActiveTarget,
    handleToggleUserActive,
    deleteUserTarget,
    setDeleteUserTarget,
    handleDeleteUser,
    deleteWorkspaceTarget,
    setDeleteWorkspaceTarget,
    handleDeleteWorkspace,
    viewWorkspaceTarget,
    setViewWorkspaceTarget,
    promoteAdminTarget,
    setPromoteAdminTarget,
    confirmPromoteAdmin,
  } = useAdminWorkspace();

  return (
    <>
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

      <ConfirmDialog
        open={!!deleteRoleTarget}
        onOpenChange={(open) => { if (!open) setDeleteRoleTarget(null); }}
        title="Delete Custom Role"
        description={`Are you sure you want to permanently delete the custom role '${deleteRoleTarget?.name}'? Custom permissions attached to this role will be discarded.`}
        confirmLabel="Delete Role"
        destructive
        onConfirm={handleDeleteRole}
      />

      <ConfirmDialog
        open={!!promoteAdminTarget}
        onOpenChange={(open) => { if (!open) setPromoteAdminTarget(null); }}
        title="Grant Platform Admin"
        description={`Grant platform admin privileges to '${promoteAdminTarget?.name}'? They will use the admin workspace instead of collaboration UI. If they belong to workspaces today, membership may remain in the database but they cannot join new workspaces via invite.`}
        confirmLabel="Grant Admin"
        destructive
        onConfirm={confirmPromoteAdmin}
      />

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

      <ConfirmDialog
        open={!!deleteUserTarget}
        onOpenChange={(open) => { if (!open) setDeleteUserTarget(null); }}
        title="Delete & Anonymize User"
        description={`WARNING: This will permanently deactivate the login credentials and scrub/anonymize all personal profile information for user '${deleteUserTarget?.name}'. This action is irreversible.`}
        confirmLabel="Scrumb & Deactivate"
        destructive
        onConfirm={handleDeleteUser}
      />

      <ConfirmDialog
        open={!!deleteWorkspaceTarget}
        onOpenChange={(open) => { if (!open) setDeleteWorkspaceTarget(null); }}
        title="Force Delete Workspace"
        description={`WARNING: This will permanently delete the workspace '${deleteWorkspaceTarget?.name}', discarding all of its projects, tasks, comments, and attachments. This action is irreversible.`}
        confirmLabel="Force Delete Workspace"
        destructive
        onConfirm={handleDeleteWorkspace}
      />

      <Dialog open={!!viewWorkspaceTarget} onOpenChange={(open) => { if (!open) setViewWorkspaceTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Workspace Information</DialogTitle>
          </DialogHeader>
          {viewWorkspaceTarget && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Workspace Name</Label>
                <p className="text-sm font-medium">{viewWorkspaceTarget.name}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Slug</Label>
                <p className="text-sm font-mono">{viewWorkspaceTarget.slug}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Description</Label>
                <p className="text-sm">{viewWorkspaceTarget.description || "No description provided."}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Owner ID</Label>
                <p className="text-sm font-mono">{viewWorkspaceTarget.ownerId}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Members Count</Label>
                <p className="text-sm">{viewWorkspaceTarget.memberCount ?? 0}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Created At</Label>
                <p className="text-sm">
                  {viewWorkspaceTarget.createdAt ? <DateDisplay date={viewWorkspaceTarget.createdAt} format="absolute" /> : "N/A"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
