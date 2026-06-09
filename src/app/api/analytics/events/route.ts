import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isAnalyticsEventName,
  redactAnalyticsSearchQuery,
  sanitizeAnalyticsProperties,
  truncateAnalyticsString,
  type AnalyticsSessionInput,
} from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVENTS_PER_BATCH = 20;
const MAX_BODY_BYTES = 48_000;

type AnalyticsEventsPayload = {
  session?: Partial<AnalyticsSessionInput>;
  events?: unknown;
};

type RawAnalyticsEvent = {
  name?: unknown;
  path?: unknown;
  occurredAt?: unknown;
  competitionId?: unknown;
  searchQuery?: unknown;
  resultCount?: unknown;
  properties?: unknown;
};

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let payload: AnalyticsEventsPayload;
  try {
    payload = JSON.parse(body) as AnalyticsEventsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const session = normalizeSession(payload.session);
  if (!session) {
    return NextResponse.json({ error: "Invalid analytics session." }, { status: 400 });
  }

  if (!Array.isArray(payload.events)) {
    return NextResponse.json({ error: "Invalid analytics events." }, { status: 400 });
  }

  const now = new Date();
  const ipAddress = getClientIp(request);
  const userAgent = truncateAnalyticsString(request.headers.get("user-agent"), 1024);
  const events = payload.events
    .slice(0, MAX_EVENTS_PER_BATCH)
    .map((event) => normalizeEvent(event, session, ipAddress, userAgent))
    .filter((event): event is NonNullable<typeof event> => Boolean(event));

  await prisma.analyticsSession.upsert({
    where: { id: session.sessionId },
    create: {
      id: session.sessionId,
      visitorId: session.visitorId,
      landingPath: session.landingPath,
      referrer: session.referrer,
      referrerHost: session.referrerHost,
      channel: session.channel,
      utmSource: session.utmSource,
      utmMedium: session.utmMedium,
      utmCampaign: session.utmCampaign,
      utmContent: session.utmContent,
      utmTerm: session.utmTerm,
      ipAddress,
      userAgent,
      deviceCategory: session.deviceCategory,
      browserName: session.browserName,
      osName: session.osName,
      startedAt: now,
      lastSeenAt: now,
    },
    update: {
      visitorId: session.visitorId,
      referrer: session.referrer,
      referrerHost: session.referrerHost,
      channel: session.channel,
      utmSource: session.utmSource,
      utmMedium: session.utmMedium,
      utmCampaign: session.utmCampaign,
      utmContent: session.utmContent,
      utmTerm: session.utmTerm,
      ipAddress,
      userAgent,
      deviceCategory: session.deviceCategory,
      browserName: session.browserName,
      osName: session.osName,
      lastSeenAt: now,
    },
  });

  if (events.length > 0) {
    await prisma.analyticsEvent.createMany({ data: events });
  }

  return NextResponse.json({ ok: true, count: events.length }, { status: 202 });
}

function normalizeSession(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<AnalyticsSessionInput>;
  const sessionId = normalizeId(input.sessionId);
  const visitorId = normalizeId(input.visitorId);
  const landingPath = truncateAnalyticsString(input.landingPath, 500);

  if (!sessionId || !visitorId || !landingPath) return null;

  return {
    sessionId,
    visitorId,
    landingPath,
    referrer: truncateAnalyticsString(input.referrer, 500),
    referrerHost: truncateAnalyticsString(input.referrerHost, 120),
    channel: truncateAnalyticsString(input.channel, 40),
    utmSource: truncateAnalyticsString(input.utmSource, 120),
    utmMedium: truncateAnalyticsString(input.utmMedium, 120),
    utmCampaign: truncateAnalyticsString(input.utmCampaign, 160),
    utmContent: truncateAnalyticsString(input.utmContent, 160),
    utmTerm: truncateAnalyticsString(input.utmTerm, 160),
    deviceCategory: truncateAnalyticsString(input.deviceCategory, 40),
    browserName: truncateAnalyticsString(input.browserName, 80),
    osName: truncateAnalyticsString(input.osName, 80),
  };
}

function normalizeEvent(
  value: unknown,
  session: NonNullable<ReturnType<typeof normalizeSession>>,
  ipAddress: string | null,
  userAgent: string | null,
) {
  if (!value || typeof value !== "object") return null;
  const input = value as RawAnalyticsEvent;
  if (!isAnalyticsEventName(input.name)) return null;

  const path = truncateAnalyticsString(
    typeof input.path === "string" ? input.path : session.landingPath,
    500,
  );
  if (!path) return null;

  return {
    sessionId: session.sessionId,
    visitorId: session.visitorId,
    name: input.name,
    path,
    occurredAt: normalizeDate(input.occurredAt),
    competitionId: truncateAnalyticsString(
      typeof input.competitionId === "string" ? input.competitionId : null,
      120,
    ),
    searchQuery: redactAnalyticsSearchQuery(input.searchQuery),
    resultCount: normalizeInteger(input.resultCount),
    propertiesJson: JSON.stringify(sanitizeAnalyticsProperties(input.properties)),
    ipAddress,
    userAgent,
  };
}

function normalizeId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9_-][a-zA-Z0-9_-]{7,79}$/.test(normalized.replace(/-/g, "_"))) {
    return null;
  }
  return normalized.slice(0, 80);
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return new Date();

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function normalizeInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value >= 0 ? value : null;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const candidate =
    forwardedFor?.split(",").map((item) => item.trim()).find(Boolean) ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null;

  return truncateAnalyticsString(candidate, 45);
}
