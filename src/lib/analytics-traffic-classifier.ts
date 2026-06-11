import { promises as dns } from "node:dns";
import type { BotDetectionRule, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ANALYTICS_CLASSIFICATION_VERSION = "2026-06-11.1";

const DNS_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const VALID_TRAFFIC_TYPES = new Set(["human", "bot", "suspected_bot", "unknown"]);

type ClassificationInput = {
  ipAddress: string | null;
  userAgent: string | null;
  now?: Date;
  prismaClient?: PrismaClient;
  rules?: BotDetectionRule[];
};

export type AnalyticsTrafficClassification = {
  trafficType: string;
  botName: string | null;
  botReason: string | null;
  botVerified: boolean;
  reverseDnsHost: string | null;
  classifiedAt: Date;
  classificationVersion: string;
};

export async function classifyAnalyticsTraffic({
  ipAddress,
  userAgent,
  now = new Date(),
  prismaClient = prisma,
  rules,
}: ClassificationInput): Promise<AnalyticsTrafficClassification> {
  const detectionRules = rules ?? (await loadBotDetectionRules(prismaClient));
  let reverseDnsHost: string | null | undefined;

  for (const rule of detectionRules) {
    const match = await matchesRule(rule, {
      ipAddress,
      now,
      prismaClient,
      userAgent,
      getReverseDnsHost: async () => {
        reverseDnsHost ??= await getReverseDnsHost(ipAddress, now, prismaClient);
        return reverseDnsHost;
      },
    });

    if (!match.matched) continue;

    return toClassification(rule, {
      now,
      reverseDnsHost: match.reverseDnsHost ?? null,
      verified: match.verified,
    });
  }

  return {
    trafficType: "human",
    botName: null,
    botReason: null,
    botVerified: false,
    reverseDnsHost: reverseDnsHost ?? null,
    classifiedAt: now,
    classificationVersion: ANALYTICS_CLASSIFICATION_VERSION,
  };
}

export function loadBotDetectionRules(prismaClient: PrismaClient = prisma) {
  return prismaClient.botDetectionRule.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    where: { enabled: true },
  });
}

export function getDeviceCategoryFromUserAgent(userAgent: string | null) {
  if (!userAgent) return null;
  if (/Macintosh/i.test(userAgent) && /Mobile\/\w+ Safari/i.test(userAgent)) return "tablet";
  if (/iPad|Tablet|PlayBook|Kindle|Silk|Android(?!.*Mobile)/i.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(userAgent)) return "mobile";
  if (/Macintosh|Windows NT|X11|CrOS|Linux x86_64|Ubuntu|Fedora/i.test(userAgent)) {
    return "desktop";
  }
  return null;
}

export function getBrowserNameFromUserAgent(userAgent: string | null) {
  if (!userAgent) return null;
  if (/Whale\//i.test(userAgent)) return "Whale";
  if (/SamsungBrowser\//i.test(userAgent)) return "Samsung Internet";
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/CriOS\//i.test(userAgent)) return "Chrome";
  if (/HeadlessChrome\//i.test(userAgent)) return "Headless Chrome";
  if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) return "Chrome";
  if (/FxiOS\//i.test(userAgent) || /Firefox\//i.test(userAgent)) return "Firefox";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  return "Other";
}

export function getOsNameFromUserAgent(userAgent: string | null) {
  if (!userAgent) return null;
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Android/i.test(userAgent)) return "Android";
  if (/CrOS/i.test(userAgent)) return "ChromeOS";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
  if (/Windows NT|Windows/i.test(userAgent)) return "Windows";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Other";
}

async function matchesRule(
  rule: BotDetectionRule,
  context: {
    ipAddress: string | null;
    now: Date;
    prismaClient: PrismaClient;
    userAgent: string | null;
    getReverseDnsHost: () => Promise<string | null>;
  },
) {
  if (rule.matchType === "user_agent_regex") {
    if (!context.userAgent || !safeRegexTest(rule.pattern, context.userAgent)) {
      return { matched: false, verified: false, reverseDnsHost: null };
    }
    if (!rule.verifyReverseDns) {
      return { matched: true, verified: true, reverseDnsHost: null };
    }
    const reverseDnsHost = await context.getReverseDnsHost();
    return {
      matched: true,
      verified: Boolean(reverseDnsHost),
      reverseDnsHost,
    };
  }

  if (rule.matchType === "ip_prefix") {
    if (!context.ipAddress?.startsWith(rule.pattern)) {
      return { matched: false, verified: false, reverseDnsHost: null };
    }
    if (!rule.verifyReverseDns) {
      return { matched: true, verified: true, reverseDnsHost: null };
    }
    const reverseDnsHost = await context.getReverseDnsHost();
    return {
      matched: true,
      verified: Boolean(reverseDnsHost),
      reverseDnsHost,
    };
  }

  if (rule.matchType === "reverse_dns_suffix") {
    if (!shouldCheckReverseDns(context.userAgent)) {
      return { matched: false, verified: false, reverseDnsHost: null };
    }
    const reverseDnsHost = await context.getReverseDnsHost();
    const suffix = normalizeDnsSuffix(rule.pattern);
    return {
      matched: Boolean(reverseDnsHost && reverseDnsHost.endsWith(suffix)),
      verified: Boolean(reverseDnsHost),
      reverseDnsHost,
    };
  }

  return { matched: false, verified: false, reverseDnsHost: null };
}

function shouldCheckReverseDns(userAgent: string | null) {
  if (!userAgent) return true;
  if (/bot|crawler|spider|crawling|facebookexternalhit|slurp|yeti|daumoa|headless/i.test(userAgent)) {
    return true;
  }
  if (/\(KHTML$/i.test(userAgent)) return true;
  return !/(Chrome\/|Safari\/|Firefox\/|Edg\/|Whale\/|SamsungBrowser\/|CriOS\/|FxiOS\/)/i.test(
    userAgent,
  );
}

function toClassification(
  rule: BotDetectionRule,
  options: {
    now: Date;
    reverseDnsHost: string | null;
    verified: boolean;
  },
): AnalyticsTrafficClassification {
  const trafficType = normalizeTrafficType(
    rule.verifyReverseDns && !options.verified ? "suspected_bot" : rule.trafficType,
  );

  return {
    trafficType,
    botName: rule.botName,
    botReason: rule.botReason,
    botVerified: options.verified,
    reverseDnsHost: options.reverseDnsHost,
    classifiedAt: options.now,
    classificationVersion: ANALYTICS_CLASSIFICATION_VERSION,
  };
}

async function getReverseDnsHost(
  ipAddress: string | null,
  now: Date,
  prismaClient: PrismaClient,
) {
  if (!ipAddress) return null;

  const cached = await prismaClient.analyticsDnsCache.findUnique({
    where: { ipAddress },
  });
  if (cached && cached.expiresAt > now) {
    return cached.hostname;
  }

  const hostname = await lookupReverseDnsHost(ipAddress);
  const expiresAt = new Date(now.getTime() + DNS_CACHE_TTL_MS);

  await prismaClient.analyticsDnsCache.upsert({
    where: { ipAddress },
    create: {
      ipAddress,
      hostname,
      lookedUpAt: now,
      expiresAt,
    },
    update: {
      hostname,
      lookedUpAt: now,
      expiresAt,
    },
  });

  return hostname;
}

async function lookupReverseDnsHost(ipAddress: string) {
  try {
    const hosts = await dns.reverse(ipAddress);
    return hosts[0]?.replace(/\.$/, "").toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function safeRegexTest(pattern: string, value: string) {
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return false;
  }
}

function normalizeDnsSuffix(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith(".") ? normalized : `.${normalized}`;
}

function normalizeTrafficType(value: string) {
  return VALID_TRAFFIC_TYPES.has(value) ? value : "unknown";
}
