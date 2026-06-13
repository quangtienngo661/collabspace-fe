import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "../../../auth/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("tho@collabspace.dev");
  const [password, setPassword] = useState("collabspace123");
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
      const isAdmin = await login(email, password);
      setLoading(false);
      toast.success("Welcome back");
      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white font-bold text-xl mb-4">CS</span>
          <h1 className="text-xl font-bold text-white">Sign in to CollabSpace</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise collaboration platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-xs">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="email" type="email" placeholder="you@company.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className={`pl-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.email ? "border-red-500" : ""}`}
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
                className={`pl-9 pr-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.password ? "border-red-500" : ""}`}
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

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500">or</span></div>
          </div>

          <Button type="button" variant="outline" className="w-full border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" onClick={() => toast.info("SSO not configured in demo")}>
            Continue with SSO
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
