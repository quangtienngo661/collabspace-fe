import { apiRequest } from "./httpClient";
import type { DlqListResponse, DlqMessage, DlqStatus, DlqErrorCategory } from "./types";

export interface DlqListParams {
  status?: DlqStatus[];
  errorCategory?: DlqErrorCategory;
  sourceTopic?: string;
  cursor?: string;
  limit?: number;
}

export const dlqApi = {
  async list(params?: DlqListParams): Promise<DlqListResponse> {
    const q = new URLSearchParams();
    params?.status?.forEach((s) => q.append("status", s));
    if (params?.errorCategory) q.set("errorCategory", params.errorCategory);
    if (params?.sourceTopic) q.set("sourceTopic", params.sourceTopic);
    if (params?.cursor) q.set("cursor", params.cursor);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiRequest<DlqListResponse>(`/dlq/messages${qs ? `?${qs}` : ""}`);
  },

  async replay(id: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/replay`, { method: "POST" });
  },

  async resolve(id: string, resolutionNote?: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resolutionNote }),
    });
  },

  async discard(id: string, resolutionNote?: string): Promise<DlqMessage> {
    return apiRequest<DlqMessage>(`/dlq/messages/${id}/discard`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resolutionNote }),
    });
  },
};
