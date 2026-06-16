import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, Key, LogOut, Monitor, Save, Settings, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card } from "../../ui/card";
import { Switch } from "../../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { UserAvatar } from "../../shared/UserAvatar";
import { PresenceDot, RoleBadge } from "../../shared/StatusBadge";
import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { ErrorState } from "../../shared/EmptyState";
import { toast } from "sonner";
import { useAuth } from "../../../auth/AuthContext";
import { authApi } from "../../../api/authApi";
import { usersApi } from "../../../api/usersApi";
import type { User as DomainUser, UserPreferences, UserStatus } from "../../../api/types";
import { useAsyncData } from "../../../hooks/useAsyncData";

const defaultPreferences: UserPreferences = {
  dateFormat: "YYYY-MM-DD",
  desktopNotificationsEnabled: true,
  digestFrequency: "daily",
  emailNotificationsEnabled: true,
  language: "en",
  pushNotificationsEnabled: true,
  theme: "system",
  timeFormat: "24h",
  timezone: "UTC",
  weekStartsOn: "monday",
};

function fallbackUser(email?: string): DomainUser {
  return {
    id: "current-user",
    userId: "current-user",
    name: email ?? "Current User",
    email,
    avatar: (email ?? "U").slice(0, 2).toUpperCase(),
    role: "member",
    status: "offline",
    joinedAt: "",
  };
}

function formatDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
}

export function MyProfilePage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const navigate = useNavigate();
  const { authUser, profile, preferences, session, refresh, logout, setPreferences, setProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const sessionsState = useAsyncData(() => authApi.sessions(), [], { enabled: activeTab === "sessions" });
  const currentUser = profile ?? fallbackUser(authUser?.email);

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    username: currentUser.username ?? "",
    status: currentUser.status,
    bio: currentUser.bio ?? "",
  });
  const [prefs, setPrefs] = useState<UserPreferences>(preferences ?? defaultPreferences);
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [revokeFamilyId, setRevokeFamilyId] = useState<string | null>(null);
  const [logoutOthersOpen, setLogoutOthersOpen] = useState(false);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      name: profile.name,
      username: profile.username ?? "",
      status: profile.status,
      bio: profile.bio ?? "",
    });
  }, [profile]);

  useEffect(() => {
    if (preferences) setPrefs(preferences);
  }, [preferences]);

  async function saveProfile() {
    try {
      await usersApi.updateMe({
        fullName: profileForm.name,
        displayName: profileForm.name,
        username: profileForm.username.trim() || null,
        bio: profileForm.bio || null,
      });
      await usersApi.updateStatus(profileForm.status);
      await refresh(true);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile");
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setIsUploading(true);
      const updated = await usersApi.uploadAvatar(file);
      setProfile(updated);
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload avatar");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = "";
    }
  }

  async function savePrefs() {
    try {
      const saved = await usersApi.updatePreferences(prefs);
      setPreferences(saved);
      toast.success("Preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save preferences");
    }
  }

  async function savePw() {
    if (!pw.current) {
      toast.error("Current password is required");
      return;
    }
    if (pw.newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (pw.newPw !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await authApi.changePassword(pw.current, pw.newPw);
      toast.success("Password changed. Please sign in again.");
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password");
    }
  }

  async function revokeSession() {
    if (!revokeFamilyId) return;
    try {
      await authApi.revokeSession(revokeFamilyId);
      setRevokeFamilyId(null);
      await sessionsState.reload();
      toast.success("Session revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to revoke session");
    }
  }

  async function logoutOthers() {
    if (!session?.refreshToken) {
      toast.error("Refresh token is not available");
      return;
    }
    try {
      await authApi.logoutOthers(session.refreshToken);
      setLogoutOthersOpen(false);
      await sessionsState.reload();
      toast.success("Other sessions logged out");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to logout other sessions");
    }
  }

  async function logoutAllDevices() {
    try {
      await authApi.logoutAll();
      setLogoutAllOpen(false);
      toast.success("Logged out from all devices");
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to logout all devices");
    }
  }

  const activeSessions = (sessionsState.data ?? []).filter(item => item.isActive);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account Settings</h1>

      <Tabs defaultValue={defaultTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="profile"><User className="mr-1.5 size-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="preferences"><Settings className="mr-1.5 size-3.5" />Preferences</TabsTrigger>
          <TabsTrigger value="sessions"><Monitor className="mr-1.5 size-3.5" />Sessions</TabsTrigger>
          <TabsTrigger value="password"><Key className="mr-1.5 size-3.5" />Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="space-y-4 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 md:col-span-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profile Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Full Name</Label>
                  <Input value={profileForm.name} onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <Input
                    value={profileForm.username}
                    onChange={e => setProfileForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                    placeholder="letters, numbers, . _ -"
                    pattern="^[a-z0-9._\-]+$"
                  />
                  <p className="text-xs text-slate-400">Used for @mentions in task comments</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={authUser?.email ?? currentUser.email ?? "N/A"} disabled className="opacity-60" />
                  <p className="text-xs text-slate-400">Contact admin to change email</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Presence Status</Label>
                  <Select value={profileForm.status} onValueChange={value => setProfileForm(prev => ({ ...prev, status: value as UserStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online"><span className="flex items-center gap-2"><PresenceDot status="online" /> Online</span></SelectItem>
                      <SelectItem value="away"><span className="flex items-center gap-2"><PresenceDot status="away" /> Away</span></SelectItem>
                      <SelectItem value="busy"><span className="flex items-center gap-2"><PresenceDot status="busy" /> Busy</span></SelectItem>
                      <SelectItem value="offline"><span className="flex items-center gap-2"><PresenceDot status="offline" /> Invisible</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Bio</Label>
                  <Input value={profileForm.bio} onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))} />
                </div>
              </div>
              <Button onClick={saveProfile} className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
                <Save className="size-3.5" /> Save Changes
              </Button>
            </Card>

            <Card className="space-y-4 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Avatar</h2>
              <div className="flex flex-col items-center gap-4">
                <UserAvatar user={currentUser} size="lg" showPresence />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                  <p className="text-xs text-slate-400">{authUser?.email ?? currentUser.email ?? "N/A"}</p>
                  <RoleBadge role={currentUser.role} className="mt-2" />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                  <Label htmlFor="avatar-upload">
                    <Button size="sm" variant="outline" className="cursor-pointer" disabled={isUploading} asChild>
                      <span>{isUploading ? "Uploading..." : "Upload Avatar"}</span>
                    </Button>
                  </Label>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="space-y-4 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { key: "emailNotificationsEnabled", label: "Email notifications" },
                  { key: "pushNotificationsEnabled", label: "Push notifications" },
                  { key: "desktopNotificationsEnabled", label: "Desktop notifications" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label className="cursor-pointer text-sm text-slate-700 dark:text-slate-300">{item.label}</Label>
                    <Switch
                      checked={Boolean(prefs[item.key as keyof UserPreferences])}
                      onCheckedChange={value => setPrefs(prev => ({ ...prev, [item.key]: value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Digest frequency</Label>
                <Select value={prefs.digestFrequency} onValueChange={value => setPrefs(prev => ({ ...prev, digestFrequency: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Card className="space-y-4 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Display Preferences</h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Theme</Label>
                  <Select value={prefs.theme} onValueChange={value => setPrefs(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System default</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={prefs.language} onValueChange={value => setPrefs(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="vi">Vietnamese</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Input value={prefs.timezone ?? ""} onChange={e => setPrefs(prev => ({ ...prev, timezone: e.target.value }))} />
                </div>
              </div>
              <Button onClick={savePrefs} className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
                <Save className="size-3.5" /> Save Preferences
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activeSessions.length} Active Sessions</p>
                <p className="text-xs text-slate-400">Refresh token sessions returned by auth-service</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => setLogoutOthersOpen(true)}
                >
                  <LogOut className="size-3.5" /> Logout Others
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => setLogoutAllOpen(true)}
                >
                  <LogOut className="size-3.5" /> Logout All Devices
                </Button>
              </div>
            </div>
            {sessionsState.error ? (
              <ErrorState title="Unable to load sessions" description={sessionsState.error} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-700">
                    <TableHead className="text-xs text-slate-500">Device</TableHead>
                    <TableHead className="hidden text-xs text-slate-500 md:table-cell">Location</TableHead>
                    <TableHead className="hidden text-xs text-slate-500 md:table-cell">Last Active</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionsState.loading && activeSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">Loading sessions...</TableCell>
                    </TableRow>
                  ) : activeSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">No active sessions returned.</TableCell>
                    </TableRow>
                  ) : activeSessions.map(activeSession => (
                    <TableRow key={activeSession.id} className="border-slate-100 dark:border-slate-700">
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <Monitor className="size-4 shrink-0 text-slate-400" />
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activeSession.device}</p>
                            {activeSession.current && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700 dark:bg-green-900/40 dark:text-green-300">Current</span>}
                          </div>
                          <p className="pl-6 text-xs text-slate-400">{activeSession.browser} - {activeSession.ip}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-slate-500 md:table-cell">{activeSession.location}</TableCell>
                      <TableCell className="hidden text-sm text-slate-500 md:table-cell">{formatDate(activeSession.lastActive)}</TableCell>
                      <TableCell>
                        {!activeSession.current && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => setRevokeFamilyId(activeSession.familyId)}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
          <ConfirmDialog
            open={!!revokeFamilyId}
            onOpenChange={open => { if (!open) setRevokeFamilyId(null); }}
            title="Revoke Session"
            description="This refresh token family will be revoked immediately."
            confirmLabel="Revoke"
            onConfirm={() => void revokeSession()}
            destructive
          />
          <ConfirmDialog
            open={logoutOthersOpen}
            onOpenChange={setLogoutOthersOpen}
            title="Logout All Other Sessions"
            description="All other devices will be logged out. Your current session will remain active."
            confirmLabel="Logout Others"
            onConfirm={() => void logoutOthers()}
            destructive
          />
          <ConfirmDialog
            open={logoutAllOpen}
            onOpenChange={setLogoutAllOpen}
            title="Logout All Devices"
            description="You will be signed out on every device, including this one."
            confirmLabel="Logout All"
            onConfirm={() => void logoutAllDevices()}
            destructive
          />
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card className="max-w-md space-y-4 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Current password"
                  value={pw.current}
                  onChange={e => setPw(prev => ({ ...prev, current: e.target.value }))}
                  className="pr-9"
                />
                <button type="button" onClick={() => setShowPw(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" placeholder="Min 8 characters" value={pw.newPw} onChange={e => setPw(prev => ({ ...prev, newPw: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input type="password" placeholder="Repeat new password" value={pw.confirm} onChange={e => setPw(prev => ({ ...prev, confirm: e.target.value }))} />
            </div>
            <Button onClick={savePw} className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
              <Key className="size-3.5" /> Update Password
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
