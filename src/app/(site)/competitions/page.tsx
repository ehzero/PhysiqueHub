import type { Metadata } from "next";
import { ListShell } from "@/components/ListShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import {
  isListFilterQueryKey,
  parseListFilterQuery,
  type PageSearchParams,
} from "@/lib/filter-query";
import { createPageMetadata } from "@/lib/metadata";

export const revalidate = 86_400;

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
      description:
        "국내 보디빌딩·피트니스 대회 일정을 주최 단체, 카테고리, 접수 상태별로 탐색해보세요.",
      path: "/competitions",
    }),
    robots: {
      index: !hasFilterQuery,
      follow: true,
    },
  };
}

export default async function CompetitionsPage() {
  const { competitionPage, filterOptions } =
    await getUpcomingCompetitionContext({ includeFilters: true });
  const initialFilterState = parseListFilterQuery(new URLSearchParams());

  return (
    <ListShell
      initialCompetitionPage={competitionPage}
      initialFilterOptions={filterOptions!}
      initialFilterState={initialFilterState}
    />
  );
}
