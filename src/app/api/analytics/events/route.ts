import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isAnalyticsEventName,
  redactAnalyticsSearchQuery,
  sanitizeAnalyticsProperties,
  truncateAnalyticsString,
  type AnalyticsSessionInput,
} from "@/lib/analytics";
import {
  classifyAnalyticsTraffic,
  getBrowserNameFromUserAgent,
  getCachedBotDetectionRules,
  getDeviceCategoryFromUserAgent,
  getOsNameFromUserAgent,
} from "@/lib/analytics-traffic-classifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVENTS_PER_BATCH = 20;
const MAX_BODY_BYTES = 48_000;
const OCCURRED_AT_MAX_FUTURE_MS = 5 * 60 * 1_000;
const OCCURRED_AT_MAX_PAST_MS = 2 * 24 * 60 * 60 * 1_000;

type AnalyticsEventsPayload = {
  session?: Partial<AnalyticsSessionInput>;
  events?: unknown;
};

type RawAnalyticsEvent = {
  name?: unknown;
  eventId?: unknown;
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
    .map((event) => normalizeEvent(event, session, ipAddress, userAgent, now))
    .filter((event): event is NonNullable<typeof event> => Boolean(event));

  await upsertAnalyticsSession(session, ipAddress, userAgent, now);

  if (events.length > 0) {
    // skipDuplicates: 재시도로 같은 eventId가 다시 들어오면 ON CONFLICT DO
    // NOTHING으로 중복 삽입을 건너뛴다(멱등).
    await prisma.analyticsEvent.createMany({ data: events, skipDuplicates: true });
  }

  return NextResponse.json({ ok: true, count: events.length }, { status: 202 });
}

async function upsertAnalyticsSession(
  session: NonNullable<ReturnType<typeof normalizeSession>>,
  ipAddress: string | null,
  userAgent: string | null,
  now: Date,
) {
  // 반복 배치(이미 생성·분류된 세션)는 lastSeenAt만 갱신한다. 분류·유입·기기 속성은
  // 세션 동안 사실상 불변이므로 다시 쓰지 않는다 → 봇 재분류와 14컬럼 UPDATE 제거.
  const updated = await prisma.analyticsSession.updateMany({
    where: { id: session.sessionId },
    data: { lastSeenAt: now },
  });
  if (updated.count > 0) return;

  // 신규 세션: 이때만 봇 분류를 1회 수행한다(규칙은 모듈 캐시 사용).
  const client = getClientSummary(userAgent, session);
  const classification = await classifyAnalyticsTraffic({
    ipAddress,
    userAgent,
    rules: await getCachedBotDetectionRules(),
  });

  try {
    await prisma.analyticsSession.create({
      data: {
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
        deviceCategory: client.deviceCategory,
        browserName: client.browserName,
        osName: client.osName,
        trafficType: classification.trafficType,
        botName: classification.botName,
        botReason: classification.botReason,
        botVerified: classification.botVerified,
        reverseDnsHost: classification.reverseDnsHost,
        classifiedAt: classification.classifiedAt,
        classificationVersion: classification.classificationVersion,
        displayMode: session.displayMode,
        startedAt: now,
        lastSeenAt: now,
      },
    });
  } catch (error) {
    // 첫 배치 동시 도착 경합: 다른 요청이 먼저 생성(PK 충돌)했으면 lastSeenAt만 갱신.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await prisma.analyticsSession.updateMany({
        where: { id: session.sessionId },
        data: { lastSeenAt: now },
      });
      return;
    }
    throw error;
  }
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
    displayMode: truncateAnalyticsString(input.displayMode, 40),
  };
}

function normalizeEvent(
  value: unknown,
  session: NonNullable<ReturnType<typeof normalizeSession>>,
  ipAddress: string | null,
  userAgent: string | null,
  now: Date,
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
    eventId: normalizeId(input.eventId),
    sessionId: session.sessionId,
    visitorId: session.visitorId,
    name: input.name,
    path,
    occurredAt: normalizeDate(input.occurredAt, now),
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

function normalizeDate(value: unknown, now: Date) {
  if (typeof value !== "string") return now;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return now;

  // 클록 스큐 클램핑: 미래로 과도하거나 너무 과거인 클라이언트 시각은 서버
  // 수신 시각으로 대체해 시간 버킷(일/기간) 왜곡과 윈도 누락을 막는다.
  const time = date.getTime();
  if (time > now.getTime() + OCCURRED_AT_MAX_FUTURE_MS) return now;
  if (time < now.getTime() - OCCURRED_AT_MAX_PAST_MS) return now;
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

function getClientSummary(
  userAgent: string | null,
  fallback: Pick<
    NonNullable<ReturnType<typeof normalizeSession>>,
    "browserName" | "deviceCategory" | "osName"
  >,
) {
  return {
    browserName: getBrowserName(userAgent) ?? fallback.browserName,
    deviceCategory: getDeviceCategory(userAgent) ?? fallback.deviceCategory,
    osName: getOsName(userAgent) ?? fallback.osName,
  };
}

function getDeviceCategory(userAgent: string | null) {
  return getDeviceCategoryFromUserAgent(userAgent);
}

function getBrowserName(userAgent: string | null) {
  return getBrowserNameFromUserAgent(userAgent);
}

function getOsName(userAgent: string | null) {
  return getOsNameFromUserAgent(userAgent);
}
