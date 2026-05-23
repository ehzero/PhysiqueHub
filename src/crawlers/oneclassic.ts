import * as cheerio from "cheerio";
import type {
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionRegistrationStatus,
  CompetitionScheduleDraft,
} from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
import type { CrawlerResult } from "./types";
import {
  absoluteUrl,
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  fetchHtml,
  inferLocation,
  rawHash,
  uniqueTexts,
} from "./utils";

const ONE_CLASSIC_SOURCE = {
  organizationId: "one-classic",
  organizationName: "ONE CLASSIC",
  organizationShortName: "ONE CLASSIC",
  url: "https://oneclassic.co.kr/about",
  homeUrl: "https://oneclassic.co.kr/",
  registrationPageUrl: "https://oneclassic.co.kr/register",
} as const;

const PARSER_NAME = "one-classic-about-preview";
const DEFAULT_SEASON_YEAR = 2026;

interface OneClassicPageData {
  title: string;
  date: CompetitionDateRange;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  registrationRawText?: string;
  locationText?: string;
  divisions: CompetitionDivision[];
  rawText: string;
  rawHtml: string;
}

export async function crawlOneClassic(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (
    selectedOrganizationIds &&
    !selectedOrganizationIds.includes(ONE_CLASSIC_SOURCE.organizationId)
  ) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(ONE_CLASSIC_SOURCE.url);
    const $ = cheerio.load(html);
    const pageData = extractOneClassicPageData($);
    const events = pageData ? [createOneClassicEvent(pageData, fetchedAt)] : [];
    const warnings = [
      "robots.txt에서 일반 User-agent 공개 페이지 접근은 허용되며 /api, /_next 경로는 제외됩니다.",
      "공식 대회일정(/about)의 서버 렌더링 텍스트를 기준으로 단일 대회 이벤트를 수집합니다.",
      "참가 신청 Google Form은 /register 페이지 링크로 확인되며 registrationUrl에 보존합니다.",
    ];

    if (events.length === 0) {
      warnings.push("ONE CLASSIC 대회 일정 페이지에서 수집 가능한 대회 정보를 찾지 못했습니다.");
    }

    sources.push({
      organizationId: ONE_CLASSIC_SOURCE.organizationId,
      organizationName: ONE_CLASSIC_SOURCE.organizationName,
      url: ONE_CLASSIC_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: ONE_CLASSIC_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: ONE_CLASSIC_SOURCE.organizationId,
      organizationName: ONE_CLASSIC_SOURCE.organizationName,
      url: ONE_CLASSIC_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["ONE CLASSIC 대회 일정 페이지 fetch 또는 텍스트 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractOneClassicPageData($: cheerio.CheerioAPI): OneClassicPageData | undefined {
  const rawText = cleanText($("body").text());
  const date = parseOneClassicDate(rawText);

  if (!date.startsOn) {
    return undefined;
  }

  return {
    title: "ONE CLASSIC FITNESS CHAMPIONSHIP",
    date,
    registrationOpensAt: parseScheduleDateTime(rawText, "접수 시작"),
    registrationClosesAt: parseScheduleDateTime(rawText, "접수 마감"),
    registrationRawText: extractScheduleRawText(rawText),
    locationText: extractLocationText(rawText),
    divisions: extractOneClassicDivisions(rawText),
    rawText,
    rawHtml: $("main").html() ?? $("body").html() ?? rawText,
  };
}

function createOneClassicEvent(
  data: OneClassicPageData,
  fetchedAt: string,
): CompetitionScheduleDraft {
  const registrationUrl = absoluteUrl("/register", ONE_CLASSIC_SOURCE.url);
  const formUrl = absoluteUrl("https://forms.gle/bxinCC6PYjYoJvES6", ONE_CLASSIC_SOURCE.url);
  const location = data.locationText
    ? inferOneClassicLocation(data.locationText)
    : {
        country: "KR",
        confidence: "low" as const,
      };
  const qualityIssues = [];

  if (!data.locationText) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "ONE CLASSIC 일정 페이지에서 장소 텍스트를 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!data.registrationClosesAt) {
    qualityIssues.push({
      field: "registration" as const,
      severity: "warning" as const,
      message: "ONE CLASSIC 일정 페이지에서 접수 마감일을 안정적으로 파싱하지 못했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: ONE_CLASSIC_SOURCE.organizationId,
    organizationName: ONE_CLASSIC_SOURCE.organizationName,
    organizationShortName: ONE_CLASSIC_SOURCE.organizationShortName,
    title: data.title,
    seasonYear: data.date.startsOn ? Number(data.date.startsOn.slice(0, 4)) : DEFAULT_SEASON_YEAR,
    date: data.date,
    registration: {
      opensAt: data.registrationOpensAt,
      closesAt: data.registrationClosesAt,
      status: inferOneClassicRegistrationStatus(data.registrationOpensAt, data.registrationClosesAt),
      registrationUrl: formUrl ?? registrationUrl,
      rawText: data.registrationRawText,
      confidence: data.registrationClosesAt ? "high" : "medium",
    },
    location,
    divisions: data.divisions,
    tags: uniqueTexts([
      "ONE CLASSIC",
      "원클래식",
      "Natural",
      "Open",
      "Fitness Championship",
    ]),
    flags: {
      natural: true,
      rookieClass: false,
      beginnerFriendly: false,
      international: false,
    },
    source: createSourceSnapshot({
      sourceType: "official-homepage",
      sourceUrl: ONE_CLASSIC_SOURCE.url,
      detailUrl: registrationUrl,
      sourceEventId: rawHash(`${data.title}:${data.date.rawText}:${data.locationText ?? ""}`),
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: data.rawHtml,
      rawTitle: data.title,
      rawDateText: data.date.rawText,
      rawLocationText: data.locationText,
      rawRegistrationText: data.registrationRawText,
    }),
    qualityIssues,
    notes:
      "ONE CLASSIC 공식 대회일정 페이지의 서버 렌더링 텍스트에서 수집한 preview 데이터입니다.",
  });
}

function parseOneClassicDate(rawText: string): CompetitionDateRange {
  const match = rawText.match(/Date\s*(20\d{2})\.\s*(\d{1,2})\.\s*(\d{1,2})\s*[—–~-]\s*(\d{1,2})/);

  if (!match) {
    return {
      timezone: "Asia/Seoul",
      rawText: rawText.includes("ONE CLASSIC") ? "ONE CLASSIC date not parsed" : undefined,
      confidence: "low",
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const startDay = Number(match[3]);
  const endDay = Number(match[4]);

  return {
    startsOn: toDateString(year, month, startDay),
    endsOn: toDateString(year, month, endDay),
    timezone: "Asia/Seoul",
    rawText: cleanText(match[0].replace(/^Date/, "")),
    confidence: "high",
  };
}

function parseScheduleDateTime(rawText: string, label: "접수 시작" | "접수 마감"): string | undefined {
  const index = rawText.indexOf(label);
  if (index < 0) {
    return undefined;
  }

  const slice = rawText.slice(index, index + 80);
  const match = slice.match(/(20\d{2})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!match) {
    return undefined;
  }

  const time = label === "접수 시작" ? "00:00:00" : "23:59:00";

  return `${toDateString(Number(match[1]), Number(match[2]), Number(match[3]))}T${time}+09:00`;
}

function extractScheduleRawText(rawText: string): string | undefined {
  const match = rawText.match(
    /접수 시작참가 신청 및 서류 접수20\d{2}\.\s*\d{1,2}\.\s*\d{1,2}.*?접수 마감참가 신청 마감 및 확인20\d{2}\.\s*\d{1,2}\.\s*\d{1,2}/,
  );

  return match ? cleanText(match[0]) : undefined;
}

function extractLocationText(rawText: string): string | undefined {
  const match = rawText.match(/Venue\s*(대전\s*한밭대학교)\s*(대전광역시)?/);
  if (!match) {
    return undefined;
  }

  return cleanText([match[1], match[2]].filter(Boolean).join(" "));
}

function inferOneClassicLocation(rawText: string) {
  const inferred = inferLocation([rawText]);

  return {
    ...inferred,
    region: "대전광역시",
    city: "대전광역시",
    venue: "한밭대학교",
    rawText,
    confidence: "high" as const,
  };
}

function extractOneClassicDivisions(rawText: string): CompetitionDivision[] {
  const prizeMap = new Map([
    ["보디빌딩", "Natural ₩3,000,000 / Open ₩10,000,000"],
    ["클래식 피지크", "Natural ₩3,000,000 / Open ₩4,000,000"],
    ["피지크", "Natural ₩3,000,000 / Open ₩3,000,000"],
    ["스포츠모델", "Natural ₩3,000,000 / Open ₩3,000,000"],
    ["비키니", "Natural ₩3,000,000 / Open ₩3,000,000"],
    ["핏모델", "Natural ₩1,000,000 / Open ₩1,000,000"],
  ]);
  const sourceText = rawText.includes("Prize Money") ? rawText : "";

  return Array.from(prizeMap.entries())
    .filter(([name]) => sourceText.includes(name))
    .map(([name, classText]) => ({
      name,
      group: inferOneClassicDivisionGroup(name),
      classText,
      rawText: `${name} ${classText}`,
    }));
}

function inferOneClassicDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/비키니/.test(name)) {
    return "womens";
  }

  if (/보디빌딩|클래식 피지크|피지크/.test(name)) {
    return "mens";
  }

  return "unknown";
}

function inferOneClassicRegistrationStatus(
  opensAt: string | undefined,
  closesAt: string | undefined,
): CompetitionRegistrationStatus {
  const now = Date.now();
  const openMs = opensAt ? Date.parse(opensAt) : Number.NaN;
  const closeMs = closesAt ? Date.parse(closesAt) : Number.NaN;

  if (Number.isFinite(closeMs) && closeMs < now) {
    return "closed";
  }

  if (Number.isFinite(openMs) && openMs > now) {
    return "scheduled";
  }

  if (Number.isFinite(openMs) && openMs <= now) {
    return "open";
  }

  return "unknown";
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
