import { parseCompetitionListQuery } from "@/lib/competition-api";
import { getCompetitionFiltersPayload } from "@/lib/competition-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseCompetitionListQuery(url.searchParams);
  return Response.json(await getCompetitionFiltersPayload(query));
}
