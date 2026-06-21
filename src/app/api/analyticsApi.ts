import { apiRequest } from "./httpClient";
import type {
  AnalyticsActivityResponse,
  AnalyticsMetric,
  AnalyticsOverview,
} from "./types";

export const analyticsApi = {
  async getOverview(): Promise<AnalyticsOverview> {
    return apiRequest<AnalyticsOverview>("/analytics/overview");
  },

  async getActivity(params?: {
    metric?: AnalyticsMetric;
    from?: string;
    to?: string;
  }): Promise<AnalyticsActivityResponse> {
    const query = new URLSearchParams();
    if (params?.metric) query.set("metric", params.metric);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return apiRequest<AnalyticsActivityResponse>(
      `/analytics/activity${qs ? `?${qs}` : ""}`,
    );
  },
};
