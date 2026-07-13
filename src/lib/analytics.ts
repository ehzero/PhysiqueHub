export const ANALYTICS_EVENT_NAMES = [
  "session_start",
  "page_view",
  "engagement_ping",
  "search_performed",
  "empty_search_result",
  "filter_applied",
  "filter_reset",
  "sort_changed",
  "view_mode_changed",
  "competition_open",
  "competition_detail_click",
  "competition_view",
  "related_competition_click",
  "registration_link_click",
  "source_link_click",
  "share_click",
  "save_competition",
  "unsave_competition",
  "contact_open",
  "contact_submit_success",
  "owned_promo_impression",
  "owned_promo_click",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];
export type AnalyticsPropertyValue = string | number | boolean | null;

export interface AnalyticsEventInput {
  name: AnalyticsEventName;
  eventId?: string;
  path?: string;
  occurredAt?: string;
  competitionId?: string;
  searchQuery?: string;
  resultCount?: number;
  properties?: Record<string, AnalyticsPropertyValue | undefined>;
}

export interface AnalyticsSessionInput {
  sessionId: string;
  visitorId: string;
  landingPath: string;
  referrer?: string | null;
  referrerHost?: string | null;
  channel?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  deviceCategory?: string | null;
  browserName?: string | null;
  osName?: string | null;
  displayMode?: string | null;
}

export const ANALYTICS_ALLOWED_PROPERTY_KEYS = new Set([
  "activeSeconds",
  "activeFilterCount",
  "browserName",
  "category",
  "channel",
  "dateStartsOn",
  "deviceCategory",
  "displayMode",
  "filterCount",
  "filterKey",
  "filterKeys",
  "filterValue",
  "hadRegistrationUrl",
  "isPwa",
  "landingPath",
  "maxScrollDepth",
  "organizationId",
  "osName",
  "promotionId",
  "referrerHost",
  "registrationStatus",
  "routeType",
  "savedCount",
  "scope",
  "sortKey",
  "source",
  "tier",
  "utmCampaign",
  "utmContent",
  "utmMedium",
  "utmSource",
  "utmTerm",
  "variant",
  "viewMode",
]);

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return (
    typeof value === "string" &&
    ANALYTICS_EVENT_NAMES.includes(value as AnalyticsEventName)
  );
}

export function redactAnalyticsSearchQuery(value: unknown) {
  if (typeof value !== "string") return null;

  return truncateAnalyticsString(
    value
      .trim()
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]")
      .replace(/(?:\+?82[-.\s]?)?0?1[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, "[redacted]"),
    80,
  );
}

export function truncateAnalyticsString(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

export function sanitizeAnalyticsProperties(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const properties: Record<string, AnalyticsPropertyValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!ANALYTICS_ALLOWED_PROPERTY_KEYS.has(key)) continue;

    if (typeof item === "string") {
      const truncated = truncateAnalyticsString(item, 160);
      if (truncated !== null) properties[key] = truncated;
      continue;
    }

    if (typeof item === "number") {
      if (Number.isFinite(item)) properties[key] = item;
      continue;
    }

    if (typeof item === "boolean" || item === null) {
      properties[key] = item;
    }
  }

  return properties;
}
