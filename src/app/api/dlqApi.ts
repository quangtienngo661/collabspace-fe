import { apiRequest, buildApiUrl, ApiError } from "./httpClient";
import { getStoredSession } from "./session";
import type { DlqListResponse, DlqMessage, DlqStatus, DlqErrorCategory } from "./types";

export interface DlqListParams {
  status?: DlqStatus[];
  errorCategory?: DlqErrorCategory;
  sourceTopic?: string;
  cursor?: string;
  limit?: number;
}

// list() bypasses apiRequest's unwrapResponse because the DLQ list response
// has shape { data: [], nextCursor, total } — the generic unwrap would strip
// nextCursor and total, leaving only the array.
async function listRaw(params?: DlqListParams): Promise<DlqListResponse> {
  const q = new URLSearchParams();
  params?.status?.forEach((s) => q.append("status", s));
  if (params?.errorCategory) q.set("errorCategory", params.errorCategory);
  if (params?.sourceTopic) q.set("sourceTopic", params.sourceTopic);
  if (params?.cursor) q.set("cursor", params.cursor);
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();

  const session = getStoredSession();
  const url = buildApiUrl(`/dlq/messages${qs ? `?${qs}` : ""}`);
  const response = await fetch(url, {
    headers: session?.accessToken
      ? { Authorization: `Bearer ${session.accessToken}` }
      : {},
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? response.statusText, payload);
  }
  return payload as DlqListResponse;
}

export interface ReplayBatchResult {
  total: number;
  produced: number;
  skipped: number;
  results: { id: string; produced: boolean; skipped: boolean; reason?: string }[];
}

function resolutionNoteBody(resolutionNote?: string): { resolutionNote?: string } {
  const trimmed = resolutionNote?.trim();
  return trimmed ? { resolutionNote: trimmed } : {};
}

export const dlqApi = {
  list: listRaw,

  async replay(id: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/replay`, { method: "POST" });
  },

  async replayBatch(params?: {
    status?: DlqStatus[];
    sourceTopic?: string;
    errorCategory?: DlqErrorCategory;
    limit?: number;
  }): Promise<ReplayBatchResult> {
    return apiRequest<ReplayBatchResult>(`/dlq/replay-batch`, {
      method: "POST",
      body: params ?? { status: ["pending", "requires_manual_review"], limit: 50 },
    });
  },

  async resolve(id: string, resolutionNote?: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/resolve`, {
      method: "POST",
      body: resolutionNoteBody(resolutionNote),
    });
  },

  async discard(id: string, resolutionNote?: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/discard`, {
      method: "POST",
      body: resolutionNoteBody(resolutionNote),
    });
  },
};
