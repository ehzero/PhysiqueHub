import type { Metadata } from "next";
import { ListShell } from "@/components/ListShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import {
  isListFilterQueryKey,
  parseListFilterQuery,
  toURLSearchParams,
  type PageSearchParams,
} from "@/lib/filter-query";
import { createPageMetadata } from "@/lib/metadata";
import { getKoreaYear } from "@/lib/date";

export const revalidate = 86_400;

function getCompetitionListDescription(seasonYear: number) {
  return `${seasonYear}년 국내외 보디빌딩·피트니스 대회 일정을 한곳에서 확인하세요. 주최 단체, 지역, 종목, 대회 유형별로 대회를 탐색할 수 있습니다.`;
}

interface CompetitionsPageProps {
  searchParams?: Promise<PageSearchParams>;
}

export async function generateMetadata({
  searchParams,
}: CompetitionsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilterQuery = Object.keys(params ?? {}).some(isListFilterQueryKey);

  return {
    ...createPageMetadata({
      title: "대회 목록",
      description: getCompetitionListDescription(getKoreaYear()),
      path: "/competitions",
    }),
    robots: {
      index: !hasFilterQuery,
      follow: true,
    },
  };
}

export default async function CompetitionsPage({
  searchParams,
}: CompetitionsPageProps) {
  const { competitionPage, filterOptions, seasonYear } =
    await getUpcomingCompetitionContext({ includeFilters: true });
  const initialFilterState = parseListFilterQuery(
    toURLSearchParams(await searchParams),
  );
  const description = getCompetitionListDescription(seasonYear);

  return (
    <ListShell
      initialCompetitionPage={competitionPage}
      initialFilterOptions={filterOptions!}
      initialFilterState={initialFilterState}
      description={description}
    />
  );
}
