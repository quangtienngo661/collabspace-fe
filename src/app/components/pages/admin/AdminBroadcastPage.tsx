import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { adminApi } from "../../../api/adminApi";
import { AdminWorkspaceLayout } from "./AdminWorkspaceLayout";
import { toast } from "sonner";

interface AdminBroadcastPageProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function AdminBroadcastPage({ dark, onToggleDark }: AdminBroadcastPageProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastJob, setLastJob] = useState<{ id: string; status: string } | null>(null);

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const job = await adminApi.broadcast({ title: title.trim(), body: body.trim() }, idempotencyKey);
      setLastJob(job);
      toast.success(`Broadcast queued (${job.status})`);
      setTitle("");
      setBody("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send broadcast");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminWorkspaceLayout
      title="System Broadcast"
      description="Send a system alert notification to all users."
      dark={dark}
      onToggleDark={onToggleDark}
    >
      <Card className="max-w-xl space-y-4 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Megaphone className="w-4 h-4" /> New broadcast
        </div>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea value={body} onChange={e => setBody(e.target.value)} rows={5} maxLength={2000} />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading} onClick={() => void send()}>
          {loading ? "Sending…" : "Send to all users"}
        </Button>
        {lastJob && (
          <p className="text-xs text-slate-500">
            Last job: <span className="font-mono">{lastJob.id}</span> — {lastJob.status}
          </p>
        )}
      </Card>
    </AdminWorkspaceLayout>
  );
}
