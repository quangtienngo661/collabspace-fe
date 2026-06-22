import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { AdminWorkspaceLayout } from "./AdminWorkspaceLayout";
import { AdminProvider, useAdminWorkspace } from "./AdminContext";
import { AdminDialogs } from "./AdminDialogs";
import { ADMIN_TAB_REDIRECTS, getAdminPageMeta } from "./adminNav";

function AdminLayoutInner() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { reloadAll } = useAdminWorkspace();
  const meta = getAdminPageMeta(location.pathname);

  const tabParam = searchParams.get("tab");
  if (tabParam && ADMIN_TAB_REDIRECTS[tabParam]) {
    return <Navigate to={ADMIN_TAB_REDIRECTS[tabParam]} replace />;
  }

  return (
    <AdminWorkspaceLayout
      title={meta.title}
      description={meta.description}
      action={
        <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl text-xs" onClick={reloadAll}>
          <RefreshCw className="size-3.5" /> Sync Data
        </Button>
      }
    >
      <Outlet />
      <AdminDialogs />
    </AdminWorkspaceLayout>
  );
}

export function AdminLayout() {
  return (
    <AdminProvider>
      <AdminLayoutInner />
    </AdminProvider>
  );
}
