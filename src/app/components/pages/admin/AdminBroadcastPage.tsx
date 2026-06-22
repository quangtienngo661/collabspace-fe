import { Send, ShieldAlert } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { useAdminWorkspace } from "./AdminContext";

export function AdminBroadcastPage() {
  const {
    broadcastTitle,
    setBroadcastTitle,
    broadcastMessage,
    setBroadcastMessage,
    broadcastSending,
    handleSendBroadcast,
  } = useAdminWorkspace();

  return (
    <Card className="max-w-2xl gap-5 rounded-3xl border-white/70 bg-white/85 p-6 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
        <ShieldAlert className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Important Audit Notice</p>
          <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
            System broadcasts dispatch real-time notifications to **every account** registered on this server.
            These actions are logged and are protected by idempotency tokens to prevent double-delivery.
          </p>
        </div>
      </div>

      <form onSubmit={handleSendBroadcast} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold">Broadcast Title</Label>
          <Input
            id="title"
            placeholder="System Maintenance Scheduled"
            value={broadcastTitle}
            onChange={e => setBroadcastTitle(e.target.value)}
            required
            className="h-10 rounded-xl bg-white dark:bg-slate-950/70"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message" className="text-xs font-semibold">Broadcast Message Body</Label>
          <Textarea
            id="message"
            placeholder="We will be performing routine database optimizations on June 18th from 02:00 to 03:00 UTC. Some workflows may be degraded."
            value={broadcastMessage}
            onChange={e => setBroadcastMessage(e.target.value)}
            rows={4}
            required
            className="rounded-xl bg-white dark:bg-slate-950/70"
          />
        </div>

        <Button
          type="submit"
          disabled={broadcastSending}
          className="h-10 w-full gap-2 rounded-xl bg-blue-600 text-xs font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        >
          <Send className="size-3.5" />
          {broadcastSending ? "Sending Broadcast..." : "Dispatch Broadcast"}
        </Button>
      </form>
    </Card>
  );
}
