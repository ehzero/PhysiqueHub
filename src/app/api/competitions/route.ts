import {
  parseCompetitionListQuery,
} from "@/lib/competition-api";
import { getCompetitionListPayload } from "@/lib/competition-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseCompetitionListQuery(url.searchParams);
  const payload = await getCompetitionListPayload(query);

  return Response.json({
    ...payload,
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
      tiers: query.tiers,
      global: query.global,
      major: query.major,
      nationalSelection: query.nationalSelection,
      sort: query.sort,
    },
  });
}
