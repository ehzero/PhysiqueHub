import * as cheerio from "cheerio";
import type {
  CompetitionDivision,
  CompetitionMoney,
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

const UNMO_BASE_URL = "https://unmo.kr/shop/tournament.php";
const PARSER_NAME = "musa-wngp-bob-anbc-registration-preview";
const UNMO_ORGANIZATION_IDS = ["musa", "wngp", "bob", "anbc"] as const;

interface UnmoListItem {
  title: string;
  detailUrl: string;
  listUrl: string;
  organizationId: Extract<CompetitionOrganizationId, "musa" | "wngp" | "bob" | "anbc">;
  fee?: CompetitionMoney;
  sourceEventId?: string;
  rawHtml: string;
}

interface UnmoDetailData {
  title: string;
  fee?: CompetitionMoney;
  dateText?: string;
  locationText?: string;
  registrationClosesAt?: string;
  divisions: CompetitionDivision[];
  rawHtml: string;
  fetchedAt: string;
}

export async function crawlUnmo(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  const targetIds = new Set(
    (selectedOrganizationIds?.filter((id) =>
      UNMO_ORGANIZATION_IDS.includes(id as (typeof UNMO_ORGANIZATION_IDS)[number]),
    ) as UnmoListItem["organizationId"][] | undefined) ?? UNMO_ORGANIZATION_IDS,
  );
  const sources: CrawlerResult["sources"] = [];
  const events: CompetitionScheduleDraft[] = [];
  const errors: CrawlerResult["errors"] = [];
  const listItems: UnmoListItem[] = [];
  const listUrls = await getListUrls();

  for (const listUrl of listUrls) {
    const sourceWarnings = [
      "공개 대회접수 목록/상세만 preview로 수집합니다. 사이트 하단의 스크래핑 금지 문구가 있어 운영 전 허가 검토가 필요합니다.",
    ];

    try {
      const { html, fetchedAt } = await fetchHtml(listUrl);
      const $ = cheerio.load(html);
      const pageItems = extractListItems($, listUrl).filter((item) =>
        targetIds.has(item.organizationId),
      );

      listItems.push(...pageItems);
      sources.push(...createSourceSummaries(listUrl, pageItems, sourceWarnings, fetchedAt));
    } catch (error) {
      errors.push({ url: listUrl, message: getErrorMessage(error) });
      for (const organizationId of targetIds) {
        sources.push({
          organizationId,
          organizationName: getOrganizationName(organizationId),
          url: listUrl,
          ok: false,
          count: 0,
          warnings: ["목록 fetch 또는 파싱에 실패했습니다."],
        });
      }
    }
  }

  const uniqueItems = dedupeListItems(listItems);
  for (let index = 0; index < uniqueItems.length; index += 1) {
    const item = uniqueItems[index];

    if (index > 0) {
      await waitBeforeNextDetailRequest();
    }

    const detail = await fetchUnmoDetail(item).catch((error: unknown) => {
      errors.push({ url: item.detailUrl, message: getErrorMessage(error) });
      return undefined;
    });

    events.push(createUnmoEvent(item, detail));
  }

  return { sources, events, errors };
}

async function getListUrls(): Promise<string[]> {
  const { html } = await fetchHtml(UNMO_BASE_URL);
  const $ = cheerio.load(html);
  const pages = $("a.pg_page")
    .toArray()
    .map((link) => absoluteUrl($(link).attr("href"), UNMO_BASE_URL))
    .filter(Boolean) as string[];

  return uniqueTexts([UNMO_BASE_URL, ...pages]).sort((a, b) => {
    return getPageNumber(a) - getPageNumber(b);
  });
}

function extractListItems($: cheerio.CheerioAPI, listUrl: string): UnmoListItem[] {
  return $("a[href*='tournament_view.php?index_no=']")
    .toArray()
    .map((link) => {
      const href = absoluteUrl($(link).attr("href"), listUrl);
      const card = $(link).closest("li");
      const title = cleanText(card.find(".pname").first().text());
      const organizationId = inferUnmoOrganizationId(title);

      if (!href || !title || !organizationId || !isUnmoCompetitionTitle(title)) {
        return undefined;
      }

      return {
        title,
        detailUrl: href,
        listUrl,
        organizationId,
        fee: parseKrwMoney(card.find(".price").first().text()),
        sourceEventId: sourceEventIdFromUrl(href) ?? rawHash(href),
        rawHtml: card.html() ?? "",
      };
    })
    .filter(Boolean) as UnmoListItem[];
}

async function fetchUnmoDetail(item: UnmoListItem): Promise<UnmoDetailData> {
  const { html, fetchedAt } = await fetchHtml(item.detailUrl);
  const $ = cheerio.load(html);
  const fieldMap = extractDetailFieldMap($);
  const title = cleanText($("meta[property='og:title']").attr("content")) || item.title;
  const optionTexts = $("#it_option_1 option")
    .toArray()
    .map((option) => cleanText($(option).text()))
    .filter((text) => text && !/선택|추가\s*신청자|추가종목|^-+$/.test(text));

  return {
    title: title.replace(/\s*\|\s*운동의모든것.*$/, ""),
    fee: parseKrwMoney(fieldMap.get("대회출전비")) ?? item.fee,
    dateText: fieldMap.get("대회일자"),
    locationText: fieldMap.get("대회장소"),
    registrationClosesAt: parseTargetDate(html),
    divisions: optionTexts.map((name) => ({
      name,
      group: inferDivisionGroup(name),
      rawText: name,
    })),
    rawHtml: $(".vi_txt_bx").first().html() ?? html,
    fetchedAt,
  };
}

function createUnmoEvent(
  item: UnmoListItem,
  detail: UnmoDetailData | undefined,
): CompetitionScheduleDraft {
  const title = detail?.title || item.title;
  const date = parseKoreanDateRange(detail?.dateText, 2026, detail?.dateText ? "high" : "low");
  const location = detail?.locationText
    ? {
        ...inferLocation([detail.locationText]),
        rawText: detail.locationText,
      }
    : { country: "KR", confidence: "low" as const };
  const fee = detail?.fee ?? item.fee;
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "UNMO 상세에서 대회 일자를 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!detail?.locationText) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "UNMO 상세에서 장소를 안정적으로 파싱하지 못했습니다.",
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
    organizationName: getOrganizationName(item.organizationId),
    organizationShortName: item.organizationId.toUpperCase(),
    title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : 2026,
    date,
    registration: {
      closesAt: detail?.registrationClosesAt,
      status:
        detail?.registrationClosesAt && Date.parse(detail.registrationClosesAt) < Date.now()
          ? "closed"
          : "unknown",
      fee,
      registrationUrl: item.detailUrl,
      rawText: detail?.registrationClosesAt
        ? `접수 마감: ${detail.registrationClosesAt}`
        : undefined,
      confidence: detail?.registrationClosesAt || fee ? "medium" : "low",
    },
    location,
    divisions: detail?.divisions ?? [],
    tags: uniqueTexts([
      item.organizationId.toUpperCase(),
      ...(item.organizationId === "wngp" ? ["내추럴"] : []),
    ]),
    flags: {
      natural: item.organizationId === "wngp",
      proQualifier: /프로\s*퀄리파이어|프로카드/i.test(title),
      proCard: /프로카드/i.test(title),
      rookieClass: /비기너|노비스/i.test(detail?.divisions.map((division) => division.name).join(" ") ?? ""),
      international: /일본|홍콩|Japan|Hong Kong/i.test(title),
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
      rawRegistrationText: detail?.registrationClosesAt,
    }),
    qualityIssues,
    notes:
      "운동의모든것 공개 접수 상세 기반 preview입니다. 운영 반영 전 수집 허가/약관 검토가 필요합니다.",
  });
}

function createSourceSummaries(
  listUrl: string,
  pageItems: UnmoListItem[],
  warnings: string[],
  fetchedAt: string,
): CrawlerResult["sources"] {
  const countsByOrganization = new Map<UnmoListItem["organizationId"], number>();

  for (const item of pageItems) {
    countsByOrganization.set(
      item.organizationId,
      (countsByOrganization.get(item.organizationId) ?? 0) + 1,
    );
  }

  return Array.from(countsByOrganization.entries()).map(([organizationId, count]) => ({
    organizationId,
    organizationName: getOrganizationName(organizationId),
    url: listUrl,
    ok: true,
    count,
    warnings,
    fetchedAt,
  }));
}

function extractDetailFieldMap($: cheerio.CheerioAPI): Map<string, string> {
  const fieldMap = new Map<string, string>();

  $(".vi_txt_bx dt").each((_, dt) => {
    const key = normalizeFieldName($(dt).text());
    const value = cleanText($(dt).next("dd").text());

    if (key && value) {
      fieldMap.set(key, value);
    }
  });

  return fieldMap;
}

function inferUnmoOrganizationId(
  title: string,
): UnmoListItem["organizationId"] | undefined {
  if (/^MUSA|MUSA/i.test(title)) {
    return "musa";
  }
  if (/^WNGP|WNGP/i.test(title)) {
    return "wngp";
  }
  if (/^ANBC|ANBC/i.test(title)) {
    return "anbc";
  }
  if (/\bBOB\b|비오비/i.test(title)) {
    return "bob";
  }

  return undefined;
}

function isUnmoCompetitionTitle(title: string): boolean {
  if (/세미나|설명회|교육|아카데미|박사|파트/i.test(title)) {
    return false;
  }

  return /대회|파이널|프로카드|MUSA|WNGP|ANBC|\bBOB\b|비오비/i.test(title);
}

function parseTargetDate(html: string): string | undefined {
  const match = html.match(
    /targetDate\s*=\s*new Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2}),\s*(\d{1,2}),\s*(\d{1,2}),\s*(\d{1,2})\)/,
  );

  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const zeroBasedMonth = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  return `${year}-${String(zeroBasedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+09:00`;
}

function parseKrwMoney(rawText: string | undefined): CompetitionMoney | undefined {
  const raw = cleanText(rawText);
  const amount = Number(raw.replace(/[^\d]/g, ""));

  if (!raw || !Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return {
    currency: "KRW",
    minAmount: amount,
    maxAmount: amount,
    rawText: raw,
  };
}

function inferDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/여자|여성|비키니|웰니스|모노키니/i.test(name)) {
    return "womens";
  }
  if (/남자|남성|멘즈|보디빌딩|피지크|머슬모델/i.test(name)) {
    return "mens";
  }

  return "unknown";
}

function getOrganizationName(organizationId: UnmoListItem["organizationId"]): string {
  switch (organizationId) {
    case "musa":
      return "MUSA";
    case "wngp":
      return "WNGP";
    case "bob":
      return "BOB";
    case "anbc":
      return "ANBC";
  }
}

function normalizeFieldName(value: string): string {
  return cleanText(value).replace(/[\s:：]/g, "");
}

function dedupeListItems(items: UnmoListItem[]): UnmoListItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.detailUrl)) {
      return false;
    }
    seen.add(item.detailUrl);
    return true;
  });
}

function getPageNumber(url: string): number {
  try {
    return Number(new URL(url).searchParams.get("page")) || 1;
  } catch {
    return 1;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
