import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { toast } from "sonner";
import { authApi } from "../../../api/authApi";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.password || form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (!token) e.token = "Reset token is missing from the URL";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      setLoading(false);
      toast.success("Password reset successfully! Please sign in.");
      navigate("/login");
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Unable to reset password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white font-bold text-xl mb-4">CS</span>
          <h1 className="text-xl font-bold text-white">Set new password</h1>
          <p className="text-sm text-slate-400 mt-1">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw" className="text-slate-300 text-xs">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input id="pw" type={showPw ? "text" : "password"} placeholder="Min 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={`pl-9 pr-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.password ? "border-red-500" : ""}`}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-slate-300 text-xs">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input id="confirm" type="password" placeholder="Repeat password" value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                className={`pl-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${errors.confirm ? "border-red-500" : ""}`}
              />
            </div>
            {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li className={form.password.length >= 8 ? "text-green-400" : ""}>At least 8 characters</li>
              <li className={/[A-Z]/.test(form.password) ? "text-green-400" : ""}>One uppercase letter</li>
              <li className={/[0-9]/.test(form.password) ? "text-green-400" : ""}>One number</li>
            </ul>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
          {errors.token && <p className="text-xs text-red-400 text-center">{errors.token}</p>}
        </form>
      </div>
    </div>
  );
}
