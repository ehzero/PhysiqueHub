import type { Metadata } from "next";
import { ListShell } from "@/components/ListShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import { parseListFilterQuery } from "@/lib/filter-query";
import { createPageMetadata } from "@/lib/metadata";
import { getKoreaYear } from "@/lib/date";

export const revalidate = 86_400;

function getCompetitionListDescription(seasonYear: number) {
  return `${seasonYear}년 국내·해외 단체의 일정을 한곳에서 비교하세요. 종목·유형·지역·단체로 좁히고, 접수 상태를 확인하며 마감일 기준으로 정렬할 수 있습니다.`;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...createPageMetadata({
      title: "대회 일정",
      description: getCompetitionListDescription(getKoreaYear()),
      path: "/competitions",
    }),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CompetitionsPage() {
  const { competitionPage, filterOptions, seasonYear } =
    await getUpcomingCompetitionContext({ includeFilters: true });
  const initialFilterState = parseListFilterQuery(new URLSearchParams());
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
