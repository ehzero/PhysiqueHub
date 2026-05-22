import { prisma } from "@/lib/prisma";
import {
  buildCompetitionWhere,
  getCompetitionOrderBy,
  normalizePageMeta,
  parseCompetitionListQuery,
  serializePublicCompetitionListItem,
} from "@/lib/competition-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseCompetitionListQuery(url.searchParams);
  const where = buildCompetitionWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    prisma.competitionSchedule.findMany({
      where,
      orderBy: getCompetitionOrderBy(query.sort),
      skip,
      take: query.pageSize,
    }),
    prisma.competitionSchedule.count({ where }),
  ]);

  return Response.json({
    items: items.map(serializePublicCompetitionListItem),
    ...normalizePageMeta(query.page, query.pageSize, total),
    filters: {
      seasonYear: query.seasonYear,
      organizationIds: query.organizationIds,
      registrationStatuses: query.registrationStatuses,
      startsFrom: url.searchParams.get("startsFrom"),
      startsTo: url.searchParams.get("startsTo"),
      keyword: query.keyword,
      hasDate: query.hasDate,
      natural: query.natural,
      beginnerAny: query.beginnerAny,
      beginnerFriendly: query.beginnerFriendly,
      rookieClass: query.rookieClass,
      proQualifier: query.proQualifier,
      sort: query.sort,
    },
  });
}
