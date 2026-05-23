import * as cheerio from "cheerio";
import type { CompetitionScheduleDraft } from "../types/competitionSchedule";
import { waitBeforeNextDetailRequest } from "./delay";
import type { CrawlerResult } from "./types";
import {
  absoluteUrl,
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  extractDivisions,
  fetchHtml,
  inferLocation,
  parseKoreanDateRange,
  parseKoreanDeadline,
  sourceEventIdFromUrl,
  uniqueTexts,
} from "./utils";

const KBBF_SOURCES = [
  {
    url: "https://bodybuilding.or.kr/contest_kr",
    label: "국내대회",
    tags: ["KBBF", "국내대회"],
  },
  {
    url: "https://bodybuilding.or.kr/contest_inti",
    label: "국제대회",
    tags: ["KBBF", "국제대회"],
  },
  {
    url: "https://bodybuilding.or.kr/contest_city",
    label: "시도대회",
    tags: ["KBBF", "시도대회"],
  },
] as const;

const PARSER_NAME = "kbbf-board-detail-preview";

interface KbbfListItem {
  title: string;
  detailUrl: string;
  postedAt: string;
  fallbackYear: number;
  sourceEventId?: string;
}

interface KbbfDetailData {
  title?: string;
  dateText?: string;
  locationText?: string;
  registrationText?: string;
  divisionText?: string;
  registrationUrl?: string;
  notes?: string;
  rawHtml: string;
  fetchedAt: string;
  confidence: "low" | "medium" | "high";
}

export async function crawlKbbf(): Promise<CrawlerResult> {
  const sources: CrawlerResult["sources"] = [];
  const events: CompetitionScheduleDraft[] = [];
  const errors: CrawlerResult["errors"] = [];
  const seen = new Set<string>();

  for (const source of KBBF_SOURCES) {
    const sourceEvents: CompetitionScheduleDraft[] = [];
    const warnings = [
      "게시글 상세 본문 표를 우선 파싱합니다. 이미지/HWP 첨부에만 있는 세부 정보는 별도 검수가 필요합니다.",
    ];

    try {
      const { html, fetchedAt } = await fetchHtml(source.url);
      const $ = cheerio.load(html);
      const rows = $(".li_board ul.li_body").toArray();
      let detailFetchCount = 0;

      for (const row of rows) {
        const container = $(row);
        const titleLink = container.find("a.list_text_title").first();
        const title = cleanText(titleLink.text());
        const detailUrl = absoluteUrl(titleLink.attr("href"), source.url);

        if (!title || !detailUrl || !isCompetitionTitle(title)) {
          continue;
        }

        const uniqueKey = `${source.url}:${detailUrl}`;
        if (seen.has(uniqueKey)) {
          continue;
        }
        seen.add(uniqueKey);

        const listItem = buildListItem($, container, title, detailUrl);
        if (detailFetchCount > 0) {
          await waitBeforeNextDetailRequest();
        }
        detailFetchCount += 1;

        const detail = await fetchKbbfDetail(listItem).catch((error: unknown) => {
          errors.push({
            url: listItem.detailUrl,
            message: getErrorMessage(error),
          });
          return undefined;
        });

        sourceEvents.push(
          createKbbfEvent({
            sourceUrl: source.url,
            sourceLabel: source.label,
            sourceTags: [...source.tags],
            listItem,
            detail,
            fallbackFetchedAt: fetchedAt,
            fallbackRawHtml: container.html() ?? "",
          }),
        );
      }

      if (sourceEvents.length === 0) {
        warnings.push("게시판 목록에서 대회성 제목을 찾지 못했습니다.");
      }

      events.push(...sourceEvents);
      sources.push({
        organizationId: "kbbf",
        organizationName: `대한보디빌딩협회 ${source.label}`,
        url: source.url,
        ok: true,
        count: sourceEvents.length,
        warnings,
        fetchedAt,
      });
    } catch (error) {
      errors.push({ url: source.url, message: getErrorMessage(error) });
      sources.push({
        organizationId: "kbbf",
        organizationName: `대한보디빌딩협회 ${source.label}`,
        url: source.url,
        ok: false,
        count: 0,
        warnings: ["fetch 또는 파싱에 실패했습니다."],
      });
    }
  }

  return { sources, events, errors };
}

function buildListItem(
  $: cheerio.CheerioAPI,
  container: ReturnType<cheerio.CheerioAPI>,
  title: string,
  detailUrl: string,
): KbbfListItem {
  const postedAt =
    cleanText(container.find("li.time").attr("title")) ||
    cleanText(container.find("li.time").text());
  const categoryYear = cleanText(container.find("li.category em").first().text());

  return {
    title,
    detailUrl: simplifyKbbfDetailUrl(detailUrl),
    postedAt,
    fallbackYear: Number(categoryYear) || getYearFromKbbfText(title, postedAt),
    sourceEventId: sourceEventIdFromUrl(detailUrl),
  };
}

async function fetchKbbfDetail(listItem: KbbfListItem): Promise<KbbfDetailData> {
  const { html, fetchedAt } = await fetchHtml(listItem.detailUrl);
  const $ = cheerio.load(html);
  const board = $(".board_txt_area").first();
  const fieldMap = extractDetailFieldMap($, board);
  const detailText = cleanText(board.text());
  const registrationUrl = board
    .find("a")
    .toArray()
    .map((link) => ({
      text: cleanText($(link).text()),
      href: absoluteUrl($(link).attr("href"), listItem.detailUrl),
    }))
    .find((link) => link.href && /신청|접수|스포츠지원|sports/i.test(`${link.text} ${link.href}`))
    ?.href;
  const attachments = $(".file_area a")
    .toArray()
    .map((link) => cleanText($(link).text()))
    .filter(Boolean);

  return {
    title: getFirstField(fieldMap, ["대회명", "대회 명"]),
    dateText: getFirstField(fieldMap, ["대회일시", "대회 일시", "일시", "일 정", "일정"]),
    locationText: getFirstField(fieldMap, ["대회장소", "대회 장소", "장소"]),
    registrationText:
      getFirstField(fieldMap, ["참가신청마감", "참가 신청 마감", "접수마감일", "접수 마감일", "접수마감"]) ||
      detailText.match(/(?:참가신청마감|접수마감일?|접수\s*마감)[:\s]*[^。\n]+/)?.[0],
    divisionText: getFirstField(fieldMap, ["종별", "부문", "종목", "체급"]),
    registrationUrl,
    notes: attachments.length > 0 ? `첨부파일: ${attachments.join(" / ")}` : undefined,
    rawHtml: board.html() ?? html,
    fetchedAt,
    confidence: board.length > 0 ? "high" : "low",
  };
}

function createKbbfEvent(input: {
  sourceUrl: string;
  sourceLabel: string;
  sourceTags: string[];
  listItem: KbbfListItem;
  detail: KbbfDetailData | undefined;
  fallbackFetchedAt: string;
  fallbackRawHtml: string;
}): CompetitionScheduleDraft {
  const title = cleanText(input.detail?.title) || input.listItem.title;
  const dateText = input.detail?.dateText || input.listItem.title;
  const dateConfidence = input.detail?.dateText ? "high" : "low";
  const date = parseKoreanDateRange(dateText, input.listItem.fallbackYear, dateConfidence);
  const registrationText = input.detail?.registrationText;
  const closesAt = parseKoreanDeadline(registrationText, input.listItem.fallbackYear);
  const location = input.detail?.locationText
    ? {
        ...inferLocation([input.detail.locationText]),
        rawText: input.detail.locationText,
      }
    : { country: "KR", confidence: "low" as const };
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "상세 본문에서 대회일을 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!input.detail?.locationText) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "상세 본문에서 장소를 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!input.detail) {
    qualityIssues.push({
      field: "source" as const,
      severity: "warning" as const,
      message: "상세 페이지 fetch/parsing 실패로 목록 정보만 사용했습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: "kbbf",
    organizationName: "대한보디빌딩협회",
    organizationShortName: "KBBF",
    title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : input.listItem.fallbackYear,
    date,
    registration: {
      closesAt,
      registrationUrl: input.detail?.registrationUrl,
      status: closesAt && Date.parse(closesAt) < Date.now() ? "closed" : "unknown",
      rawText: registrationText,
      confidence: closesAt || input.detail?.registrationUrl ? "medium" : "low",
    },
    location,
    divisions: extractDivisions(input.detail?.divisionText),
    tags: uniqueTexts(input.sourceTags),
    flags: {
      nationalTeamRoute: /국가대표|대표선발|전국체육대회|세계|아시아/i.test(title),
      international: input.sourceLabel === "국제대회",
    },
    source: createSourceSnapshot({
      sourceType: "official-board",
      sourceUrl: input.sourceUrl,
      detailUrl: input.listItem.detailUrl,
      sourceEventId: input.listItem.sourceEventId,
      sourceUpdatedAt: input.listItem.postedAt || undefined,
      fetchedAt: input.detail?.fetchedAt ?? input.fallbackFetchedAt,
      parserName: PARSER_NAME,
      rawHtml: input.detail?.rawHtml ?? input.fallbackRawHtml,
      rawTitle: title,
      rawDateText: dateText,
      rawLocationText: input.detail?.locationText,
      rawRegistrationText: registrationText,
    }),
    qualityIssues,
    notes: input.detail?.notes,
  });
}

function extractDetailFieldMap(
  $: cheerio.CheerioAPI,
  board: ReturnType<cheerio.CheerioAPI>,
): Map<string, string> {
  const fieldMap = new Map<string, string>();

  board.find("table tr").each((_, row) => {
    const cells = $(row)
      .find("td, th")
      .toArray()
      .map((cell) => cleanText($(cell).text()))
      .filter(Boolean);

    if (cells.length >= 2) {
      fieldMap.set(normalizeFieldName(cells[0]), cells.slice(1).join(" "));
    }
  });

  return fieldMap;
}

function getFirstField(fieldMap: Map<string, string>, names: string[]): string | undefined {
  for (const name of names) {
    const value = fieldMap.get(normalizeFieldName(name));
    if (value) {
      return value;
    }
  }

  return undefined;
}

function normalizeFieldName(value: string): string {
  return cleanText(value).replace(/[\s:：]/g, "");
}

function simplifyKbbfDetailUrl(detailUrl: string): string {
  const parsed = new URL(detailUrl);
  const idx = parsed.searchParams.get("idx");

  if (idx) {
    parsed.search = `?bmode=view&idx=${idx}`;
  }

  return parsed.toString();
}

function isCompetitionTitle(title: string): boolean {
  return /(대회|선수권|선발전|체전|올림피아|보디빌딩|피트니스|챔피언|Mr\.?|미스터)/i.test(title);
}

function getYearFromKbbfText(title: string, postedAt: string): number {
  const titleYear = title.match(/20\d{2}/)?.[0];
  if (titleYear) {
    return Number(titleYear);
  }

  const postedYear = postedAt.match(/20\d{2}/)?.[0];
  if (postedYear) {
    return Number(postedYear);
  }

  return 2026;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
