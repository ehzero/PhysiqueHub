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
const FLUSH_INTERVAL_MS = 3_000;
const MAX_BATCH_SIZE = 10;

let queue: AnalyticsEventInput[] = [];
let flushTimer: number | null = null;
let lastPageViewPath = "";
const memoryStorage: Record<string, string> = {};

export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  event: Omit<AnalyticsEventInput, "name" | "occurredAt" | "path"> & {
    path?: string;
    occurredAt?: string;
  } = {},
) {
  if (!shouldCollectAnalytics()) return;

  queue.push({
    ...event,
    name,
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
        browserName: session.browserName,
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
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true"
  );
}

function getAnalyticsSession() {
  const sessionStorage = getBrowserStorage("session");
  const localStorage = getBrowserStorage("local");
  const sessionId = ensureStorageId(sessionStorage, SESSION_STORAGE_KEY);
  const visitorId = ensureStorageId(localStorage, VISITOR_STORAGE_KEY);
  const landingPath = ensureLandingPath();
  const referrer = document.referrer || null;
  const referrerHost = getReferrerHost(referrer);
  const url = new URL(window.location.href);

  return {
    sessionId,
    visitorId,
    landingPath,
    referrer,
    referrerHost,
    channel: getTrafficChannel(referrerHost, url.searchParams),
    utmSource: getParam(url.searchParams, "utm_source"),
    utmMedium: getParam(url.searchParams, "utm_medium"),
    utmCampaign: getParam(url.searchParams, "utm_campaign"),
    utmContent: getParam(url.searchParams, "utm_content"),
    utmTerm: getParam(url.searchParams, "utm_term"),
    deviceCategory: getDeviceCategory(),
    browserName: getBrowserName(navigator.userAgent),
    osName: getOsName(navigator.userAgent),
  };
}

function ensureAnalyticsSession() {
  ensureStorageId(getBrowserStorage("session"), SESSION_STORAGE_KEY);
  ensureStorageId(getBrowserStorage("local"), VISITOR_STORAGE_KEY);
  ensureLandingPath();
}

function ensureStorageId(storage: Storage | null, key: string) {
  const current = getStorageValue(storage, key);
  if (current) return current;

  const next =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  setStorageValue(storage, key, next);
  return next;
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
  if (/Mac OS X|Macintosh/.test(userAgent)) return "macOS";
  if (/Windows/.test(userAgent)) return "Windows";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Other";
}

export type { AnalyticsPropertyValue };
