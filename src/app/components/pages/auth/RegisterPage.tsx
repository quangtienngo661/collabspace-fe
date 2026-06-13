import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { toast } from "sonner";
import { authApi } from "../../../api/authApi";

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password || form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const result = await authApi.register({ fullName: form.name, email: form.email, password: form.password });
      window.sessionStorage.setItem("collabspace.pendingVerificationUserId", result.userId);
      window.sessionStorage.setItem("collabspace.pendingVerificationEmail", result.email);
      setLoading(false);
      toast.success("Account created! Please verify your email.");
      navigate("/otp");
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Unable to create account");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white font-bold text-xl mb-4">CS</span>
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Join your team on CollabSpace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
          {[
            { id: "name", label: "Full name", type: "text", icon: User, placeholder: "John Doe", key: "name" },
            { id: "email", label: "Work email", type: "email", icon: Mail, placeholder: "you@company.com", key: "email" },
          ].map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="text-slate-300 text-xs">{field.label}</Label>
              <div className="relative">
                <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input id={field.id} type={field.type} placeholder={field.placeholder}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => set(field.key, e.target.value)}
                  className={`pl-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors[field.key] ? "border-red-500" : ""}`}
                />
              </div>
              {errors[field.key] && <p className="text-xs text-red-400">{errors[field.key]}</p>}
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 text-xs">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input id="password" type={showPw ? "text" : "password"} placeholder="Min 8 characters" value={form.password}
                onChange={e => set("password", e.target.value)}
                className={`pl-9 pr-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.password ? "border-red-500" : ""}`}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-slate-300 text-xs">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input id="confirm" type="password" placeholder="Repeat password" value={form.confirm}
                onChange={e => set("confirm", e.target.value)}
                className={`pl-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.confirm ? "border-red-500" : ""}`}
              />
            </div>
            {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
