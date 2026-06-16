import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { UserPlus, FolderOpen, Settings, Users, RefreshCw, ArrowLeft, Activity, MoreHorizontal, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { workspaceApi } from "../../../api/workspaceApi";
import { enrichProjectsTaskCounts } from "../../../api/clientStats";
import { usersApi } from "../../../api/usersApi";
import { RoleBadge } from "../../shared/StatusBadge";
import { UserAvatar } from "../../shared/UserAvatar";
import { EmptyState, ErrorState } from "../../shared/EmptyState";
import { WorkspaceActivityFeed } from "../../shared/WorkspaceActivityFeed";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { usePresenceMap } from "../../../hooks/usePresenceMap";
import { useAuth } from "../../../auth/AuthContext";
import { useWorkspaces } from "../../../context/WorkspacesContext";
import type { WorkspaceMember } from "../../../api/types";
import { toast } from "sonner";

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "members";
  const { profile } = useAuth();
  const { reload: reloadWorkspaces, setActiveWorkspace } = useWorkspaces();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [settings, setSettings] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  const workspaceState = useAsyncData(async () => {
    if (!id) throw new Error("Workspace id is missing");
    const workspace = await workspaceApi.get(id);
    setSettings({ name: workspace.name, description: workspace.description });
    return workspace;
  }, [id]);

  const projectsState = useAsyncData(
    () => id ? workspaceApi.listProjects(id).then(enrichProjectsTaskCounts) : Promise.resolve([]),
    [id],
  );

  const membersState = useAsyncData<WorkspaceMember[]>(async () => {
    if (!id) return [];
    const members = await workspaceApi.members(id);
    const profiles = await usersApi.bulk(members.map(member => member.userId));
    const profileByUserId = new Map(profiles.map(profile => [profile.userId, profile]));
    return members.map(member => ({ ...member, profile: profileByUserId.get(member.userId) }));
  }, [id]);

  const invitationsState = useAsyncData(
    () => id ? workspaceApi.invitations(id) : Promise.resolve([]),
    [id],
  );

  const activityState = useAsyncData(
    () => (id ? workspaceApi.getActivity(id, 0, 20) : Promise.resolve({ items: [], total: 0 })),
    [id],
    { enabled: Boolean(id) },
  );

  useEffect(() => {
    if (id) setActiveWorkspace(id);
  }, [id, setActiveWorkspace]);

  const ws = workspaceState.data?.id === id ? workspaceState.data : null;
  const wsProjects = projectsState.data ?? [];
  const members = membersState.data ?? [];
  const invitations = invitationsState.data ?? [];
  const error = workspaceState.error || projectsState.error || membersState.error || invitationsState.error;

  const memberUserIds = useMemo(() => members.map(m => m.userId).filter(Boolean), [members]);
  const presenceMap = usePresenceMap(memberUserIds, Boolean(id));

  const isOwner = useMemo(() => {
    if (!profile?.id) return false;
    if (ws?.ownerId === profile.id) return true;
    return members.some(m => m.userId === profile.id && m.role === "owner");
  }, [profile?.id, ws?.ownerId, members]);

  function canRemoveMember(target: { userId: string; role: string }) {
    if (!target.userId || target.role === "owner") return false;
    if (target.userId === profile?.id) return true;
    return isOwner;
  }

  async function handleRemoveMember() {
    if (!id || !removeTarget) return;
    setRemoving(true);
    try {
      await workspaceApi.removeMember(id, removeTarget.userId);
      const isSelf = removeTarget.userId === profile?.id;
      if (isSelf) {
        await reloadWorkspaces();
        toast.success("You left the workspace");
        setRemoveTarget(null);
        navigate("/workspaces");
        return;
      }
      await membersState.reload();
      toast.success(`Removed ${removeTarget.name} from workspace`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to remove member");
    } finally {
      setRemoving(false);
    }
  }

  const memberRows = useMemo(() => {
    const regularMembers = members.map(member => {
      const fallbackName = "Unknown User";
      const liveStatus = presenceMap[member.userId] ?? member.profile?.status ?? "offline";
      return {
        ...member,
        user: member.profile
          ? { ...member.profile, status: liveStatus }
          : {
          id: member.userId,
          userId: member.userId,
          name: fallbackName,
          avatar: fallbackName.slice(0, 2).toUpperCase(),
          role: member.role,
          status: liveStatus,
          title: "",
          joinedAt: member.joinedAt,
        },
      };
    });

    const pendingMembers = invitations.map(invitation => ({
      id: invitation.id,
      userId: "",
      workspaceId: id!,
      role: "member",
      joinedAt: invitation.createdAt,
      user: {
        id: invitation.id,
        userId: "",
        name: invitation.email,
        email: invitation.email,
        avatar: "?",
        role: "member",
        status: "pending" as const,
        title: "Pending Invitation",
        joinedAt: invitation.createdAt,
      },
    }));

    return [...regularMembers, ...pendingMembers];
  }, [members, invitations, id, presenceMap]);

  async function handleDeleteWorkspace() {
    if (!id) return;
    setDeleting(true);
    try {
      await workspaceApi.delete(id);
      await reloadWorkspaces();
      toast.success("Workspace deleted");
      setDeleteOpen(false);
      navigate("/workspaces");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete workspace");
    } finally {
      setDeleting(false);
    }
  }

  async function handleInvite() {
    if (!id) return;
    if (!inviteEmail) { toast.error("Email is required"); return; }
    try {
      await workspaceApi.invite(id, inviteEmail);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteOpen(false);
      void invitationsState.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send invitation");
    }
  }

  async function saveSettings() {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await workspaceApi.update(id, settings);
      workspaceState.setData(updated);
      toast.success("Workspace settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save workspace");
    } finally {
      setSaving(false);
    }
  }

  if (workspaceState.loading && !ws) {
    return <div className="p-6 text-sm text-slate-400">Loading workspace...</div>;
  }

  if (!ws && workspaceState.error) {
    const denied =
      workspaceState.error.toLowerCase().includes("forbidden")
      || workspaceState.error.toLowerCase().includes("403")
      || workspaceState.error.toLowerCase().includes("not a member");
    if (denied) {
      navigate("/403", { replace: true });
      return null;
    }
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/workspaces")}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspaces
        </Button>
        <ErrorState title="Workspace not found" description={workspaceState.error} />
      </div>
    );
  }

  if (!ws) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/workspaces")}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspaces
        </Button>
        <div className="text-slate-400">Workspace not found</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">{ws.name[0]}</div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{ws.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{ws.description || "No description"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { void workspaceState.reload(); void projectsState.reload(); void membersState.reload(); void invitationsState.reload(); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/workspaces/${id}/projects`)}>
            <FolderOpen className="w-3.5 h-3.5" /> Projects
          </Button>
        </div>
      </div>

      {error && <ErrorState title="Some workspace data could not load" description={error} />}

      <Tabs value={activeTab} onValueChange={value => setSearchParams({ tab: value }, { replace: true })}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="members" className="gap-1.5"><Users className="w-3.5 h-3.5" />Members</TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5"><FolderOpen className="w-3.5 h-3.5" />Projects</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><Activity className="w-3.5 h-3.5" />Activity</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-3.5 h-3.5" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-0 flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{memberRows.length} Members</span>
              {isOwner && (
                <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent">
                  <TableHead className="text-xs text-slate-500">Member</TableHead>
                  <TableHead className="text-xs text-slate-500">Role</TableHead>
                  <TableHead className="text-xs text-slate-500">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberRows.map(member => (
                  <TableRow key={member.id} className="border-slate-100 dark:border-slate-700">
                    <TableCell>
                      <div className="flex items-center gap-2.5 my-[5px] mx-[5px]" >
                        <UserAvatar user={member.user} size="sm" showPresence />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.user.name}</p>
                          <p className="text-xs text-slate-400">{member.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge role={member.role} /></TableCell>
                    <TableCell><span className="text-xs capitalize text-slate-500">{member.user.status}</span></TableCell>
                    <TableCell>
                      {member.userId && canRemoveMember(member) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setRemoveTarget({ userId: member.userId, name: member.user.name })}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {member.userId === profile?.id ? "Leave workspace" : "Remove member"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          {wsProjects.length === 0 ? (
            <EmptyState icon={FolderOpen} title="No projects yet" description="Create your first project to start managing tasks." action={{ label: "New Project", onClick: () => navigate(`/workspaces/${id}/projects`) }} />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {wsProjects.map(p => (
                <Card key={p.id} className="p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/workspaces/${id}/projects/${p.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{p.description || "No description"}</p>
                  <p className="text-xs text-slate-400">{p.taskCount} tasks · Created {p.createdAt || "N/A"}</p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="p-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Workspace activity</h2>
            <WorkspaceActivityFeed
              items={activityState.data?.items ?? []}
              loading={activityState.loading}
              onItemClick={item => {
                const taskId =
                  typeof item.meta?.taskId === "string"
                    ? item.meta.taskId
                    : typeof item.meta?.targetId === "string"
                      ? item.meta.targetId
                      : null;
                const projectId = typeof item.meta?.projectId === "string" ? item.meta.projectId : null;
                if (taskId && projectId && id) {
                  navigate(`/workspaces/${id}/projects/${projectId}?task=${taskId}`);
                }
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card className="p-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Workspace Settings</h2>
            <div className="space-y-1.5">
              <Label>Workspace Name</Label>
              <Input value={settings.name} onChange={event => setSettings(prev => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={settings.description} onChange={event => setSettings(prev => ({ ...prev, description: event.target.value }))} />
            </div>
            <div className="pt-2 flex gap-2 flex-wrap">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveSettings} disabled={saving || !isOwner}>{saving ? "Saving..." : "Save Changes"}</Button>
              {isOwner && (
                <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
                  Delete Workspace
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} className="bg-blue-600 hover:bg-blue-700 text-white">Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={open => { if (!open) setRemoveTarget(null); }}
        title={removeTarget?.userId === profile?.id ? "Leave workspace?" : "Remove member?"}
        description={
          removeTarget
            ? removeTarget.userId === profile?.id
              ? "You will lose access to this workspace until invited again."
              : `Remove "${removeTarget.name}" from this workspace?`
            : ""
        }
        confirmLabel={removing ? "Removing..." : removeTarget?.userId === profile?.id ? "Leave" : "Remove"}
        destructive
        onConfirm={() => void handleRemoveMember()}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete workspace?"
        description="This permanently deletes the workspace and cascades via backend events. Only the owner can do this."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        destructive
        onConfirm={() => void handleDeleteWorkspace()}
      />
    </div>
  );
}
