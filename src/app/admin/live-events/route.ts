import { hasAdminSession } from "@/lib/admin-auth";
import { toAnalyticsEventLabel } from "@/lib/admin-analytics";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 라이브 활동 피드에 보여줄 "의미 있는" 사람 행동. engagement_ping·session_start 같은
// 고빈도/저신호 이벤트는 제외한다. page_view는 둘러보기 생동감을 위해 별도로 포함하되
// (아래 OR 절) 대회 상세 경로는 competition_view와 중복되므로 거른다.
const FEED_EVENT_NAMES = [
  "competition_open",
  "competition_detail_click",
  "competition_view",
  "registration_link_click",
  "source_link_click",
  "share_click",
  "save_competition",
  "related_competition_click",
  "search_performed",
  "filter_applied",
  "contact_open",
  "contact_submit_success",
];

const FEED_LIMIT = 20;

// 어드민 전용. 폴링으로 호출되는 가벼운 실시간 피드.
// - 캐시하지 않음(실시간 목적). 쿼리는 (name, occurredAt) 인덱스 꼬리만 읽어 O(log n).
// - after 커서가 있으면 그 이후 신규 행만 반환(증분).
// - 개인정보(IP·UA)는 반환하지 않는다(기존 방침과 동일). path·검색어는 비식별 저장값.
export async function GET(request: Request) {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const afterParam = new URL(request.url).searchParams.get("after");
  let after: Date | undefined;
  if (afterParam) {
    const parsed = new Date(afterParam);
    if (!Number.isNaN(parsed.getTime())) after = parsed;
  }

  const rows = await prisma.analyticsEvent.findMany({
    where: {
      OR: [
        { name: { in: FEED_EVENT_NAMES } },
        // page_view: 둘러보기 생동감용. 단 대회 상세(/competitions/<slug>)는 competition_view가
        // 대회명으로 이미 보여주므로 제외해 같은 진입이 두 줄로 찍히지 않게 한다.
        { name: "page_view", NOT: { path: { startsWith: "/competitions/" } } },
      ],
      ...(after ? { occurredAt: { gt: after } } : {}),
      session: { is: { trafficType: "human" } },
    },
    orderBy: { occurredAt: "desc" },
    take: FEED_LIMIT,
    select: {
      id: true,
      name: true,
      path: true,
      occurredAt: true,
      competitionId: true,
      searchQuery: true,
      session: { select: { deviceCategory: true } },
    },
  });

  const competitionIds = [
    ...new Set(rows.map((row) => row.competitionId).filter((id): id is string => Boolean(id))),
  ];
  const competitions = competitionIds.length
    ? await prisma.competitionSchedule.findMany({
        where: { id: { in: competitionIds } },
        select: { id: true, title: true },
      })
    : [];
  const titleById = new Map(competitions.map((c) => [c.id, c.title]));

  const events = rows.map((row) => {
    let target = row.path;
    if (row.competitionId && titleById.has(row.competitionId)) {
      target = titleById.get(row.competitionId) ?? row.path;
    } else if (row.name === "search_performed" && row.searchQuery) {
      target = `검색: ${row.searchQuery}`;
    }
    return {
      id: row.id,
      name: row.name,
      label: toAnalyticsEventLabel(row.name),
      at: row.occurredAt.toISOString(),
      target,
      device: row.session?.deviceCategory ?? null,
    };
  });

  return Response.json(
    { events },
    { headers: { "Cache-Control": "no-store" } },
  );
}
