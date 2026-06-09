"use client";

import { useCallback, useMemo } from "react";
import { regStatusAt } from "@/lib/data";
import { useCompetitionDrawer } from "@/hooks/use-competition-drawer";
import { useListFilterQueryState } from "@/hooks/use-filter-query-state";
import type {
  CompetitionFilterOptions,
  CompetitionListPage,
} from "@/lib/competition-public";
import type { ListFilterQueryState } from "@/lib/filter-query";
import { useClientToday } from "@/hooks/use-client-today";
import { useSiteShell } from "@/components/SiteShell";
import { ListView } from "@/components/ListView";
import { CompDrawer } from "@/components/CompDrawer";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

interface ListShellProps {
  initialCompetitionPage: CompetitionListPage;
  initialFilterOptions: CompetitionFilterOptions;
  initialFilterState: ListFilterQueryState;
  initialOpenedCompetitionId?: string;
  description: string;
}

export function ListShell({
  initialCompetitionPage,
  initialFilterOptions,
  initialFilterState,
  initialOpenedCompetitionId,
  description,
}: ListShellProps) {
  const today = useClientToday();
  const { saved, toggleSave } = useSiteShell();
  const { filters, setFilters, search, setSearch, scope, setScope, currentPath } =
    useListFilterQueryState(initialFilterState);
  const initialOpenedCompetition =
    initialOpenedCompetitionId
      ? initialCompetitionPage.items.find(
          (competition) => competition.id === initialOpenedCompetitionId,
        ) ?? null
      : null;
  const { openedComp, drawerOpen, openComp, closeDrawer } =
    useCompetitionDrawer({
      closePath: currentPath,
      initialCompetition: initialOpenedCompetition,
    });
  const openTrackedCompetition = useCallback(
    (competition: CompetitionListPage["items"][number]) => {
      trackAnalyticsEvent("competition_open", {
        competitionId: competition.id,
        properties: getCompetitionAnalyticsProperties(competition),
      });
      openComp(competition);
    },
    [openComp],
  );

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
        if (
          filters.ageGroups?.length &&
          !competition.classFacets.some(
            (facet) =>
              facet.type === "age" && filters.ageGroups!.includes(facet.value),
          )
        ) {
          return false;
        }
        if (
          filters.experienceClasses?.length &&
          !competition.classFacets.some(
            (facet) =>
              facet.type === "experience" &&
              filters.experienceClasses!.includes(facet.value),
          )
        ) {
          return false;
        }
        if (
          filters.measurementClasses?.length &&
          !competition.classFacets.some(
            (facet) =>
              facet.type === "measurement" &&
              filters.measurementClasses!.includes(facet.value),
          )
        ) {
          return false;
        }
        if (
          filters.classTexts?.length &&
          !competition.classTexts.some((classText) =>
            filters.classTexts!.includes(classText),
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
        if (
          filters.tiers?.length &&
          !filters.tiers.includes(competition.tier)
        ) {
          return false;
        }
        if (filters.global && !competition.attributes.global) {
          return false;
        }
        if (
          filters.nationalSelection &&
          !competition.attributes.nationalSelection
        ) {
          return false;
        }
        if (
          filters.nationalTeamEvent &&
          !competition.attributes.nationalTeamEvent
        ) {
          return false;
        }
        if (
          filters.nationalSportsFestival &&
          !competition.attributes.nationalSportsFestival
        ) {
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
    [competitions, filters, search, today],
  );

  return (
    <>
      <ListView
        comps={filtered}
        allComps={competitions}
        saved={saved}
        toggleSave={toggleSave}
        openComp={openTrackedCompetition}
        filters={filters}
        setFilters={setFilters}
        filterOptions={initialFilterOptions}
        search={search}
        setSearch={setSearch}
        scope={scope}
        setScope={setScope}
        today={today}
        description={description}
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

function getCompetitionAnalyticsProperties(
  competition: CompetitionListPage["items"][number],
) {
  return {
    organizationId: competition.organizationId ?? null,
    tier: competition.tier,
    region: competition.region,
    dateStartsOn: competition.date,
    registrationStatus: competition.registrationStatus ?? null,
  };
}
