import { useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { ErrorState } from "../../shared/EmptyState";
import { DateDisplay } from "../../shared/DateDisplay";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { dlqApi } from "../../../api/dlqApi";
import type { DlqMessage, DlqStatus, DlqErrorCategory } from "../../../api/types";

const STATUS_LABELS: Record<DlqStatus, string> = {
  pending: "Pending",
  replaying: "Replaying",
  requires_manual_review: "Needs Review",
  resolved: "Resolved",
  discarded: "Discarded",
};

const STATUS_COLORS: Record<DlqStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  replaying: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  requires_manual_review: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  discarded: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

const CATEGORY_COLORS: Record<DlqErrorCategory, string> = {
  transient: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  logic: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  schema: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  unknown: "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function StatusBadge({ status }: { status: DlqStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function CategoryBadge({ category }: { category: DlqErrorCategory }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[category]}`}>
      {category}
    </span>
  );
}

function PayloadRow({ msg }: { msg: DlqMessage }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow
        key={msg.id}
        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-[120px] truncate">
          {msg.sourceTopic}
        </TableCell>
        <TableCell>
          <StatusBadge status={msg.status} />
        </TableCell>
        <TableCell>
          <CategoryBadge category={msg.errorCategory} />
        </TableCell>
        <TableCell className="text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
          {msg.errorMessage}
        </TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
          {msg.retryCount}/{msg.maxRetries}
        </TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
          <DateDisplay date={msg.failedAt} />
        </TableCell>
        <TableCell className="text-right">
          {open ? (
            <ChevronUp className="size-3.5 inline text-slate-400" />
          ) : (
            <ChevronDown className="size-3.5 inline text-slate-400" />
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-slate-50 dark:bg-slate-800/60">
          <TableCell colSpan={7} className="p-0">
            <DlqMessageDetail msg={msg} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function DlqMessageDetail({ msg }: { msg: DlqMessage }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<DlqMessage["status"]>(msg.status);
  const [note, setNote] = useState("");

  const canReplay = localStatus === "pending" || localStatus === "requires_manual_review";
  const canResolve = localStatus !== "resolved" && localStatus !== "discarded";
  const canDiscard = localStatus !== "discarded";

  async function act(
    action: "replay" | "resolve" | "discard",
    fn: () => Promise<DlqMessage>,
  ) {
    setBusy(action);
    try {
      const updated = await fn();
      setLocalStatus(updated.status);
    } catch {
      // swallow — user can retry
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Payload</p>
          <pre className="bg-slate-900 dark:bg-slate-950 text-green-400 rounded p-3 overflow-auto max-h-48 text-[11px] leading-relaxed">
            {JSON.stringify(msg.payload, null, 2)}
          </pre>
        </div>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Error</p>
            <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
              {msg.errorMessage}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">ID</span>
            <span className="font-mono truncate">{msg.id}</span>
            <span className="text-slate-400">Partition</span>
            <span>{msg.sourcePartition}</span>
            <span className="text-slate-400">Offset</span>
            <span className="font-mono">{msg.sourceOffset}</span>
            {msg.consumerGroup && (
              <>
                <span className="text-slate-400">Consumer</span>
                <span className="font-mono truncate">{msg.consumerGroup}</span>
              </>
            )}
            {msg.nextRetryAt && (
              <>
                <span className="text-slate-400">Next retry</span>
                <DateDisplay date={msg.nextRetryAt} />
              </>
            )}
          </div>
        </div>
      </div>

      {msg.retryHistory.length > 0 && (
        <div>
          <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Retry history</p>
          <div className="space-y-1">
            {msg.retryHistory.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400"
              >
                <DateDisplay date={h.at} />
                <span className={`px-1.5 py-0.5 rounded ${h.result === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                  {h.action}
                </span>
                <span>{h.result}</span>
                {h.errorMessage && <span className="text-red-400 truncate">{h.errorMessage}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Resolution note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 h-7 px-2 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        />
        {canReplay && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            disabled={!!busy}
            onClick={(e) => {
              e.stopPropagation();
              act("replay", () => dlqApi.replay(msg.id));
            }}
          >
            <RotateCcw className="size-3" />
            {busy === "replay" ? "Replaying…" : "Replay"}
          </Button>
        )}
        {canResolve && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
            disabled={!!busy}
            onClick={(e) => {
              e.stopPropagation();
              act("resolve", () => dlqApi.resolve(msg.id, note || undefined));
            }}
          >
            <CheckCircle className="size-3" />
            {busy === "resolve" ? "Resolving…" : "Resolve"}
          </Button>
        )}
        {canDiscard && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
            disabled={!!busy}
            onClick={(e) => {
              e.stopPropagation();
              act("discard", () => dlqApi.discard(msg.id, note || undefined));
            }}
          >
            <Trash2 className="size-3" />
            {busy === "discard" ? "Discarding…" : "Discard"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdminDlqPage() {
  const [statusFilter, setStatusFilter] = useState<DlqStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<DlqErrorCategory | "all">("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      dlqApi.list({
        status: statusFilter !== "all" ? [statusFilter] : undefined,
        errorCategory: categoryFilter !== "all" ? categoryFilter : undefined,
        cursor,
        limit: 20,
      }),
    [statusFilter, categoryFilter, cursor],
  );

  function applyFilter(newStatus: DlqStatus | "all", newCat: DlqErrorCategory | "all") {
    setStatusFilter(newStatus);
    setCategoryFilter(newCat);
    setCursor(undefined);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Dead Letter Queue
          </p>
          <p className="text-xs text-slate-400">
            Failed Kafka events awaiting replay or manual resolution.
            {data ? ` ${data.total} total.` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => applyFilter(v as DlqStatus | "all", categoryFilter)}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABELS) as DlqStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(v) => applyFilter(statusFilter, v as DlqErrorCategory | "all")}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="transient">transient</SelectItem>
              <SelectItem value="logic">logic</SelectItem>
              <SelectItem value="schema">schema</SelectItem>
              <SelectItem value="unknown">unknown</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={reload}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
        {error ? (
          <ErrorState title="Unable to load DLQ messages" description={error} />
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/75 dark:bg-slate-900/40">
              <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-700">
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Topic</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Error</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Retries</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400">Failed At</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-200 dark:border-slate-700">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (data?.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-400">
                    No DLQ messages match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((msg) => <PayloadRow key={msg.id} msg={msg} />)
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {(data?.nextCursor || cursor) && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          {cursor && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCursor(undefined)}>
              ← First page
            </Button>
          )}
          {data?.nextCursor && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs ml-auto"
              onClick={() => setCursor(data.nextCursor ?? undefined)}
            >
              Next page →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
