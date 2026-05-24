import * as cheerio from "cheerio";
import type { CompetitionScheduleDraft } from "../types/competitionSchedule";
import type { CrawlerResult } from "./types";
import {
  absoluteUrl,
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  fetchHtml,
  getYearFromText,
  inferRegistrationStatus,
  parseKoreanDateRange,
  slugify,
  toKoreaIsoDateTime,
} from "./utils";

const NABBA_URL = "https://www.nabba.kr/board/com_schedule.html";
const PARSER_NAME = "nabba-korea-schedule-preview";

export async function crawlNabba(): Promise<CrawlerResult> {
  const sources: CrawlerResult["sources"] = [];
  const events: CompetitionScheduleDraft[] = [];
  const errors: CrawlerResult["errors"] = [];
  const warnings: string[] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(NABBA_URL);
    const $ = cheerio.load(html);
    const cards = $(".nabba-event-card, .nabba-event-card2").toArray();

    for (const card of cards) {
      const container = $(card);
      const title = cleanText(container.find(".event-title").first().text());
      const dateText = cleanText(container.find(".event-date").first().text());
      const placeText = cleanText(container.find(".event-place").first().text());
      const link = container.find(".event-link").first();
      const registrationUrl = absoluteUrl(link.attr("href"), NABBA_URL);
      const opensAt = toKoreaIsoDateTime(link.attr("data-open-date"));
      const closesAt = toKoreaIsoDateTime(link.attr("data-end-date"));

      if (!title) {
        continue;
      }

      const date = parseKoreanDateRange(dateText, getYearFromText(dateText), "high");
      const sourceEventId = slugify([title, date.startsOn ?? dateText].join(" "));

      events.push(
        createScheduleDraft({
          organizationId: "nabba-korea",
          organizationName: "NABBA Korea",
          organizationShortName: "NABBA",
          title,
          seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : getYearFromText(dateText),
          date,
          registration: {
            opensAt,
            closesAt,
            status: inferRegistrationStatus(opensAt, closesAt, link.attr("data-apply-open")),
            registrationUrl,
            rawText: [opensAt && `접수 시작: ${opensAt}`, closesAt && `접수 마감: ${closesAt}`]
              .filter(Boolean)
              .join(" / "),
            confidence: opensAt || closesAt ? "high" : "low",
          },
          location: {
            country: "KR",
            venue: placeText || undefined,
            rawText: placeText || undefined,
            confidence: placeText ? "high" : "low",
          },
          tags: ["NABBA", "NABBA Korea"],
          flags: {
            rookieClass: /novice/i.test(title),
            proQualifier: /pro\s*qualifier|qualifier|프로\s*퀄리파이어/i.test(title),
            proCard: /pro\s*card|프로\s*카드/i.test(title),
            proShow: /pro\s*show|프로\s*쇼|프로쇼/i.test(title),
            championship: /championship|챔피언십|챔피언쉽/i.test(title),
            major: /grand\s*prix|그랑프리|championship|챔피언십|챔피언쉽/i.test(title),
          },
          source: createSourceSnapshot({
            sourceType: "official-homepage",
            sourceUrl: NABBA_URL,
            detailUrl: registrationUrl,
            sourceEventId,
            fetchedAt,
            parserName: PARSER_NAME,
            rawHtml: container.html() ?? "",
            rawTitle: title,
            rawDateText: dateText,
            rawLocationText: placeText,
            rawRegistrationText: link.attr("data-end-date"),
          }),
        }),
      );
    }

    if (events.length === 0) {
      warnings.push("일정 카드(.nabba-event-card)를 찾지 못했습니다.");
    }

    sources.push({
      organizationId: "nabba-korea",
      organizationName: "NABBA Korea",
      url: NABBA_URL,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });
  } catch (error) {
    errors.push({ url: NABBA_URL, message: getErrorMessage(error) });
    sources.push({
      organizationId: "nabba-korea",
      organizationName: "NABBA Korea",
      url: NABBA_URL,
      ok: false,
      count: 0,
      warnings: ["fetch 또는 파싱에 실패했습니다."],
    });
  }

  return { sources, events, errors };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
