import type { CompetitionOrganizationId, CompetitionScheduleDraft } from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
import { crawlFitSchedule } from "./fitschedule";
import type { CrawlerResult } from "./types";
import {
  cleanText,
  createScheduleDraft,
  createSourceSnapshot,
  fetchHtml,
  inferLocation,
  rawHash,
  uniqueTexts,
} from "./utils";

const FITSCHEDULE_URL = "https://www.fitschedule.co.kr/";
const KISMOS_KCL_URL = "https://kismos.co.kr/product/list.html?cate_no=822";

const PARSER_NAME = "candidate-source-monitor";

const KCLASSIC_RELATED_ORGANIZATIONS = [
  {
    id: "j-classic",
    name: "J-Classic",
    warning:
      "K-Classic/KISMOS 계열 소스로 감시 중이나 현재 공개 HTML에서 J-Classic 2026 일정 상품은 확인되지 않았습니다.",
  },
  {
    id: "ssa-korea",
    name: "SSA Korea",
    warning:
      "K-Classic/KISMOS 계열 소스로 감시 중이나 현재 공개 HTML에서 SSA Korea 2026 일정 상품은 확인되지 않았습니다.",
  },
  {
    id: "wff-korea",
    name: "WFF Korea",
    warning:
      "K-Classic/KISMOS 계열 소스로 감시 중이나 현재 공개 HTML에서 WFF Korea 2026 일정 상품은 확인되지 않았습니다.",
  },
] as const satisfies ReadonlyArray<{
  id: CrawlOrganizationId;
  name: string;
  warning: string;
}>;

export async function crawlAgonas(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (selectedOrganizationIds && !selectedOrganizationIds.includes("agonas")) {
    return { sources: [], events: [], errors: [] };
  }

  const fitScheduleResult = await crawlFitSchedule();
  const events = fitScheduleResult.events
    .filter((event) => /아고나스|agonas/i.test(`${event.title} ${event.tags.join(" ")}`))
    .map(toAgonasEvent);
  const errors = fitScheduleResult.errors.map((error) => ({
    ...error,
    message: `아고나스 후보 수집 중 보조 소스 오류: ${error.message}`,
  }));
  const sourceWarnings = [
    "보조 데이터에서 아고나스 후보 일정을 필터링했습니다.",
    "공식 단체 홈페이지가 아닌 보조 집계 소스이므로 sourceType은 aggregator로 두고 reviewStatus는 needs-review로 유지합니다.",
    "Naver Cafe 상세/접수 링크는 registration.registrationUrl 및 source.detailUrl에 보존합니다.",
  ];

  if (events.length === 0) {
    sourceWarnings.push("보조 payload에서 아고나스 후보 일정을 찾지 못했습니다.");
  }

  return {
    sources: [
      {
        organizationId: "agonas",
        organizationName: "아고나스",
        url: FITSCHEDULE_URL,
        ok: fitScheduleResult.sources.some((source) => source.url === FITSCHEDULE_URL && source.ok),
        count: events.length,
        warnings: sourceWarnings,
        fetchedAt: fitScheduleResult.sources.find((source) => source.url === FITSCHEDULE_URL)
          ?.fetchedAt,
      },
    ],
    events,
    errors,
  };
}

export async function crawlIcnKorea(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (selectedOrganizationIds && !selectedOrganizationIds.includes("icn-korea")) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { fetchedAt } = await fetchHtml(FITSCHEDULE_URL);
    sources.push({
      organizationId: "icn-korea",
      organizationName: "ICN Korea",
      url: FITSCHEDULE_URL,
      ok: true,
      count: 0,
      warnings: [
        "현재 보조 공개 payload에서 ICN Korea 2026 일정 후보를 찾지 못했습니다.",
        "공식 일정 페이지 또는 공식 SNS/접수 앱 URL이 확인되면 별도 공식 소스 크롤러로 승격해야 합니다.",
      ],
      fetchedAt,
    });
  } catch (error) {
    errors.push({ url: FITSCHEDULE_URL, message: getErrorMessage(error) });
    sources.push({
      organizationId: "icn-korea",
      organizationName: "ICN Korea",
      url: FITSCHEDULE_URL,
      ok: false,
      count: 0,
      warnings: ["ICN Korea 후보 감시용 보조 소스 fetch에 실패했습니다."],
    });
  }

  return { sources, events: [], errors };
}

export async function crawlKclassicRelatedCandidates(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  const selectedIds = new Set(selectedOrganizationIds ?? []);
  const organizations = KCLASSIC_RELATED_ORGANIZATIONS.filter(
    (organization) => selectedIds.size === 0 || selectedIds.has(organization.id),
  );

  if (organizations.length === 0) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(KISMOS_KCL_URL);
    const foundTerms = {
      jClassic: /J[-\s]?Classic|제이클래식/i.test(html),
      ssa: /\bSSA\s*Korea\b|에스에스에이/i.test(html),
      wff: /\bWFF\s*Korea\b|더블유에프에프/i.test(html),
    };

    for (const organization of organizations) {
      sources.push({
        organizationId: organization.id,
        organizationName: organization.name,
        url: KISMOS_KCL_URL,
        ok: true,
        count: 0,
        warnings: [
          organization.warning,
          `현재 키워드 감지 결과: J-Classic=${foundTerms.jClassic}, SSA Korea=${foundTerms.ssa}, WFF Korea=${foundTerms.wff}`,
          "KISMOS 2026 KCL 상품 카테고리는 K-Classic 수집에는 유효하지만 이 후보들의 일정 이벤트로 정규화할 상품은 아직 없습니다.",
        ],
        fetchedAt,
      });
    }
  } catch (error) {
    const message = getErrorMessage(error);
    errors.push({ url: KISMOS_KCL_URL, message });

    for (const organization of organizations) {
      sources.push({
        organizationId: organization.id,
        organizationName: organization.name,
        url: KISMOS_KCL_URL,
        ok: false,
        count: 0,
        warnings: [`${organization.name} 후보 감시용 KISMOS fetch에 실패했습니다.`],
      });
    }
  }

  return { sources, events: [], errors };
}

function toAgonasEvent(event: CompetitionScheduleDraft): CompetitionScheduleDraft {
  const fetchedAt = event.source.fetchedAt;
  const detailUrl = event.source.detailUrl ?? event.registration.registrationUrl;
  const sourceEventId = `agonas:${event.source.sourceEventId ?? rawHash(event.title)}`;
  const rawLocationText = cleanText(event.location.rawText);
  const location = rawLocationText
    ? {
        ...inferLocation([rawLocationText]),
        rawText: rawLocationText,
        confidence: "medium" as const,
      }
    : event.location;

  return createScheduleDraft({
    organizationId: "agonas" satisfies CompetitionOrganizationId,
    organizationName: "아고나스",
    organizationShortName: "AGONAS",
    title: event.title,
    seasonYear: event.seasonYear,
    date: {
      ...event.date,
      confidence: event.date.startsOn ? "medium" : "low",
    },
    registration: {
      ...event.registration,
      registrationUrl: detailUrl,
      confidence: event.registration.closesAt ? "medium" : "low",
    },
    location,
    divisions: event.divisions,
    tags: uniqueTexts(["아고나스", "Naver Cafe", ...event.tags.filter((tag) => tag !== "FitSchedule")]),
    flags: {
      ...event.flags,
    },
    media: event.media,
    source: createSourceSnapshot({
      sourceType: "aggregator",
      sourceUrl: FITSCHEDULE_URL,
      detailUrl,
      sourceEventId,
      sourceUpdatedAt: event.source.sourceUpdatedAt,
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: JSON.stringify({
        title: event.title,
        date: event.date,
        location: event.location,
        detailUrl,
      }),
      rawTitle: event.source.rawTitle ?? event.title,
      rawDateText: event.date.rawText,
      rawLocationText,
      rawRegistrationText: event.registration.rawText,
    }),
    confidence: "low",
    qualityIssues: [
      ...event.qualityIssues,
      {
        field: "source",
        severity: "warning",
        message: "공식 홈페이지가 아닌 보조 소스/Naver Cafe 기반 후보 데이터입니다.",
      },
    ],
    notes:
      "아고나스 후보 일정입니다. 보조 집계값과 Naver Cafe 링크를 보존했으며, 공식 원본 확인 후 승인해야 합니다.",
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
