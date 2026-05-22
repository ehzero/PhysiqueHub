import * as cheerio from "cheerio";
import type {
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionLocation,
  CompetitionRegistrationWindow,
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

const WNBF_SOURCE = {
  organizationId: "wnbf-korea",
  organizationName: "WNBF Korea",
  organizationShortName: "WNBF",
  url: "https://www.wnbfkorea1.com/26",
} as const;

const PARSER_NAME = "wnbf-korea-imweb-preview";
const DEFAULT_SEASON_YEAR = 2026;

interface WnbfWidget {
  type?: string;
  text: string;
  href?: string;
  rawHtml: string;
}

interface WnbfSection {
  title: string;
  description?: string;
  detailUrl?: string;
  rawHtml: string;
}

export async function crawlWnbfKorea(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (selectedOrganizationIds && !selectedOrganizationIds.includes(WNBF_SOURCE.organizationId)) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(WNBF_SOURCE.url);
    const $ = cheerio.load(html);
    const sections = extractWnbfSections($);
    const events = sections.map((section) => createWnbfEvent(section, fetchedAt));
    const warnings = [
      "robots.txt에서 공개 페이지 접근은 허용됩니다.",
      "Imweb 텍스트 위젯의 대회 신청 섹션을 기준으로 수집합니다.",
      "버튼 링크는 신청/문의 폼 성격일 수 있어 registrationUrl 또는 detailUrl로만 보존합니다.",
    ];

    if (events.length === 0) {
      warnings.push("대회참가 신청 페이지에서 수집 가능한 대회 섹션을 찾지 못했습니다.");
    }

    sources.push({
      organizationId: WNBF_SOURCE.organizationId,
      organizationName: WNBF_SOURCE.organizationName,
      url: WNBF_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: WNBF_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: WNBF_SOURCE.organizationId,
      organizationName: WNBF_SOURCE.organizationName,
      url: WNBF_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["대회참가 신청 페이지 fetch 또는 위젯 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractWnbfSections($: cheerio.CheerioAPI): WnbfSection[] {
  const widgets = $("._widget_data")
    .toArray()
    .map((element) => ({
      type: $(element).attr("data-widget-type"),
      text: cleanText($(element).text()),
      href: absoluteUrl($(element).find("a[href]").first().attr("href"), WNBF_SOURCE.url),
      rawHtml: $(element).html() ?? "",
    }))
    .filter((widget) => widget.text);
  const sections: WnbfSection[] = [];

  for (let index = 0; index < widgets.length; index += 1) {
    const widget = widgets[index];

    if (!isEventTitleWidget(widget)) {
      continue;
    }

    const description = findNextWidget(widgets, index + 1, "text")?.text;
    const button = findNextWidget(widgets, index + 1, "button");

    sections.push({
      title: widget.text,
      description,
      detailUrl: button?.href,
      rawHtml: [widget.rawHtml, description, button?.rawHtml].filter(Boolean).join("\n"),
    });
  }

  return dedupeSections(sections);
}

function createWnbfEvent(section: WnbfSection, fetchedAt: string): CompetitionScheduleDraft {
  const rawText = cleanText(`${section.title} ${section.description ?? ""}`);
  const date = parseWnbfDate(section.title, section.description);
  const registration = parseWnbfRegistration(section.description, section.detailUrl);
  const location = inferWnbfLocation(section.title, section.description);
  const divisions = extractWnbfDivisions(section.description);
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "WNBF Korea 위젯 텍스트에서 대회일을 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!location.rawText) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "WNBF Korea 위젯 텍스트에서 장소를 안정적으로 파싱하지 못했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: WNBF_SOURCE.organizationId,
    organizationName: WNBF_SOURCE.organizationName,
    organizationShortName: WNBF_SOURCE.organizationShortName,
    title: normalizeWnbfTitle(section.title),
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : DEFAULT_SEASON_YEAR,
    date,
    registration,
    location,
    divisions,
    tags: uniqueTexts(["WNBF", "WNBF Korea", "내추럴", "폴리그라프"]),
    flags: {
      natural: true,
      beginnerFriendly: /아마추어/i.test(section.title),
      international: isWorldsEvent(section.title),
    },
    source: createSourceSnapshot({
      sourceType: "official-homepage",
      sourceUrl: WNBF_SOURCE.url,
      detailUrl: section.detailUrl,
      sourceEventId: rawHash(rawText),
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: section.rawHtml,
      rawTitle: section.title,
      rawDateText: date.rawText,
      rawLocationText: location.rawText,
      rawRegistrationText: registration.rawText,
    }),
    confidence: date.startsOn && location.rawText ? "medium" : "low",
    qualityIssues,
    notes:
      "WNBF Korea 공식 Imweb 대회참가 신청 페이지의 텍스트 위젯에서 수집한 preview 데이터입니다.",
  });
}

function isEventTitleWidget(widget: WnbfWidget): boolean {
  if (widget.type !== "text") {
    return false;
  }

  if (widget.text.length > 120) {
    return false;
  }

  return /^WNBF\s+(?:Worlds|asia|한국)/i.test(widget.text);
}

function findNextWidget(
  widgets: WnbfWidget[],
  startIndex: number,
  type: string,
): WnbfWidget | undefined {
  for (let index = startIndex; index < widgets.length; index += 1) {
    const widget = widgets[index];

    if (isEventTitleWidget(widget)) {
      return undefined;
    }

    if (widget.type === type) {
      return widget;
    }
  }

  return undefined;
}

function parseWnbfDate(
  title: string,
  description: string | undefined,
): CompetitionDateRange {
  const rawSource = cleanText(`${title} ${description ?? ""}`);
  const titleRange = title.match(
    /(26|2026)\s*,\s*(\d{1,2})\.(\d{1,2})\s*\(체크인\)\s*\/\s*(\d{1,2})\s*\(본대회\)/,
  );

  if (titleRange) {
    const year = normalizeTwoDigitYear(titleRange[1]);
    const month = Number(titleRange[2]);
    const startDay = Number(titleRange[3]);
    const endDay = Number(titleRange[4]);

    return {
      startsOn: toDateString(year, month, startDay),
      endsOn: toDateString(year, month, endDay),
      timezone: "Asia/Seoul",
      rawText: cleanText(titleRange[0]),
      confidence: "high",
    };
  }

  const worldDate = rawSource.match(/(?:26년|2026년).*?(\d{1,2})월\s*(\d{1,2})일/);
  if (worldDate) {
    return {
      startsOn: toDateString(DEFAULT_SEASON_YEAR, Number(worldDate[1]), Number(worldDate[2])),
      timezone: isWorldsEvent(rawSource) ? "unknown" : "Asia/Seoul",
      rawText: cleanText(worldDate[0]),
      confidence: "medium",
    };
  }

  return {
    timezone: "Asia/Seoul",
    rawText: rawSource || undefined,
    confidence: "low",
  };
}

function parseWnbfRegistration(
  description: string | undefined,
  detailUrl: string | undefined,
): Partial<CompetitionRegistrationWindow> {
  const text = cleanText(description);
  const closesAt = parseRegistrationDeadline(text);

  return {
    status: closesAt && Date.parse(closesAt) > Date.now() ? "open" : "unknown",
    opensAt: parseRegistrationOpen(text),
    closesAt,
    registrationUrl: detailUrl ?? WNBF_SOURCE.url,
    rawText: text || undefined,
    confidence: closesAt || detailUrl ? "medium" : "low",
  };
}

function parseRegistrationDeadline(text: string): string | undefined {
  if (/6\s*월\s*7\s*일|6\s*[.]\s*7\s*일?/.test(text)) {
    return "2026-06-07T23:59:00+09:00";
  }

  return undefined;
}

function parseRegistrationOpen(text: string): string | undefined {
  const match = text.match(/2026\s*,\s*(\d{1,2})\.(\d{1,2})/);
  if (!match) {
    return undefined;
  }

  return `${toDateString(2026, Number(match[1]), Number(match[2]))}T00:00:00+09:00`;
}

function inferWnbfLocation(
  title: string,
  description: string | undefined,
): Partial<CompetitionLocation> {
  const text = cleanText(`${title} ${description ?? ""}`);

  if (/정선|하이원리조트/i.test(title)) {
    return {
      country: "KR",
      region: "정선",
      venue: "하이원리조트",
      rawText: "정선 하이원리조트",
      confidence: "high",
    };
  }

  if (/케나다|캐나다|켈거리|캘거리/i.test(text)) {
    return {
      country: "CA",
      city: /켈거리/.test(text) ? "켈거리" : "캘거리",
      rawText: "케나다(켈거리)",
      confidence: "medium",
    };
  }

  if (/정선|하이원리조트/i.test(text)) {
    return {
      country: "KR",
      region: "정선",
      venue: "하이원리조트",
      rawText: "정선 하이원리조트",
      confidence: "high",
    };
  }

  return {
    country: "KR",
    confidence: "low",
  };
}

function extractWnbfDivisions(description: string | undefined): CompetitionDivision[] {
  const text = cleanText(description);
  const divisionBlock = text.match(/종목\(([^)]+)\)/)?.[1];
  const names = divisionBlock
    ? divisionBlock.split(/[,/·]/).map(cleanText)
    : [];

  return uniqueTexts(names).map((name) => ({
    name,
    group: inferDivisionGroup(name),
    rawText: name,
  }));
}

function inferDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/우먼|비키니|피규어|women|bikini|figure/i.test(name)) {
    return "womens";
  }

  if (/맨즈|보디빌딩|피지크|men|bodybuilding|physique/i.test(name)) {
    return "mens";
  }

  return "unknown";
}

function normalizeWnbfTitle(title: string): string {
  return cleanText(title)
    .replace(/\s+26\s*,.*$/, "")
    .replace(/\s+/g, " ");
}

function isWorldsEvent(text: string): boolean {
  return /Worlds|월드/i.test(text);
}

function normalizeTwoDigitYear(value: string): number {
  return value.length === 2 ? 2000 + Number(value) : Number(value);
}

function dedupeSections(sections: WnbfSection[]): WnbfSection[] {
  const seen = new Set<string>();

  return sections.filter((section) => {
    const key = `${section.title}:${section.description}`;
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
