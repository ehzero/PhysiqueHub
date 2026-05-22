import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type {
  CompetitionConfidence,
  CompetitionDateRange,
  CompetitionLocation,
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
  rawHash,
  uniqueTexts,
} from "./utils";

const MUSCLEMANIA_SOURCE = {
  organizationId: "musclemania",
  organizationName: "Musclemania",
  organizationShortName: "Musclemania",
  url: "https://musclemania.com/musclemania-events-schedule/",
} as const;

const PARSER_NAME = "musclemania-event-schedule-preview";
const DEFAULT_SEASON_YEAR = 2026;

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const COUNTRY_BY_CITY_OR_SHOW: Array<[RegExp, string]> = [
  [/korea|seoul/i, "KR"],
  [/japan|tokyo/i, "JP"],
  [/vietnam|ho chi minh/i, "VN"],
  [/philippines|manila/i, "PH"],
  [/indonesia|yogyakarta/i, "ID"],
  [/india|delhi|bangalore|kolkata|mumbai|hyderabad/i, "IN"],
  [/mexico|mexico city|latino/i, "MX"],
  [/spain|barcelona|europe/i, "ES"],
  [/china|guangzhou|shenzhen|chengdu|yunnan|xi.?an|lhasa|shanghai|yantai|asia/i, "CN"],
  [/brazil|sao paulo/i, "BR"],
  [/colombia|bogota/i, "CO"],
  [/laos|vientiane/i, "LA"],
  [/uzbekistan|tashkent/i, "UZ"],
  [/pakistan|karachi/i, "PK"],
  [/fiji|suva/i, "FJ"],
  [/arabia|cairo/i, "EG"],
  [/mongolia|ulaanbaatar/i, "MN"],
  [/africa|togo|lome/i, "TG"],
  [/america|los angeles|palmdale|houston|new york|anaheim|orlando|florida|texas|california/i, "US"],
];

interface MusclemaniaListItem {
  title: string;
  showName: string;
  dateText: string;
  cityText: string;
  detailUrl?: string;
  sourceEventId: string;
  rawHtml: string;
  sourceUrl: string;
  tableTitle?: string;
}

export async function crawlMusclemania(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (
    selectedOrganizationIds &&
    !selectedOrganizationIds.includes(MUSCLEMANIA_SOURCE.organizationId)
  ) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(MUSCLEMANIA_SOURCE.url);
    const $ = cheerio.load(html);
    const seasonYear = extractSeasonYear($) ?? DEFAULT_SEASON_YEAR;
    const items = extractScheduleRows($);
    const events = items.map((item) => createMusclemaniaEvent(item, seasonYear, fetchedAt));
    const warnings = [
      "공식 Event Schedule 표를 기준으로 수집합니다.",
      "등록 링크가 없는 행은 일정 페이지 URL만 보존하고 reviewStatus=needs-review로 둡니다.",
    ];

    if (events.length === 0) {
      warnings.push("일정 표에서 수집 가능한 이벤트 행을 찾지 못했습니다.");
    }

    sources.push({
      organizationId: MUSCLEMANIA_SOURCE.organizationId,
      organizationName: MUSCLEMANIA_SOURCE.organizationName,
      url: MUSCLEMANIA_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: MUSCLEMANIA_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: MUSCLEMANIA_SOURCE.organizationId,
      organizationName: MUSCLEMANIA_SOURCE.organizationName,
      url: MUSCLEMANIA_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["Event Schedule fetch 또는 표 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractScheduleRows($: cheerio.CheerioAPI): MusclemaniaListItem[] {
  const items: MusclemaniaListItem[] = [];

  $("table").each((tableIndex, table) => {
    const headers = $(table)
      .find("tr")
      .first()
      .find("th,td")
      .toArray()
      .map((cell) => cleanText($(cell).text()).toLowerCase());
    const showIndex = findHeaderIndex(headers, ["show", "city"]);
    const dateIndex = findHeaderIndex(headers, ["date", "dates", "month"]);
    const cityIndex = findCityHeaderIndex(headers, showIndex, dateIndex);
    const tableTitle = findPreviousHeading($, table);

    if (dateIndex < 0 || showIndex < 0 || cityIndex < 0) {
      return;
    }

    $(table)
      .find("tr")
      .slice(1)
      .each((rowIndex, row) => {
        const cells = $(row).find("td,th").toArray();
        const showName = cleanText($(cells[showIndex]).text());
        const dateText = cleanText($(cells[dateIndex]).text());
        const cityText = cleanText($(cells[cityIndex]).text());
        const detailHref =
          $(row).find("a[href]").first().attr("href") ??
          $(cells[showIndex]).find("a[href]").first().attr("href");
        const detailUrl = absoluteUrl(detailHref, MUSCLEMANIA_SOURCE.url);

        if (!showName || !dateText || !cityText || !isDateLike(dateText)) {
          return;
        }

        const title = createTitle(showName, cityText);
        items.push({
          title,
          showName,
          dateText,
          cityText,
          detailUrl,
          sourceEventId: rawHash(`${tableIndex}:${rowIndex}:${showName}:${dateText}:${cityText}`),
          rawHtml: $(row).html() ?? "",
          sourceUrl: MUSCLEMANIA_SOURCE.url,
          tableTitle,
        });
      });
  });

  return dedupeItems(items);
}

function createMusclemaniaEvent(
  item: MusclemaniaListItem,
  seasonYear: number,
  fetchedAt: string,
): CompetitionScheduleDraft {
  const date = parseEnglishDateRange(item.dateText, seasonYear);
  const location = inferMusclemaniaLocation(item);
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "Musclemania 일정 표의 영문 날짜를 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!item.detailUrl) {
    qualityIssues.push({
      field: "registration" as const,
      severity: "info" as const,
      message: "일정 표에 별도 Show Info/등록 링크가 없어 일정 페이지 URL만 보존했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: MUSCLEMANIA_SOURCE.organizationId,
    organizationName: MUSCLEMANIA_SOURCE.organizationName,
    organizationShortName: MUSCLEMANIA_SOURCE.organizationShortName,
    title: item.title,
    seasonYear,
    date,
    registration: {
      status: "unknown",
      registrationUrl: item.detailUrl ?? MUSCLEMANIA_SOURCE.url,
      confidence: item.detailUrl ? "medium" : "low",
    },
    location,
    divisions: [],
    tags: uniqueTexts(["Musclemania", "Fitness Universe", item.tableTitle ?? "Event Schedule"]),
    flags: {
      natural: true,
    },
    source: createSourceSnapshot({
      sourceType: "official-homepage",
      sourceUrl: item.sourceUrl,
      detailUrl: item.detailUrl,
      sourceEventId: item.sourceEventId,
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: item.rawHtml,
      rawTitle: item.title,
      rawDateText: item.dateText,
      rawLocationText: item.cityText,
    }),
    confidence: date.startsOn ? "medium" : "low",
    qualityIssues,
    notes:
      "Musclemania 공식 Event Schedule 표에서 수집한 preview 데이터입니다. 지역/국가 분류는 show/city 텍스트 기반 추정입니다.",
  });
}

function parseEnglishDateRange(
  rawText: string,
  fallbackYear: number,
): CompetitionDateRange {
  const raw = cleanText(rawText).replace(/[–—]/g, "-");
  const empty: CompetitionDateRange = {
    timezone: "unknown",
    rawText: raw || undefined,
    confidence: raw ? "low" : "low",
  };
  const match = raw.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*-\s*(\d{1,2}))?$/i,
  );

  if (!match) {
    return empty;
  }

  const month = MONTHS[match[1].toLowerCase()];
  const startDay = Number(match[2]);
  const endDay = match[3] ? Number(match[3]) : undefined;

  return {
    startsOn: toDateString(fallbackYear, month, startDay),
    endsOn: endDay ? toDateString(fallbackYear, month, endDay) : undefined,
    timezone: "unknown",
    rawText: cleanText(rawText),
    confidence: "high",
  };
}

function inferMusclemaniaLocation(item: MusclemaniaListItem): Partial<CompetitionLocation> {
  const combined = `${item.showName} ${item.cityText}`;
  const country = COUNTRY_BY_CITY_OR_SHOW.find(([pattern]) => pattern.test(combined))?.[1];

  return {
    country: country ?? "UNKNOWN",
    city: cleanText(item.cityText.split(",")[0]),
    rawText: item.cityText,
    confidence: country ? "medium" : "low",
  };
}

function extractSeasonYear($: cheerio.CheerioAPI): number | undefined {
  const text = cleanText($("h1,h2,h3").text());
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function findHeaderIndex(headers: string[], names: string[]): number {
  return headers.findIndex((header) => names.includes(header));
}

function findCityHeaderIndex(headers: string[], showIndex: number, dateIndex: number): number {
  const explicitIndex = headers.findIndex(
    (header, index) => header === "city" && index !== showIndex && index !== dateIndex,
  );

  if (explicitIndex >= 0) {
    return explicitIndex;
  }

  return headers.findIndex((_, index) => index !== showIndex && index !== dateIndex);
}

function findPreviousHeading($: cheerio.CheerioAPI, table: AnyNode): string | undefined {
  let current = $(table).parent();

  while (current.length > 0) {
    const heading = current.prevAll("h1,h2,h3,h4").first();
    if (heading.length > 0) {
      return cleanText(heading.text());
    }
    current = current.parent();
  }

  return undefined;
}

function createTitle(showName: string, cityText: string): string {
  if (/musclemania|fitness universe/i.test(showName)) {
    return showName;
  }

  return `Musclemania ${showName}${cityText ? ` - ${cityText}` : ""}`;
}

function isDateLike(value: string): boolean {
  return /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i.test(
    value,
  );
}

function dedupeItems(items: MusclemaniaListItem[]): MusclemaniaListItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.showName}:${item.dateText}:${item.cityText}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
