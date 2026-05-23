"use client";

import { useMemo, useState } from "react";
import type { Filters } from "@/lib/data";
import { regStatusAt } from "@/lib/data";
import { useCompetitionDrawer } from "@/hooks/use-competition-drawer";
import type {
  CompetitionFilterOptions,
  CompetitionListPage,
} from "@/lib/competition-public";
import { useClientToday } from "@/hooks/use-client-today";
import { useSiteShell } from "@/components/SiteShell";
import { ListView } from "@/components/ListView";
import { CompDrawer } from "@/components/CompDrawer";

interface ListShellProps {
  initialCompetitionPage: CompetitionListPage;
  initialFilterOptions: CompetitionFilterOptions;
  initialOpenedCompetitionId?: string;
}

export function ListShell({
  initialCompetitionPage,
  initialFilterOptions,
  initialOpenedCompetitionId,
}: ListShellProps) {
  const today = useClientToday();
  const { saved, toggleSave } = useSiteShell();
  const initialOpenedCompetition =
    initialOpenedCompetitionId
      ? initialCompetitionPage.items.find(
          (competition) => competition.id === initialOpenedCompetitionId,
        ) ?? null
      : null;
  const { openedComp, drawerOpen, openComp, closeDrawer } =
    useCompetitionDrawer({
      closePath: "/competitions",
      initialCompetition: initialOpenedCompetition,
    });
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState("");

  const competitions = initialCompetitionPage.items;
  const filtered = useMemo(
    () =>
      competitions.filter((competition) => {
        if (
          filters.regions?.length &&
          !filters.regions.includes(competition.region)
        ) {
          return false;
        }
        if (filters.orgs?.length && !filters.orgs.includes(competition.org)) {
          return false;
        }
        if (
          filters.cats?.length &&
          !competition.categories.some((category) =>
            filters.cats!.includes(category),
          )
        ) {
          return false;
        }
        if (filters.status?.length) {
          if (!today) {
            return false;
          }
          if (!filters.status.includes(regStatusAt(competition, today).kind)) {
            return false;
          }
        }
        if (filters.beginner && !competition.beginner) {
          return false;
        }
        if (filters.natural && !competition.natural) {
          return false;
        }
        if (filters.savedOnly && !saved.includes(competition.id)) {
          return false;
        }
        if (
          search &&
          !competition.title.includes(search) &&
          !competition.org.includes(search) &&
          !competition.region.includes(search)
        ) {
          return false;
        }

        return true;
      }),
    [competitions, filters, saved, search, today],
  );

  return (
    <>
      <ListView
        comps={filtered}
        allComps={competitions}
        saved={saved}
        toggleSave={toggleSave}
        openComp={openComp}
        filters={filters}
        setFilters={setFilters}
        filterOptions={initialFilterOptions}
        search={search}
        setSearch={setSearch}
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
