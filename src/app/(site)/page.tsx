import { HomeShell } from "@/components/HomeShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import { parseHomeFilterQuery } from "@/lib/filter-query";

export const revalidate = 86_400;

export default async function Home() {
  const { seasonYear, competitionPage, filterOptions } =
    await getUpcomingCompetitionContext({ includeFilters: true });
  const initialFilterState = parseHomeFilterQuery(new URLSearchParams());

  return (
    <HomeShell
      seasonYear={seasonYear}
      initialCompetitionPage={competitionPage}
      initialFilterOptions={filterOptions!}
      initialFilterState={initialFilterState}
    />
  );
}
