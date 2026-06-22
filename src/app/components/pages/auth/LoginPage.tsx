import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "../../../auth/AuthContext";
import { workspaceApi } from "../../../api/workspaceApi";

const demoEmail = "tho@collabspace.dev";
const demoPassword = "collabspace123";
const showDemoLogin = import.meta.env.DEV;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(showDemoLogin ? demoEmail : "");
  const [password, setPassword] = useState(showDemoLogin ? demoPassword : "");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const isAdminUser = await login(email, password);
      setLoading(false);
      toast.success("Welcome back");
      if (isAdminUser) {
        navigate("/admin");
        return;
      }
      try {
        const list = await workspaceApi.list();
        navigate(list.length === 0 ? "/workspaces" : "/dashboard");
      } catch {
        navigate("/dashboard");
      }
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.28),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.22),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="hidden flex-1 pr-12 lg:block">
          <span className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
            Workspace collaboration, streamlined
          </span>
          <h1 className="max-w-xl text-5xl font-bold tracking-tight text-white">
            Turn scattered work into one clear team operating system.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-300">
            CollabSpace brings workspaces, projects, tasks, notifications, and team presence into one focused interface for fast-moving teams.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {[
              ["Live", "Presence"],
              ["Kanban", "Planning"],
              ["Smart", "Notifications"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-xl shadow-blue-950/40">CS</span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to CollabSpace</h2>
            <p className="mt-1 text-sm text-slate-400">Access your workspaces, tasks, and notifications.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
            {showDemoLogin && (
              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-100">
                <div className="flex items-center justify-between gap-3">
                  <span>Demo credentials are loaded for local development.</span>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-blue-500/20 px-2.5 py-1 font-semibold text-blue-100 hover:bg-blue-500/30"
                    onClick={() => {
                      setEmail(demoEmail);
                      setPassword(demoPassword);
                    }}
                  >
                    Fill demo
                  </button>
                </div>
              </div>
            )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-xs">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="email" type="email" placeholder="you@company.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className={`h-11 rounded-xl border-slate-700 bg-slate-950/70 pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.email ? "border-red-500" : ""}`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 text-xs">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="password" type={showPw ? "text" : "password"} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                className={`h-11 rounded-xl border-slate-700 bg-slate-950/70 pl-9 pr-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.password ? "border-red-500" : ""}`}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">Remember me</Label>
            </div>
            <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</Link>
          </div>

          <Button type="submit" className="h-11 w-full rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500">or</span></div>
          </div>

          <Button type="button" variant="outline" className="h-11 w-full rounded-xl border-slate-700 bg-slate-950/50 text-slate-200 hover:bg-slate-800" onClick={() => toast.info("SSO not configured in demo")}>
            Continue with SSO
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
