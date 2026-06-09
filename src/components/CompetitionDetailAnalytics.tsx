"use client";

import { useEffect } from "react";
import type { AnalyticsPropertyValue } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

interface CompetitionDetailAnalyticsProps {
  competitionId: string;
  properties: Record<string, AnalyticsPropertyValue | undefined>;
}

export function CompetitionDetailAnalytics({
  competitionId,
  properties,
}: CompetitionDetailAnalyticsProps) {
  useEffect(() => {
    trackAnalyticsEvent("competition_view", {
      competitionId,
      properties,
    });
  }, [competitionId, properties]);

  return null;
}
