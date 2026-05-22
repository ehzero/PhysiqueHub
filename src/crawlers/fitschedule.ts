import type {
  CompetitionDateRange,
  CompetitionRegistrationStatus,
  CompetitionScheduleDraft,
} from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
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

const FITSCHEDULE_SOURCE = {
  organizationId: "fitschedule",
  organizationName: "FitSchedule",
  organizationShortName: "FitSchedule",
  url: "https://www.fitschedule.co.kr/",
} as const;

const PARSER_NAME = "fitschedule-next-preview";

interface FitScheduleCompetition {
  title?: string;
  date?: string;
  dateEnd?: string;
  deadline?: string;
  venue?: string;
  qualification?: string;
  proCards?: string;
  sourceUrl?: string;
  supplementUrl?: string;
  sourceId?: string;
  sourceTier?: string;
  sourceName?: string;
  officialUrl?: string;
  id?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  adminNote?: string;
  posterUrl?: string;
}

export async function crawlFitSchedule(
  selectedOrganizationIds?: CrawlOrganizationId[],
): Promise<CrawlerResult> {
  if (
    selectedOrganizationIds &&
    !selectedOrganizationIds.includes(FITSCHEDULE_SOURCE.organizationId)
  ) {
    return { sources: [], events: [], errors: [] };
  }

  const sources: CrawlerResult["sources"] = [];
  const errors: CrawlerResult["errors"] = [];

  try {
    const { html, fetchedAt } = await fetchHtml(FITSCHEDULE_SOURCE.url);
    const competitions = extractCompetitions(html);
    const events = competitions.map((competition) => createFitScheduleEvent(competition, fetchedAt));
    const warnings = [
      "FitSchedule은 공식 단체가 아닌 일정 집계 서비스입니다. 공식 원본 검증/누락 탐지용 보조 데이터로만 사용합니다.",
      "Next.js HTML에 포함된 competitions payload를 파싱합니다.",
      "원본 공식 URL은 source.detailUrl 및 registration.registrationUrl에 보존합니다.",
    ];

    if (events.length === 0) {
      warnings.push("HTML payload에서 수집 가능한 competitions 데이터를 찾지 못했습니다.");
    }

    sources.push({
      organizationId: FITSCHEDULE_SOURCE.organizationId,
      organizationName: FITSCHEDULE_SOURCE.organizationName,
      url: FITSCHEDULE_SOURCE.url,
      ok: true,
      count: events.length,
      warnings,
      fetchedAt,
    });

    return { sources, events, errors };
  } catch (error) {
    errors.push({ url: FITSCHEDULE_SOURCE.url, message: getErrorMessage(error) });
    sources.push({
      organizationId: FITSCHEDULE_SOURCE.organizationId,
      organizationName: FITSCHEDULE_SOURCE.organizationName,
      url: FITSCHEDULE_SOURCE.url,
      ok: false,
      count: 0,
      warnings: ["FitSchedule fetch 또는 Next.js payload 파싱에 실패했습니다."],
    });

    return { sources, events: [], errors };
  }
}

function extractCompetitions(html: string): FitScheduleCompetition[] {
  const start = html.indexOf('\\"competitions\\":[');
  const end = html.indexOf(',\\"platforms\\":[', start);

  if (start < 0 || end < 0 || end <= start) {
    return [];
  }

  const escapedPayload = html.slice(start, end);
  const decodedPayload = JSON.parse(`"${escapedPayload}"`) as string;
  const payload = JSON.parse(`{${decodedPayload}}`) as {
    competitions?: FitScheduleCompetition[];
  };

  return (payload.competitions ?? []).filter((competition) =>
    Boolean(cleanText(competition.title) && cleanText(competition.date)),
  );
}

function createFitScheduleEvent(
  competition: FitScheduleCompetition,
  fetchedAt: string,
): CompetitionScheduleDraft {
  const title = cleanText(competition.title);
  const date = parseDateRange(competition);
  const deadline = cleanText(competition.deadline);
  const closesAt = deadline ? `${deadline}T23:59:00+09:00` : undefined;
  const location = competition.venue
    ? {
        ...inferLocation([competition.venue]),
        rawText: cleanText(competition.venue),
        confidence: "medium" as const,
      }
    : {
        country: "KR",
        confidence: "low" as const,
      };
  const detailUrl = cleanText(competition.supplementUrl) || cleanText(competition.sourceUrl);
  const qualityIssues = [];

  if (!date.startsOn) {
    qualityIssues.push({
      field: "date" as const,
      severity: "warning" as const,
      message: "FitSchedule payload의 date 값을 안정적으로 파싱하지 못했습니다.",
    });
  }

  if (!competition.venue) {
    qualityIssues.push({
      field: "location" as const,
      severity: "warning" as const,
      message: "FitSchedule payload에 venue 값이 없습니다.",
    });
  }

  return createScheduleDraft({
    organizationId: FITSCHEDULE_SOURCE.organizationId,
    organizationName: FITSCHEDULE_SOURCE.organizationName,
    organizationShortName: FITSCHEDULE_SOURCE.organizationShortName,
    title,
    seasonYear: date.startsOn ? Number(date.startsOn.slice(0, 4)) : 2026,
    date,
    registration: {
      closesAt,
      status: inferStatusFromDeadline(closesAt),
      registrationUrl: detailUrl || cleanText(competition.officialUrl) || undefined,
      rawText: deadline ? `접수 마감: ${deadline}` : undefined,
      confidence: deadline ? "medium" : "low",
    },
    location,
    divisions: [],
    tags: uniqueTexts([
      "FitSchedule",
      cleanText(competition.sourceName),
      cleanText(competition.sourceId),
      cleanText(competition.sourceTier),
    ]),
    flags: {
      natural: /natural|내추럴|wnbf|npca|wngp/i.test(
        `${title} ${competition.sourceId ?? ""}`,
      ),
      proCard: /프로카드|pro card/i.test(`${title} ${competition.proCards ?? ""}`),
      nationalTeamRoute: /대표|전국체육|전국체전/i.test(title),
      international: /international|asia|asian|world|olympia|국제/i.test(
        `${title} ${competition.sourceTier ?? ""}`,
      ),
    },
    media: {
      posterImageUrl: cleanText(competition.posterUrl) || undefined,
      imageSourceUrl: detailUrl || undefined,
    },
    source: createSourceSnapshot({
      sourceType: "aggregator",
      sourceUrl: FITSCHEDULE_SOURCE.url,
      detailUrl: detailUrl || undefined,
      sourceEventId: cleanText(competition.id) || rawHash(`${title}:${date.rawText}`),
      sourceUpdatedAt: cleanText(competition.updatedAt) || undefined,
      fetchedAt,
      parserName: PARSER_NAME,
      rawHtml: JSON.stringify(competition),
      rawTitle: title,
      rawDateText: date.rawText,
      rawLocationText: cleanText(competition.venue) || undefined,
      rawRegistrationText: deadline || undefined,
    }),
    confidence: "medium",
    qualityIssues,
    notes:
      "FitSchedule 집계 데이터를 공식 원본 누락 탐지용으로 수집한 preview 데이터입니다. 운영 노출/저장 시 공식 URL과 교차 검수해야 합니다.",
  });
}

function parseDateRange(competition: FitScheduleCompetition): CompetitionDateRange {
  const startsOn = cleanText(competition.date);
  const endsOn = cleanText(competition.dateEnd);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) {
    return {
      timezone: "Asia/Seoul",
      rawText: startsOn || undefined,
      confidence: startsOn ? "low" : "low",
    };
  }

  return {
    startsOn,
    endsOn: /^\d{4}-\d{2}-\d{2}$/.test(endsOn) ? endsOn : undefined,
    timezone: "Asia/Seoul",
    rawText: endsOn ? `${startsOn} ~ ${endsOn}` : startsOn,
    confidence: "high",
  };
}

function inferStatusFromDeadline(closesAt: string | undefined): CompetitionRegistrationStatus {
  if (!closesAt) {
    return "unknown";
  }

  return Date.parse(closesAt) < Date.now() ? "closed" : "open";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
