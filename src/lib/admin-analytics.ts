import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LOOFIT_PROMOTION_ID } from "@/lib/site";

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
  previousValue?: number; // 직전 동일기간 값(비교 기준이 있을 때만)
  deltaPct?: number | null; // 직전 대비 ±%. null = 직전 0(비교 불가) → UI에서 표시 안 함
  goodWhen?: "higher" | "lower"; // 델타 색상 의미(낮을수록 좋은 지표 구분)
  status?: "ok" | "warn"; // 임계값 평가 결과
  spark?: number[]; // hero KPI 일별 시리즈(오래된→최신)
  sparkDays?: string[]; // spark와 1:1 대응하는 Seoul 날짜 키(YYYY-MM-DD), 툴팁용
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
  directFunnelRows: AnalyticsTableRow[];
  end: Date;
  eventRows: AnalyticsTableRow[];
  funnelRows: AnalyticsTableRow[];
  heroMetrics: AnalyticsMetric[];
  leadCompetitionRows: AnalyticsTableRow[];
  leadFunnelRows: AnalyticsTableRow[];
  leadMetrics: AnalyticsMetric[];
  leadSourceRows: AnalyticsTableRow[];
  loofitPromoMetrics: AnalyticsMetric[];
  loofitPromoSourceRows: AnalyticsTableRow[];
  overviewMetrics: AnalyticsMetric[];
  osRows: AnalyticsTableRow[];
  retentionMetrics: AnalyticsMetric[];
  searchQualityMetrics: AnalyticsMetric[];
  start: Date;
  topCompetitions: AnalyticsTableRow[];
  topFilters: AnalyticsTableRow[];
  topPages: AnalyticsTableRow[];
  topRegistrationCompetitions: AnalyticsTableRow[];
  topSavedCompetitions: AnalyticsTableRow[];
  topSearches: AnalyticsTableRow[];
  topSharedCompetitions: AnalyticsTableRow[];
  unavailableMessage?: string;
  visitorBehaviorRows: AnalyticsTableRow[];
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

type FunnelSessionRow = {
  list1: number;
  list2: number;
  list3: number;
  list4: number;
  list5: number;
  direct1: number;
  direct2: number;
};

type BehaviorRow = {
  returning: boolean;
  sessions: number;
  views: number;
  regs: number;
};

type CohortRow = {
  c1: number;
  k1: number;
  c7: number;
  k7: number;
  c30: number;
  k30: number;
};

type OwnedPromoCounts = {
  source: string;
  variant: string;
  impressions: number;
  clicks: number;
};

type AnalyticsCountInputs = {
  activeSessionCount: number;
  activeVisitorCount: number;
  averageActiveSeconds: number;
  competitionDetailClickCount: number;
  competitionOpenCount: number;
  competitionViewCount: number;
  contactOpenCount: number;
  contactSubmitCount: number;
  emptySearchResultCount: number;
  relatedCompetitionClickCount: number;
  sourceLinkClickCount: number;
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

export type AnalyticsSegment = { dimension: "channel" | "device"; value: string };

// 세그먼트 → 세션 where 필터. humanSessionFilter에 합치면 모든 Prisma 기반
// 세션/이벤트(session.is) 쿼리에 자동 전파된다.
function toSessionSegmentFilter(segment?: AnalyticsSegment): Prisma.AnalyticsSessionWhereInput {
  if (!segment) return {};
  return segment.dimension === "channel"
    ? { channel: segment.value }
    : { deviceCategory: segment.value };
}

// 원시 SQL용 세그먼트 조건. qualifier는 "s." (별칭) 또는 "" (별칭 없음).
// qualifier/column은 고정 식별자라 raw로, 값은 파라미터로 바인딩한다.
function segmentSql(segment: AnalyticsSegment | undefined, qualifier = ""): Prisma.Sql {
  if (!segment) return Prisma.empty;
  const column = segment.dimension === "channel" ? "channel" : "deviceCategory";
  return Prisma.sql`AND ${Prisma.raw(`${qualifier}"${column}"`)} = ${segment.value}`;
}

export function parseAnalyticsSegment(dimension: string, value: string): AnalyticsSegment | undefined {
  if (!value) return undefined;
  if (dimension === "channel" || dimension === "device") return { dimension, value };
  return undefined;
}

export async function getAnalyticsSummary(
  start: Date,
  end: Date,
  segment?: AnalyticsSegment,
): Promise<AnalyticsSummary> {
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
      ...toSessionSegmentFilter(segment),
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
      visitorStatsRows,
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
      activeVisitorCountRows,
      activeSessionCount,
      deviceGroupRows,
      browserGroupRows,
      osGroupRows,
      searchResultAverage,
      engagementSummaryRows,
      botVisitorCountRows,
      botSessionCount,
      botPageViewCount,
      botNameRows,
      botTopPageRows,
      windowSessionCountRows,
      contactOpenCount,
      relatedCompetitionClickCount,
      sourceLinkClickCount,
      contactEventRows,
      ownedPromoEventRows,
      topFilterRows,
      funnelSessionRows,
      behaviorRows,
      cohortRows,
    ] = await Promise.all([
      prisma.$queryRaw<{ total: number; returning: number }[]>`
        SELECT
          COUNT(DISTINCT s."visitorId")::int AS total,
          COUNT(DISTINCT s."visitorId") FILTER (
            WHERE EXISTS (
              SELECT 1 FROM "AnalyticsSession" p
              WHERE p."visitorId" = s."visitorId" AND p."startedAt" < ${start}
            )
          )::int AS returning
        FROM "AnalyticsSession" s
        WHERE s."trafficType" = 'human'
          AND s."startedAt" >= ${start}
          AND s."startedAt" <= ${end}
          ${segmentSql(segment, "s.")}
      `,
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
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT "visitorId")::int AS count
        FROM "AnalyticsSession"
        WHERE "trafficType" = 'human' AND "lastSeenAt" >= ${activeSince}
        ${segmentSql(segment, "")}
      `,
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
            ${segmentSql(segment, "s.")}
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
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT "visitorId")::int AS count
        FROM "AnalyticsSession"
        WHERE "trafficType" IN ('bot', 'suspected_bot')
          AND "startedAt" >= ${start} AND "startedAt" <= ${end}
      `,
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
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT e."sessionId")::int AS count
        FROM "AnalyticsEvent" e
        JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
        WHERE s."trafficType" = 'human'
          AND e."occurredAt" >= ${start} AND e."occurredAt" <= ${end}
          ${segmentSql(segment, "s.")}
      `,
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "contact_open" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "related_competition_click" },
      }),
      prisma.analyticsEvent.count({
        where: { ...humanEventWindow, name: "source_link_click" },
      }),
      // 리드(광고 문의) 이벤트는 저빈도라 행을 fetch해 JS에서 source/대회로 묶는다.
      prisma.analyticsEvent.findMany({
        where: {
          ...humanEventWindow,
          name: { in: ["contact_open", "contact_submit_success"] },
        },
        select: { name: true, propertiesJson: true, competitionId: true },
      }),
      // 자사 프로모션은 저빈도 이벤트이며 propertiesJson이 TEXT다. 기간·사람 트래픽·
      // 세그먼트는 DB에서 먼저 제한하고, JSON은 행별로 안전하게 파싱해 손상 로그를 무시한다.
      prisma.analyticsEvent.findMany({
        where: {
          ...humanEventWindow,
          name: { in: ["owned_promo_impression", "owned_promo_click"] },
        },
        select: { name: true, propertiesJson: true },
      }),
      // 상위 필터: filter_applied의 propertiesJson.filterKeys(제어문자 US로 연결)를
      // 행으로 펼쳐 라벨별 빈도를 센다. propertiesJson은 TEXT라 객체('{'로 시작)만
      // ::jsonb 캐스트하고, filterKeys가 없는(구버전) 행은 ->> 가 NULL이라 제외된다.
      // 구분자는 클라이언트 join과 동일한 US(chr(31)) — 라벨에 절대 안 나오는 문자.
      prisma.$queryRaw<{ key: string; count: number }[]>`
        SELECT key, COUNT(*)::int AS count
        FROM (
          SELECT unnest(
            string_to_array(e."propertiesJson"::jsonb ->> 'filterKeys', chr(31))
          ) AS key
          FROM "AnalyticsEvent" e
          JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
          WHERE e."name" = 'filter_applied'
            AND e."propertiesJson" LIKE '{%'
            AND e."occurredAt" >= ${start}
            AND e."occurredAt" <= ${end}
            AND s."trafficType" = 'human'
            ${segmentSql(segment, "s.")}
        ) t
        WHERE key IS NOT NULL AND key <> ''
        GROUP BY key
        ORDER BY count DESC, key ASC
        LIMIT 12
      `.catch((error): { key: string; count: number }[] => {
        console.error("Failed to compute analytics top filters", error);
        return [];
      }),
      // 탐색 퍼널(세션 단위·단조). 세션별로 각 단계 이벤트 발생 여부(bool_or)를 모은 뒤,
      // 목록 주도 경로는 직전 단계를 모두 거친 세션만 누적(부분집합)해 진짜 깔때기가 되게 한다.
      // 직접 진입(direct)은 목록 페이지뷰 없이 상세를 본 세션 → SEO/공유 유입을 분리 집계.
      prisma.$queryRaw<FunnelSessionRow[]>`
        WITH per_session AS (
          SELECT
            e."sessionId",
            bool_or(e."name" = 'page_view'
              AND (e."path" = '/competitions' OR e."path" LIKE '/competitions?%')) AS has_list,
            bool_or(e."name" = 'competition_open') AS has_open,
            bool_or(e."name" = 'competition_detail_click') AS has_click,
            bool_or(e."name" = 'competition_view') AS has_view,
            bool_or(e."name" = 'registration_link_click') AS has_reg
          FROM "AnalyticsEvent" e
          JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
          WHERE s."trafficType" = 'human'
            AND e."occurredAt" >= ${start} AND e."occurredAt" <= ${end}
            ${segmentSql(segment, "s.")}
          GROUP BY e."sessionId"
        )
        SELECT
          COUNT(*) FILTER (WHERE has_list)::int AS list1,
          COUNT(*) FILTER (WHERE has_list AND has_open)::int AS list2,
          COUNT(*) FILTER (WHERE has_list AND has_open AND has_click)::int AS list3,
          COUNT(*) FILTER (WHERE has_list AND has_open AND has_click AND has_view)::int AS list4,
          COUNT(*) FILTER (WHERE has_list AND has_open AND has_click AND has_view AND has_reg)::int AS list5,
          COUNT(*) FILTER (WHERE NOT has_list AND has_view)::int AS direct1,
          COUNT(*) FILTER (WHERE NOT has_list AND has_view AND has_reg)::int AS direct2
        FROM per_session
      `.catch((error): FunnelSessionRow[] => {
        console.error("Failed to compute analytics session funnel", error);
        return [];
      }),
      // 신규/재방문 행동 비교: 윈도 내 사람 세션을 (윈도 시작 이전 세션 존재 여부로)
      // 신규/재방문 분류하고, 세션별 상세조회·접수클릭 도달을 집계해 전환을 비교한다.
      prisma.$queryRaw<BehaviorRow[]>`
        WITH classified AS (
          SELECT s."id" AS sid,
            EXISTS (
              SELECT 1 FROM "AnalyticsSession" p
              WHERE p."visitorId" = s."visitorId" AND p."startedAt" < ${start}
            ) AS is_returning
          FROM "AnalyticsSession" s
          WHERE s."trafficType" = 'human'
            AND s."startedAt" >= ${start} AND s."startedAt" <= ${end}
            ${segmentSql(segment, "s.")}
        ),
        ev AS (
          SELECT e."sessionId",
            bool_or(e."name" = 'competition_view') AS viewed,
            bool_or(e."name" = 'registration_link_click') AS reg
          FROM "AnalyticsEvent" e
          JOIN classified c ON c.sid = e."sessionId"
          WHERE e."occurredAt" >= ${start} AND e."occurredAt" <= ${end}
          GROUP BY e."sessionId"
        )
        SELECT c.is_returning AS returning,
          COUNT(*)::int AS sessions,
          COUNT(*) FILTER (WHERE ev.viewed)::int AS views,
          COUNT(*) FILTER (WHERE ev.reg)::int AS regs
        FROM classified c
        LEFT JOIN ev ON ev."sessionId" = c.sid
        GROUP BY c.is_returning
      `.catch((error): BehaviorRow[] => {
        console.error("Failed to compute analytics visitor behavior", error);
        return [];
      }),
      // 코호트 롤링 리텐션: 방문자의 최초 세션(first_at) 기준 D1/D7/D30 내 재방문 비율.
      // 기준시각은 윈도 end(캐시 결정성). 성숙 코호트만(첫 방문이 end-N일 이전) 분모로.
      // 세그먼트는 적용하지 않는다(전체 방문자 제품 건강 지표).
      prisma.$queryRaw<CohortRow[]>`
        WITH first_seen AS (
          SELECT "visitorId", MIN("startedAt") AS first_at
          FROM "AnalyticsSession"
          WHERE "trafficType" = 'human'
          GROUP BY "visitorId"
        ),
        ret AS (
          SELECT fs."visitorId", fs.first_at,
            bool_or(s."startedAt" > fs.first_at
              AND s."startedAt" <= fs.first_at + interval '1 day') AS r1,
            bool_or(s."startedAt" > fs.first_at
              AND s."startedAt" <= fs.first_at + interval '7 day') AS r7,
            bool_or(s."startedAt" > fs.first_at
              AND s."startedAt" <= fs.first_at + interval '30 day') AS r30
          FROM first_seen fs
          JOIN "AnalyticsSession" s
            ON s."visitorId" = fs."visitorId" AND s."trafficType" = 'human'
          GROUP BY fs."visitorId", fs.first_at
        )
        SELECT
          COUNT(*) FILTER (WHERE first_at <= ${new Date(end.getTime() - 86_400_000)})::int AS c1,
          COUNT(*) FILTER (WHERE first_at <= ${new Date(end.getTime() - 86_400_000)} AND r1)::int AS k1,
          COUNT(*) FILTER (WHERE first_at <= ${new Date(end.getTime() - 7 * 86_400_000)})::int AS c7,
          COUNT(*) FILTER (WHERE first_at <= ${new Date(end.getTime() - 7 * 86_400_000)} AND r7)::int AS k7,
          COUNT(*) FILTER (WHERE first_at <= ${new Date(end.getTime() - 30 * 86_400_000)})::int AS c30,
          COUNT(*) FILTER (WHERE first_at <= ${new Date(end.getTime() - 30 * 86_400_000)} AND r30)::int AS k30
        FROM ret
      `.catch((error): CohortRow[] => {
        console.error("Failed to compute analytics cohort retention", error);
        return [];
      }),
    ]);

    // 방문자/재방문/활성/봇/활동세션은 COUNT(DISTINCT) 스칼라로 받는다(행을 Node로
    // 끌어와 length로 세지 않음). 재방문은 visitor 통계 쿼리에 통합되어 별도 wave가 없다.
    // (재방문 판정은 과거 세션 존재 여부만 보고 trafficType은 따지지 않는다 — 재분류 안정성.)
    const visitorCount = visitorStatsRows[0]?.total ?? 0;
    const returningVisitorCount = visitorStatsRows[0]?.returning ?? 0;
    const newVisitorCount = Math.max(visitorCount - returningVisitorCount, 0);
    const activeVisitorCount = activeVisitorCountRows[0]?.count ?? 0;
    const botVisitorCount = botVisitorCountRows[0]?.count ?? 0;
    const windowSessionCount = windowSessionCountRows[0]?.count ?? 0;
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
    // 리드 소스/대회 집계: contact_open·contact_submit_success를 propertiesJson.source
    // (슬롯)와 competitionId로 묶는다. JSON 필드 groupBy를 피하고 JS에서 집계한다.
    const leadSourceMap = new Map<string, LeadCounts>();
    const leadCompetitionMap = new Map<string, LeadCounts>();
    for (const row of contactEventRows) {
      const isSubmit = row.name === "contact_submit_success";
      addLeadCount(leadSourceMap, toContactSource(row.propertiesJson), isSubmit);
      if (row.competitionId) {
        addLeadCount(leadCompetitionMap, row.competitionId, isSubmit);
      }
    }
    const loofitPromoSummary = getLoofitPromoSummary(ownedPromoEventRows);
    const competitionIds = [
      ...topCompetitionRows,
      ...topRegistrationCompetitionRows,
      ...topSharedCompetitionRows,
      ...topSavedCompetitionRows,
    ]
      .map((row) => row.competitionId)
      .filter((id): id is string => Boolean(id));
    const uniqueCompetitionIds = Array.from(
      new Set([...competitionIds, ...leadCompetitionMap.keys()]),
    );
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
      activeVisitorCount,
      averageActiveSeconds,
      competitionDetailClickCount,
      competitionOpenCount,
      competitionViewCount,
      contactOpenCount,
      contactSubmitCount,
      relatedCompetitionClickCount,
      sourceLinkClickCount,
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
      visitorCount,
      windowSessionCount,
    };

    // 직전 동일기간(현재 시작점에서 같은 길이만큼 앞)과 hero 일별 시리즈. (start,end)에서
    // 결정적으로 파생되므로 캐시 키(getAnalyticsSummaryForRange)는 그대로다.
    const periodMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodMs);
    const prevEnd = new Date(start.getTime());
    const [prevCounts, heroSeries] = await Promise.all([
      getWindowCounts(prevStart, prevEnd, segment),
      getHeroSeries(start, end),
    ]);

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
      activeVisitorCount,
      botMetrics: [
        metric("bot-visitors", "봇 방문자", botVisitorCount, "number"),
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
      conversionMetrics: withDeltas(getConversionMetrics(counts), getConversionMetrics(prevCounts)),
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
      directFunnelRows: getDirectFunnelRows(funnelSessionRows[0]),
      funnelRows: getSessionFunnelRows(funnelSessionRows[0]),
      heroMetrics: withDeltas(
        buildHeroMetrics(counts, segment ? undefined : heroSeries),
        buildHeroMetrics(prevCounts),
      ),
      leadCompetitionRows: toLeadCompetitionRows(leadCompetitionMap, competitionById),
      leadFunnelRows: getLeadFunnelRows(counts),
      leadMetrics: withDeltas(getLeadMetrics(counts), getLeadMetrics(prevCounts)),
      leadSourceRows: toLeadSourceRows(leadSourceMap),
      loofitPromoMetrics: loofitPromoSummary.metrics,
      loofitPromoSourceRows: loofitPromoSummary.sourceRows,
      overviewMetrics: withDeltas(getOverviewMetrics(counts), getOverviewMetrics(prevCounts)),
      osRows: osGroupRows.map((row) => ({
        key: row.osName ?? "unknown",
        label: row.osName ?? "알 수 없음",
        meta: toPercentLabel(row._count._all, sessionCount),
        count: row._count._all,
      })),
      retentionMetrics: getRetentionMetrics(cohortRows[0]),
      searchQualityMetrics: withDeltas(getSearchQualityMetrics(counts), getSearchQualityMetrics(prevCounts)),
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
      topFilters: topFilterRows.map((row) => ({
        key: row.key,
        label: row.key,
        count: row.count,
      })),
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
      visitorBehaviorRows: getVisitorBehaviorRows(behaviorRows),
      visitorRows: [
        {
          key: "new",
          label: "신규 방문자",
          meta: toPercentLabel(newVisitorCount, visitorCount),
          count: newVisitorCount,
        },
        {
          key: "returning",
          label: "재방문자",
          meta: toPercentLabel(returningVisitorCount, visitorCount),
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

const ANALYTICS_CACHE_REVALIDATE_SECONDS = 60;

const getCachedAnalyticsSummary = unstable_cache(
  (startMs: number, endMs: number, segDimension: string, segValue: string) =>
    getAnalyticsSummary(
      new Date(startMs),
      new Date(endMs),
      parseAnalyticsSegment(segDimension, segValue),
    ),
  ["analytics-summary"],
  { revalidate: ANALYTICS_CACHE_REVALIDATE_SECONDS },
);

// 어드민 대시보드 진입점. 무거운 집계(~38쿼리)를 윈도(끝을 분 단위로 버킷팅한 키)로
// 캐시해 반복 진입·기간 토글마다 전체 재실행하지 않는다. 활성 사용자 타일은 캐시
// TTL(최대 60초)만큼 stale할 수 있으나 2분 활성 윈도 안이라 허용 범위다.
// unstable_cache가 결과를 직렬화하며 Date를 문자열로 바꾸므로 표시용 start/end는
// 호출 측의 실제 Date로 복원한다.
export async function getAnalyticsSummaryForRange(
  start: Date,
  end: Date,
  segment?: AnalyticsSegment,
): Promise<AnalyticsSummary> {
  const bucketedEndMs = Math.floor(end.getTime() / 60_000) * 60_000;
  const cached = await getCachedAnalyticsSummary(
    start.getTime(),
    bucketedEndMs,
    segment?.dimension ?? "",
    segment?.value ?? "",
  );
  return { ...cached, start, end };
}

export type CompetitionFunnel = {
  competitionId: string;
  title: string;
  organizationName: string;
  rows: AnalyticsTableRow[];
};

// 대회 단일 드릴다운: 상세 조회 → 접수 클릭/저장/공유. 상세 조회 대비 비율을 meta에
// 담아 FunnelBars로 렌더한다. comp 파라미터가 있을 때만(저빈도) 호출하는 단일 쿼리.
export async function getCompetitionFunnel(
  competitionId: string,
  start: Date,
  end: Date,
): Promise<CompetitionFunnel | null> {
  try {
    const [competition, rows] = await Promise.all([
      prisma.competitionSchedule.findUnique({
        where: { id: competitionId },
        select: { title: true, organizationName: true },
      }),
      prisma.$queryRaw<{ name: string; count: number }[]>`
        SELECT e."name" AS name, COUNT(*)::int AS count
        FROM "AnalyticsEvent" e
        JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
        WHERE e."competitionId" = ${competitionId}
          AND s."trafficType" = 'human'
          AND e."occurredAt" >= ${start} AND e."occurredAt" <= ${end}
          AND e."name" IN ('competition_view', 'registration_link_click', 'save_competition', 'share_click')
        GROUP BY e."name"
      `,
    ]);
    if (!competition) return null;

    const byName = new Map(rows.map((row) => [row.name, row.count]));
    const viewCount = byName.get("competition_view") ?? 0;
    const step = (name: string, label: string): AnalyticsTableRow => {
      const count = byName.get(name) ?? 0;
      return {
        key: name,
        label,
        meta:
          name === "competition_view"
            ? "상세 페이지 조회"
            : `상세 대비 ${toPercentLabel(count, viewCount)}`,
        count,
      };
    };

    return {
      competitionId,
      title: competition.title,
      organizationName: competition.organizationName,
      rows: [
        step("competition_view", "상세 조회"),
        step("registration_link_click", "접수 클릭"),
        step("save_competition", "저장"),
        step("share_click", "공유"),
      ],
    };
  } catch {
    return null;
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
    contactOpenCount: 0,
    contactSubmitCount: 0,
    emptySearchResultCount: 0,
    relatedCompetitionClickCount: 0,
    sourceLinkClickCount: 0,
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
    directFunnelRows: getDirectFunnelRows(undefined),
    end,
    eventRows: [],
    funnelRows: getSessionFunnelRows(undefined),
    heroMetrics: [],
    leadCompetitionRows: [],
    leadFunnelRows: getLeadFunnelRows(counts),
    leadMetrics: getLeadMetrics(counts),
    leadSourceRows: [],
    loofitPromoMetrics: getLoofitPromoMetrics(0, 0),
    loofitPromoSourceRows: [],
    overviewMetrics: getOverviewMetrics(counts),
    osRows: [],
    retentionMetrics: getRetentionMetrics(undefined),
    searchQualityMetrics: getSearchQualityMetrics(counts),
    start,
    topCompetitions: [],
    topFilters: [],
    topPages: [],
    topRegistrationCompetitions: [],
    topSavedCompetitions: [],
    topSearches: [],
    topSharedCompetitions: [],
    unavailableMessage,
    visitorBehaviorRows: [],
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
    // 활성 사용자(최근 2분)는 시점 지표라 기간 그리드에서 제외하고 별도 라이브
    // 인디케이터(LiveIndicator)로 분리한다. 직전 대비 델타도 의미가 없어 붙이지 않는다.
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

const EMPTY_FUNNEL_ROW: FunnelSessionRow = {
  list1: 0,
  list2: 0,
  list3: 0,
  list4: 0,
  list5: 0,
  direct1: 0,
  direct2: 0,
};

// 목록 주도 탐색 퍼널(세션 단위·단조). 각 단계는 직전 단계를 모두 거친 세션의 부분집합이라
// 실제 깔때기처럼 단조감소한다(이벤트 카운트가 아니라 도달 세션 수).
function getSessionFunnelRows(row: FunnelSessionRow | undefined): AnalyticsTableRow[] {
  const r = row ?? EMPTY_FUNNEL_ROW;
  return [
    { key: "list-1", label: "목록 조회 세션", meta: "대회 목록을 본 세션", count: r.list1 },
    {
      key: "list-2",
      label: "드로어 열기",
      meta: `목록 대비 ${toPercentLabel(r.list2, r.list1)}`,
      count: r.list2,
    },
    {
      key: "list-3",
      label: "드로어 상세 클릭",
      meta: `드로어 대비 ${toPercentLabel(r.list3, r.list2)}`,
      count: r.list3,
    },
    {
      key: "list-4",
      label: "상세 조회",
      meta: `상세클릭 대비 ${toPercentLabel(r.list4, r.list3)}`,
      count: r.list4,
    },
    {
      key: "list-5",
      label: "접수 클릭",
      meta: `상세조회 대비 ${toPercentLabel(r.list5, r.list4)} · 목록 대비 ${toPercentLabel(r.list5, r.list1)}`,
      count: r.list5,
    },
  ];
}

// 직접 진입 경로: 목록 페이지뷰 없이 상세를 본 세션(SEO·공유 유입)→접수. 목록 주도와 분리해
// 서로 다른 두 유입 경로가 하나의 퍼널로 섞이지 않게 한다.
function getDirectFunnelRows(row: FunnelSessionRow | undefined): AnalyticsTableRow[] {
  const r = row ?? EMPTY_FUNNEL_ROW;
  return [
    {
      key: "direct-1",
      label: "상세 조회(직접)",
      meta: "목록 없이 상세 진입 · SEO·공유",
      count: r.direct1,
    },
    {
      key: "direct-2",
      label: "접수 클릭",
      meta: `상세 대비 ${toPercentLabel(r.direct2, r.direct1)}`,
      count: r.direct2,
    },
  ];
}

// 신규/재방문 행동 비교: 그룹별 세션 수와 상세조회·접수도달률. 재방문자가 실제로 더 잘
// 전환하는지(접수도달률)를 한눈에 본다. count는 접수 도달 세션, meta에 비율을 싣는다.
function getVisitorBehaviorRows(rows: BehaviorRow[]): AnalyticsTableRow[] {
  return [...rows]
    .sort((a, b) => Number(a.returning) - Number(b.returning))
    .filter((row) => row.sessions > 0)
    .map((row) => ({
      key: row.returning ? "returning" : "new",
      label: row.returning ? "재방문자" : "신규 방문자",
      meta: `세션 ${formatCount(row.sessions)} · 상세조회 ${toPercentLabel(row.views, row.sessions)} · 접수도달 ${toPercentLabel(row.regs, row.sessions)}`,
      count: row.regs,
    }));
}

// 코호트 롤링 리텐션(D1/D7/D30). 윈도 end 기준 성숙 코호트만 분모. 윈도/세그먼트와 무관한
// 제품 건강 지표라 직전 대비 델타는 붙이지 않는다.
function getRetentionMetrics(row: CohortRow | undefined): AnalyticsMetric[] {
  const r = row ?? { c1: 0, k1: 0, c7: 0, k7: 0, c30: 0, k30: 0 };
  return [
    metric("retention-d1", "D1 리텐션", toRate(r.k1, r.c1), "percent", `재방문 ${formatCount(r.k1)} / 코호트 ${formatCount(r.c1)}명`),
    metric("retention-d7", "D7 리텐션", toRate(r.k7, r.c7), "percent", `${formatCount(r.k7)} / ${formatCount(r.c7)}명`),
    metric("retention-d30", "D30 리텐션", toRate(r.k30, r.c30), "percent", `${formatCount(r.k30)} / ${formatCount(r.c30)}명`),
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
      "related-ctr",
      "관련 대회 CTR",
      toRate(counts.relatedCompetitionClickCount, counts.competitionViewCount),
      "percent",
      `관련 클릭 ${formatCount(counts.relatedCompetitionClickCount)} / 상세 ${formatCount(counts.competitionViewCount)}`,
    ),
    metric(
      "source-link-clicks",
      "출처 링크 클릭",
      counts.sourceLinkClickCount,
      "number",
      "접수 URL 없을 때 공식 공지 클릭",
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

type LeadCounts = { opens: number; submits: number };

function getLoofitPromoSummary(
  rows: Array<{ name: string; propertiesJson: string }>,
): { metrics: AnalyticsMetric[]; sourceRows: AnalyticsTableRow[] } {
  const countsBySlot = new Map<string, OwnedPromoCounts>();
  let impressions = 0;
  let clicks = 0;

  for (const row of rows) {
    const slot = toLoofitPromoSlot(row.propertiesJson);
    if (!slot) continue;

    const key = `${slot.source}\u001f${slot.variant}`;
    const counts = countsBySlot.get(key) ?? {
      ...slot,
      impressions: 0,
      clicks: 0,
    };

    if (row.name === "owned_promo_impression") {
      counts.impressions += 1;
      impressions += 1;
    } else if (row.name === "owned_promo_click") {
      counts.clicks += 1;
      clicks += 1;
    } else {
      continue;
    }
    countsBySlot.set(key, counts);
  }

  const sourceRows = Array.from(countsBySlot.entries())
    .map(([key, counts]) => ({
      key,
      label: toLoofitPromoSourceLabel(counts.source),
      meta: `${toLoofitPromoVariantLabel(counts.variant)} · 노출 ${formatCount(counts.impressions)} · 이벤트 CTR ${toPercentLabel(counts.clicks, counts.impressions)}`,
      count: counts.clicks,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    metrics: getLoofitPromoMetrics(impressions, clicks),
    sourceRows,
  };
}

function getLoofitPromoMetrics(impressions: number, clicks: number): AnalyticsMetric[] {
  return [
    metric(
      "loofit-promo-impressions",
      "총 노출",
      impressions,
      "number",
      "화면에 50% 이상 표시된 이벤트",
    ),
    metric(
      "loofit-promo-clicks",
      "총 클릭",
      clicks,
      "number",
      "App Store 이동 링크 클릭",
    ),
    metric(
      "loofit-promo-event-ctr",
      "이벤트 CTR",
      toRate(clicks, impressions),
      "percent",
      `클릭 ${formatCount(clicks)} / 노출 ${formatCount(impressions)} · 반복 클릭 포함`,
    ),
  ];
}

function toLoofitPromoSlot(propertiesJson: string): Pick<OwnedPromoCounts, "source" | "variant"> | null {
  try {
    const parsed: unknown = JSON.parse(propertiesJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    const properties = parsed as Record<string, unknown>;
    if (properties.promotionId !== LOOFIT_PROMOTION_ID) return null;

    return {
      source:
        typeof properties.source === "string" && properties.source
          ? properties.source
          : "unknown",
      variant:
        typeof properties.variant === "string" && properties.variant
          ? properties.variant
          : "unknown",
    };
  } catch {
    return null;
  }
}

function toLoofitPromoSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    home_owned_promo: "홈 쇼케이스",
    competition_grid_owned_promo: "대회 그리드 배너",
    competition_list_owned_promo: "대회 목록 배너",
    competition_detail_mobile_owned_promo: "대회 상세 모바일 배너",
    competition_detail_side_owned_promo: "대회 상세 사이드 배너",
  };
  return labels[source] ?? source;
}

function toLoofitPromoVariantLabel(variant: string): string {
  const labels: Record<string, string> = {
    showcase: "쇼케이스",
    inline: "인라인",
    mobile: "모바일",
    side: "사이드",
  };
  return labels[variant] ?? variant;
}

function addLeadCount(map: Map<string, LeadCounts>, key: string, isSubmit: boolean) {
  const bucket = map.get(key) ?? { opens: 0, submits: 0 };
  if (isSubmit) bucket.submits += 1;
  else bucket.opens += 1;
  map.set(key, bucket);
}

function getLeadMetrics(counts: AnalyticsCountInputs): AnalyticsMetric[] {
  return [
    metric(
      "leads",
      "광고 문의 제출",
      counts.contactSubmitCount,
      "number",
      `문의 열기 ${formatCount(counts.contactOpenCount)}`,
    ),
    metric(
      "lead-completion-rate",
      "문의 완료율",
      toRate(counts.contactSubmitCount, counts.contactOpenCount),
      "percent",
      `제출 ${formatCount(counts.contactSubmitCount)} / 열기 ${formatCount(counts.contactOpenCount)}`,
    ),
    metric(
      "lead-conversion-rate",
      "문의 전환율",
      toRate(counts.contactSubmitCount, counts.windowSessionCount),
      "percent",
      `활동 세션 ${formatCount(counts.windowSessionCount)} 대비`,
    ),
  ];
}

function getLeadFunnelRows(counts: AnalyticsCountInputs): AnalyticsTableRow[] {
  const abandoned = Math.max(counts.contactOpenCount - counts.contactSubmitCount, 0);
  return [
    {
      key: "contact-open",
      label: "문의 열기",
      meta: "문의 드로어 열기",
      count: counts.contactOpenCount,
    },
    {
      key: "contact-submit",
      label: "문의 제출",
      meta: `열기 대비 ${toPercentLabel(counts.contactSubmitCount, counts.contactOpenCount)} · 이탈 ${toPercentLabel(abandoned, counts.contactOpenCount)}`,
      count: counts.contactSubmitCount,
    },
  ];
}

function toLeadSourceRows(map: Map<string, LeadCounts>): AnalyticsTableRow[] {
  return Array.from(map.entries())
    .map(([source, { opens, submits }]) => ({
      key: source,
      label: toContactSourceLabel(source),
      meta: `제출 ${formatCount(submits)} · 완료율 ${toPercentLabel(submits, opens)}`,
      count: opens,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 10);
}

function toLeadCompetitionRows(
  map: Map<string, LeadCounts>,
  competitionById: Map<string, CompetitionAnalyticsSummary>,
): AnalyticsTableRow[] {
  return Array.from(map.entries())
    .map(([competitionId, { opens, submits }]) => {
      const competition = competitionById.get(competitionId);
      const metaParts = [
        competition?.organizationShortName ?? competition?.organizationName,
        `제출 ${formatCount(submits)}`,
      ].filter((part): part is string => Boolean(part));

      return {
        key: competitionId,
        label: competition?.title ?? competitionId,
        meta: metaParts.join(" · "),
        count: opens,
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 10);
}

function toContactSource(propertiesJson: string): string {
  try {
    const properties = JSON.parse(propertiesJson) as Record<string, unknown>;
    return typeof properties.source === "string" ? properties.source : "unknown";
  } catch {
    return "unknown";
  }
}

function toContactSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    competition_detail_side_ad: "상세 사이드 광고",
    competition_detail_mobile_ad: "상세 모바일 광고",
    competition_drawer_ad: "드로어 광고",
    competition_grid_inline_ad: "그리드 인라인 광고",
    competition_list_inline_ad: "목록 인라인 광고",
    competition_list_mobile_ad: "목록 모바일 광고",
    competition_list_ad_rail: "목록 광고 레일",
    site_shell: "헤더·푸터 등",
  };
  return labels[source] ?? source;
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
  spark?: number[],
): AnalyticsMetric {
  return { key, label, value, format, meta, spark };
}

// 낮을수록 좋은 지표(상승=빨강). 그 외는 상승=초록.
const LOWER_IS_BETTER = new Set(["zero-result-rate"]);

// 선택적 임계값 → ok/warn 색상. 비율은 percent 값 기준.
const METRIC_THRESHOLDS: Record<string, { warnBelow?: number; warnAbove?: number }> = {
  "engaged-session-rate": { warnBelow: 30 },
  "registration-intent-rate": { warnBelow: 5 },
  "lead-completion-rate": { warnBelow: 40 },
  "returning-rate": { warnBelow: 20 },
  "zero-result-rate": { warnAbove: 15 },
};

function toDeltaPct(current: number, previous: number | undefined): number | null | undefined {
  if (previous === undefined) return undefined; // 비교 대상 없음
  if (previous === 0) return null; // 직전 0 → 변화율 정의 불가
  return ((current - previous) / previous) * 100;
}

function toMetricStatus(key: string, value: number): "ok" | "warn" | undefined {
  const threshold = METRIC_THRESHOLDS[key];
  if (!threshold) return undefined;
  if (threshold.warnBelow !== undefined) return value < threshold.warnBelow ? "warn" : "ok";
  if (threshold.warnAbove !== undefined) return value > threshold.warnAbove ? "warn" : "ok";
  return undefined;
}

// 현재/직전 동일기간 메트릭을 key로 매칭해 previousValue·deltaPct·status를 붙인다.
function withDeltas(current: AnalyticsMetric[], previous: AnalyticsMetric[]): AnalyticsMetric[] {
  const previousByKey = new Map(previous.map((item) => [item.key, item.value]));
  return current.map((item) => {
    const previousValue = previousByKey.get(item.key);
    return {
      ...item,
      previousValue,
      deltaPct: toDeltaPct(item.value, previousValue),
      goodWhen: LOWER_IS_BETTER.has(item.key) ? "lower" : "higher",
      status: toMetricStatus(item.key, item.value),
    };
  });
}

function buildHeroMetrics(counts: AnalyticsCountInputs, series?: HeroSeries): AnalyticsMetric[] {
  const withDays = (m: AnalyticsMetric): AnalyticsMetric => ({ ...m, sparkDays: series?.days });
  return [
    withDays(metric("visitors", "방문자", counts.visitorCount, "number", undefined, series?.visitors)),
    withDays(metric("sessions", "세션", counts.sessionCount, "number", undefined, series?.sessions)),
    withDays(
      metric(
        "registration-clicks",
        "접수 클릭",
        counts.registrationClickCount,
        "number",
        undefined,
        series?.registration,
      ),
    ),
    withDays(
      metric("leads", "광고 문의 제출", counts.contactSubmitCount, "number", undefined, series?.leads),
    ),
  ];
}

type HeroSeries = {
  days: string[];
  visitors: number[];
  sessions: number[];
  registration: number[];
  leads: number[];
};

function koreaDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// 윈도를 Seoul 날짜 키(YYYY-MM-DD) 배열로. 한국은 DST가 없어 +24h가 정확히 하루.
// 최대 92일로 제한해 스파크라인 페이로드 상한을 둔다.
function koreaDaysBetween(start: Date, end: Date): string[] {
  const days: string[] = [];
  const seen = new Set<string>();
  let cursor = start.getTime();
  const endMs = end.getTime();
  let guard = 0;
  while (cursor <= endMs && guard < 92) {
    const key = koreaDayKey(new Date(cursor));
    if (!seen.has(key)) {
      seen.add(key);
      days.push(key);
    }
    cursor += 86_400_000;
    guard += 1;
  }
  const endKey = koreaDayKey(end);
  if (!seen.has(endKey) && days.length < 92) days.push(endKey);
  return days;
}

// hero KPI 일별 시리즈. 컬럼은 naive UTC timestamp이므로 'UTC'→'Asia/Seoul' 이중
// 변환으로 Seoul 날짜 버킷을 만든다(단일 변환은 9시간 어긋남). 실패해도 빈 배열로
// 격리해 대시보드 전체를 막지 않는다.
async function getHeroSeries(start: Date, end: Date): Promise<HeroSeries> {
  const days = koreaDaysBetween(start, end);
  const [sessionRows, eventRows] = await Promise.all([
    prisma.$queryRaw<{ day: string; visitors: number; sessions: number }[]>`
      SELECT
        to_char(date_trunc('day', "startedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT "visitorId")::int AS visitors,
        COUNT(DISTINCT "id")::int AS sessions
      FROM "AnalyticsSession"
      WHERE "trafficType" = 'human'
        AND "startedAt" >= ${start} AND "startedAt" <= ${end}
      GROUP BY 1
      ORDER BY 1
    `.catch((): { day: string; visitors: number; sessions: number }[] => []),
    prisma.$queryRaw<{ day: string; registration: number; leads: number }[]>`
      SELECT
        to_char(date_trunc('day', e."occurredAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM-DD') AS day,
        COUNT(*) FILTER (WHERE e."name" = 'registration_link_click')::int AS registration,
        COUNT(*) FILTER (WHERE e."name" = 'contact_submit_success')::int AS leads
      FROM "AnalyticsEvent" e
      JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
      WHERE s."trafficType" = 'human'
        AND e."occurredAt" >= ${start} AND e."occurredAt" <= ${end}
      GROUP BY 1
      ORDER BY 1
    `.catch((): { day: string; registration: number; leads: number }[] => []),
  ]);

  const sessionByDay = new Map(sessionRows.map((row) => [row.day, row]));
  const eventByDay = new Map(eventRows.map((row) => [row.day, row]));
  return {
    days,
    visitors: days.map((day) => sessionByDay.get(day)?.visitors ?? 0),
    sessions: days.map((day) => sessionByDay.get(day)?.sessions ?? 0),
    registration: days.map((day) => eventByDay.get(day)?.registration ?? 0),
    leads: days.map((day) => eventByDay.get(day)?.leads ?? 0),
  };
}

// 직전 동일기간의 윈도 스칼라 카운트(델타 비교용). 현재 윈도 배치는 건드리지 않고
// 여기서만 다시 계산한다. 실시간(활성) 카운트는 windowless이므로 0으로 둔다.
async function getWindowCounts(
  start: Date,
  end: Date,
  segment?: AnalyticsSegment,
): Promise<AnalyticsCountInputs> {
  const eventWindow: Prisma.AnalyticsEventWhereInput = { occurredAt: { gte: start, lte: end } };
  const humanSessionFilter: Prisma.AnalyticsSessionWhereInput = {
    trafficType: "human",
    ...toSessionSegmentFilter(segment),
  };
  const humanEventWindow: Prisma.AnalyticsEventWhereInput = {
    AND: [eventWindow, { session: { is: humanSessionFilter } }],
  };
  const humanSessionWindow: Prisma.AnalyticsSessionWhereInput = {
    AND: [{ startedAt: { gte: start, lte: end } }, humanSessionFilter],
  };
  const listPageViewFilter: Prisma.AnalyticsEventWhereInput = {
    OR: [{ path: "/competitions" }, { path: { startsWith: "/competitions?" } }],
  };
  const eventCount = (name: string, extra: Prisma.AnalyticsEventWhereInput = {}) =>
    prisma.analyticsEvent.count({ where: { ...humanEventWindow, ...extra, name } });

  const [
    visitorStatsRows,
    sessionCount,
    windowSessionRows,
    pageViewCount,
    listPageViewCount,
    competitionOpenCount,
    competitionDetailClickCount,
    competitionViewCount,
    registrationClickCount,
    shareClickCount,
    saveCompetitionCount,
    unsaveCompetitionCount,
    contactOpenCount,
    contactSubmitCount,
    searchPerformedCount,
    filterAppliedCount,
    emptySearchResultCount,
    relatedCompetitionClickCount,
    sourceLinkClickCount,
    searchResultAverage,
    engagementSummaryRows,
  ] = await Promise.all([
    prisma.$queryRaw<{ total: number; returning: number }[]>`
      SELECT
        COUNT(DISTINCT s."visitorId")::int AS total,
        COUNT(DISTINCT s."visitorId") FILTER (
          WHERE EXISTS (
            SELECT 1 FROM "AnalyticsSession" p
            WHERE p."visitorId" = s."visitorId" AND p."startedAt" < ${start}
          )
        )::int AS returning
      FROM "AnalyticsSession" s
      WHERE s."trafficType" = 'human'
        AND s."startedAt" >= ${start} AND s."startedAt" <= ${end}
        ${segmentSql(segment, "s.")}
    `,
    prisma.analyticsSession.count({ where: humanSessionWindow }),
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT e."sessionId")::int AS count
      FROM "AnalyticsEvent" e
      JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
      WHERE s."trafficType" = 'human'
        AND e."occurredAt" >= ${start} AND e."occurredAt" <= ${end}
        ${segmentSql(segment, "s.")}
    `,
    eventCount("page_view"),
    eventCount("page_view", listPageViewFilter),
    eventCount("competition_open"),
    eventCount("competition_detail_click"),
    eventCount("competition_view"),
    eventCount("registration_link_click"),
    eventCount("share_click"),
    eventCount("save_competition"),
    eventCount("unsave_competition"),
    eventCount("contact_open"),
    eventCount("contact_submit_success"),
    eventCount("search_performed"),
    eventCount("filter_applied"),
    eventCount("empty_search_result"),
    eventCount("related_competition_click"),
    eventCount("source_link_click"),
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
          AND e."propertiesJson" LIKE '{%'
          AND e."occurredAt" >= ${start} AND e."occurredAt" <= ${end}
          AND s."trafficType" = 'human'
          ${segmentSql(segment, "s.")}
        GROUP BY e."sessionId"
      )
      SELECT
        COUNT(*)::bigint AS "engagedSessionCount",
        COALESCE(AVG("maxActiveSeconds"), 0)::double precision AS "averageActiveSeconds"
      FROM per_session
    `.catch((): EngagementSummaryRow[] => []),
  ]);

  const visitorCount = visitorStatsRows[0]?.total ?? 0;
  const returningVisitorCount = visitorStatsRows[0]?.returning ?? 0;
  const engagementSummary = engagementSummaryRows[0];
  return {
    activeSessionCount: 0,
    activeVisitorCount: 0,
    averageActiveSeconds: Number(engagementSummary?.averageActiveSeconds ?? 0),
    competitionDetailClickCount,
    competitionOpenCount,
    competitionViewCount,
    contactOpenCount,
    contactSubmitCount,
    relatedCompetitionClickCount,
    sourceLinkClickCount,
    emptySearchResultCount,
    engagedSessionCount: toCount(engagementSummary?.engagedSessionCount),
    filterAppliedCount,
    listPageViewCount,
    newVisitorCount: Math.max(visitorCount - returningVisitorCount, 0),
    pageViewCount,
    registrationClickCount,
    returningVisitorCount,
    saveCompetitionCount,
    searchPerformedCount,
    sessionCount,
    shareClickCount,
    topSearchAverageResultCount: searchResultAverage._avg.resultCount ?? 0,
    unsaveCompetitionCount,
    visitorCount,
    windowSessionCount: windowSessionRows[0]?.count ?? 0,
  };
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

export function toAnalyticsEventLabel(value: string) {
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
    owned_promo_click: "자사 프로모션 클릭",
    owned_promo_impression: "자사 프로모션 노출",
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
