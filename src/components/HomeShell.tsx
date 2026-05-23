"use client";

import { useCompetitionDrawer } from "@/hooks/use-competition-drawer";
import { useHomeFilterQueryState } from "@/hooks/use-filter-query-state";
import { useClientToday } from "@/hooks/use-client-today";
import { useSiteShell } from "@/components/SiteShell";
import type {
  CompetitionFilterOptions,
  CompetitionListPage,
} from "@/lib/competition-public";
import type { HomeFilterQueryState } from "@/lib/filter-query";
import { HomeView } from "@/components/HomeView";
import { CompDrawer } from "@/components/CompDrawer";

interface HomeShellProps {
  seasonYear: number;
  initialCompetitionPage: CompetitionListPage;
  initialFilterOptions: CompetitionFilterOptions;
  initialFilterState: HomeFilterQueryState;
}

export function HomeShell({
  seasonYear,
  initialCompetitionPage,
  initialFilterOptions,
  initialFilterState,
}: HomeShellProps) {
  const today = useClientToday();
  const { saved, toggleSave } = useSiteShell();
  const { state, setHomeFilterState, currentPath } =
    useHomeFilterQueryState(initialFilterState);
  const { openedComp, drawerOpen, openComp, closeDrawer } =
    useCompetitionDrawer({ closePath: currentPath });

  return (
    <>
      <HomeView
        seasonYear={seasonYear}
        initialCompetitionPage={initialCompetitionPage}
        saved={saved}
        toggleSave={toggleSave}
        openComp={openComp}
        filterOptions={initialFilterOptions}
        filterState={state}
        setFilterState={setHomeFilterState}
        today={today}
      />

      <CompDrawer
        comp={openedComp}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        isSaved={openedComp ? saved.includes(openedComp.id) : false}
        onToggleSave={toggleSave}
        today={today}
      />
    </>
  );
}
