import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ACTIVE_SESSION_WINDOW_MS = 2 * 60 * 1_000;
const COMPETITION_ACTION_NAMES = [
  "competition_view",
  "registration_link_click",
  "save_competition",
  "share_click",
] as const;

export type AnalyticsMetricFormat = "number" | "percent" | "decimal" | "seconds";

export type AnalyticsMetric = {
  key: string;
  label: string;
  value: number;
  format: AnalyticsMetricFormat;
  meta?: string;
};

export type AnalyticsTableRow = {
  key: string;
  label: string;
  meta?: string;
  count: number;
};

export type AnalyticsSummary = {
  accessModeRows: AnalyticsTableRow[];
  activeSessionCount: number;
  activeVisitorCount: number;
  botMetrics: AnalyticsMetric[];
  botRows: AnalyticsTableRow[];
  botTopPages: AnalyticsTableRow[];
  browserRows: AnalyticsTableRow[];
  channelRows: AnalyticsTableRow[];
  conversionMetrics: AnalyticsMetric[];
  deviceRows: AnalyticsTableRow[];
  end: Date;
  eventRows: AnalyticsTableRow[];
  funnelRows: AnalyticsTableRow[];
  overviewMetrics: AnalyticsMetric[];
  osRows: AnalyticsTableRow[];
  searchQualityMetrics: AnalyticsMetric[];
  start: Date;
  topCompetitions: AnalyticsTableRow[];
  topPages: AnalyticsTableRow[];
  topRegistrationCompetitions: AnalyticsTableRow[];
  topSavedCompetitions: AnalyticsTableRow[];
  topSearches: AnalyticsTableRow[];
  topSharedCompetitions: AnalyticsTableRow[];
  unavailableMessage?: string;
  visitorRows: AnalyticsTableRow[];
  zeroResultSearches: AnalyticsTableRow[];
};

type CompetitionAnalyticsGroupRow = {
  competitionId: string | null;
  _count: {
    _all: number;
  };
};

type CompetitionAnalyticsSummary = {
  id: string;
  organizationName: string;
  organizationShortName: string | null;
  title: string;
};

type EngagementSummaryRow = {
  engagedSessionCount: bigint | number;
  averageActiveSeconds: number | null;
};

type AnalyticsCountInputs = {
  activeSessionCount: number;
  activeVisitorCount: number;
  averageActiveSeconds: number;
  competitionDetailClickCount: number;
  competitionOpenCount: number;
  competitionViewCount: number;
  contactSubmitCount: number;
  emptySearchResultCount: number;
  engagedSessionCount: number;
  filterAppliedCount: number;
  listPageViewCount: number;
  newVisitorCount: number;
  pageViewCount: number;
  registrationClickCount: number;
  returningVisitorCount: number;
  saveCompetitionCount: number;
  searchPerformedCount: number;
  sessionCount: number;
  shareClickCount: number;
  topSearchAverageResultCount: number;
  unsaveCompetitionCount: number;
  visitorCount: number;
  windowSessionCount: number;
};

type CompetitionActionCountMap = Map<string, Map<(typeof COMPETITION_ACTION_NAMES)[number], number>>;

const numberFormatter = new Intl.NumberFormat("ko-KR");

export async function getAnalyticsSummary(start: Date, end: Date): Promise<AnalyticsSummary> {
  try {
    const activeSince = new Date(end.getTime() - ACTIVE_SESSION_WINDOW_MS);
    const eventWindow: Prisma.AnalyticsEventWhereInput = {
      occurredAt: {
        gte: start,
        lte: end,
      },
    };
    const sessionWindow: Prisma.AnalyticsSessionWhereInput = {
      startedAt: {
        gte: start,
        lte: end,
      },
    };
    const humanSessionFilter: Prisma.AnalyticsSessionWhereInput = {
      trafficType: "human",
    };
    const botSessionFilter: Prisma.AnalyticsSessionWhereInput = {
      trafficType: { in: ["bot", "suspected_bot"] },
    };
    const humanSessionWindow: Prisma.AnalyticsSessionWhereInput = {
      AND: [sessionWindow, humanSessionFilter],
    };
    const botSessionWindow: Prisma.AnalyticsSessionWhereInput = {
      AND: [sessionWindow, botSessionFilter],
    };
    const humanEventWindow: Prisma.AnalyticsEventWhereInput = {
      AND: [eventWindow, { session: { is: humanSessionFilter } }],
    };
    const botEventWindow: Prisma.AnalyticsEventWhereInput = {
      AND: [eventWindow, { session: { is: botSessionFilter } }],
    };
    const listPageViewFilter: Prisma.AnalyticsEventWhereInput = {
      OR: [{ path: "/competitions" }, { path: { startsWith: "/competitions?" } }],
    };

    const [
      visitorRows,
      sessionCount,
      pageViewCount,
      listPageViewCount,
      competitionOpenCount,
      competitionDetailClickCount,
      competitionViewCount,
      registrationClickCount,
      shareClickCount,
      saveCompetitionCount,
      unsaveCompetitionCount,
      contactSubmitCount,
      searchPerformedCount,
      filterAppliedCount,
      emptySearchResultCount,
      topPageRows,
      topCompetitionRows,
      topRegistrationCompetitionRows,
      topSharedCompetitionRows,
      topSavedCompetitionRows,
      topSearchRows,
      zeroResultSearchRows,
      channelGroupRows,
      eventGroupRows,
      accessModeGroupRows,
      activeVisitorRows,
      activeSessionCount,
      deviceGroupRows,
      browserGroupRows,
      osGroupRows,
      searchResultAverage,
      engagementSummaryRows,
      botVisitorRows,
      botSessionCount,
      botPageViewCount,
      botNameRows,
      botTopPageRows,
      windowSessionRows,
    ] = await Promise.all([
      prisma.analyticsSession.findMany({
        distinct: ["visitorId"],
        select: { visitorId: true },
        where: humanSessionWindow,
      }),
      prisma.analyticsSession.count({ where: humanSessionWindow }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "page_view" },
      }),
      prisma.analyticsEvent.count({
        where: {
          ...humanEventWindow,
          ...listPageViewFilter,
          name: "page_view",
        },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "competition_open" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "competition_detail_click" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "competition_view" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "registration_link_click" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "share_click" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "save_competition" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "unsave_competition" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "contact_submit_success" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "search_performed" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "filter_applied" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "empty_search_result" },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { ...humanEventWindow, name: "page_view" },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["competitionId"],
        where: {
          ...humanEventWindow,
          name: "competition_view",
          competitionId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { competitionId: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["competitionId"],
        where: {
          ...humanEventWindow,
          name: "registration_link_click",
          competitionId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { competitionId: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["competitionId"],
        where: {
          ...humanEventWindow,
          name: "share_click",
          competitionId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { competitionId: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["competitionId"],
        where: {
          ...humanEventWindow,
          name: "save_competition",
          competitionId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { competitionId: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["searchQuery"],
        where: {
          ...humanEventWindow,
          name: "search_performed",
          searchQuery: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { searchQuery: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["searchQuery"],
        where: {
          ...humanEventWindow,
          name: "empty_search_result",
          searchQuery: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { searchQuery: "desc" } },
        take: 10,
      }),
      prisma.analyticsSession.groupBy({
        by: ["channel", "referrerHost"],
        where: humanSessionWindow,
        _count: { _all: true },
        // id는 non-null PK라 COUNT(id) = 전체 행 수. referrerHost로 정렬하면
        // referrer 없는 그룹(직접 방문)이 COUNT=0으로 밀려 누락된다.
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["name"],
        where: humanEventWindow,
        _count: { _all: true },
        orderBy: { _count: { name: "desc" } },
        take: 10,
      }),
      prisma.analyticsSession.groupBy({
        by: ["displayMode"],
        where: humanSessionWindow,
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.analyticsSession.findMany({
        distinct: ["visitorId"],
        select: { visitorId: true },
        where: {
          AND: [{ lastSeenAt: { gte: activeSince } }, humanSessionFilter],
        },
      }),
      prisma.analyticsSession.count({
        where: {
          AND: [{ lastSeenAt: { gte: activeSince } }, humanSessionFilter],
        },
      }),
      prisma.analyticsSession.groupBy({
        by: ["deviceCategory"],
        where: humanSessionWindow,
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.analyticsSession.groupBy({
        by: ["browserName"],
        where: humanSessionWindow,
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.analyticsSession.groupBy({
        by: ["osName"],
        where: humanSessionWindow,
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.aggregate({
        where: { ...humanEventWindow, name: "search_performed" },
        _avg: { resultCount: true },
      }),
      prisma.$queryRaw<EngagementSummaryRow[]>`
        WITH per_session AS (
          SELECT
            e."sessionId",
            MAX(
              CASE
                WHEN jsonb_typeof(e."propertiesJson"::jsonb -> 'activeSeconds') = 'number'
                  THEN (e."propertiesJson"::jsonb ->> 'activeSeconds')::double precision
                ELSE 0
              END
            ) AS "maxActiveSeconds"
          FROM "AnalyticsEvent" e
          JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
          WHERE e."name" = 'engagement_ping'
            -- propertiesJson은 TEXT라 ::jsonb 캐스트가 비정상 행에서 throw한다.
            -- 객체 형태('{'로 시작)만 캐스트하고, 그래도 깨지는 행은 아래
            -- catch가 격리해 engagement만 0으로 떨어뜨린다(대시보드 전체 보호).
            AND e."propertiesJson" LIKE '{%'
            AND e."occurredAt" >= ${start}
            AND e."occurredAt" <= ${end}
            AND s."trafficType" = 'human'
          GROUP BY e."sessionId"
        )
        SELECT
          COUNT(*)::bigint AS "engagedSessionCount",
          COALESCE(AVG("maxActiveSeconds"), 0)::double precision AS "averageActiveSeconds"
        FROM per_session
      `.catch((error): EngagementSummaryRow[] => {
        console.error("Failed to compute analytics engagement summary", error);
        return [];
      }),
      prisma.analyticsSession.findMany({
        distinct: ["visitorId"],
        select: { visitorId: true },
        where: botSessionWindow,
      }),
      prisma.analyticsSession.count({ where: botSessionWindow }),
      prisma.analyticsEvent.count({
        where: { ...botEventWindow, name: "page_view" },
      }),
      prisma.analyticsSession.groupBy({
        by: ["botName"],
        where: botSessionWindow,
        _count: { _all: true },
        orderBy: { _count: { botName: "desc" } },
        take: 50,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { ...botEventWindow, name: "page_view" },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      // 윈도 내 활동(이벤트 1건 이상) 세션. per-session 비율의 분모로 쓴다.
      // sessionCount(startedAt 기준)와 달리 이벤트 분자와 같은 모집단이라
      // 경계에서 비율이 부풀려지지 않는다.
      prisma.analyticsEvent.findMany({
        distinct: ["sessionId"],
        select: { sessionId: true },
        where: humanEventWindow,
      }),
    ]);

    const visitorIds = visitorRows.map((row) => row.visitorId);
    const returningVisitorRows =
      visitorIds.length > 0
        ? await prisma.analyticsSession.findMany({
            distinct: ["visitorId"],
            select: { visitorId: true },
            where: {
              // 과거에 (분류와 무관하게) 세션이 있었으면 재방문으로 본다. human
              // 필터를 두면 재분류로 과거 세션이 봇이 될 때 재방문율이 흔들린다.
              startedAt: { lt: start },
              visitorId: { in: visitorIds },
            },
          })
        : [];
    const returningVisitorCount = returningVisitorRows.length;
    const newVisitorCount = Math.max(visitorRows.length - returningVisitorCount, 0);
    const accessModeCounts = accessModeGroupRows.reduce(
      (acc, row) => {
        acc[toAccessMode(row.displayMode)] += row._count._all;
        return acc;
      },
      { browser: 0, pwa: 0, unknown: 0 },
    );
    const pwaSessionCount = accessModeCounts.pwa;
    const browserSessionCount = accessModeCounts.browser;
    const engagementSummary = engagementSummaryRows[0];
    const engagedSessionCount = toCount(engagementSummary?.engagedSessionCount);
    const averageActiveSeconds = Number(engagementSummary?.averageActiveSeconds ?? 0);
    const competitionIds = [
      ...topCompetitionRows,
      ...topRegistrationCompetitionRows,
      ...topSharedCompetitionRows,
      ...topSavedCompetitionRows,
    ]
      .map((row) => row.competitionId)
      .filter((id): id is string => Boolean(id));
    const uniqueCompetitionIds = Array.from(new Set(competitionIds));
    const [competitions, competitionActionRows] =
      uniqueCompetitionIds.length > 0
        ? await Promise.all([
            prisma.competitionSchedule.findMany({
              select: {
                id: true,
                organizationShortName: true,
                organizationName: true,
                title: true,
              },
              where: { id: { in: uniqueCompetitionIds } },
            }),
            prisma.analyticsEvent.groupBy({
              by: ["competitionId", "name"],
              where: {
                ...humanEventWindow,
                competitionId: { in: uniqueCompetitionIds },
                name: { in: [...COMPETITION_ACTION_NAMES] },
              },
              _count: { _all: true },
            }),
          ])
        : [[], []];
    const competitionById = new Map(competitions.map((competition) => [competition.id, competition]));
    const competitionActionCounts = toCompetitionActionCountMap(competitionActionRows);
    const counts: AnalyticsCountInputs = {
      activeSessionCount,
      activeVisitorCount: activeVisitorRows.length,
      averageActiveSeconds,
      competitionDetailClickCount,
      competitionOpenCount,
      competitionViewCount,
      contactSubmitCount,
      emptySearchResultCount,
      engagedSessionCount,
      filterAppliedCount,
      listPageViewCount,
      newVisitorCount,
      pageViewCount,
      registrationClickCount,
      returningVisitorCount,
      saveCompetitionCount,
      searchPerformedCount,
      sessionCount,
      shareClickCount,
      topSearchAverageResultCount: searchResultAverage._avg.resultCount ?? 0,
      unsaveCompetitionCount,
      visitorCount: visitorRows.length,
      windowSessionCount: windowSessionRows.length,
    };

    return {
      accessModeRows: [
        {
          key: "browser",
          label: "브라우저",
          meta: toPercentLabel(browserSessionCount, sessionCount),
          count: browserSessionCount,
        },
        {
          key: "pwa",
          label: "PWA",
          meta: toPercentLabel(pwaSessionCount, sessionCount),
          count: pwaSessionCount,
        },
        {
          key: "unknown",
          label: "알 수 없음",
          meta: toPercentLabel(accessModeCounts.unknown, sessionCount),
          count: accessModeCounts.unknown,
        },
      ].filter((row) => row.count > 0),
      activeSessionCount,
      activeVisitorCount: activeVisitorRows.length,
      botMetrics: [
        metric("bot-visitors", "봇 방문자", botVisitorRows.length, "number"),
        metric("bot-sessions", "봇 세션", botSessionCount, "number"),
        metric("bot-pageviews", "봇 페이지뷰", botPageViewCount, "number"),
      ],
      botRows: toBotRows(botNameRows),
      botTopPages: botTopPageRows.map((row) => ({
        key: row.path,
        label: row.path,
        count: row._count._all,
      })),
      browserRows: browserGroupRows.map((row) => ({
        key: row.browserName ?? "unknown",
        label: row.browserName ?? "알 수 없음",
        meta: toPercentLabel(row._count._all, sessionCount),
        count: row._count._all,
      })),
      channelRows: channelGroupRows.map((row) => ({
        key: `${row.channel ?? "unknown"}:${row.referrerHost ?? "none"}`,
        label: toAnalyticsChannelLabel(row.channel),
        meta: row.referrerHost ?? "referrer 없음",
        count: row._count._all,
      })),
      conversionMetrics: getConversionMetrics(counts),
      deviceRows: deviceGroupRows.map((row) => ({
        key: row.deviceCategory ?? "unknown",
        label: toDeviceCategoryLabel(row.deviceCategory),
        meta: toPercentLabel(row._count._all, sessionCount),
        count: row._count._all,
      })),
      end,
      eventRows: eventGroupRows.map((row) => ({
        key: row.name,
        label: toAnalyticsEventLabel(row.name),
        meta: row.name,
        count: row._count._all,
      })),
      funnelRows: getFunnelRows(counts),
      overviewMetrics: getOverviewMetrics(counts),
      osRows: osGroupRows.map((row) => ({
        key: row.osName ?? "unknown",
        label: row.osName ?? "알 수 없음",
        meta: toPercentLabel(row._count._all, sessionCount),
        count: row._count._all,
      })),
      searchQualityMetrics: getSearchQualityMetrics(counts),
      start,
      topCompetitions: toCompetitionRows(
        topCompetitionRows,
        competitionById,
        competitionActionCounts,
        "competition_view",
      ),
      topPages: topPageRows.map((row) => ({
        key: row.path,
        label: row.path,
        count: row._count._all,
      })),
      topRegistrationCompetitions: toCompetitionRows(
        topRegistrationCompetitionRows,
        competitionById,
        competitionActionCounts,
        "registration_link_click",
      ),
      topSavedCompetitions: toCompetitionRows(
        topSavedCompetitionRows,
        competitionById,
        competitionActionCounts,
        "save_competition",
      ),
      topSearches: topSearchRows.map((row) => ({
        key: row.searchQuery ?? "unknown",
        label: row.searchQuery ?? "알 수 없는 검색어",
        count: row._count._all,
      })),
      topSharedCompetitions: toCompetitionRows(
        topSharedCompetitionRows,
        competitionById,
        competitionActionCounts,
        "share_click",
      ),
      visitorRows: [
        {
          key: "new",
          label: "신규 방문자",
          meta: toPercentLabel(newVisitorCount, visitorRows.length),
          count: newVisitorCount,
        },
        {
          key: "returning",
          label: "재방문자",
          meta: toPercentLabel(returningVisitorCount, visitorRows.length),
          count: returningVisitorCount,
        },
      ].filter((row) => row.count > 0),
      zeroResultSearches: zeroResultSearchRows.map((row) => ({
        key: row.searchQuery ?? "unknown",
        label: row.searchQuery ?? "알 수 없는 검색어",
        count: row._count._all,
      })),
    };
  } catch {
    return getEmptyAnalyticsSummary(
      start,
      end,
      "Analytics 테이블을 확인할 수 없습니다. Prisma migration 적용 상태를 확인하세요.",
    );
  }
}

function getEmptyAnalyticsSummary(
  start: Date,
  end: Date,
  unavailableMessage?: string,
): AnalyticsSummary {
  const counts: AnalyticsCountInputs = {
    activeSessionCount: 0,
    activeVisitorCount: 0,
    averageActiveSeconds: 0,
    competitionDetailClickCount: 0,
    competitionOpenCount: 0,
    competitionViewCount: 0,
    contactSubmitCount: 0,
    emptySearchResultCount: 0,
    engagedSessionCount: 0,
    filterAppliedCount: 0,
    listPageViewCount: 0,
    newVisitorCount: 0,
    pageViewCount: 0,
    registrationClickCount: 0,
    returningVisitorCount: 0,
    saveCompetitionCount: 0,
    searchPerformedCount: 0,
    sessionCount: 0,
    shareClickCount: 0,
    topSearchAverageResultCount: 0,
    unsaveCompetitionCount: 0,
    visitorCount: 0,
    windowSessionCount: 0,
  };

  return {
    accessModeRows: [],
    activeSessionCount: 0,
    activeVisitorCount: 0,
    botMetrics: [
      metric("bot-visitors", "봇 방문자", 0, "number"),
      metric("bot-sessions", "봇 세션", 0, "number"),
      metric("bot-pageviews", "봇 페이지뷰", 0, "number"),
    ],
    botRows: [],
    botTopPages: [],
    browserRows: [],
    channelRows: [],
    conversionMetrics: getConversionMetrics(counts),
    deviceRows: [],
    end,
    eventRows: [],
    funnelRows: getFunnelRows(counts),
    overviewMetrics: getOverviewMetrics(counts),
    osRows: [],
    searchQualityMetrics: getSearchQualityMetrics(counts),
    start,
    topCompetitions: [],
    topPages: [],
    topRegistrationCompetitions: [],
    topSavedCompetitions: [],
    topSearches: [],
    topSharedCompetitions: [],
    unavailableMessage,
    visitorRows: [],
    zeroResultSearches: [],
  };
}

function getOverviewMetrics(counts: AnalyticsCountInputs): AnalyticsMetric[] {
  return [
    metric(
      "visitors",
      "방문자",
      counts.visitorCount,
      "number",
      `신규 ${formatCount(counts.newVisitorCount)} / 재방문 ${formatCount(counts.returningVisitorCount)}`,
    ),
    metric("sessions", "세션", counts.sessionCount, "number"),
    metric(
      "active-visitors",
      "활성 사용자",
      counts.activeVisitorCount,
      "number",
      `최근 2분 · 세션 ${formatCount(counts.activeSessionCount)}`,
    ),
    metric(
      "returning-rate",
      "재방문율",
      toRate(counts.returningVisitorCount, counts.visitorCount),
      "percent",
      `${formatCount(counts.returningVisitorCount)} / ${formatCount(counts.visitorCount)}명`,
    ),
    metric(
      "pageviews-per-session",
      "페이지뷰/세션",
      toRatio(counts.pageViewCount, counts.windowSessionCount),
      "decimal",
      `페이지뷰 ${formatCount(counts.pageViewCount)} · 활동 세션 ${formatCount(counts.windowSessionCount)}`,
    ),
    metric(
      "engaged-session-rate",
      "참여 세션율",
      toRate(counts.engagedSessionCount, counts.windowSessionCount),
      "percent",
      `ping 세션 ${formatCount(counts.engagedSessionCount)} / 활동 세션 ${formatCount(counts.windowSessionCount)}`,
    ),
    metric(
      "average-active-seconds",
      "평균 활성 시간",
      counts.averageActiveSeconds,
      "seconds",
      "engagement ping 기준",
    ),
  ];
}

function getFunnelRows(counts: AnalyticsCountInputs): AnalyticsTableRow[] {
  return [
    {
      key: "list-page-view",
      label: "목록 조회",
      meta: "대회 목록 페이지뷰",
      count: counts.listPageViewCount,
    },
    {
      key: "competition-open",
      label: "대회 드로어 열기",
      meta: `목록 조회 대비 ${toPercentLabel(counts.competitionOpenCount, counts.listPageViewCount)} · 상호작용 기준`,
      count: counts.competitionOpenCount,
    },
    {
      key: "competition-detail-click",
      label: "드로어 상세 클릭",
      meta: `드로어 대비 ${toPercentLabel(counts.competitionDetailClickCount, counts.competitionOpenCount)}`,
      count: counts.competitionDetailClickCount,
    },
    {
      key: "competition-view",
      label: "상세 페이지 조회",
      meta: `상세 클릭 대비 ${toPercentLabel(counts.competitionViewCount, counts.competitionDetailClickCount)} · 직접 진입 포함`,
      count: counts.competitionViewCount,
    },
    {
      key: "registration-link-click",
      label: "접수 링크 클릭",
      meta: `상세 조회 대비 ${toPercentLabel(counts.registrationClickCount, counts.competitionViewCount)}`,
      count: counts.registrationClickCount,
    },
  ];
}

function getConversionMetrics(counts: AnalyticsCountInputs): AnalyticsMetric[] {
  return [
    metric(
      "registration-intent-rate",
      "접수 의도율",
      toRate(counts.registrationClickCount, counts.competitionViewCount),
      "percent",
      `${formatCount(counts.registrationClickCount)} / 상세 ${formatCount(counts.competitionViewCount)}`,
    ),
    metric(
      "save-rate",
      "저장률",
      toRate(counts.saveCompetitionCount, counts.competitionViewCount),
      "percent",
      `저장 ${formatCount(counts.saveCompetitionCount)} · 해제 ${formatCount(counts.unsaveCompetitionCount)}`,
    ),
    metric(
      "share-rate",
      "공유율",
      toRate(counts.shareClickCount, counts.competitionViewCount),
      "percent",
      `공유 ${formatCount(counts.shareClickCount)}`,
    ),
    metric(
      "contact-conversion-rate",
      "문의 전환율",
      toRate(counts.contactSubmitCount, counts.windowSessionCount),
      "percent",
      `문의 제출 ${formatCount(counts.contactSubmitCount)} / 활동 세션 ${formatCount(counts.windowSessionCount)}`,
    ),
  ];
}

function getSearchQualityMetrics(counts: AnalyticsCountInputs): AnalyticsMetric[] {
  const searchAndFilterCount = counts.searchPerformedCount + counts.filterAppliedCount;

  return [
    metric("searches", "검색 수", counts.searchPerformedCount, "number"),
    metric("filters", "필터 적용", counts.filterAppliedCount, "number"),
    metric("zero-results", "0건 결과", counts.emptySearchResultCount, "number"),
    metric(
      "zero-result-rate",
      "0건 결과율",
      toRate(counts.emptySearchResultCount, searchAndFilterCount),
      "percent",
      `검색·필터 ${formatCount(searchAndFilterCount)}회(상호작용) 기준`,
    ),
    metric(
      "average-search-results",
      "평균 검색 결과",
      counts.topSearchAverageResultCount,
      "decimal",
      "search_performed resultCount 평균",
    ),
  ];
}

function metric(
  key: string,
  label: string,
  value: number,
  format: AnalyticsMetricFormat,
  meta?: string,
): AnalyticsMetric {
  return { key, label, value, format, meta };
}

function toBotRows(
  rows: Array<{
    botName: string | null;
    _count: { _all: number };
  }>,
): AnalyticsTableRow[] {
  return rows
    .map((row) => ({
      key: row.botName ?? "unknown_bot",
      label: row.botName ?? "알 수 없는 봇",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 10);
}

function toCompetitionRows(
  rows: CompetitionAnalyticsGroupRow[],
  competitionById: Map<string, CompetitionAnalyticsSummary>,
  actionCounts: CompetitionActionCountMap,
  primaryAction: (typeof COMPETITION_ACTION_NAMES)[number],
): AnalyticsTableRow[] {
  return rows.map((row) => {
    const competition = row.competitionId ? competitionById.get(row.competitionId) : null;
    const metaParts = [
      competition?.organizationShortName ?? competition?.organizationName ?? row.competitionId,
      ...toCompetitionActionMeta(row.competitionId, actionCounts, primaryAction),
    ].filter((part): part is string => Boolean(part));

    return {
      key: row.competitionId ?? "unknown",
      label: competition?.title ?? row.competitionId ?? "알 수 없는 대회",
      meta: metaParts.length > 0 ? metaParts.join(" · ") : undefined,
      count: row._count._all,
    };
  });
}

function toCompetitionActionMeta(
  competitionId: string | null,
  actionCounts: CompetitionActionCountMap,
  primaryAction: (typeof COMPETITION_ACTION_NAMES)[number],
) {
  if (!competitionId) return [];

  const counts = actionCounts.get(competitionId);
  if (!counts) return [];

  return COMPETITION_ACTION_NAMES.filter((action) => action !== primaryAction)
    .map((action) => {
      const count = counts.get(action);
      if (!count) return null;
      return `${toCompetitionActionLabel(action)} ${formatCount(count)}`;
    })
    .filter((item): item is string => Boolean(item));
}

function toCompetitionActionCountMap(
  rows: Array<{
    competitionId: string | null;
    name: string;
    _count: { _all: number };
  }>,
): CompetitionActionCountMap {
  const counts: CompetitionActionCountMap = new Map();

  for (const row of rows) {
    if (!row.competitionId || !isCompetitionActionName(row.name)) continue;

    const competitionCounts = counts.get(row.competitionId) ?? new Map();
    competitionCounts.set(row.name, row._count._all);
    counts.set(row.competitionId, competitionCounts);
  }

  return counts;
}

function isCompetitionActionName(value: string): value is (typeof COMPETITION_ACTION_NAMES)[number] {
  return COMPETITION_ACTION_NAMES.some((name) => name === value);
}

function toCompetitionActionLabel(value: (typeof COMPETITION_ACTION_NAMES)[number]) {
  if (value === "competition_view") return "상세";
  if (value === "registration_link_click") return "접수";
  if (value === "save_competition") return "저장";
  return "공유";
}

function toAnalyticsChannelLabel(value: string | null) {
  if (value === "direct") return "직접 방문";
  if (value === "internal") return "내부 이동";
  if (value === "organic_search") return "검색 유입";
  if (value === "paid") return "유료 유입";
  if (value === "referral") return "추천 유입";
  if (value === "social") return "소셜 유입";
  return "알 수 없음";
}

function toDeviceCategoryLabel(value: string | null) {
  if (value === "mobile") return "모바일";
  if (value === "tablet") return "태블릿";
  if (value === "desktop") return "데스크톱";
  return "알 수 없음";
}

function toAnalyticsEventLabel(value: string) {
  const labels: Record<string, string> = {
    contact_open: "문의 열기",
    contact_submit_success: "문의 제출 성공",
    competition_detail_click: "드로어 상세 클릭",
    competition_open: "대회 드로어 열기",
    competition_view: "대회 상세 조회",
    empty_search_result: "0건 결과",
    engagement_ping: "활성 ping",
    filter_applied: "필터 적용",
    filter_reset: "필터 초기화",
    page_view: "페이지뷰",
    registration_link_click: "접수 링크 클릭",
    related_competition_click: "관련 대회 클릭",
    save_competition: "관심 대회 저장",
    search_performed: "검색 수행",
    session_start: "세션 시작",
    share_click: "공유 클릭",
    sort_changed: "정렬 변경",
    source_link_click: "출처 링크 클릭",
    unsave_competition: "관심 대회 해제",
    view_mode_changed: "보기 변경",
  };

  return labels[value] ?? value;
}

function toAccessMode(displayMode: string | null): "browser" | "pwa" | "unknown" {
  if (
    displayMode === "standalone" ||
    displayMode === "fullscreen" ||
    displayMode === "minimal-ui"
  ) {
    return "pwa";
  }
  if (displayMode === "browser") return "browser";
  return "unknown";
}

function toRatio(count: number, total: number) {
  if (total <= 0) return 0;
  return count / total;
}

function toRate(count: number, total: number) {
  return toRatio(count, total) * 100;
}

function toPercentLabel(count: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

function toCount(value: bigint | number | null | undefined) {
  return Number(value ?? 0);
}

function formatCount(value: number) {
  return numberFormatter.format(Math.round(value));
}
