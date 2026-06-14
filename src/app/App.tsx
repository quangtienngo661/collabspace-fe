import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./components/pages/auth/LoginPage";
import { RegisterPage } from "./components/pages/auth/RegisterPage";
import { OtpPage } from "./components/pages/auth/OtpPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { WorkspaceListPage } from "./components/pages/workspace/WorkspaceListPage";
import { WorkspaceDetailPage } from "./components/pages/workspace/WorkspaceDetailPage";
import { ProjectListPage } from "./components/pages/project/ProjectListPage";
import { KanbanBoardPage } from "./components/pages/task/KanbanBoardPage";
import { NotificationsPage } from "./components/pages/NotificationsPage";
import { MyProfilePage } from "./components/pages/profile/MyProfilePage";
import { AdminPage } from "./components/pages/admin/AdminPage";
import { HealthPage } from "./components/pages/admin/HealthPage";
import { ForbiddenPage, NotFoundPage } from "./components/pages/ErrorPages";
import { AdminRoute, AuthProvider, ProtectedRoute } from "./auth/AuthContext";

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
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        <Route path="/reset-password" element={<Navigate to="/login" replace />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage dark={dark} onToggleDark={() => setDark(d => !d)} /></AdminRoute>} />
        <Route path="/admin/health" element={<AdminRoute><HealthPage dark={dark} onToggleDark={() => setDark(d => !d)} /></AdminRoute>} />

        {/* App routes (with sidebar) */}
        <Route element={<ProtectedRoute><AppShell dark={dark} onToggleDark={() => setDark(d => !d)} /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspaceListPage />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
          <Route path="/workspaces/:id/projects" element={<ProjectListPage />} />
          <Route path="/workspaces/:id/projects/:pid" element={<KanbanBoardPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
