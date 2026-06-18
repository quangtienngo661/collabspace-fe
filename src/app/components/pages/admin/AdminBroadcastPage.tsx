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
    <Card className="max-w-xl border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 shadow-sm rounded-lg">
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 mb-6">
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
          />
        </div>

        <Button
          type="submit"
          disabled={broadcastSending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium text-xs py-2"
        >
          <Send className="size-3.5" />
          {broadcastSending ? "Sending Broadcast..." : "Dispatch Broadcast"}
        </Button>
      </form>
    </Card>
  );
}
