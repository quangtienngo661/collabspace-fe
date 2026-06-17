import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { authApi } from "../api/authApi";
import { clearStoredSession, getStoredSession, setStoredSession } from "../api/session";
import { usersApi } from "../api/usersApi";
import { invalidateCachedRequestPrefix } from "../api/requestCache";
import type { AuthSession, AuthUser, Role, User, UserPreferences } from "../api/types";

interface AuthState {
  authUser: AuthUser | null;
  profile: User | null;
  preferences: UserPreferences | null;
  session: AuthSession | null;
  loading: boolean;
  refresh: (silent?: boolean) => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setProfile: (profile: User) => void;
  setPreferences: (preferences: UserPreferences) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function normalizeRole(role?: string | null): Role {
  if (role === "admin") return "admin";
  // Legacy JWT from before platform role simplification
  if (role === "member" || role === "viewer" || role === "user") return "user";
  return "user";
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
  const refreshInflight = useRef<Promise<AuthUser | null> | null>(null);

  const refresh = useCallback(async (silent = false): Promise<AuthUser | null> => {
    if (refreshInflight.current) {
      return refreshInflight.current;
    }

    const run = (async (): Promise<AuthUser | null> => {
      const stored = getStoredSession();
      setSession(stored);

      if (!stored?.accessToken) {
        setAuthUser(null);
        setProfile(null);
        setPreferences(null);
        setLoading(false);
        return null;
      }

      if (!silent) {
        setLoading(true);
      }
      try {
        const currentAuthUser = await authApi.me();
        setAuthUser(currentAuthUser);

        const [userProfile, userPreferences] = await Promise.all([
          usersApi.me(currentAuthUser).catch(() => fallbackProfile(currentAuthUser)),
          usersApi.preferences().catch(() => null),
        ]);

        setProfile(userProfile);
        setPreferences(userPreferences);
        return currentAuthUser;
      } catch {
        clearStoredSession();
        setSession(null);
        setAuthUser(null);
        setProfile(null);
        setPreferences(null);
        return null;
      } finally {
        setLoading(false);
      }
    })();

    refreshInflight.current = run;
    try {
      return await run;
    } finally {
      if (refreshInflight.current === run) {
        refreshInflight.current = null;
      }
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
    invalidateCachedRequestPrefix("auth:");
    invalidateCachedRequestPrefix("users:");
    invalidateCachedRequestPrefix("workspaces:");
    invalidateCachedRequestPrefix("notifications:");
    setStoredSession(nextSession, { emit: false });
    setSession(nextSession);
    await usersApi.declareOnline().catch(() => undefined);
    sessionStorage.setItem("collabspace:session-presence", "1");
    const currentAuthUser = await refresh(true);

    return Boolean(
      currentAuthUser?.roles?.includes("admin") ||
        currentAuthUser?.role === "admin" ||
        currentAuthUser?.permissions?.includes("auth.manage"),
    );
  }, [refresh]);

  const logout = useCallback(async () => {
    const active = getStoredSession();
    try {
      await usersApi.declareOffline().catch(() => undefined);
      if (active?.refreshToken) {
        await authApi.logout(active.refreshToken);
      }
    } finally {
      sessionStorage.removeItem("collabspace:session-presence");
      clearStoredSession();
      invalidateCachedRequestPrefix("auth:");
      invalidateCachedRequestPrefix("users:");
      invalidateCachedRequestPrefix("notifications:");
      invalidateCachedRequestPrefix("workspaces:");
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

export function CollaborationRoute({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">Loading session...</div>;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
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
