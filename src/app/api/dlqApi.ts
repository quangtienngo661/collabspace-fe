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

export const dlqApi = {
  list: listRaw,

  async replay(id: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/replay`, { method: "POST" });
  },

  async resolve(id: string, resolutionNote?: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolutionNote }),
    });
  },

  async discard(id: string, resolutionNote?: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/discard`, {
      method: "POST",
      body: JSON.stringify({ resolutionNote }),
    });
  },
};
