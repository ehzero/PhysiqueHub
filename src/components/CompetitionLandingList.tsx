"use client";

import { useState } from "react";
import type { Competition } from "@/lib/data";
import { useClientToday } from "@/hooks/use-client-today";
import { useCompetitionDrawer } from "@/hooks/use-competition-drawer";
import { CompDrawer } from "@/components/CompDrawer";
import { CompetitionListItem } from "@/components/CompetitionListItem";
import { useSiteShell } from "@/components/SiteShell";

interface CompetitionLandingListProps {
  competitions: Competition[];
  initialToday?: string;
}

export function CompetitionLandingList({
  competitions,
  initialToday,
}: CompetitionLandingListProps) {
  const today = useClientToday(initialToday);
  const { saved, toggleSave } = useSiteShell();
  const [closePath] = useState(() =>
    typeof window === "undefined"
      ? ""
      : `${window.location.pathname}${window.location.search}`,
  );

  const { openedComp, drawerOpen, openComp, closeDrawer } =
    useCompetitionDrawer({
      closePath,
    });

  return (
    <>
      <div className="comp-list competition-landing-list">
        {competitions.map((competition) => (
          <CompetitionListItem
            key={competition.id}
            competition={competition}
            today={today}
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }

              event.preventDefault();
              openComp(competition);
            }}
          />
        ))}
      </div>

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
