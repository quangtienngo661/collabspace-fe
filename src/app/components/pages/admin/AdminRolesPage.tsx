import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Checkbox } from "../../ui/checkbox";
import { RoleBadge } from "../../shared/StatusBadge";
import { ErrorState } from "../../shared/EmptyState";
import { useAdminWorkspace } from "./AdminContext";
import type { Role } from "../../../api/types";

export function AdminRolesPage() {
  const {
    rolesState,
    permissionsState,
    rolesLoading,
    roles,
    permissions,
    isProtectedRole,
    setCreatePermissionOpen,
    setCreateRoleOpen,
    openEditRole,
    setDeleteRoleTarget,
    handlePermissionToggle,
  } = useAdminWorkspace();

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Permission Matrix</p>
          <p className="text-xs text-slate-400">Configure permission mappings for RBAC. System-level roles are protected.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button size="sm" variant="outline" className="gap-1 rounded-xl text-xs" onClick={() => setCreatePermissionOpen(true)}>
            <Plus className="size-3.5" /> New Permission
          </Button>
          <Button size="sm" className="gap-1 rounded-xl bg-blue-600 text-xs text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700" onClick={() => setCreateRoleOpen(true)}>
            <Plus className="size-3.5" /> New Custom Role
          </Button>
        </div>
      </div>

      {rolesState.error || permissionsState.error ? (
        <ErrorState title="Unable to load roles metadata" description={rolesState.error || permissionsState.error || ""} />
      ) : (
        <Card className="overflow-x-auto rounded-2xl border-white/70 bg-white/85 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/50">
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
                              aria-label={`Edit ${role.name} role`}
                            >
                              <Pencil className="size-2.5" /> Edit
                            </button>
                            <button
                              type="button"
                              className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-0.5 hover:underline"
                              onClick={() => setDeleteRoleTarget({ id: role.id, name: role.name })}
                              aria-label={`Delete ${role.name} role`}
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
                      index % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-950/20"
                    }`}
                  >
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{perm.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{perm.description || "No description provided."}</p>
                    </td>
                    {roles.map(role => {
                      const isAdminRole = role.name.toLowerCase() === "admin";
                      const isAssigned = isAdminRole ? true : role.permissions?.includes(perm.name);
                      return (
                        <td key={role.id} className="px-4 py-3 text-center">
                          {isAdminRole ? (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-sm" title="Implicit All Permissions">All</span>
                          ) : (
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={(val) =>
                                handlePermissionToggle(role.id, role.name, perm.id, perm.name, Boolean(val))
                              }
                              className="mx-auto"
                            />
                          )}
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
    </div>
  );
}
