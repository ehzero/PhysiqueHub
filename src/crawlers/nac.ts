import * as cheerio from "cheerio";
import type {
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionLocation,
  CompetitionQualityIssue,
  CompetitionScheduleDraft,
} from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
import { crawlFitSchedule } from "./fitschedule";
import type { CrawlerResult } from "./types";
import {
  absoluteUrl,
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  fetchHtml,
  rawHash,
  uniqueTexts,
} from "./utils";

const NAC_SOURCE = {
  organizationId: "nac-korea",
  organizationName: "NAC Korea",
  organizationShortName: "NAC Korea",
  url: "https://www.nackorea.com/product/list.html?cate_no=28",
  homeUrl: "https://www.nackorea.com/",
  contestInfoUrl: "https://www.nackorea.com/page/contest.html",
} as const;

const PARSER_NAME = "nac-korea-registration-preview";
const DEFAULT_SEASON_YEAR = 2026;

interface NacRegistrationProduct {
  name: string;
  href: string;
  rawHtml: string;
}

interface NacPageData {
  products: NacRegistrationProduct[];
  rawHtml: string;
}

interface NacCandidateEvent {
  title: string;
  date: CompetitionDateRange;
  location: CompetitionLocation;
  rawText: string;
}

export async function crawlNacKorea(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (selectedOrganizationIds && !selectedOrganizationIds.includes(NAC_SOURCE.organizationId)) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const [{ html, fetchedAt }, fitScheduleCandidate] = await Promise.all([
      fetchHtml(NAC_SOURCE.url),
      findFitScheduleNacCandidate(),
    ]);
    const $ = cheerio.load(html);
    const pageData = extractNacPageData($);
    const events =
      pageData.products.length > 0
        ? [createNacEvent(pageData, fitScheduleCandidate, fetchedAt)]
        : [];
    const warnings = [
      "NAC Korea 공식 대회접수 카테고리의 공개 상품 목록을 수집합니다.",
      "공식 접수 HTML에는 2026 대회일/장소가 직접 노출되지 않아 보조 후보값으로 보강하고 needs-review로 둡니다.",
      `${pageData.products.length}개 접수 상품을 종목 후보로 추출했습니다.`,
    ];

    if (!fitScheduleCandidate) {
      warnings.push("보조 후보에서 NAC Korea 일정을 찾지 못해 날짜/장소는 비워둡니다.");
    }

    if (events.length === 0) {
      warnings.push("NAC Korea 공식 대회접수 페이지에서 수집 가능한 접수 상품을 찾지 못했습니다.");
    }

    sources.push({
      organizationId: NAC_SOURCE.organizationId,
      organizationName: NAC_SOURCE.organizationName,
      url: NAC_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: NAC_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: NAC_SOURCE.organizationId,
      organizationName: NAC_SOURCE.organizationName,
      url: NAC_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["NAC Korea 공식 대회접수 페이지 fetch 또는 상품 목록 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractNacPageData($: cheerio.CheerioAPI): NacPageData {
  const products: NacRegistrationProduct[] = [];

  $("li[id^='anchorBoxId_']").each((_, element) => {
    const link = $(element).find("a[href*='/product/']").first();
    const href = absoluteUrl(link.attr("href"), NAC_SOURCE.url);
    const rawName =
      cleanText($(element).find(".name").text()) ||
      cleanText(link.text()) ||
      cleanText(link.find("img[alt]").attr("alt"));
    const name = normalizeProductName(rawName);

    if (!href || !name || !/얼리버드|보디빌딩|피지크|모델|비키니|웰니스/.test(rawName)) {
      return;
    }

    products.push({
      name,
      href,
      rawHtml: $.html(element),
    });
  });

  return {
    products: dedupeProducts(products),
    rawHtml: $("body").html() ?? $.root().html() ?? "",
  };
}

function createNacEvent(
  pageData: NacPageData,
  candidate: NacCandidateEvent | undefined,
  fetchedAt: string,
): CompetitionScheduleDraft {
  const date = candidate ? degradeCandidateDate(candidate.date) : emptyDate();
  const location = candidate ? degradeCandidateLocation(candidate.location) : emptyLocation();
  const registrationUrl = pageData.products[0]?.href ?? NAC_SOURCE.url;
  const qualityIssues: CompetitionQualityIssue[] = [
    {
      field: "date" as const,
      severity: "warning" as const,
      message:
        "NAC Korea 공식 접수 HTML에 대회일이 직접 노출되지 않아 보조 후보값으로 보강했습니다.",
    },
    {
      field: "location" as const,
      severity: "warning" as const,
      message:
        "NAC Korea 공식 접수 HTML에 장소가 직접 노출되지 않아 보조 후보값으로 보강했습니다.",
    },
  ];

  if (!candidate) {
    qualityIssues.push({
      field: "source" as const,
      severity: "warning" as const,
      message: "보조 후보를 찾지 못했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: NAC_SOURCE.organizationId,
    organizationName: NAC_SOURCE.organizationName,
    organizationShortName: NAC_SOURCE.organizationShortName,
    title: candidate?.title ?? "NAC Korea Championship",
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : DEFAULT_SEASON_YEAR,
    date,
    registration: {
      status: "unknown",
      registrationUrl,
      rawText: `공식 대회접수 상품 ${pageData.products.length}개 노출`,
      confidence: "medium",
    },
    location,
    divisions: pageData.products.map((product) => ({
      name: product.name,
      group: inferNacDivisionGroup(product.name),
      rawText: product.name,
    })),
    tags: uniqueTexts(["NAC Korea", "NAC", "국제대회 선발전", "공식 접수"]),
    flags: {
      international: true,
      natural: false,
    },
    source: createSourceSnapshot({
      sourceType: "official-registration-app",
      sourceUrl: NAC_SOURCE.url,
      detailUrl: registrationUrl,
      sourceEventId: candidate?.date.startsOn
        ? `nac-korea-${candidate.date.startsOn}`
        : rawHash(pageData.products.map((product) => product.href).join("|")),
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: pageData.rawHtml,
      rawTitle: candidate?.title ?? "NAC Korea registration products",
      rawDateText: date.rawText,
      rawLocationText: location.rawText,
      rawRegistrationText: `products=${pageData.products.length}; first=${registrationUrl}`,
    }),
    confidence: "low",
    qualityIssues,
    notes:
      "NAC Korea 공식 대회접수 상품 목록을 기준으로 수집했습니다. 날짜/장소는 공식 HTML에 직접 노출되지 않아 보조 후보와 교차 보강한 preview 데이터입니다.",
  });
}

async function findFitScheduleNacCandidate(): Promise<NacCandidateEvent | undefined> {
  try {
    const result = await crawlFitSchedule();
    const event = result.events.find((candidate) =>
      /NAC코리아|NACKOREA|NAC국제|NAC Korea/i.test(
        `${candidate.title} ${candidate.tags.join(" ")} ${candidate.registration.registrationUrl ?? ""}`,
      ),
    );

    if (!event) {
      return undefined;
    }

    return {
      title: event.title,
      date: event.date,
      location: event.location,
      rawText: JSON.stringify({
        title: event.title,
        date: event.date,
        location: event.location,
        source: event.source,
      }),
    };
  } catch {
    return undefined;
  }
}

function normalizeProductName(rawName: string): string {
  return cleanText(rawName)
    .replace(/^상품명\s*:\s*/, "")
    .replace(/\[얼리버드\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferNacDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/여자|우먼|미즈|비키니|웰니스/.test(name)) {
    return "womens";
  }

  if (/남자|맨|보디빌딩|클래식 피지크|피지크/.test(name)) {
    return "mens";
  }

  return "unknown";
}

function degradeCandidateDate(date: CompetitionDateRange): CompetitionDateRange {
  return {
    startsOn: date.startsOn,
    endsOn: date.endsOn,
    timezone: date.timezone,
    rawText: date.rawText ? `${date.rawText} (보조 후보)` : "보조 후보",
    confidence: "low",
  };
}

function degradeCandidateLocation(location: CompetitionLocation): CompetitionLocation {
  return {
    country: location.country,
    region: location.region,
    city: location.city,
    venue: location.venue,
    address: location.address,
    rawText: location.rawText ? `${location.rawText} (보조 후보)` : "보조 후보",
    confidence: "low",
  };
}

function emptyDate(): CompetitionDateRange {
  return {
    timezone: "Asia/Seoul",
    rawText: "NAC Korea 공식 접수 HTML에 날짜 미노출",
    confidence: "low",
  };
}

function emptyLocation(): CompetitionLocation {
  return {
    country: "KR",
    rawText: "NAC Korea 공식 접수 HTML에 장소 미노출",
    confidence: "low",
  };
}

function dedupeProducts(products: NacRegistrationProduct[]): NacRegistrationProduct[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = `${product.name}:${product.href}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
