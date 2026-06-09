"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { AnalyticsEventName, AnalyticsPropertyValue } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  eventName: AnalyticsEventName;
  competitionId?: string;
  resultCount?: number;
  searchQuery?: string;
  analyticsProperties?: Record<string, AnalyticsPropertyValue | undefined>;
}

export function TrackedLink({
  eventName,
  competitionId,
  resultCount,
  searchQuery,
  analyticsProperties,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackAnalyticsEvent(eventName, {
          competitionId,
          resultCount,
          searchQuery,
          properties: analyticsProperties,
        });
        onClick?.(event);
      }}
    />
  );
}
