"use client";

import type { AnalyticsEventInput, AnalyticsSessionInput } from "@/lib/analytics";
import { apiClient } from "@/lib/http-client";

export interface AnalyticsEventsBatch {
  session: AnalyticsSessionInput;
  events: AnalyticsEventInput[];
}

export interface VisitorStatsResponse {
  todayVisitors: number;
  totalVisitors: number;
  date: string;
}

export async function postAnalyticsEventsBatch(batch: AnalyticsEventsBatch) {
  await apiClient.post("/api/analytics/events", batch);
}

export async function getVisitorStats() {
  const response = await apiClient.get<VisitorStatsResponse>(
    "/api/analytics/visitor-stats",
  );

  return response.data;
}
