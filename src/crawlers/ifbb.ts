import * as cheerio from "cheerio";
import type { CompetitionOrganizationId, CompetitionScheduleDraft } from "../types/competitionSchedule";
import type { CrawlerResult } from "./types";
import {
  absoluteUrl,
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  extractDivisions,
  fetchHtml,
  getYearFromText,
  inferLocation,
  parseKoreanDateRange,
  parseKoreanDeadline,
  slugify,
  uniqueTexts,
} from "./utils";

const IFBB_SOURCES = [
  "https://ifbbprokorea.com/schedule/",
  "https://ifbbprokorea.com/schedule/open-regional/",
  "https://ifbbprokorea.com/schedule/natural-regional/",
  "https://ifbbprokorea.com/schedule/proqualifier/",
  "https://ifbbprokorea.com/schedule/ifbb-pro/",
] as const;

const PARSER_NAME = "ifbb-npc-agp-elementor-preview";

export async function crawlIfbbNpcAgp(): Promise<CrawlerResult> {
  const sources: CrawlerResult["sources"] = [];
  const events: CompetitionScheduleDraft[] = [];
  const errors: CrawlerResult["errors"] = [];

  for (const url of IFBB_SOURCES) {
    const sourceEvents: CompetitionScheduleDraft[] = [];
    const seenInSource = new Set<string>();
    const warnings = [
      "WordPress/Elementor HTML 기반 preview입니다. robots/약관 및 상세 신청 페이지는 별도 검수가 필요합니다.",
    ];

    try {
      const { html, fetchedAt } = await fetchHtml(url);
      const $ = cheerio.load(html);
      const pageText = cleanText($("body").text());
      const fallbackYear = getYearFromText(pageText);
      const headings = $("h4.elementor-heading-title").toArray();

      for (const heading of headings) {
        const title = cleanText($(heading).text());
        if (!isEventTitle(title)) {
          continue;
        }

        const card = findElementorCard($, heading);
        const detailTexts = uniqueTexts(
          card
            .find(".elementor-icon-list-text")
            .toArray()
            .map((node) => $(node).text()),
        );
        const dateText = detailTexts.find(isDateLike);
        const registrationText =
          detailTexts.find((text) => /신청\s*마감|접수\s*마감/i.test(text)) ??
          detailTexts.find((text, index) => index === 1 && /\d{1,2}월\s*\d{1,2}일/.test(text));
        const locationTexts = detailTexts.filter(isLocationLike);
        const divisionText = detailTexts.find((text) =>
          /(비키니|웰니스|피겨|피지크|보디빌딩|핏 모델|스포츠모델|클래식)/.test(text),
        );
        const registrationUrl = findRegistrationUrl($, card, url);
        const organizationId = inferOrganizationId(title, detailTexts.join(" "), url);
        const organizationName =
          organizationId === "agp" ? "AGP" : "NPC/IFBB Pro Korea";
        const organizationShortName = organizationId === "agp" ? "AGP" : "NPC/IFBB";
        const date = parseKoreanDateRange(dateText, fallbackYear, dateText ? "high" : "low");
        const deadline = parseKoreanDeadline(registrationText, fallbackYear);
        const sourceEventId = slugify([title, date.startsOn ?? dateText ?? url].join(" "));
        const dedupeKey = `${organizationId}:${title}:${date.startsOn ?? dateText ?? url}`;

        if (seenInSource.has(dedupeKey)) {
          continue;
        }
        seenInSource.add(dedupeKey);

        const location = inferLocation(locationTexts);
        const tags = inferTags(title, detailTexts, url);

        sourceEvents.push(
          createScheduleDraft({
            organizationId,
            organizationName,
            organizationShortName,
            title,
            seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : fallbackYear,
            date,
            registration: {
              closesAt: deadline,
              status: deadline && Date.parse(deadline) < Date.now() ? "closed" : "unknown",
              registrationUrl,
              rawText: registrationText,
              confidence: deadline ? "medium" : "low",
            },
            location,
            divisions: extractDivisions(divisionText),
            tags,
            flags: {
              natural: /내추럴|natural/i.test(`${title} ${detailTexts.join(" ")}`),
              proQualifier: /프로\s*퀄리파이어|qualifier/i.test(`${title} ${url}`),
              proCard: /프로\s*카드/i.test(detailTexts.join(" ")),
              international: /필리핀|마닐라|olympia|올림피아/i.test(`${title} ${detailTexts.join(" ")}`),
            },
            source: createSourceSnapshot({
              sourceType: "official-homepage",
              sourceUrl: url,
              detailUrl: registrationUrl ?? url,
              sourceEventId,
              fetchedAt,
              parserName: PARSER_NAME,
              rawHtml: card.html() ?? "",
              rawTitle: title,
              rawDateText: dateText,
              rawLocationText: location.rawText,
              rawRegistrationText: registrationText,
            }),
            confidence: date.startsOn && location.rawText ? "medium" : "low",
            qualityIssues:
              date.startsOn && location.rawText
                ? []
                : [
                    {
                      field: date.startsOn ? "location" : "date",
                      severity: "warning",
                      message: "Elementor 카드에서 일부 일정 필드를 안정적으로 확인하지 못했습니다.",
                    },
                  ],
          }),
        );
      }

      if (sourceEvents.length === 0) {
        warnings.push("h4 Elementor 제목 기반 일정 카드를 찾지 못했습니다.");
      }

      events.push(...sourceEvents);

      const sourceOrganizationIds = Array.from(
        new Set(sourceEvents.map((event) => event.organizationId)),
      );
      const sourceSummaries =
        sourceOrganizationIds.length > 0 ? sourceOrganizationIds : ["npc-ifbb-pro-korea"];

      for (const organizationId of sourceSummaries) {
        sources.push({
          organizationId,
          organizationName: organizationId === "agp" ? "AGP" : "NPC/IFBB Pro Korea",
          url,
          ok: true,
          count: sourceEvents.filter((event) => event.organizationId === organizationId).length,
          warnings,
          fetchedAt,
        });
      }
    } catch (error) {
      errors.push({ url, message: getErrorMessage(error) });
      sources.push({
        organizationId: "npc-ifbb-pro-korea",
        organizationName: "NPC/IFBB Pro Korea/AGP",
        url,
        ok: false,
        count: 0,
        warnings: ["fetch 또는 파싱에 실패했습니다."],
      });
    }
  }

  return { sources, events, errors };
}

function findElementorCard($: cheerio.CheerioAPI, heading: Parameters<cheerio.CheerioAPI>[0]) {
  const parents = $(heading).parents(".e-con, .elementor-element").toArray();
  const card = parents.find((parent) => $(parent).find(".elementor-icon-list-text").length >= 2);

  return card ? $(card) : $(heading).parent();
}

function findRegistrationUrl(
  $: cheerio.CheerioAPI,
  card: ReturnType<cheerio.CheerioAPI>,
  baseUrl: string,
): string | undefined {
  const href = card
    .find("a")
    .toArray()
    .map((link) => ({
      href: $(link).attr("href"),
      text: cleanText($(link).text()),
    }))
    .find((link) => /참가|신청|register|apply/i.test(link.text))?.href;

  return absoluteUrl(href, baseUrl);
}

function isEventTitle(title: string): boolean {
  if (!title || title.length < 3) {
    return false;
  }

  if (/(대회 일정|copyright|IFBB PRO KOREA|참가 신청|대회 장소|일정$)/i.test(title)) {
    return false;
  }

  return /(NPC|IFBB|AGP|올림피아|프로|리저널|코리아|Natural|Regional|Olympia)/i.test(title);
}

function isDateLike(text: string): boolean {
  return (
    /((?:20\d{2}[.\-/년]\s*)?\d{1,2}\s*월\s*\d{1,2}\s*(?:일|[~\-–]\s*(?:(?:\d{1,2}\s*월\s*)?\d{1,2})\s*일?)|20\d{2}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2})/.test(
      text,
    ) && !/마감/.test(text)
  );
}

function isLocationLike(text: string): boolean {
  return /(서울|부산|대구|인천|광주|대전|울산|세종|경기도|강원|충청|전라|경상|제주|파주시|잠실|마닐라|필리핀|홀|센터|호텔|체육관|아레나|컨벤션|장소)/.test(
    text,
  );
}

function inferOrganizationId(
  title: string,
  details: string,
  sourceUrl: string,
): CompetitionOrganizationId {
  return /AGP/i.test(`${title} ${details} ${sourceUrl}`) ? "agp" : "npc-ifbb-pro-korea";
}

function inferTags(title: string, details: string[], sourceUrl: string): string[] {
  const text = `${title} ${details.join(" ")} ${sourceUrl}`;
  const tags = ["NPC", "IFBB"];

  if (/AGP/i.test(text)) {
    tags.push("AGP");
  }
  if (/내추럴|natural/i.test(text)) {
    tags.push("내추럴");
  }
  if (/프로\s*퀄리파이어|qualifier/i.test(text)) {
    tags.push("프로 퀄리파이어");
  }
  if (/프로\s*카드/i.test(text)) {
    tags.push("프로카드");
  }

  return tags;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
