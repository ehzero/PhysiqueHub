import * as cheerio from "cheerio";
import type {
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionLocation,
  CompetitionScheduleDraft,
} from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
import type { CrawlerResult } from "./types";
import {
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  fetchHtml,
  slugify,
  uniqueTexts,
} from "./utils";

const IFBB_PRO_LEAGUE_SOURCE = {
  organizationId: "ifbb-pro-league",
  organizationName: "IFBB Pro",
  organizationShortName: "IFBB Pro",
  url: "https://www.ifbbpro.com/schedule/",
} as const;

const PARSER_NAME = "ifbb-pro-league-global-schedule-preview";
const DEFAULT_SEASON_YEAR = 2026;

interface ProScheduleRow {
  title: string;
  classText?: string;
  divisionName: string;
  divisionGroup: CompetitionDivision["group"];
  dateText: string;
  locationText: string;
  promoterText?: string;
  rawHtml: string;
}

interface ProScheduleEvent {
  title: string;
  dateText: string;
  locationText: string;
  promoterText?: string;
  rawHtml: string;
  divisions: CompetitionDivision[];
}

export async function crawlIfbbProLeague(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (
    selectedOrganizationIds &&
    !selectedOrganizationIds.includes(IFBB_PRO_LEAGUE_SOURCE.organizationId)
  ) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(IFBB_PRO_LEAGUE_SOURCE.url);
    const $ = cheerio.load(html);
    const rows = extractScheduleRows($);
    const groupedEvents = groupScheduleRows(rows);
    const events = groupedEvents.map((event) => createProScheduleEvent(event, fetchedAt));
    const warnings = [
      "IFBB Pro 공식 Pro Schedule 표에서 수집한 글로벌 프로 대회입니다.",
      "디비전별로 반복되는 동일 대회는 제목/날짜/장소 기준으로 묶고 divisions에 보존합니다.",
    ];

    if (events.length === 0) {
      warnings.push("공식 Pro Schedule 표에서 수집 가능한 대회를 찾지 못했습니다.");
    }

    sources.push({
      organizationId: IFBB_PRO_LEAGUE_SOURCE.organizationId,
      organizationName: IFBB_PRO_LEAGUE_SOURCE.organizationName,
      url: IFBB_PRO_LEAGUE_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: IFBB_PRO_LEAGUE_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: IFBB_PRO_LEAGUE_SOURCE.organizationId,
      organizationName: IFBB_PRO_LEAGUE_SOURCE.organizationName,
      url: IFBB_PRO_LEAGUE_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["IFBB Pro 공식 Pro Schedule fetch 또는 표 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractScheduleRows($: cheerio.CheerioAPI): ProScheduleRow[] {
  const rows: ProScheduleRow[] = [];

  $("table").each((_, table) => {
    const divisionHeader = cleanText($(table).find("tr").first().find("th,td").first().text());
    const division = getDivisionFromHeader(divisionHeader);

    if (!division) {
      return;
    }

    $(table)
      .find("tr")
      .slice(1)
      .each((__, row) => {
        const cells = $(row).find("td").toArray();

        if (cells.length < 3) {
          return;
        }

        const titleCell = $(cells[0]);
        const title = getTitleText(titleCell);
        const classText = cleanText(titleCell.find("small").first().text()) || undefined;
        const dateText = cleanText($(cells[1]).text());
        const locationText = cleanText($(cells[2]).text());
        const promoterText = cleanText($(cells[3]).text()) || undefined;

        if (!title || !dateText || !locationText || !/^20\d{2}\b/.test(title)) {
          return;
        }

        rows.push({
          title,
          classText,
          divisionName: division.name,
          divisionGroup: division.group,
          dateText,
          locationText,
          promoterText,
          rawHtml: $.html(row),
        });
      });
  });

  return rows;
}

function getTitleText(titleCell: ReturnType<cheerio.CheerioAPI>): string {
  const clone = titleCell.clone();
  clone.find("small").remove();

  return cleanText(clone.text());
}

function groupScheduleRows(rows: ProScheduleRow[]): ProScheduleEvent[] {
  const grouped = new Map<string, ProScheduleEvent>();

  for (const row of rows) {
    const key = [row.title, row.dateText, row.locationText].map(normalizeKey).join("|");
    const existing = grouped.get(key);
    const division = {
      name: row.divisionName,
      group: row.divisionGroup,
      classText: row.classText,
      rawText: [row.divisionName, row.classText].filter(Boolean).join(" "),
    };

    if (existing) {
      existing.divisions = mergeDivisions([...existing.divisions, division]);
      existing.rawHtml = [existing.rawHtml, row.rawHtml].join("\n");
      existing.promoterText = existing.promoterText ?? row.promoterText;
      continue;
    }

    grouped.set(key, {
      title: row.title,
      dateText: row.dateText,
      locationText: row.locationText,
      promoterText: row.promoterText,
      rawHtml: row.rawHtml,
      divisions: [division],
    });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const dateCompare = a.dateText.localeCompare(b.dateText);
    return dateCompare || a.title.localeCompare(b.title);
  });
}

function createProScheduleEvent(
  event: ProScheduleEvent,
  fetchedAt: string,
): CompetitionScheduleDraft {
  const date = parseProScheduleDate(event.dateText, getYearFromTitle(event.title));
  const location = parseGlobalLocation(event.locationText);
  const sourceEventId = slugify(
    [event.title, date.startsOn ?? event.dateText, event.locationText].join(" "),
  );

  return createScheduleDraft({
    organizationId: IFBB_PRO_LEAGUE_SOURCE.organizationId,
    organizationName: IFBB_PRO_LEAGUE_SOURCE.organizationName,
    organizationShortName: IFBB_PRO_LEAGUE_SOURCE.organizationShortName,
    title: event.title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : getYearFromTitle(event.title),
    date,
    registration: {
      status: "unknown",
      confidence: "low",
    },
    location,
    divisions: mergeDivisions(event.divisions),
    tags: uniqueTexts([
      "IFBB Pro",
      "글로벌",
      "프로",
      /natural/i.test(event.title) ? "내추럴" : "",
    ]),
    flags: {
      international: true,
      proQualifier: false,
      proCard: false,
      proShow: true,
      natural: /natural/i.test(event.title),
      major: /olympia|arnold/i.test(event.title),
      championship: /olympia|arnold|championship/i.test(event.title),
    },
    source: createSourceSnapshot({
      sourceType: "official-homepage",
      sourceUrl: IFBB_PRO_LEAGUE_SOURCE.url,
      sourceEventId,
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: event.rawHtml,
      rawTitle: event.title,
      rawDateText: event.dateText,
      rawLocationText: event.locationText,
    }),
    confidence: "high",
    qualityIssues: [],
    notes:
      "IFBB Pro 공식 Pro Schedule에서 수집한 글로벌 프로 대회입니다. 국내 출전 접수 대회와 구분해 표시해야 합니다.",
  });
}

function getDivisionFromHeader(
  header: string,
): { name: string; group: CompetitionDivision["group"] } | null {
  const normalized = header.toLowerCase().replace(/[’']/g, "'");

  if (/212/.test(normalized)) {
    return { name: "Men's 212 Bodybuilding", group: "mens" };
  }
  if (/classic\s*physique/.test(normalized)) {
    return { name: "Men's Classic Physique", group: "mens" };
  }
  if (/men'?s\s*physique/.test(normalized)) {
    return { name: "Men's Physique", group: "mens" };
  }
  if (/wheelchair/.test(normalized)) {
    return { name: "Men's Wheelchair", group: "mens" };
  }
  if (/women'?s\s*bodybuilding/.test(normalized)) {
    return { name: "Women's Bodybuilding", group: "womens" };
  }
  if (/women'?s\s*fitness/.test(normalized)) {
    return { name: "Women's Fitness", group: "womens" };
  }
  if (/women'?s\s*figure/.test(normalized)) {
    return { name: "Women's Figure", group: "womens" };
  }
  if (/women'?s\s*bikini/.test(normalized)) {
    return { name: "Women's Bikini", group: "womens" };
  }
  if (/women'?s\s*physique/.test(normalized)) {
    return { name: "Women's Physique", group: "womens" };
  }
  if (/women'?s\s*wellness/.test(normalized)) {
    return { name: "Women's Wellness", group: "womens" };
  }
  if (/fit\s*model/.test(normalized)) {
    return { name: "Women's Fit Model", group: "womens" };
  }
  if (/men'?s\s*bodybuilding/.test(normalized)) {
    return { name: "Men's Open Bodybuilding", group: "mens" };
  }

  return null;
}

function mergeDivisions(divisions: CompetitionDivision[]): CompetitionDivision[] {
  const seen = new Set<string>();
  const merged: CompetitionDivision[] = [];

  for (const division of divisions) {
    const key = [division.name, division.classText].filter(Boolean).join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(division);
  }

  return merged;
}

function parseProScheduleDate(rawText: string, year: number): CompetitionDateRange {
  const raw = cleanText(rawText);
  const match = raw.match(
    /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:\s*-\s*(?:([A-Za-z]{3,9})\.?\s+)?(\d{1,2}))?$/,
  );

  if (!match) {
    return {
      timezone: "unknown",
      rawText: raw || undefined,
      confidence: raw ? "low" : "low",
    };
  }

  const startMonth = monthNumber(match[1]);

  if (!startMonth) {
    return {
      timezone: "unknown",
      rawText: raw,
      confidence: "low",
    };
  }

  const startDay = Number(match[2]);
  const endMonth = match[3] ? monthNumber(match[3]) : startMonth;
  const endDay = match[4] ? Number(match[4]) : undefined;
  const startsOn = toIsoDate(year, startMonth, startDay);
  const endsOn = endDay && endMonth ? toIsoDate(year, endMonth, endDay) : undefined;

  return {
    startsOn,
    endsOn,
    timezone: "unknown",
    rawText: raw,
    confidence: "high",
  };
}

function parseGlobalLocation(rawText: string): Partial<CompetitionLocation> {
  const raw = cleanText(rawText);
  const parts = raw.split(",").map(cleanText).filter(Boolean);
  const countryText = parts.at(-1) ?? raw;
  const city = parts.length >= 2 ? parts[0] : undefined;

  return {
    country: getCountryCode(countryText),
    city,
    rawText: raw || undefined,
    confidence: raw ? "medium" : "low",
  };
}

function getCountryCode(value: string): string {
  const normalized = value.toLowerCase();

  if (
    /usa|united states/.test(normalized) ||
    /^(oh|pa|nj|ca|fl|tx|az|nv|wa|va|al|il)$/i.test(value.trim())
  ) {
    return "US";
  }
  if (/south korea|korea/.test(normalized)) return "KR";
  if (/spain/.test(normalized)) return "ES";
  if (/france/.test(normalized)) return "FR";
  if (/canada/.test(normalized)) return "CA";
  if (/uk|united kingdom|birmingham/.test(normalized)) return "GB";
  if (/germany/.test(normalized)) return "DE";
  if (/italy/.test(normalized)) return "IT";
  if (/japan/.test(normalized)) return "JP";
  if (/poland/.test(normalized)) return "PL";
  if (/portugal/.test(normalized)) return "PT";
  if (/romania/.test(normalized)) return "RO";
  if (/brazil/.test(normalized)) return "BR";
  if (/mexico/.test(normalized)) return "MX";
  if (/taiwan|china/.test(normalized)) return "TW";
  if (/argentina/.test(normalized)) return "AR";
  if (/slovakia/.test(normalized)) return "SK";
  if (/south africa/.test(normalized)) return "ZA";
  if (/puerto rico/.test(normalized)) return "PR";
  if (/dubai|uae/.test(normalized)) return "AE";
  if (/morocco|morroco/.test(normalized)) return "MA";

  return "unknown";
}

function getYearFromTitle(title: string): number {
  return Number(title.match(/20\d{2}/)?.[0] ?? DEFAULT_SEASON_YEAR);
}

function monthNumber(value: string): number | null {
  const month = value.slice(0, 3).toLowerCase();
  const months = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  } as const;

  return months[month as keyof typeof months] ?? null;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
