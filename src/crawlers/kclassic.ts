import * as cheerio from "cheerio";
import type {
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionLocation,
  CompetitionRegistrationWindow,
  CompetitionScheduleDraft,
} from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
import { waitBeforeNextDetailRequest } from "./delay";
import type { CrawlerResult } from "./types";
import {
  absoluteUrl,
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  fetchHtml,
  parseKoreanDateRange,
  rawHash,
  uniqueTexts,
} from "./utils";

const KCLASSIC_SOURCE = {
  organizationId: "k-classic",
  organizationName: "K-Classic",
  organizationShortName: "K-Classic",
  url: "https://kismos.co.kr/product/list.html?cate_no=822",
} as const;

const PARSER_NAME = "kclassic-kismos-preview";
const DEFAULT_SEASON_YEAR = 2026;

interface KclassicListItem {
  title: string;
  detailUrl: string;
  sourceEventId: string;
  rawHtml: string;
}

interface KclassicDetail {
  title: string;
  detailUrl: string;
  sourceEventId: string;
  rawHtml: string;
  divisions: CompetitionDivision[];
  optionText?: string;
  posterImageUrl?: string;
}

export async function crawlKclassic(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (
    selectedOrganizationIds &&
    !selectedOrganizationIds.includes(KCLASSIC_SOURCE.organizationId)
  ) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(KCLASSIC_SOURCE.url);
    const $ = cheerio.load(html);
    const listItems = extractKclassicListItems($);
    const details = await fetchDetails(listItems, errors);
    const events = details.map((detail) => createKclassicEvent(detail, fetchedAt));
    const warnings = [
      "K-Classic 공식 홈페이지의 참가 페이지는 일반 fetch에서 Wix 404를 반환해, 공식 신청 앱 KISMOS의 2026 KCL 상품 목록을 기준으로 수집합니다.",
      "상세 HTML에 대회 일자/장소 텍스트가 충분히 노출되지 않아 날짜는 공식 참가 페이지에서 확인한 지역별 일자를 low confidence로 보강하고 reviewStatus=needs-review로 둡니다.",
      "상품 상세 옵션의 종목 select를 수집하지만, 결제/회원/주문 영역은 접근하지 않습니다.",
    ];

    if (events.length === 0) {
      warnings.push("2026 KCL 카테고리에서 수집 가능한 대회 상품을 찾지 못했습니다.");
    }

    sources.push({
      organizationId: KCLASSIC_SOURCE.organizationId,
      organizationName: KCLASSIC_SOURCE.organizationName,
      url: KCLASSIC_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: KCLASSIC_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: KCLASSIC_SOURCE.organizationId,
      organizationName: KCLASSIC_SOURCE.organizationName,
      url: KCLASSIC_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["KISMOS 2026 KCL 목록 fetch 또는 상품 목록 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractKclassicListItems($: cheerio.CheerioAPI): KclassicListItem[] {
  const items: KclassicListItem[] = [];

  $("a[href*='product/detail.html']").each((_, anchor) => {
    const rawText = cleanText($(anchor).text());
    const title = normalizeProductTitle(rawText);
    const detailUrl = absoluteUrl($(anchor).attr("href"), KCLASSIC_SOURCE.url);

    if (!title || !detailUrl || !/^2026\s*케이클래식/.test(title)) {
      return;
    }

    items.push({
      title,
      detailUrl,
      sourceEventId: sourceEventIdFromProductUrl(detailUrl) ?? rawHash(`${title}:${detailUrl}`),
      rawHtml: $.html(anchor),
    });
  });

  return dedupeItems(items);
}

async function fetchDetails(
  listItems: KclassicListItem[],
  errors: CrawlerResult["errors"],
): Promise<KclassicDetail[]> {
  const details: KclassicDetail[] = [];

  for (let index = 0; index < listItems.length; index += 1) {
    if (index > 0) {
      await waitBeforeNextDetailRequest();
    }

    const item = listItems[index];

    try {
      const { html } = await fetchHtml(item.detailUrl);
      const $ = cheerio.load(html);
      const title =
        cleanText($("meta[property='og:title']").attr("content")) ||
        cleanText($("h2, .headingArea h2, .name").first().text()) ||
        item.title;
      const optionText = extractPrimaryOptionText($);

      details.push({
        title: normalizeProductTitle(title) || item.title,
        detailUrl: item.detailUrl,
        sourceEventId: item.sourceEventId,
        rawHtml: html,
        divisions: extractKclassicDivisions($),
        optionText,
        posterImageUrl: extractPosterImageUrl($, item.detailUrl),
      });
    } catch (error) {
      errors.push({ url: item.detailUrl, message: getErrorMessage(error) });
      details.push({
        title: item.title,
        detailUrl: item.detailUrl,
        sourceEventId: item.sourceEventId,
        rawHtml: item.rawHtml,
        divisions: [],
      });
    }
  }

  return details;
}

function createKclassicEvent(
  detail: KclassicDetail,
  fetchedAt: string,
): CompetitionScheduleDraft {
  const date = inferDate(detail.title);
  const registration = inferRegistration(detail);
  const location = inferKclassicLocation(detail.title);
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message:
        "KISMOS 상품 상세의 공개 텍스트에서 대회일을 안정적으로 확인하지 못했습니다. K-Classic 공식 참가 페이지 또는 포스터 검수가 필요합니다.",
    });
  } else if (date.confidence === "low") {
    qualityIssues.push({
      field: "date" as const,
      severity: "info" as const,
      message:
        "대회일은 K-Classic 공식 참가 페이지의 렌더링 텍스트를 기준으로 보강했지만, KISMOS 상세 HTML에는 직접 노출되지 않아 검수가 필요합니다.",
    });
  }

  if (!location.region) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "상품명에서 개최 지역을 확인하지 못했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: KCLASSIC_SOURCE.organizationId,
    organizationName: KCLASSIC_SOURCE.organizationName,
    organizationShortName: KCLASSIC_SOURCE.organizationShortName,
    title: detail.title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : DEFAULT_SEASON_YEAR,
    date,
    registration,
    location,
    divisions: detail.divisions,
    tags: uniqueTexts([
      "K-Classic",
      "KISMOS",
      detail.title.includes("내추럴") ? "내추럴" : "오픈",
    ]),
    flags: {
      natural: detail.title.includes("내추럴"),
      beginnerFriendly: detail.optionText ? /노비스/.test(detail.optionText) : undefined,
    },
    media: {
      posterImageUrl: detail.posterImageUrl,
      imageSourceUrl: detail.detailUrl,
    },
    source: createSourceSnapshot({
      sourceType: "official-registration-app",
      sourceUrl: KCLASSIC_SOURCE.url,
      detailUrl: detail.detailUrl,
      sourceEventId: detail.sourceEventId,
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: detail.rawHtml,
      rawTitle: detail.title,
      rawDateText: date.rawText,
      rawLocationText: location.rawText,
      rawRegistrationText: registration.rawText,
    }),
    confidence: "low",
    qualityIssues,
    notes:
      "K-Classic 공식 신청 앱 KISMOS의 2026 KCL 카테고리와 상품 상세 옵션에서 수집한 preview 데이터입니다.",
  });
}

function normalizeProductTitle(value: string): string {
  return cleanText(value)
    .replace(/^상품명\s*:\s*/, "")
    .replace(/\s*-\s*KISMOS$/i, "")
    .replace(/\s*\(해외배송 가능상품\).*$/, "")
    .trim();
}

function extractKclassicDivisions($: cheerio.CheerioAPI): CompetitionDivision[] {
  const primarySelect = $("select")
    .toArray()
    .find((select) => /종목/.test(cleanText($(select).attr("option_title") ?? "")));

  if (!primarySelect) {
    return [];
  }

  return $(primarySelect)
    .find("option")
    .toArray()
    .map((option) => cleanText($(option).text()).replace(/\s*\(\+\d[\d,]*원\)\s*$/, ""))
    .filter((name) => isDivisionOption(name))
    .map((name) => ({
      name,
      group: inferDivisionGroup(name),
      rawText: cleanText($(primarySelect).text()),
    }));
}

function extractPrimaryOptionText($: cheerio.CheerioAPI): string | undefined {
  const primarySelect = $("select")
    .toArray()
    .find((select) => /종목/.test(cleanText($(select).attr("option_title") ?? "")));

  return primarySelect ? cleanText($(primarySelect).text()) : undefined;
}

function extractPosterImageUrl(
  $: cheerio.CheerioAPI,
  detailUrl: string,
): string | undefined {
  const src =
    $("meta[property='og:image']").attr("content") ||
    $("img[alt*='2026 케이클래식']").first().attr("src") ||
    $("img[ec-data-src*='/web/product/big/']").first().attr("ec-data-src");

  return absoluteUrl(src, detailUrl);
}

function inferDate(title: string): CompetitionDateRange {
  const knownDates: Array<[RegExp, string]> = [
    [/대구/, "2026년 4월 11일"],
    [/서울/, "2026년 5월 30일"],
  ];
  const match = knownDates.find(([pattern]) => pattern.test(title));

  if (!match) {
    return {
      timezone: "Asia/Seoul",
      rawText: title,
      confidence: "low",
    };
  }

  return parseKoreanDateRange(match[1], DEFAULT_SEASON_YEAR, "low");
}

function inferRegistration(detail: KclassicDetail): Partial<CompetitionRegistrationWindow> {
  return {
    status: "unknown",
    registrationUrl: detail.detailUrl,
    rawText: detail.optionText,
    confidence: "medium",
  };
}

function inferKclassicLocation(title: string): Partial<CompetitionLocation> {
  if (/대구/.test(title)) {
    return {
      country: "KR",
      region: "대구",
      city: "대구",
      rawText: "대구",
      confidence: "medium",
    };
  }

  if (/서울/.test(title)) {
    return {
      country: "KR",
      region: "서울",
      city: "서울",
      rawText: "서울",
      confidence: "medium",
    };
  }

  return {
    country: "KR",
    rawText: title,
    confidence: "low",
  };
}

function isDivisionOption(value: string): boolean {
  if (!value || value.includes("옵션을 선택") || /^-+$/.test(value)) {
    return false;
  }

  return !/추가 신청자|추가종목|선택/.test(value);
}

function inferDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/(여|비키니|모노키니)/.test(name)) {
    return "womens";
  }

  if (/(남|바디빌딩|피지크|스포츠모델)/.test(name)) {
    return "mens";
  }

  return "unknown";
}

function sourceEventIdFromProductUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const productNo = parsed.searchParams.get("product_no");
    return productNo ? `product-${productNo}` : undefined;
  } catch {
    return undefined;
  }
}

function dedupeItems(items: KclassicListItem[]): KclassicListItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.sourceEventId;
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
