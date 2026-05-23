import { HomeShell } from "@/components/HomeShell";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";

export const revalidate = 86_400;

export default async function Home() {
  const { seasonYear, competitionPage, filterOptions } =
    await getUpcomingCompetitionContext({ includeFilters: true });

  return (
    <HomeShell
      seasonYear={seasonYear}
      initialCompetitionPage={competitionPage}
      initialFilterOptions={filterOptions!}
    />
  );
}
