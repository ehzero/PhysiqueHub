"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { AnalyticsEventName, AnalyticsPropertyValue } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

interface TrackedExternalLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  eventName: AnalyticsEventName;
  competitionId?: string;
  resultCount?: number;
  searchQuery?: string;
  analyticsProperties?: Record<string, AnalyticsPropertyValue | undefined>;
  children: ReactNode;
}

export function TrackedExternalLink({
  eventName,
  competitionId,
  resultCount,
  searchQuery,
  analyticsProperties,
  onClick,
  children,
  ...props
}: TrackedExternalLinkProps) {
  return (
    <a
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
    >
      {children}
    </a>
  );
}
