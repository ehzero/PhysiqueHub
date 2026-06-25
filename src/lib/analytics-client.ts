"use client";

import {
  type AnalyticsEventInput,
  type AnalyticsEventName,
  type AnalyticsPropertyValue,
} from "@/lib/analytics";
import { postAnalyticsEventsBatch } from "@/lib/analytics-api";

const VISITOR_STORAGE_KEY = "ph-analytics-visitor-id";
const SESSION_STORAGE_KEY = "ph-analytics-session-id";
const SESSION_STARTED_KEY = "ph-analytics-session-started";
const LANDING_PATH_KEY = "ph-analytics-landing-path";
const ACQUISITION_STORAGE_KEY = "ph-analytics-acquisition";
const ANALYTICS_OPT_OUT_STORAGE_KEY = "ph-analytics-opt-out";
const FLUSH_INTERVAL_MS = 3_000;
const MAX_BATCH_SIZE = 10;

let queue: AnalyticsEventInput[] = [];
let flushTimer: number | null = null;
let lastPageViewPath = "";
const memoryStorage: Record<string, string> = {};

export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  event: Omit<AnalyticsEventInput, "name" | "eventId" | "occurredAt" | "path"> & {
    path?: string;
    occurredAt?: string;
  } = {},
) {
  if (!shouldCollectAnalytics()) return;

  // eventId는 enqueue 시점에 한 번만 생성한다. 재시도로 같은 이벤트가
  // 다시 전송돼도 같은 id를 유지하므로 서버가 중복을 건너뛸 수 있다.
  queue.push({
    ...event,
    name,
    eventId: createId(),
    path: event.path ?? getCurrentPath(),
    occurredAt: event.occurredAt ?? new Date().toISOString(),
  });

  if (queue.length >= MAX_BATCH_SIZE) {
    void flushAnalyticsEvents();
    return;
  }

  scheduleFlush();
}

export function trackPageView(routeType?: string) {
  if (!shouldCollectAnalytics()) return;

  const path = getCurrentPath();
  if (path === lastPageViewPath) return;
  lastPageViewPath = path;

  trackAnalyticsEvent("page_view", {
    path,
    properties: {
      routeType,
    },
  });
}

export function startAnalyticsSession(routeType?: string) {
  if (!shouldCollectAnalytics()) return;

  ensureAnalyticsSession();

  const sessionStorage = getBrowserStorage("session");
  if (getStorageValue(sessionStorage, SESSION_STARTED_KEY) !== "1") {
    setStorageValue(sessionStorage, SESSION_STARTED_KEY, "1");
    const session = getAnalyticsSession();
    trackAnalyticsEvent("session_start", {
      path: session.landingPath,
      properties: {
        landingPath: session.landingPath,
        referrerHost: session.referrerHost,
        channel: session.channel,
        utmSource: session.utmSource,
        utmMedium: session.utmMedium,
        utmCampaign: session.utmCampaign,
        utmContent: session.utmContent,
        utmTerm: session.utmTerm,
        deviceCategory: session.deviceCategory,
        displayMode: session.displayMode,
        browserName: session.browserName,
        isPwa: session.isPwa,
        osName: session.osName,
        routeType,
      },
    });
  }

  trackPageView(routeType);
}

export async function flushAnalyticsEvents(useBeacon = false) {
  if (!shouldCollectAnalytics() || queue.length === 0) return;

  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }

  const events = queue;
  queue = [];

  const batch = {
    session: getAnalyticsSession(),
    events,
  };
  const body = JSON.stringify(batch);

  if (useBeacon && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      "/api/analytics/events",
      new Blob([body], { type: "application/json" }),
    );
    if (sent) return;
  }

  try {
    await postAnalyticsEventsBatch(batch);
  } catch {
    queue = [...events, ...queue].slice(-MAX_BATCH_SIZE * 3);
  }
}

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    void flushAnalyticsEvents();
  }, FLUSH_INTERVAL_MS);
}

function shouldCollectAnalytics() {
  return (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" &&
    !isAnalyticsOptedOut()
  );
}

function isAnalyticsOptedOut() {
  const localStorage = getBrowserStorage("local");
  return getStorageValue(localStorage, ANALYTICS_OPT_OUT_STORAGE_KEY) === "1";
}

function getAnalyticsSession() {
  const sessionStorage = getBrowserStorage("session");
  const localStorage = getBrowserStorage("local");
  const sessionId = ensureStorageId(sessionStorage, SESSION_STORAGE_KEY);
  const visitorId = ensureStorageId(localStorage, VISITOR_STORAGE_KEY);
  const landingPath = ensureLandingPath();
  const acquisition = ensureAcquisition();
  const displayMode = getDisplayMode();

  return {
    sessionId,
    visitorId,
    landingPath,
    referrer: acquisition.referrer,
    referrerHost: acquisition.referrerHost,
    channel: acquisition.channel,
    utmSource: acquisition.utmSource,
    utmMedium: acquisition.utmMedium,
    utmCampaign: acquisition.utmCampaign,
    utmContent: acquisition.utmContent,
    utmTerm: acquisition.utmTerm,
    deviceCategory: getDeviceCategory(),
    displayMode,
    browserName: getBrowserName(navigator.userAgent),
    isPwa: isPwaDisplayMode(displayMode),
    osName: getOsName(navigator.userAgent),
  };
}

function ensureAnalyticsSession() {
  ensureStorageId(getBrowserStorage("session"), SESSION_STORAGE_KEY);
  ensureStorageId(getBrowserStorage("local"), VISITOR_STORAGE_KEY);
  ensureLandingPath();
  ensureAcquisition();
}

type AnalyticsAcquisition = {
  referrer: string | null;
  referrerHost: string | null;
  channel: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

// 유입 정보(참조 URL/채널/UTM)는 세션 진입 시점에 한 번만 스냅샷해 고정한다.
// flush마다 현재 URL에서 다시 계산하면, 사용자가 UTM 랜딩에서 벗어난 뒤의
// 빈 값으로 세션 어트리뷰션이 덮어써져 유실된다.
function ensureAcquisition(): AnalyticsAcquisition {
  const sessionStorage = getBrowserStorage("session");
  const stored = getStorageValue(sessionStorage, ACQUISITION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AnalyticsAcquisition;
    } catch {
      // 저장값이 손상되면 아래에서 다시 계산한다.
    }
  }

  const referrer = document.referrer || null;
  const referrerHost = getReferrerHost(referrer);
  const url = new URL(window.location.href);
  const acquisition: AnalyticsAcquisition = {
    referrer,
    referrerHost,
    channel: getTrafficChannel(referrerHost, url.searchParams),
    utmSource: getParam(url.searchParams, "utm_source"),
    utmMedium: getParam(url.searchParams, "utm_medium"),
    utmCampaign: getParam(url.searchParams, "utm_campaign"),
    utmContent: getParam(url.searchParams, "utm_content"),
    utmTerm: getParam(url.searchParams, "utm_term"),
  };
  setStorageValue(sessionStorage, ACQUISITION_STORAGE_KEY, JSON.stringify(acquisition));
  return acquisition;
}

function ensureStorageId(storage: Storage | null, key: string) {
  const current = getStorageValue(storage, key);
  if (current) return current;

  const next = createId();
  setStorageValue(storage, key, next);
  return next;
}

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ensureLandingPath() {
  const sessionStorage = getBrowserStorage("session");
  const current = getStorageValue(sessionStorage, LANDING_PATH_KEY);
  if (current) return current;

  const landingPath = getCurrentPath();
  setStorageValue(sessionStorage, LANDING_PATH_KEY, landingPath);
  return landingPath;
}

function getBrowserStorage(type: "local" | "session") {
  try {
    return type === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function getStorageValue(storage: Storage | null, key: string) {
  try {
    return storage?.getItem(key) ?? memoryStorage[key] ?? null;
  } catch {
    return memoryStorage[key] ?? null;
  }
}

function setStorageValue(storage: Storage | null, key: string, value: string) {
  memoryStorage[key] = value;
  try {
    storage?.setItem(key, value);
  } catch {
    // Keep the in-memory fallback for this page lifecycle.
  }
}

function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

function getParam(params: URLSearchParams, key: string): string | null {
  const value = params.get(key)?.trim();
  return value || null;
}

function getReferrerHost(referrer: string | null) {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    return url.host;
  } catch {
    return null;
  }
}

function getTrafficChannel(referrerHost: string | null, params: URLSearchParams) {
  const medium = params.get("utm_medium")?.toLowerCase();
  const source = params.get("utm_source")?.toLowerCase();

  if (medium && /cpc|paid|ad|display|ppc/.test(medium)) return "paid";
  if (medium && /social|sns/.test(medium)) return "social";
  if (source && /instagram|facebook|threads|youtube|tiktok|x\.com|twitter/.test(source)) {
    return "social";
  }
  if (!referrerHost) return "direct";
  if (referrerHost === window.location.host) return "internal";
  if (/google|naver|daum|bing|yahoo/.test(referrerHost)) return "organic_search";
  if (/instagram|facebook|threads|youtube|tiktok|twitter|x\.com/.test(referrerHost)) {
    return "social";
  }
  return "referral";
}

function getDeviceCategory() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getDisplayMode() {
  if (isIosStandalone()) return "standalone";
  if (typeof window.matchMedia !== "function") return "unknown";
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  if (window.matchMedia("(display-mode: browser)").matches) return "browser";
  return "unknown";
}

function isPwaDisplayMode(displayMode: string) {
  return displayMode === "standalone" || displayMode === "fullscreen" || displayMode === "minimal-ui";
}

function isIosStandalone() {
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function getBrowserName(userAgent: string) {
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  return "Other";
}

function getOsName(userAgent: string) {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
  if (/Android/.test(userAgent)) return "Android";
  if (/CrOS/.test(userAgent)) return "ChromeOS";
  if (/Mac OS X|Macintosh/.test(userAgent)) return "macOS";
  if (/Windows/.test(userAgent)) return "Windows";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Other";
}

export type { AnalyticsPropertyValue };
