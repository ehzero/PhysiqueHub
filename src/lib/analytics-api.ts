"use client";

import type { AnalyticsEventInput, AnalyticsSessionInput } from "@/lib/analytics";
import { apiClient } from "@/lib/http-client";

export interface AnalyticsEventsBatch {
  session: AnalyticsSessionInput;
  events: AnalyticsEventInput[];
}

export async function postAnalyticsEventsBatch(batch: AnalyticsEventsBatch) {
  await apiClient.post("/api/analytics/events", batch);
}
