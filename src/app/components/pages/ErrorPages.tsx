import { useNavigate } from "react-router";
import { Button } from "../ui/button";

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔒</span>
        </div>
        <p className="text-6xl font-black text-slate-200 dark:text-slate-800 mb-2">403</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">You don't have permission to access this page. Contact your workspace admin to request access.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-black text-slate-200 dark:text-slate-800 mb-2">404</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
