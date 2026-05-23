import { ListShell } from "@/components/ListShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import {
  parseListFilterQuery,
  toURLSearchParams,
  type PageSearchParams,
} from "@/lib/filter-query";
import { createPageMetadata } from "@/lib/metadata";

export const revalidate = 86_400;

export const metadata = createPageMetadata({
  title: "대회 목록",
  description:
    "국내 보디빌딩·피트니스 대회 일정을 주최 단체, 카테고리, 접수 상태별로 탐색해보세요.",
  path: "/competitions",
});

interface CompetitionsPageProps {
  searchParams?: Promise<PageSearchParams>;
}

export default async function CompetitionsPage({
  searchParams,
}: CompetitionsPageProps) {
  const { competitionPage, filterOptions } =
    await getUpcomingCompetitionContext({ includeFilters: true });
  const initialFilterState = parseListFilterQuery(
    toURLSearchParams(await searchParams),
  );

  return (
    <ListShell
      initialCompetitionPage={competitionPage}
      initialFilterOptions={filterOptions!}
      initialFilterState={initialFilterState}
    />
  );
}
