import * as cheerio from "cheerio";
import type {
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionLocation,
  CompetitionMoney,
  CompetitionQualityIssue,
  CompetitionScheduleDraft,
} from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
import { waitBeforeNextDetailRequest } from "./delay";
import { crawlFitSchedule } from "./fitschedule";
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

const AGONAS_SOURCE = {
  organizationId: "agonas",
  organizationName: "아고나스",
  organizationShortName: "AGONAS",
  url: "https://jambaekee.com/category/agonas-%EB%8C%80%ED%9A%8C/75/",
} as const;

const PARSER_NAME = "jambaekee-agonas-registration-preview";
const DEFAULT_SEASON_YEAR = 2026;

interface AgonasListItem {
  title: string;
  detailUrl: string;
  sourceEventId: string;
  fee?: CompetitionMoney;
  thumbnailUrl?: string;
  rawHtml: string;
}

interface AgonasDetailData {
  title: string;
  fee?: CompetitionMoney;
  divisions: CompetitionDivision[];
  posterImageUrl?: string;
  rawHtml: string;
  fetchedAt: string;
}

interface AgonasSupplementalCandidate {
  title: string;
  date: CompetitionDateRange;
  location: CompetitionLocation;
}

export async function crawlAgonas(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (selectedOrganizationIds && !selectedOrganizationIds.includes(AGONAS_SOURCE.organizationId)) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const events: CompetitionScheduleDraft[] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const [{ html, fetchedAt }, supplementalCandidates] = await Promise.all([
      fetchHtml(AGONAS_SOURCE.url),
      findSupplementalAgonasCandidates(),
    ]);
    const $ = cheerio.load(html);
    const listItems = extractListItems($);
    const warnings = [
      "잠백이 AGONAS 대회 공식 상품 카테고리의 공개 접수 상품을 수집합니다.",
      "공식 상품 HTML에는 대회일/장소가 직접 노출되지 않아 보조 후보값과 제목 매칭으로 낮은 신뢰도로 보강합니다.",
      "상세 상품의 종목 옵션과 판매가를 함께 수집합니다.",
    ];

    if (listItems.length === 0) {
      warnings.push("AGONAS 대회 카테고리에서 수집 가능한 상품을 찾지 못했습니다.");
    }

    sources.push({
      organizationId: AGONAS_SOURCE.organizationId,
      organizationName: AGONAS_SOURCE.organizationName,
      url: AGONAS_SOURCE.url,
      ok: true,
      count: listItems.length,
      warnings,
      fetchedAt,
    });

    for (let index = 0; index < listItems.length; index += 1) {
      const item = listItems[index];

      if (index > 0) {
        await waitBeforeNextDetailRequest();
      }

      const detail = await fetchAgonasDetail(item).catch((error: unknown) => {
        errors.push({ url: item.detailUrl, message: getErrorMessage(error) });
        return undefined;
      });
      const supplemental = findBestSupplementalCandidate(
        detail?.title ?? item.title,
        supplementalCandidates,
      );

      events.push(createAgonasEvent(item, detail, supplemental));
    }

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: AGONAS_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: AGONAS_SOURCE.organizationId,
      organizationName: AGONAS_SOURCE.organizationName,
      url: AGONAS_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["AGONAS 공식 상품 카테고리 fetch 또는 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractListItems($: cheerio.CheerioAPI): AgonasListItem[] {
  const items = $("li[id^='anchorBoxId_']")
    .toArray()
    .map((element) => {
      const link = $(element).find("a[href*='/product/']").first();
      const detailUrl = absoluteUrl(link.attr("href"), AGONAS_SOURCE.url);
      const rawName =
        cleanText($(element).find(".name").text()) ||
        cleanText(link.find("img[alt]").attr("alt")) ||
        cleanText(link.text());
      const title = normalizeProductTitle(rawName);
      const thumbnailUrl = absoluteUrl($(element).find("img").first().attr("src"), AGONAS_SOURCE.url);
      const fee = parseKrwMoney($(element).find(".spec").text() || $(element).text());
      const sourceEventId = getProductIdFromUrl(detailUrl) ?? rawHash(`${title}:${detailUrl}`);

      if (!detailUrl || !title || !/아고나스|agonas/i.test(title)) {
        return undefined;
      }

      return {
        title,
        detailUrl,
        sourceEventId,
        fee,
        thumbnailUrl,
        rawHtml: $.html(element),
      };
    })
    .filter(Boolean) as AgonasListItem[];

  return dedupeListItems(items);
}

async function fetchAgonasDetail(item: AgonasListItem): Promise<AgonasDetailData> {
  const { html, fetchedAt } = await fetchHtml(item.detailUrl);
  const $ = cheerio.load(html);
  const title =
    normalizeProductTitle(cleanText($("meta[property='og:title']").attr("content"))) ||
    normalizeProductTitle(cleanText($("title").text())) ||
    item.title;
  const posterImageUrl = absoluteUrl(
    $("meta[property='og:image']").attr("content") || $("img.BigImage").first().attr("src"),
    item.detailUrl,
  );

  return {
    title,
    fee: parseKrwMoney($(".infoArea").text()) ?? item.fee,
    divisions: extractAgonasDivisions($),
    posterImageUrl,
    rawHtml: $(".infoArea").html() ?? $("body").html() ?? html,
    fetchedAt,
  };
}

function createAgonasEvent(
  item: AgonasListItem,
  detail: AgonasDetailData | undefined,
  supplemental: AgonasSupplementalCandidate | undefined,
): CompetitionScheduleDraft {
  const title = detail?.title || item.title;
  const date = supplemental
    ? degradeSupplementalDate(supplemental.date)
    : emptyDate(title);
  const location = supplemental
    ? degradeSupplementalLocation(supplemental.location)
    : emptyLocation();
  const fee = detail?.fee ?? item.fee;
  const qualityIssues: CompetitionQualityIssue[] = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date",
      severity: "warning",
      message: "공식 상품 HTML에 대회일이 직접 노출되지 않아 날짜를 비워둡니다.",
    });
  } else {
    qualityIssues.push({
      field: "date",
      severity: "info",
      message: "공식 상품 HTML에 대회일이 직접 노출되지 않아 보조 후보값으로 보강했습니다.",
    });
  }

  if (!location.rawText) {
    qualityIssues.push({
      field: "location",
      severity: "warning",
      message: "공식 상품 HTML에 장소가 직접 노출되지 않아 장소를 비워둡니다.",
    });
  } else {
    qualityIssues.push({
      field: "location",
      severity: "info",
      message: "공식 상품 HTML에 장소가 직접 노출되지 않아 보조 후보값으로 보강했습니다.",
    });
  }

  if (!detail) {
    qualityIssues.push({
      field: "source",
      severity: "warning",
      message: "상세 상품 fetch/parsing 실패로 목록 정보만 사용했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: AGONAS_SOURCE.organizationId,
    organizationName: AGONAS_SOURCE.organizationName,
    organizationShortName: AGONAS_SOURCE.organizationShortName,
    title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : getYearFromTitle(title),
    date,
    registration: {
      status: "unknown",
      fee,
      registrationUrl: item.detailUrl,
      rawText: fee?.rawText,
      confidence: fee ? "medium" : "low",
    },
    location,
    divisions: detail?.divisions ?? [],
    tags: uniqueTexts(["아고나스", "AGONAS", "잠백이", "공식 접수"]),
    flags: {
      natural: false,
      rookieClass: /노비스|비기너/i.test(
        (detail?.divisions ?? []).map((division) => division.name).join(" "),
      ),
    },
    media: {
      posterImageUrl: detail?.posterImageUrl ?? item.thumbnailUrl,
      thumbnailUrl: item.thumbnailUrl,
      imageSourceUrl: item.detailUrl,
    },
    source: createSourceSnapshot({
      sourceType: "official-registration-app",
      sourceUrl: AGONAS_SOURCE.url,
      detailUrl: item.detailUrl,
      sourceEventId: item.sourceEventId,
      fetchedAt: detail?.fetchedAt ?? new Date().toISOString(),
      parserName: PARSER_NAME,
      rawHtml: detail?.rawHtml ?? item.rawHtml,
      rawTitle: title,
      rawDateText: date.rawText,
      rawLocationText: location.rawText,
      rawRegistrationText: fee?.rawText,
    }),
    confidence: detail && date.startsOn && location.rawText ? "medium" : "low",
    qualityIssues,
    notes:
      "잠백이 AGONAS 대회 공식 상품 카테고리와 상세 상품에서 수집한 preview 데이터입니다. 날짜/장소는 공식 상품 HTML에 직접 노출되지 않아 보조 후보값으로 낮은 신뢰도로 보강했습니다.",
  });
}

async function findSupplementalAgonasCandidates(): Promise<AgonasSupplementalCandidate[]> {
  try {
    const result = await crawlFitSchedule();

    return result.events
      .filter((event) => /아고나스|agonas/i.test(`${event.title} ${event.tags.join(" ")}`))
      .map((event) => ({
        title: event.title,
        date: event.date,
        location: event.location,
      }));
  } catch {
    return [];
  }
}

function findBestSupplementalCandidate(
  title: string,
  candidates: AgonasSupplementalCandidate[],
): AgonasSupplementalCandidate | undefined {
  const normalizedTitle = normalizeForMatch(title);

  return candidates.find((candidate) => {
    const normalizedCandidate = normalizeForMatch(candidate.title);
    return normalizedTitle.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedTitle);
  });
}

function extractAgonasDivisions($: cheerio.CheerioAPI): CompetitionDivision[] {
  const select = $("select")
    .toArray()
    .find((element) => /종목/.test(cleanText($(element).attr("option_title") ?? $(element).attr("name"))));

  if (!select) {
    return [];
  }

  const names = $(select)
    .find("option")
    .toArray()
    .map((option) => cleanText($(option).text()))
    .filter((name) => name && !/필수|선택|---/.test(name));

  return uniqueTexts(names).map((name) => ({
    name,
    group: inferDivisionGroup(name),
    rawText: names.join(", "),
  }));
}

function degradeSupplementalDate(date: CompetitionDateRange): CompetitionDateRange {
  return {
    startsOn: date.startsOn,
    endsOn: date.endsOn,
    timezone: date.timezone,
    rawText: date.rawText ? `${date.rawText} (보조 후보)` : "보조 후보",
    confidence: "low",
  };
}

function degradeSupplementalLocation(location: CompetitionLocation): CompetitionLocation {
  const rawText = cleanText(location.rawText);
  const inferred = rawText ? inferLocation([rawText]) : {};

  return {
    country: location.country,
    region: location.region ?? inferred.region,
    city: location.city,
    venue: location.venue ?? inferred.venue,
    address: location.address,
    rawText: rawText ? `${rawText} (보조 후보)` : undefined,
    confidence: "low",
  };
}

function emptyDate(title: string): CompetitionDateRange {
  return {
    timezone: "Asia/Seoul",
    rawText: `${title} 공식 상품 HTML에 날짜 미노출`,
    confidence: "low",
  };
}

function emptyLocation(): CompetitionLocation {
  return {
    country: "KR",
    rawText: "공식 상품 HTML에 장소 미노출",
    confidence: "low",
  };
}

function normalizeProductTitle(value: string): string {
  return cleanText(value)
    .replace(/^상품명\s*:\s*/, "")
    .replace(/\s*-\s*잠백이\s*$/, "")
    .replace(/\s*\|\s*잠백이\s*$/, "");
}

function parseKrwMoney(rawText: string | undefined): CompetitionMoney | undefined {
  const raw = cleanText(rawText);
  const match = raw.match(/판매가\s*:?\s*([\d,]+)\s*원/) ?? raw.match(/([\d,]+)\s*원/);
  const amount = Number(match?.[1]?.replace(/[^\d]/g, ""));

  if (!raw || !Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return {
    currency: "KRW",
    minAmount: amount,
    maxAmount: amount,
    rawText: `${amount.toLocaleString("ko-KR")}원`,
  };
}

function getProductIdFromUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    return parsed.pathname.match(/\/product\/[^/]+\/(\d+)\//)?.[1];
  } catch {
    return undefined;
  }
}

function getYearFromTitle(title: string): number {
  return Number(cleanText(title).match(/20\d{2}/)?.[0]) || DEFAULT_SEASON_YEAR;
}

function normalizeForMatch(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/^20\d{2}\s*/, "")
    .replace(/[^\da-z가-힣]+/g, "");
}

function inferDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/비키니|여자|여성|우먼/i.test(name)) {
    return "womens";
  }

  if (/맨즈|남자|남성|피지크|보디빌딩|클래식/i.test(name)) {
    return "mens";
  }

  return "unknown";
}

function dedupeListItems(items: AgonasListItem[]): AgonasListItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.detailUrl)) {
      return false;
    }

    seen.add(item.detailUrl);
    return true;
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
