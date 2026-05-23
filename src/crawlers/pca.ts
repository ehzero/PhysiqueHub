import * as cheerio from "cheerio";
import type {
  CompetitionDivision,
  CompetitionOrganizationId,
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
  inferLocation,
  parseKoreanDateRange,
  rawHash,
  sourceEventIdFromUrl,
  uniqueTexts,
} from "./utils";

const COACHN_SOURCES = [
  {
    organizationId: "pca-korea",
    organizationName: "PCA Korea",
    organizationShortName: "PCA",
    url: "https://coachn.co.kr/sub/competitions_list.php?sca=PCA%EC%A0%91%EC%88%98",
    category: "PCA접수",
    tags: ["PCA", "PCA Korea"],
    natural: false,
  },
  {
    organizationId: "npca-korea",
    organizationName: "NPCA Korea",
    organizationShortName: "NPCA",
    url: "https://coachn.co.kr/sub/competitions_list.php?sca=NPCA%EC%A0%91%EC%88%98",
    category: "NPCA접수",
    tags: ["NPCA", "NPCA Korea", "내추럴"],
    natural: true,
  },
] as const;

const PARSER_NAME = "coachn-pca-npca-preview";

type CoachnOrganizationId = Extract<CompetitionOrganizationId, "pca-korea" | "npca-korea">;

interface CoachnListItem {
  title: string;
  detailUrl: string;
  listUrl: string;
  organizationId: CoachnOrganizationId;
  organizationName: string;
  organizationShortName: "PCA" | "NPCA";
  sourceEventId?: string;
  rawHtml: string;
  tags: string[];
  natural: boolean;
  deadlineUnixSeconds?: number;
}

interface CoachnDetailData {
  title: string;
  dateText?: string;
  locationText?: string;
  divisions: CompetitionDivision[];
  rawHtml: string;
  fetchedAt: string;
}

export async function crawlPcaNpca(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  const targetIds = new Set(selectedOrganizationIds ?? ["pca-korea", "npca-korea"]);
  const sources: CrawlerResult["sources"] = [];
  const events: CompetitionScheduleDraft[] = [];
  const errors: CrawlerResult["errors"] = [];
  const listItems: CoachnListItem[] = [];

  for (const source of COACHN_SOURCES) {
    if (!targetIds.has(source.organizationId)) {
      continue;
    }

    const warnings = [
      "CoachN 대회신청 공개 목록을 PCA/NPCA 공식 접수 앱 원천으로 사용합니다.",
      "2026-05-22 확인 기준 robots.txt는 404로 확인되어 공개 목록/상세만 저빈도로 수집합니다.",
    ];

    try {
      const { html, fetchedAt } = await fetchHtml(source.url);
      const $ = cheerio.load(html);
      const pageItems = extractListItems($, source);

      if (pageItems.length === 0) {
        warnings.push(`${source.category} 목록에서 수집 가능한 대회 접수 항목을 찾지 못했습니다.`);
      }

      listItems.push(...pageItems);
      sources.push({
        organizationId: source.organizationId,
        organizationName: source.organizationName,
        url: source.url,
        ok: true,
        count: pageItems.length,
        warnings,
        fetchedAt,
      });
    } catch (error) {
      errors.push({ url: source.url, message: getErrorMessage(error) });
      sources.push({
        organizationId: source.organizationId,
        organizationName: source.organizationName,
        url: source.url,
        ok: false,
        count: 0,
        warnings: ["목록 fetch 또는 파싱에 실패했습니다."],
      });
    }
  }

  const uniqueItems = dedupeListItems(listItems);
  for (let index = 0; index < uniqueItems.length; index += 1) {
    const item = uniqueItems[index];

    if (index > 0) {
      await waitBeforeNextDetailRequest();
    }

    const detail = await fetchCoachnDetail(item).catch((error: unknown) => {
      errors.push({ url: item.detailUrl, message: getErrorMessage(error) });
      return undefined;
    });

    events.push(createCoachnEvent(item, detail));
  }

  return { sources, events, errors };
}

function extractListItems(
  $: cheerio.CheerioAPI,
  source: (typeof COACHN_SOURCES)[number],
): CoachnListItem[] {
  return $("a[href*='competitions_info.php?id=']")
    .toArray()
    .map((link) => {
      const detailUrl = absoluteUrl($(link).attr("href"), source.url);
      const card = $(link).closest(".box");
      const title =
        cleanText(card.find(".txt .top p").last().text()) ||
        cleanText(card.find("img").attr("alt")) ||
        cleanText($(link).text());
      const deadlineUnixSeconds = Number(card.find(".countdown").attr("data-deadline"));

      if (!detailUrl || !title || !isCompetitionTitle(title, source.organizationShortName)) {
        return undefined;
      }

      return {
        title,
        detailUrl,
        listUrl: source.url,
        organizationId: source.organizationId,
        organizationName: source.organizationName,
        organizationShortName: source.organizationShortName,
        sourceEventId: sourceEventIdFromUrl(detailUrl) ?? rawHash(detailUrl),
        rawHtml: card.html() ?? "",
        tags: [...source.tags],
        natural: source.natural,
        deadlineUnixSeconds: Number.isFinite(deadlineUnixSeconds) ? deadlineUnixSeconds : undefined,
      };
    })
    .filter(Boolean) as CoachnListItem[];
}

async function fetchCoachnDetail(item: CoachnListItem): Promise<CoachnDetailData> {
  const { html, fetchedAt } = await fetchHtml(item.detailUrl);
  const $ = cheerio.load(html);
  const marketText = cleanText($(".market_txt").text());
  const bodyText = cleanText($("body").text());
  const detailText = marketText || bodyText;
  const title =
    findSectionText(detailText, ["대회명", "대 회 명"], ["일시", "일 시", "장소", "장 소"]) ||
    cleanText($(".txt_box strong").first().text()) ||
    cleanText($("meta[property='og:title']").attr("content")) ||
    item.title;

  return {
    title: normalizeTitle(title, item.title),
    dateText:
      findSectionText(detailText, ["일시", "일 시"], ["장소", "장 소", "주최∙주관", "주최", "주관"]) ??
      extractDateFromTitle(item.title),
    locationText: findSectionText(detailText, ["장소", "장 소"], ["주최∙주관", "주최", "주관", "종목"]),
    divisions: extractSelectDivisions($),
    rawHtml: $("body").html() ?? html,
    fetchedAt,
  };
}

function createCoachnEvent(
  item: CoachnListItem,
  detail: CoachnDetailData | undefined,
): CompetitionScheduleDraft {
  const title = detail?.title || item.title;
  const year = extractYear(title) ?? extractYear(detail?.dateText) ?? 2026;
  const dateConfidence = detail?.dateText ? "high" : "low";
  const date = parseKoreanDateRange(detail?.dateText ?? extractDateFromTitle(item.title), year, dateConfidence);
  const closesAt = toKoreaIsoFromUnixSeconds(item.deadlineUnixSeconds);
  const location = detail?.locationText
    ? {
        ...inferLocation([detail.locationText]),
        rawText: detail.locationText,
      }
    : { country: "KR", confidence: "low" as const };
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "CoachN 상세 또는 목록 제목에서 대회일을 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!detail?.locationText) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "CoachN 상세에서 장소를 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!detail) {
    qualityIssues.push({
      field: "source" as const,
      severity: "warning" as const,
      message: "상세 페이지 fetch/parsing 실패로 목록 정보만 사용했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: item.organizationId,
    organizationName: item.organizationName,
    organizationShortName: item.organizationShortName,
    title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : year,
    date,
    registration: {
      status: closesAt && Date.parse(closesAt) > Date.now() ? "open" : "unknown",
      closesAt,
      registrationUrl: item.detailUrl,
      rawText: closesAt ? `대회접수마감: ${closesAt}` : undefined,
      confidence: closesAt ? "medium" : "low",
    },
    location,
    divisions: detail?.divisions ?? [],
    tags: uniqueTexts(item.tags),
    flags: {
      natural: item.natural,
    },
    source: createSourceSnapshot({
      sourceType: "official-registration-app",
      sourceUrl: item.listUrl,
      detailUrl: item.detailUrl,
      sourceEventId: item.sourceEventId,
      fetchedAt: detail?.fetchedAt ?? new Date().toISOString(),
      parserName: PARSER_NAME,
      rawHtml: detail?.rawHtml ?? item.rawHtml,
      rawTitle: title,
      rawDateText: detail?.dateText,
      rawLocationText: detail?.locationText,
      rawRegistrationText: closesAt ? `data-deadline=${item.deadlineUnixSeconds}` : undefined,
    }),
    qualityIssues,
    notes:
      "CoachN 대회신청 앱의 PCA/NPCA 접수 목록과 상세 페이지에서 수집한 preview 데이터입니다.",
  });
}

function findSectionText(
  text: string,
  labels: string[],
  stopLabels: string[],
): string | undefined {
  const labelPattern = labels.map(toLooseKoreanLabelPattern).join("|");
  const stopPattern = stopLabels.map(toLooseKoreanLabelPattern).join("|");
  const pattern = new RegExp(
    `(?:^|\\s)(?:[가-힣]\\.)?\\s*(?:${labelPattern})\\s*[:：]?\\s*(.*?)(?=\\s*(?:[가-힣]\\.)?\\s*(?:${stopPattern})(?:\\s*[:：]|\\s|$)|$)`,
  );
  const match = text.match(pattern);
  return match?.[1] ? cleanSectionValue(match[1], stopLabels) : undefined;
}

function cleanSectionValue(value: string, stopLabels: string[]): string | undefined {
  let cleaned = cleanText(value);

  for (const stopLabel of stopLabels) {
    const stopPattern = toLooseKoreanLabelPattern(stopLabel);
    cleaned = cleaned.replace(new RegExp(`\\s*[가-힣]?\\.?\\s*(?:${stopPattern}).*$`), "");
  }

  cleaned = cleanText(cleaned.replace(/\s*[가-힣]\.\s*$/, ""));
  return cleaned || undefined;
}

function toLooseKoreanLabelPattern(label: string): string {
  return cleanText(label)
    .replace(/\s+/g, "")
    .split("")
    .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*");
}

function extractSelectDivisions($: cheerio.CheerioAPI): CompetitionDivision[] {
  const names = $(".class_select option")
    .toArray()
    .map((option) => cleanText($(option).text()))
    .filter((name) => name && !/선택해주세요/.test(name));

  return uniqueTexts(names).map((name) => ({
    name,
    group: inferDivisionGroup(name),
    rawText: name,
  }));
}

function inferDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/(비키니|웰니스|여자|우먼|women)/i.test(name)) {
    return "womens";
  }

  if (/(남자|맨즈|men|보디빌딩|피지크|머슬모델)/i.test(name)) {
    return "mens";
  }

  return "unknown";
}

function extractDateFromTitle(title: string): string | undefined {
  const year = extractYear(title);
  const date = title.match(/\((\d{1,2}월\s*\d{1,2}일)\)/);

  if (!date?.[1]) {
    return undefined;
  }

  return year ? `${year}년 ${date[1]}` : date[1];
}

function extractYear(text: string | undefined): number | undefined {
  const match = cleanText(text).match(/20\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function normalizeTitle(title: string, fallbackTitle: string): string {
  const normalized = cleanText(title)
    .replace(/\s*\|\s*CoachN.*$/i, "")
    .replace(/\s*\|\s*코치엔.*$/, "");

  return normalized || fallbackTitle;
}

function isCompetitionTitle(title: string, shortName: "PCA" | "NPCA"): boolean {
  return new RegExp(`\\b${shortName}\\b|대회|리그|series|league`, "i").test(title);
}

function dedupeListItems(items: CoachnListItem[]): CoachnListItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.detailUrl)) {
      return false;
    }
    seen.add(item.detailUrl);
    return true;
  });
}

function toKoreaIsoFromUnixSeconds(value: number | undefined): string | undefined {
  if (!value || !Number.isFinite(value)) {
    return undefined;
  }

  const date = new Date(value * 1000 + 9 * 60 * 60 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
