import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { toast } from "sonner";
import { authApi } from "../../../api/authApi";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address"); return; }
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setLoading(false);
      setSent(true);
      toast.success("Reset instructions sent to your email");
    } catch (error) {
      setLoading(false);
      setError(error instanceof Error ? error.message : "Unable to send reset instructions");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white font-bold text-xl mb-4">CS</span>
          <h1 className="text-xl font-bold text-white">{sent ? "Check your email" : "Forgot password?"}</h1>
          <p className="text-sm text-slate-400 mt-1">{sent ? `We sent reset instructions to ${email}` : "Enter your email to receive reset instructions"}</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 text-xs">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="email" type="email" placeholder="you@company.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`pl-9 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 ${error ? "border-red-500" : ""}`}
                  />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-900/40 flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/reset-password")}>
                Open reset page
              </Button>
              <button type="button" onClick={() => { setSent(false); setEmail(""); }} className="w-full text-xs text-slate-400 hover:text-slate-300">
                Try a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
