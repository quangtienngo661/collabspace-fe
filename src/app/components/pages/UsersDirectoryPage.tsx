import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Search, User as UserIcon, RefreshCw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { usersApi } from "../../api/usersApi";
import { useAuth } from "../../auth/AuthContext";
import { UserAvatar } from "../shared/UserAvatar";
import { SkeletonRow } from "../shared/SkeletonCard";
import { EmptyState, ErrorState } from "../shared/EmptyState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { usePresenceMap } from "../../hooks/usePresenceMap";
import type { User } from "../../api/types";

export function UsersDirectoryPage() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("q");
    if (fromUrl) {
      setQuery(fromUrl);
      setDebounced(fromUrl.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const hasQuery = debounced.length > 0;
  const canBrowseAll = isAdmin && !hasQuery;

  const listState = useAsyncData(
    () => (hasQuery ? usersApi.search(debounced, 50) : usersApi.list({ limit: 50 })),
    [debounced, isAdmin],
    { enabled: hasQuery || canBrowseAll },
  );

  const users = listState.data?.items ?? [];
  const userIds = users.map(u => u.id);
  const presenceMap = usePresenceMap(userIds, users.length > 0);

  async function openUser(user: User) {
    setDetailLoading(true);
    setSelected(user);
    try {
      const full = await usersApi.get(user.id);
      setSelected(full);
    } catch {
      /* keep summary row */
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">User directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdmin
              ? "Search users by name or email (platform roles are managed under Platform Admin → User Accounts)"
              : "Search by name or email to find users"}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void listState.reload()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search by name or email..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {listState.error && <ErrorState title="Unable to load users" description={listState.error} />}

      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {!hasQuery && !canBrowseAll ? (
          <EmptyState
            icon={Search}
            title="Search the directory"
            description="Type a name or email above. Browsing all users requires a platform admin account."
          />
        ) : listState.loading && users.length === 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">{[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}</div>
        ) : users.length === 0 ? (
          <EmptyState icon={UserIcon} title="No users found" description="Try a different search query." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const live = { ...user, status: presenceMap[user.id] ?? user.status };
                  return (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      onClick={() => void openUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={live} size="sm" showPresence />
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{user.username ? `@${user.username}` : "—"}</TableCell>
                      <TableCell className="text-xs capitalize text-slate-500">{live.status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User profile</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2">
              {detailLoading && <p className="text-xs text-slate-400">Loading full profile...</p>}
              <div className="flex items-center gap-3">
                <UserAvatar user={{ ...selected, status: presenceMap[selected.id] ?? selected.status }} size="md" showPresence />
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                </div>
              </div>
              {selected.username && <p className="text-sm"><span className="text-slate-500">Username:</span> @{selected.username}</p>}
              {selected.bio && <p className="text-sm text-slate-600 dark:text-slate-300">{selected.bio}</p>}
              <p className="text-xs text-slate-400">Joined {selected.joinedAt || "N/A"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
