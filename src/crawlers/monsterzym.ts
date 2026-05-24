import * as cheerio from "cheerio";
import type {
  CompetitionDateRange,
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
  parseKoreanDateRange,
  rawHash,
  uniqueTexts,
} from "./utils";

const MONSTERZYM_SOURCE = {
  organizationId: "monsterzym",
  organizationName: "Monsterzym",
  organizationShortName: "Monsterzym",
  url: "https://event.monsterzym.com/",
} as const;

const PARSER_NAME = "monsterzym-event-page-preview";
const DEFAULT_SEASON_YEAR = 2026;

interface MonsterzymCard {
  section: string;
  title: string;
  subtitle: string;
  badge: string;
  dateText: string;
  locationText: string;
  registrationUrl?: string;
  sourceEventId: string;
  rawHtml: string;
}

export async function crawlMonsterzym(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (
    selectedOrganizationIds &&
    !selectedOrganizationIds.includes(MONSTERZYM_SOURCE.organizationId)
  ) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(MONSTERZYM_SOURCE.url);
    const $ = cheerio.load(html);
    const cards = extractMonsterzymCards($);
    const events = cards.map((card) => createMonsterzymEvent(card, fetchedAt));
    const warnings = [
      "2026-05-22 확인 기준 robots.txt가 User-agent: * Disallow: / 를 반환합니다.",
      "사용자 요청에 따른 preview 검증용 수집이며, 운영 자동 수집/DB 저장 전에는 주최 측 허가가 필요합니다.",
      "상세 페이지는 순회하지 않고 이벤트 메인 페이지의 공개 카드만 파싱합니다.",
    ];

    if (events.length === 0) {
      warnings.push("Monsterzym 이벤트 페이지에서 수집 가능한 일정 카드를 찾지 못했습니다.");
    }

    sources.push({
      organizationId: MONSTERZYM_SOURCE.organizationId,
      organizationName: MONSTERZYM_SOURCE.organizationName,
      url: MONSTERZYM_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: MONSTERZYM_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: MONSTERZYM_SOURCE.organizationId,
      organizationName: MONSTERZYM_SOURCE.organizationName,
      url: MONSTERZYM_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["Monsterzym 이벤트 페이지 fetch 또는 카드 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractMonsterzymCards($: cheerio.CheerioAPI): MonsterzymCard[] {
  const cards: MonsterzymCard[] = [];

  $(".mz-category-group").each((_, group) => {
    const section = cleanText($(group).find(".mz-section-header h2[lang='ko']").first().text());

    $(group)
      .find(".mz-card")
      .each((__, card) => {
        const dateText = cleanText(
          $(card).find(".mz-card-date-box span[lang='ko']").eq(0).text(),
        );
        const locationText = cleanText(
          $(card).find(".mz-card-date-box span[lang='ko']").eq(1).text(),
        );
        const badge = cleanText($(card).find(".mz-card-badge[lang='ko']").first().text());
        const title = cleanText($(card).find(".mz-card-title span[lang='ko']").first().text());
        const subtitle = cleanText(
          $(card).find(".mz-card-subtitle span[lang='ko']").first().text(),
        );
        const registrationUrl = absoluteUrl(
          $(card).find(".mz-card-action a[lang='ko']").first().attr("href") ??
            $(card).find(".mz-card-action a[href]").first().attr("href"),
          MONSTERZYM_SOURCE.url,
        );

        if (!dateText || !title || !subtitle) {
          return;
        }

        cards.push({
          section,
          title,
          subtitle,
          badge,
          dateText,
          locationText,
          registrationUrl,
          sourceEventId: createSourceEventId(registrationUrl, title, subtitle, dateText),
          rawHtml: $.html(card),
        });
      });
  });

  return dedupeCards(cards);
}

function createMonsterzymEvent(
  card: MonsterzymCard,
  fetchedAt: string,
): CompetitionScheduleDraft {
  const title = createTitle(card);
  const date = parseMonsterzymDate(card.dateText);
  const location = card.locationText
    ? {
        ...inferLocation([card.locationText]),
        rawText: card.locationText,
      }
    : {
        country: "KR",
        confidence: "low" as const,
      };
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "Monsterzym 카드의 날짜를 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!card.locationText) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "Monsterzym 카드에 장소 텍스트가 없습니다.",
    });
  }

  const eventText = `${card.section} ${card.badge} ${card.subtitle} ${card.title}`;
  const isProQualifier = /프로\s*퀄리파이어|pro\s*qualifier/i.test(eventText);
  const isProShow =
    !isProQualifier &&
    /프로\s*쇼|프로쇼|오픈\s*프로|내추럴\s*프로|pro\s*show|ifbb\s*pro/i.test(eventText);

  return createScheduleDraft({
    organizationId: MONSTERZYM_SOURCE.organizationId,
    organizationName: MONSTERZYM_SOURCE.organizationName,
    organizationShortName: MONSTERZYM_SOURCE.organizationShortName,
    title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : DEFAULT_SEASON_YEAR,
    date,
    registration: {
      status: "unknown",
      registrationUrl: card.registrationUrl,
      confidence: card.registrationUrl ? "medium" : "low",
    },
    location,
    divisions: extractDivisions(card),
    tags: uniqueTexts([
      "Monsterzym",
      card.section,
      card.badge,
      card.subtitle,
      /IFBB|프로쇼/.test(card.subtitle) ? "IFBB Pro Show" : "",
    ]),
    flags: {
      natural: /내추럴/i.test(eventText),
      proQualifier: isProQualifier,
      proCard: isProQualifier,
      proShow: isProShow,
      international: /아시안|asian|asia|IFBB/i.test(eventText),
    },
    source: createSourceSnapshot({
      sourceType: "official-homepage",
      sourceUrl: MONSTERZYM_SOURCE.url,
      detailUrl: card.registrationUrl,
      sourceEventId: card.sourceEventId,
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: card.rawHtml,
      rawTitle: title,
      rawDateText: card.dateText,
      rawLocationText: card.locationText,
    }),
    qualityIssues,
    notes:
      "Monsterzym 이벤트 메인 페이지의 일정 카드에서 수집한 preview 데이터입니다. robots.txt 차단으로 운영 자동 수집 전 허가 검토가 필요합니다.",
  });
}

function createTitle(card: MonsterzymCard): string {
  return cleanText(`${card.title}(${card.subtitle})`);
}

function parseMonsterzymDate(rawText: string): CompetitionDateRange {
  return parseKoreanDateRange(rawText, DEFAULT_SEASON_YEAR, "high");
}

function extractDivisions(card: MonsterzymCard) {
  const divisionText = card.subtitle.match(/\(([^)]+)\)/)?.[1];

  if (!divisionText) {
    return [];
  }

  return divisionText
    .split(/[,/]/)
    .map((name) => cleanText(name))
    .filter(Boolean)
    .map((name) => ({
      name,
      group: inferDivisionGroup(name),
      rawText: divisionText,
    }));
}

function inferDivisionGroup(name: string) {
  if (/(BIKINI|FIGURE|WELLNESS|FIT MODEL)/i.test(name)) {
    return "womens" as const;
  }

  if (/(212|CP|MP|Classic|Physique)/i.test(name)) {
    return "mens" as const;
  }

  return "unknown" as const;
}

function createSourceEventId(
  registrationUrl: string | undefined,
  title: string,
  subtitle: string,
  dateText: string,
): string {
  if (registrationUrl) {
    try {
      const parsed = new URL(registrationUrl);
      const contestId = parsed.pathname.match(/\/contests\/([^/]+)/)?.[1];
      const noticeId = parsed.searchParams.get("board_data_idx");

      if (contestId) {
        return contestId.toLowerCase();
      }

      if (noticeId) {
        return rawHash(`${noticeId}:${title}:${subtitle}:${dateText}`);
      }
    } catch {
      // Fall through to deterministic text hash.
    }
  }

  return rawHash(`${title}:${subtitle}:${dateText}`);
}

function dedupeCards(cards: MonsterzymCard[]): MonsterzymCard[] {
  const seen = new Set<string>();

  return cards.filter((card) => {
    const key = `${card.sourceEventId}:${card.title}:${card.subtitle}:${card.dateText}`;
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
