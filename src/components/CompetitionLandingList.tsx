"use client";

import type { Competition } from "@/lib/data";
import { useClientToday } from "@/hooks/use-client-today";
import { CompetitionListItem } from "@/components/CompetitionListItem";

interface CompetitionLandingListProps {
  competitions: Competition[];
}

export function CompetitionLandingList({
  competitions,
}: CompetitionLandingListProps) {
  const today = useClientToday();

  return (
    <div className="comp-list competition-landing-list">
      {competitions.map((competition) => (
        <CompetitionListItem
          key={competition.id}
          competition={competition}
          today={today}
        />
      ))}
    </div>
  );
}
