"use client";

import { useMemo } from "react";
import type { Competition } from "@/lib/data";
import { useCompetitionDrawer } from "@/hooks/use-competition-drawer";
import { useClientToday } from "@/hooks/use-client-today";
import { useSiteShell } from "@/components/SiteShell";
import { SavedView } from "@/components/SavedView";
import { CompDrawer } from "@/components/CompDrawer";

interface SavedShellProps {
  competitions: Competition[];
}

export function SavedShell({
  competitions,
}: SavedShellProps) {
  const today = useClientToday();
  const { saved, toggleSave } = useSiteShell();
  const { openedComp, drawerOpen, openComp, closeDrawer } =
    useCompetitionDrawer({ closePath: "/saved" });

  const savedCompetitions = useMemo(
    () => competitions.filter((competition) => saved.includes(competition.id)),
    [competitions, saved],
  );

  return (
    <>
      <SavedView
        comps={savedCompetitions}
        toggleSave={toggleSave}
        openComp={openComp}
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
