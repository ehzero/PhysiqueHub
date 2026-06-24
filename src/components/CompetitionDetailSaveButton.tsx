"use client";

import { Icons } from "@/components/Icons";
import { useSiteShell } from "@/components/SiteShell";

interface CompetitionDetailSaveButtonProps {
  competitionId: string;
}

export function CompetitionDetailSaveButton({
  competitionId,
}: CompetitionDetailSaveButtonProps) {
  const { saved, toggleSave } = useSiteShell();
  const isSaved = saved.includes(competitionId);

  return (
    <button
      aria-label={isSaved ? "저장 취소" : "저장"}
      aria-pressed={isSaved}
      className={`det-reg-action${isSaved ? " saved" : ""}`}
      onClick={() => toggleSave(competitionId)}
      type="button"
    >
      {isSaved ? Icons.bookmarkFilled : Icons.bookmark}
      <span>{isSaved ? "저장됨" : "저장"}</span>
    </button>
  );
}
