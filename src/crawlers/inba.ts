import * as cheerio from "cheerio";
import type {
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

const INBA_SOURCE = {
  organizationId: "inba-pnba",
  organizationName: "INBA / PNBA",
  organizationShortName: "INBA/PNBA",
  url: "https://naturalbodybuilding.com/events-schedule/",
} as const;

const PARSER_NAME = "inba-pnba-events-schedule-preview";

interface InbaScheduleRow {
  title: string;
  dateText: string;
  locationText: string;
  detailUrl?: string;
  sourceEventId: string;
  rawHtml: string;
}

export async function crawlInbaPnba(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (selectedOrganizationIds && !selectedOrganizationIds.includes(INBA_SOURCE.organizationId)) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(INBA_SOURCE.url);
    const $ = cheerio.load(html);
    const rows = extractScheduleRows($);
    const competitionRows = rows.filter((row) => !/workshop/i.test(row.title));
    const normalizedEvents = competitionRows.map((row) => createInbaEvent(row, fetchedAt));
    const events = normalizedEvents.filter((event) => event.location.country === "KR");
    const skippedWorkshops = rows.length - competitionRows.length;
    const skippedGlobalEvents = normalizedEvents.length - events.length;
    const warnings = [
      "공식 글로벌 Events Schedule 테이블을 fetch하되, 정규화 결과는 한국 대회만 유지합니다.",
      "일정 페이지가 일부 브라우저형 UA에는 Cloudflare challenge를 반환할 수 있어 preview crawler UA 기준으로 검증했습니다.",
      "상세 페이지는 이번 단계에서 순회하지 않고 목록 테이블의 날짜/지역/대회명/상세 URL만 정규화합니다.",
    ];

    if (skippedWorkshops > 0) {
      warnings.push(`대회가 아닌 Workshop 행 ${skippedWorkshops}건은 제외했습니다.`);
    }

    if (skippedGlobalEvents > 0) {
      warnings.push(`한국 대회가 아닌 글로벌 일정 ${skippedGlobalEvents}건은 정규화 단계에서 제외했습니다.`);
    }

    if (events.length === 0) {
      warnings.push("Events Schedule 테이블에서 한국 대회로 정규화할 수 있는 행을 찾지 못했습니다.");
    }

    sources.push({
      organizationId: INBA_SOURCE.organizationId,
      organizationName: INBA_SOURCE.organizationName,
      url: INBA_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: INBA_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: INBA_SOURCE.organizationId,
      organizationName: INBA_SOURCE.organizationName,
      url: INBA_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["Events Schedule fetch 또는 테이블 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractScheduleRows($: cheerio.CheerioAPI): InbaScheduleRow[] {
  const rows: InbaScheduleRow[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("td,th").toArray();

    if (cells.length < 3) {
      return;
    }

    const dateText = cleanText($(cells[0]).text());
    const locationText = cleanText($(cells[1]).text());
    const title = cleanText($(cells[2]).text());
    const detailUrl = absoluteUrl($(cells[2]).find("a[href]").first().attr("href"), INBA_SOURCE.url);

    if (!isDateText(dateText) || !title || !locationText) {
      return;
    }

    rows.push({
      title,
      dateText,
      locationText,
      detailUrl,
      sourceEventId: sourceEventIdFromDetailUrl(detailUrl) ?? rawHash(`${dateText}:${locationText}:${title}`),
      rawHtml: $.html(row),
    });
  });

  return dedupeRows(rows);
}

function createInbaEvent(row: InbaScheduleRow, fetchedAt: string): CompetitionScheduleDraft {
  const date = parseUsDate(row.dateText);
  const location = parseGlobalLocation(row.locationText);
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "INBA/PNBA 일정 테이블의 날짜를 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!location.rawText) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "INBA/PNBA 일정 테이블의 지역을 안정적으로 파싱하지 못했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: INBA_SOURCE.organizationId,
    organizationName: INBA_SOURCE.organizationName,
    organizationShortName: INBA_SOURCE.organizationShortName,
    title: row.title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : 2026,
    date,
    registration: {
      status: "unknown",
      registrationUrl: row.detailUrl,
      confidence: row.detailUrl ? "low" : "low",
    },
    location,
    divisions: [],
    tags: uniqueTexts([
      "INBA",
      "PNBA",
      "Natural Bodybuilding",
      row.title.includes("Pro/Am") ? "Pro/Am" : "",
      isAsiaPacific(row) ? "Asia-Pacific" : "",
    ]),
    flags: {
      natural: true,
      proQualifier: /pro\/am|championship|natural olympia|universe|world/i.test(row.title),
      international: true,
    },
    source: createSourceSnapshot({
      sourceType: "official-homepage",
      sourceUrl: INBA_SOURCE.url,
      detailUrl: row.detailUrl,
      sourceEventId: row.sourceEventId,
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: row.rawHtml,
      rawTitle: row.title,
      rawDateText: row.dateText,
      rawLocationText: row.locationText,
    }),
    confidence: date.startsOn && location.rawText ? "medium" : "low",
    qualityIssues,
    notes:
      "NaturalBodybuilding.com 공식 Events Schedule 테이블에서 수집한 INBA/PNBA preview 데이터입니다.",
  });
}

function parseUsDate(rawText: string): CompetitionDateRange {
  const raw = cleanText(rawText);
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(20\d{2})$/);

  if (!match) {
    return {
      timezone: "unknown",
      rawText: raw || undefined,
      confidence: raw ? "low" : "low",
    };
  }

  return {
    startsOn: `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`,
    timezone: "unknown",
    rawText: raw,
    confidence: "high",
  };
}

function parseGlobalLocation(rawText: string): Partial<CompetitionLocation> {
  const raw = cleanText(rawText);

  if (!raw) {
    return {
      country: "unknown",
      confidence: "low",
    };
  }

  const parts = raw.split(",").map(cleanText).filter(Boolean);
  const city = parts[0];
  const regionOrCountry = parts[1];
  const country = inferCountry(raw, regionOrCountry);

  return {
    country,
    region: regionOrCountry && isUsStateCode(regionOrCountry) ? regionOrCountry : undefined,
    city,
    rawText: raw,
    confidence: country === "unknown" ? "low" : "medium",
  };
}

function inferCountry(rawText: string, regionOrCountry: string | undefined): string {
  const normalized = cleanText(regionOrCountry ?? rawText).toLowerCase();

  if (regionOrCountry && isUsStateCode(regionOrCountry)) {
    return "US";
  }

  const countries: Array<[RegExp, string]> = [
    [/korea|seoul|busan|incheon|daegu|daejeon|gwangju|gyeonggi|jeju/i, "KR"],
    [/china|shanghai/i, "CN"],
    [/singapore/i, "SG"],
    [/hungary|budapest/i, "HU"],
    [/romania|bucharest/i, "RO"],
  ];

  return countries.find(([pattern]) => pattern.test(normalized))?.[1] ?? "unknown";
}

function isDateText(value: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/20\d{2}$/.test(cleanText(value));
}

function isUsStateCode(value: string): boolean {
  return /^(A[KLZR]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[A]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$/.test(
    value.trim(),
  );
}

function sourceEventIdFromDetailUrl(detailUrl: string | undefined): string | undefined {
  if (!detailUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(detailUrl);
    return parsed.pathname.replace(/^\/project\//, "").replace(/\/$/, "") || undefined;
  } catch {
    return undefined;
  }
}

function isAsiaPacific(row: InbaScheduleRow): boolean {
  return /asia|pacific|china|singapore/i.test(`${row.title} ${row.locationText}`);
}

function dedupeRows(rows: InbaScheduleRow[]): InbaScheduleRow[] {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = row.sourceEventId;
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
