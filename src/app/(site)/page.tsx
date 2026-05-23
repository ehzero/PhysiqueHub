import { HomeShell } from "@/components/HomeShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import {
  parseHomeFilterQuery,
  toURLSearchParams,
  type PageSearchParams,
} from "@/lib/filter-query";

export const revalidate = 86_400;

interface HomePageProps {
  searchParams?: Promise<PageSearchParams>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { seasonYear, competitionPage, filterOptions } =
    await getUpcomingCompetitionContext({ includeFilters: true });
  const initialFilterState = parseHomeFilterQuery(
    toURLSearchParams(await searchParams),
  );

  return (
    <HomeShell
      seasonYear={seasonYear}
      initialCompetitionPage={competitionPage}
      initialFilterOptions={filterOptions!}
      initialFilterState={initialFilterState}
    />
  );
}
