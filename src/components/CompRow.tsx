"use client";

import { getCompetitionPath } from "@/lib/competition-slug";
import type { Competition } from "@/lib/data";
import { CompetitionListItem } from "./CompetitionListItem";

interface CompRowProps {
  comp: Competition;
  onOpen: (c: Competition) => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  today: Date | null;
}

export function CompRow({ comp, onOpen, today }: CompRowProps) {
  const href = getCompetitionPath(comp);

  return (
    <CompetitionListItem
      competition={comp}
      today={today}
      href={href}
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
        onOpen(comp);
      }}
    />
  );
}
