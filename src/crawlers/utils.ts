import { createHash } from "node:crypto";
import { FETCH_TIMEOUT_MS } from "./config";
import type {
  CompetitionConfidence,
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionLocation,
  CompetitionOrganizationId,
  CompetitionQualityIssue,
  CompetitionRegistrationStatus,
  CompetitionRegistrationWindow,
  CompetitionScheduleDraft,
  CompetitionSourceSnapshot,
  CompetitionSourceType,
} from "../types/competitionSchedule";

const USER_AGENT =
  "PhysiqueHubCrawlerPreview/0.1 (+https://physiquehub.local; contact: preview)";

const KOREA_TIMEZONE = "Asia/Seoul" as const;

export interface FetchHtmlResult {
  html: string;
  fetchedAt: string;
}

export async function fetchHtml(
  url: string,
  options: { encoding?: string } = {},
): Promise<FetchHtmlResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.7,en;q=0.6",
        "user-agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const fetchedAt = new Date().toISOString();

    if (options.encoding) {
      return {
        html: new TextDecoder(options.encoding).decode(
          Buffer.from(await response.arrayBuffer()),
        ),
        fetchedAt,
      };
    }

    return {
      html: await response.text(),
      fetchedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function cleanText(value: string | undefined | null): string {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueTexts(values: string[]): string[] {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

export function absoluteUrl(href: string | undefined, baseUrl: string): string | undefined {
  const cleanHref = cleanText(href);

  if (!cleanHref || cleanHref === "#") {
    return undefined;
  }

  try {
    return new URL(cleanHref, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function rawHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function slugify(value: string): string {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || rawHash(value);
}

export function makeDeterministicId(
  organizationId: CompetitionOrganizationId,
  sourceEventId: string | undefined,
  fallbackParts: string[],
): string {
  return `${organizationId}:${sourceEventId || slugify(fallbackParts.join(" "))}`;
}

export function getYearFromText(text: string, fallbackYear = 2026): number {
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : fallbackYear;
}

export function parseKoreanDateRange(
  rawText: string | undefined,
  fallbackYear = 2026,
  confidence: CompetitionConfidence = "medium",
): CompetitionDateRange {
  const raw = cleanText(rawText);
  const dateText = raw
    .replace(/\((?:월|화|수|목|금|토|일)\)/g, "")
    .replace(/（(?:월|화|수|목|금|토|일)）/g, "")
    .replace(/\s[~-]\s*\d{1,2}:\d{2}(?::\d{2})?/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const empty: CompetitionDateRange = {
    timezone: KOREA_TIMEZONE,
    rawText: raw || undefined,
    confidence: raw ? confidence : "low",
  };

  if (!raw) {
    return empty;
  }

  const isoRange = dateText.match(
    /(20\d{2})[-./](\d{1,2})[-./](\d{1,2})(?:\s+(?:~|-|–)\s+(20\d{2})[-./](\d{1,2})[-./](\d{1,2}))?/,
  );
  if (isoRange) {
    return {
      startsOn: toDateString(Number(isoRange[1]), Number(isoRange[2]), Number(isoRange[3])),
      endsOn: isoRange[4]
        ? toDateString(Number(isoRange[4]), Number(isoRange[5]), Number(isoRange[6]))
        : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  const fullRange = dateText.match(
    /(20\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})\s*(?:일)?\.?\s*(?:[~\-–]\s*(?:(\d{1,2})[.\-/월\s]+)?(\d{1,2}))?/,
  );
  if (fullRange) {
    const year = Number(fullRange[1]);
    const month = Number(fullRange[2]);
    const day = Number(fullRange[3]);
    const endMonth = fullRange[4] ? Number(fullRange[4]) : month;
    const endDay = fullRange[5] ? Number(fullRange[5]) : day;

    return {
      startsOn: toDateString(year, month, day),
      endsOn: fullRange[5] ? toDateString(year, endMonth, endDay) : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  const koreanRange = dateText.match(
    /(?:(20\d{2})년\s*)?(\d{1,2})월\s*(\d{1,2})일?(?:\s*[~\-–]\s*(?:(\d{1,2})월\s*)?(\d{1,2})일?)?/,
  );
  if (koreanRange) {
    const year = koreanRange[1] ? Number(koreanRange[1]) : fallbackYear;
    const month = Number(koreanRange[2]);
    const day = Number(koreanRange[3]);
    const endMonth = koreanRange[4] ? Number(koreanRange[4]) : month;
    const endDay = koreanRange[5] ? Number(koreanRange[5]) : day;

    return {
      startsOn: toDateString(year, month, day),
      endsOn: koreanRange[5] ? toDateString(year, endMonth, endDay) : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  const numericMonthDay = dateText.match(
    /(\d{1,2})\s*[.]\s*(\d{1,2})\s*[.]?(?:\s*[~\-–]\s*(?:(\d{1,2})\s*[.]\s*)?(\d{1,2})\s*[.]?)?/,
  );
  if (numericMonthDay) {
    const month = Number(numericMonthDay[1]);
    const day = Number(numericMonthDay[2]);
    const endMonth = numericMonthDay[3] ? Number(numericMonthDay[3]) : month;
    const endDay = numericMonthDay[4] ? Number(numericMonthDay[4]) : day;

    return {
      startsOn: toDateString(fallbackYear, month, day),
      endsOn: numericMonthDay[4] ? toDateString(fallbackYear, endMonth, endDay) : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  return empty;
}

export function parseKoreanDeadline(
  rawText: string | undefined,
  fallbackYear = 2026,
): string | undefined {
  const raw = cleanText(rawText);
  const range = parseKoreanDateRange(rawText, fallbackYear, "medium");
  if (!range.startsOn) {
    return undefined;
  }

  const colonTime = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  const koreanTime = raw.match(/(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  const hour = colonTime?.[1] ?? koreanTime?.[1] ?? "23";
  const minute = colonTime?.[2] ?? koreanTime?.[2] ?? "59";

  return `${range.startsOn}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+09:00`;
}

export function toKoreaIsoDateTime(rawValue: string | undefined): string | undefined {
  const value = cleanText(rawValue);

  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return `${value}+09:00`;
  }

  return value;
}

export function inferRegistrationStatus(
  opensAt: string | undefined,
  closesAt: string | undefined,
  applyOpen?: string,
): CompetitionRegistrationStatus {
  const normalizedApplyOpen = cleanText(applyOpen).toLowerCase();
  const now = Date.now();
  const openMs = opensAt ? Date.parse(opensAt) : Number.NaN;
  const closeMs = closesAt ? Date.parse(closesAt) : Number.NaN;

  if (Number.isFinite(closeMs) && closeMs < now) {
    return "closed";
  }

  if (normalizedApplyOpen === "true" || normalizedApplyOpen === "ture") {
    return "open";
  }

  if (Number.isFinite(openMs) && openMs > now) {
    return "scheduled";
  }

  if (Number.isFinite(openMs) && openMs <= now) {
    return "open";
  }

  return "unknown";
}

export function extractDivisions(rawText: string | undefined): CompetitionDivision[] {
  const text = cleanText(rawText);
  if (!text) {
    return [];
  }

  return text
    .split(/[,/·]/)
    .map((name) => cleanText(name))
    .filter((name) => name.length > 1)
    .map((name) => ({
      name,
      group: inferDivisionGroup(name),
      rawText: text,
    }));
}

export function createScheduleDraft(input: {
  organizationId: CompetitionOrganizationId;
  organizationName: string;
  organizationShortName?: string;
  title: string;
  seasonYear?: number;
  date: CompetitionDateRange;
  registration?: Partial<CompetitionRegistrationWindow>;
  location?: Partial<CompetitionLocation>;
  divisions?: CompetitionDivision[];
  tags?: string[];
  flags?: CompetitionScheduleDraft["flags"];
  media?: CompetitionScheduleDraft["media"];
  source: CompetitionSourceSnapshot;
  confidence?: CompetitionConfidence;
  qualityIssues?: CompetitionQualityIssue[];
  notes?: string;
}): CompetitionScheduleDraft {
  const createdAt = input.source.fetchedAt;
  const dateConfidence = input.date.confidence;
  const registrationConfidence = input.registration?.confidence ?? "low";
  const locationConfidence = input.location?.confidence ?? "low";
  const fallbackConfidence =
    input.confidence ?? minConfidence([dateConfidence, registrationConfidence, locationConfidence]);
  const sourceEventId = input.source.sourceEventId;

  return {
    id: makeDeterministicId(input.organizationId, sourceEventId, [
      input.title,
      input.date.rawText ?? "",
      input.source.sourceUrl,
    ]),
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    organizationShortName: input.organizationShortName,
    title: input.title,
    seasonYear: input.seasonYear,
    date: input.date,
    registration: {
      status: input.registration?.status ?? "unknown",
      opensAt: input.registration?.opensAt,
      closesAt: input.registration?.closesAt,
      fee: input.registration?.fee,
      registrationUrl: input.registration?.registrationUrl,
      rawText: input.registration?.rawText,
      confidence: registrationConfidence,
    },
    location: {
      country: input.location?.country ?? "KR",
      region: input.location?.region,
      city: input.location?.city,
      venue: input.location?.venue,
      address: input.location?.address,
      rawText: input.location?.rawText,
      confidence: locationConfidence,
    },
    divisions: input.divisions ?? [],
    tags: uniqueTexts(input.tags ?? []),
    flags: input.flags ?? {},
    media: input.media,
    source: input.source,
    crawlStatus: "sample-collected",
    reviewStatus: "needs-review",
    confidence: fallbackConfidence,
    qualityIssues: input.qualityIssues ?? [],
    notes: input.notes,
    createdAt,
    updatedAt: createdAt,
    normalizedAt: createdAt,
  };
}

export function createSourceSnapshot(input: {
  sourceType: CompetitionSourceType;
  sourceUrl: string;
  detailUrl?: string;
  sourceEventId?: string;
  sourceUpdatedAt?: string;
  fetchedAt: string;
  parserName: string;
  rawHtml?: string;
  rawTitle?: string;
  rawDateText?: string;
  rawLocationText?: string;
  rawRegistrationText?: string;
}): CompetitionSourceSnapshot {
  return {
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    detailUrl: input.detailUrl,
    sourceEventId: input.sourceEventId,
    sourceUpdatedAt: input.sourceUpdatedAt,
    fetchedAt: input.fetchedAt,
    parserName: input.parserName,
    parserVersion: "0.1.0",
    rawHash: input.rawHtml ? rawHash(input.rawHtml) : undefined,
    rawTitle: input.rawTitle,
    rawDateText: input.rawDateText,
    rawLocationText: input.rawLocationText,
    rawRegistrationText: input.rawRegistrationText,
  };
}

export function inferLocation(texts: string[]): Partial<CompetitionLocation> {
  const cleaned = uniqueTexts(texts);
  const rawText = cleaned.join(" ");
  const venue = cleaned.find((text) =>
    /(홀|센터|체육관|아레나|호텔|컨벤션|방송센터|경기장|문화|회관|예정)/.test(text),
  );
  const region = cleaned.find((text) =>
    /(서울|부산|대구|인천|광주|대전|울산|세종|경기도|강원|충청|전라|경상|제주|필리핀|마닐라)/.test(text),
  );

  return {
    country: /필리핀|마닐라/i.test(rawText) ? "PH" : "KR",
    region,
    venue,
    rawText: rawText || undefined,
    confidence: venue || region ? "medium" : "low",
  };
}

export function sourceEventIdFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return (
      parsed.searchParams.get("idx") ??
      parsed.searchParams.get("id") ??
      parsed.searchParams.get("index_no") ??
      parsed.searchParams.get("ps_goid") ??
      undefined
    );
  } catch {
    return undefined;
  }
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/(비키니|웰니스|피겨|여자|우먼|womens?)/i.test(name)) {
    return "womens";
  }

  if (/(멘즈|남자|클래식 피지크|보디빌딩|mens?)/i.test(name)) {
    return "mens";
  }

  return "unknown";
}

function minConfidence(values: CompetitionConfidence[]): CompetitionConfidence {
  if (values.includes("low")) {
    return "low";
  }

  if (values.includes("medium")) {
    return "medium";
  }

  return "high";
}
