import { useEffect, useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Textarea } from "../../ui/textarea";
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
import { formatApiError } from "../../../api/adminErrors";
import type { DlqMessage, DlqStatus, DlqErrorCategory } from "../../../api/types";

const RESOLUTION_NOTE_MAX_LENGTH = 1000;

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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function CategoryBadge({ category }: { category: DlqErrorCategory }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_COLORS[category]}`}>
      {category}
    </span>
  );
}

function validateResolutionNote(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > RESOLUTION_NOTE_MAX_LENGTH) {
    return `Resolution note must be at most ${RESOLUTION_NOTE_MAX_LENGTH} characters.`;
  }
  return null;
}

function PayloadRow({
  msg,
  onUpdated,
}: {
  msg: DlqMessage;
  onUpdated: (msg: DlqMessage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [currentMsg, setCurrentMsg] = useState(msg);

  useEffect(() => {
    setCurrentMsg(msg);
  }, [msg]);

  function handleUpdated(updated: DlqMessage) {
    setCurrentMsg(updated);
    onUpdated(updated);
  }

  return (
    <>
      <TableRow
        key={currentMsg.id}
        className="cursor-pointer border-slate-100 transition-colors hover:bg-blue-50/40 dark:border-slate-800 dark:hover:bg-slate-800/70"
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-[120px] truncate">
          {currentMsg.sourceTopic}
        </TableCell>
        <TableCell>
          <StatusBadge status={currentMsg.status} />
        </TableCell>
        <TableCell>
          <CategoryBadge category={currentMsg.errorCategory} />
        </TableCell>
        <TableCell className="text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
          {currentMsg.errorMessage}
        </TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
          {currentMsg.retryCount}/{currentMsg.maxRetries}
        </TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
          <DateDisplay date={currentMsg.failedAt} />
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
        <TableRow className="bg-slate-50/80 dark:bg-slate-950/40">
          <TableCell colSpan={7} className="p-0">
            <DlqMessageDetail msg={currentMsg} onUpdated={handleUpdated} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function DlqMessageDetail({
  msg,
  onUpdated,
}: {
  msg: DlqMessage;
  onUpdated: (msg: DlqMessage) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<DlqMessage["status"]>(msg.status);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(msg.status);
  }, [msg.status]);

  const canReplay = localStatus === "pending" || localStatus === "requires_manual_review";
  const canResolve = localStatus !== "resolved" && localStatus !== "discarded";
  const canDiscard = localStatus !== "resolved" && localStatus !== "discarded";
  const hasResolutionNoteAction = canResolve || canDiscard;
  const hasActions = canReplay || hasResolutionNoteAction;

  async function act(
    action: "replay" | "resolve" | "discard",
    fn: () => Promise<DlqMessage>,
    successMessage: string,
  ) {
    setBusy(action);
    setActionError(null);
    try {
      const updated = await fn();
      setLocalStatus(updated.status);
      onUpdated(updated);
      toast.success(successMessage);
    } catch (error) {
      const message = formatApiError(error, `Unable to ${action} DLQ message`);
      setActionError(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }

  function actWithNote(
    action: "resolve" | "discard",
    fn: (resolutionNote?: string) => Promise<DlqMessage>,
  ) {
    const validationError = validateResolutionNote(note);
    if (validationError) {
      setNoteError(validationError);
      return;
    }
    const resolutionNote = note.trim();
    setNoteError(null);
    void act(
      action,
      () => fn(resolutionNote),
      action === "resolve" ? "DLQ message resolved" : "DLQ message discarded",
    );
  }

  return (
    <div className="space-y-4 p-4 text-xs">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Payload</p>
          <pre className="max-h-56 overflow-auto rounded-2xl bg-slate-950 p-3 text-[11px] leading-relaxed text-green-400 shadow-inner">
            {JSON.stringify(msg.payload, null, 2)}
          </pre>
        </div>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Error</p>
            <p className="rounded-2xl bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
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

      {hasActions && (
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 lg:flex-row lg:items-start">
          {hasResolutionNoteAction && (
            <div className="flex-1 min-w-0">
              <Textarea
                placeholder="Resolution note (optional, max 1000 chars)"
                value={note}
                maxLength={RESOLUTION_NOTE_MAX_LENGTH}
                aria-invalid={Boolean(noteError)}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (noteError && !validateResolutionNote(e.target.value)) {
                    setNoteError(null);
                  }
                }}
                className="min-h-10 rounded-xl py-2 text-xs leading-snug"
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[11px] text-red-500 dark:text-red-400">{noteError ?? actionError ?? ""}</p>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {note.trim().length}/{RESOLUTION_NOTE_MAX_LENGTH}
                </span>
              </div>
            </div>
          )}
          {canReplay && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-xl text-xs"
              disabled={!!busy}
              onClick={(e) => {
                e.stopPropagation();
                void act("replay", () => dlqApi.replay(msg.id), "DLQ message replay started");
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
              className="h-8 gap-1 rounded-xl border-green-300 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
              disabled={!!busy}
              onClick={(e) => {
                e.stopPropagation();
                actWithNote("resolve", (resolutionNote) => dlqApi.resolve(msg.id, resolutionNote));
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
              className="h-8 gap-1 rounded-xl border-red-300 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              disabled={!!busy}
              onClick={(e) => {
                e.stopPropagation();
                actWithNote("discard", (resolutionNote) => dlqApi.discard(msg.id, resolutionNote));
              }}
            >
              <Trash2 className="size-3" />
              {busy === "discard" ? "Discarding…" : "Discard"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminDlqPage() {
  const [statusFilter, setStatusFilter] = useState<DlqStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<DlqErrorCategory | "all">("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [replayingAll, setReplayingAll] = useState(false);
  const [replayResult, setReplayResult] = useState<string | null>(null);
  const [messages, setMessages] = useState<DlqMessage[]>([]);

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
  useEffect(() => {
    setMessages(data?.data ?? []);
  }, [data?.data]);

  const hasPendingRows = messages.some((msg) => msg.status === "pending");

  function updateMessage(updated: DlqMessage) {
    setMessages((current) => current.map((msg) => (msg.id === updated.id ? updated : msg)));
  }

  async function replayAll() {
    setReplayingAll(true);
    setReplayResult(null);
    try {
      const result = await dlqApi.replayBatch({
        status: ["pending"],
        limit: 50,
      });
      setReplayResult(`Replayed ${result.produced}/${result.total} events. Skipped: ${result.skipped}.`);
      await reload();
    } catch {
      setReplayResult("Replay batch failed. Check permissions or DLQ service.");
    } finally {
      setReplayingAll(false);
    }
  }

  function applyFilter(newStatus: DlqStatus | "all", newCat: DlqErrorCategory | "all") {
    setStatusFilter(newStatus);
    setCategoryFilter(newCat);
    setCursor(undefined);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10 xl:flex-row xl:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            Dead Letter Queue
          </p>
          <p className="text-xs text-slate-400">
            Failed Kafka events awaiting replay or manual resolution.
            {data ? ` ${data.total ?? 0} total.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => applyFilter(v as DlqStatus | "all", categoryFilter)}
          >
            <SelectTrigger className="h-9 w-44 rounded-xl bg-white text-xs dark:bg-slate-950/70">
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
            <SelectTrigger className="h-9 w-36 rounded-xl bg-white text-xs dark:bg-slate-950/70">
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
          <Button size="sm" variant="outline" className="h-9 gap-1 rounded-xl text-xs" onClick={reload}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          {hasPendingRows && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 rounded-xl border-blue-300 text-xs text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
              disabled={replayingAll}
              onClick={replayAll}
            >
              <PlayCircle className="size-3.5" />
              {replayingAll ? "Replaying…" : "Replay All Pending"}
            </Button>
          )}
        </div>
      </div>

      {replayResult && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          {replayResult}
        </div>
      )}

      <Card className="gap-0 overflow-hidden rounded-2xl border-white/70 bg-white/85 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">
        {error ? (
          <ErrorState title="Unable to load DLQ messages" description={error} />
        ) : (
          <div className="overflow-x-auto">
          <Table className="min-w-[960px]">
            <TableHeader className="bg-slate-50/90 dark:bg-slate-950/50">
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
                  <TableRow key={i} className="border-slate-200 dark:border-slate-800">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-400">
                    No DLQ messages match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((msg) => <PayloadRow key={msg.id} msg={msg} onUpdated={updateMessage} />)
              )}
            </TableBody>
          </Table>
          </div>
        )}
      </Card>

      {(data?.nextCursor || cursor) && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          {cursor && (
            <Button size="sm" variant="outline" className="h-8 rounded-xl text-xs" onClick={() => setCursor(undefined)}>
              ← First page
            </Button>
          )}
          {data?.nextCursor && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-8 rounded-xl text-xs"
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
