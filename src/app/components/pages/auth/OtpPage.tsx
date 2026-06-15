import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../ui/input-otp";
import { toast } from "sonner";
import { authApi } from "../../../api/authApi";

export function OtpPage() {
  const navigate = useNavigate();
  const userId = window.sessionStorage.getItem("collabspace.pendingVerificationUserId") || "";
  const email = window.sessionStorage.getItem("collabspace.pendingVerificationEmail") || "your email address";
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (value.length < 6) { setError("Please enter the complete 6-digit code"); return; }
    if (!userId) { setError("Missing pending verification user. Please register again."); return; }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmail(userId, value);
      setLoading(false);
      window.sessionStorage.removeItem("collabspace.pendingVerificationUserId");
      window.sessionStorage.removeItem("collabspace.pendingVerificationEmail");
      toast.success("Email verified. Please sign in.");
      navigate("/login");
    } catch (error) {
      setLoading(false);
      setError(error instanceof Error ? error.message : "Invalid verification code. Please try again.");
    }
  }

  async function resend() {
    if (!email || email === "your email address") { setError("Missing email. Please register again."); return; }
    try {
      await authApi.resendVerificationOtp(email);
      toast.success("Verification code resent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend code");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white font-bold text-xl mb-4">CS</span>
          <h1 className="text-xl font-bold text-white">Verify your email</h1>
          {email !== "your email address" ? (
            <p className="text-sm text-slate-400 mt-1">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-200">{email}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-400 mt-1">
              We sent a 6-digit code to your email address
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <InputOTP maxLength={6} value={value} onChange={setValue}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => (
                  <InputOTPSlot key={i} index={i} className="bg-slate-800 border-slate-600 text-slate-100 focus:border-blue-500" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading || value.length < 6}>
            {loading ? "Verifying..." : "Verify email"}
          </Button>

          <div className="text-center">
            <button type="button" onClick={resend} className="text-xs text-blue-400 hover:text-blue-300">
              Didn't receive it? Resend code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
