import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./components/pages/auth/LoginPage";
import { RegisterPage } from "./components/pages/auth/RegisterPage";
import { OtpPage } from "./components/pages/auth/OtpPage";
import { ForgotPasswordPage } from "./components/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/pages/auth/ResetPasswordPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { WorkspaceListPage } from "./components/pages/workspace/WorkspaceListPage";
import { WorkspaceDetailPage } from "./components/pages/workspace/WorkspaceDetailPage";
import { ProjectListPage } from "./components/pages/project/ProjectListPage";
import { KanbanBoardPage } from "./components/pages/task/KanbanBoardPage";
import { NotificationsPage } from "./components/pages/NotificationsPage";
import { MyProfilePage } from "./components/pages/profile/MyProfilePage";
import { AdminLayout } from "./components/pages/admin/AdminLayout";
import { AdminOverviewPage } from "./components/pages/admin/AdminOverviewPage";
import { AdminRolesPage } from "./components/pages/admin/AdminRolesPage";
import { AdminUsersPage } from "./components/pages/admin/AdminUsersPage";
import { AdminWorkspacesPage } from "./components/pages/admin/AdminWorkspacesPage";
import { AdminBroadcastPage } from "./components/pages/admin/AdminBroadcastPage";
import { AdminDlqPage } from "./components/pages/admin/AdminDlqPage";
import { InvitationsPage } from "./components/pages/InvitationsPage";
import { UsersDirectoryPage } from "./components/pages/UsersDirectoryPage";
import { ForbiddenPage, NotFoundPage } from "./components/pages/ErrorPages";
import { AdminRoute, AuthProvider, CollaborationRoute, ProtectedRoute, useAuth } from "./auth/AuthContext";

function HomeRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
}

function UsersDirectoryRoute() {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/admin/users" replace />;
  }
  return <UsersDirectoryPage />;
}

export default function App() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <BrowserRouter>
      <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Auth routes (no sidebar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* App routes (with sidebar) */}
        <Route element={<ProtectedRoute><AppShell dark={dark} onToggleDark={() => setDark(d => !d)} /></ProtectedRoute>}>
          <Route index element={<HomeRedirect />} />
          <Route path="/dashboard" element={<CollaborationRoute><DashboardPage /></CollaborationRoute>} />
          <Route path="/workspaces" element={<CollaborationRoute><WorkspaceListPage /></CollaborationRoute>} />
          <Route path="/workspaces/:id" element={<CollaborationRoute><WorkspaceDetailPage /></CollaborationRoute>} />
          <Route path="/workspaces/:id/projects" element={<CollaborationRoute><ProjectListPage /></CollaborationRoute>} />
          <Route path="/workspaces/:id/projects/:pid" element={<CollaborationRoute><KanbanBoardPage /></CollaborationRoute>} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<UsersDirectoryRoute />} />
          <Route path="/invitations" element={<CollaborationRoute><InvitationsPage /></CollaborationRoute>} />
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="workspaces" element={<AdminWorkspacesPage />} />
            <Route path="broadcast" element={<AdminBroadcastPage />} />
            <Route path="dlq" element={<AdminDlqPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
