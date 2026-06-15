import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { authApi } from "../api/authApi";
import { clearStoredSession, getStoredSession, setStoredSession } from "../api/session";
import { usersApi } from "../api/usersApi";
import type { AuthSession, AuthUser, Role, User, UserPreferences } from "../api/types";

interface AuthState {
  authUser: AuthUser | null;
  profile: User | null;
  preferences: UserPreferences | null;
  session: AuthSession | null;
  loading: boolean;
  refresh: (silent?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setProfile: (profile: User) => void;
  setPreferences: (preferences: UserPreferences) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function normalizeRole(role?: string | null): Role {
  return role === "admin" || role === "viewer" || role === "member" ? role : "member";
}

function fallbackProfile(authUser: AuthUser): User {
  const name = "Current User";
  return {
    id: authUser.userId,
    userId: authUser.userId,
    name,
    email: authUser.email,
    avatar: (authUser.email?.slice(0, 2) ?? "CU").toUpperCase(),
    role: normalizeRole(authUser.role ?? authUser.roles?.[0]),
    roles: authUser.roles,
    status: "offline",
    joinedAt: "",
    emailVerified: authUser.emailVerified,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (silent = false) => {
    const stored = getStoredSession();
    setSession(stored);

    if (!stored?.accessToken) {
      setAuthUser(null);
      setProfile(null);
      setPreferences(null);
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    try {
      const currentAuthUser = await authApi.me();
      setAuthUser(currentAuthUser);

      let userProfile: User;
      try {
        userProfile = await usersApi.me(currentAuthUser);
      } catch {
        userProfile = fallbackProfile(currentAuthUser);
      }

      try {
        const userStatus = await usersApi.status();
        userProfile.status = userStatus;
      } catch {
        // Keep profile's status or offline
      }

      setProfile(userProfile);

      try {
        setPreferences(await usersApi.preferences());
      } catch {
        setPreferences(null);
      }
    } catch {
      clearStoredSession();
      setSession(null);
      setAuthUser(null);
      setProfile(null);
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onSessionChange = () => {
      setSession(getStoredSession());
      void refresh();
    };
    const onExpired = () => {
      setSession(null);
      setAuthUser(null);
      setProfile(null);
      setPreferences(null);
    };
    window.addEventListener("collabspace:session-changed", onSessionChange);
    window.addEventListener("collabspace:session-expired", onExpired);
    return () => {
      window.removeEventListener("collabspace:session-changed", onSessionChange);
      window.removeEventListener("collabspace:session-expired", onExpired);
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const nextSession = await authApi.login(email, password);
    setStoredSession(nextSession);
    setSession(nextSession);
    const currentAuthUser = await authApi.me();
    setAuthUser(currentAuthUser);
    
    // Also trigger refresh in background or await it
    await refresh();

    return Boolean(
      currentAuthUser?.roles?.includes("admin") ||
        currentAuthUser?.role === "admin" ||
        currentAuthUser?.permissions?.includes("auth.manage"),
    );
  }, [refresh]);

  const logout = useCallback(async () => {
    const active = getStoredSession();
    try {
      if (active?.refreshToken) {
        await authApi.logout(active.refreshToken);
      }
    } finally {
      clearStoredSession();
      setSession(null);
      setAuthUser(null);
      setProfile(null);
      setPreferences(null);
    }
  }, []);

  const isAdmin = Boolean(
    authUser?.roles?.includes("admin") ||
      authUser?.role === "admin" ||
      authUser?.permissions?.includes("auth.manage"),
  );

  const value = useMemo<AuthState>(() => ({
    authUser,
    profile,
    preferences,
    session,
    loading,
    refresh,
    login,
    logout,
    setProfile,
    setPreferences,
    isAdmin,
  }), [authUser, profile, preferences, session, loading, refresh, login, logout, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">Loading session...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">Loading admin workspace...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
