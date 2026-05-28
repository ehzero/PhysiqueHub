"use client";

import { useState } from "react";
import type { Competition } from "@/lib/data";
import { getCompetitionPath } from "@/lib/competition-slug";

interface UseCompetitionDrawerOptions {
  closePath: string;
  initialCompetition?: Competition | null;
}

export function useCompetitionDrawer({
  closePath,
  initialCompetition = null,
}: UseCompetitionDrawerOptions) {
  const [openedComp, setOpenedComp] = useState<Competition | null>(
    initialCompetition,
  );
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialCompetition));

  function openComp(comp: Competition) {
    setOpenedComp(comp);
    setDrawerOpen(true);
    window.history.pushState(null, "", getCompetitionPath(comp));
  }

  function closeDrawer() {
    setDrawerOpen(false);
    window.history.replaceState(null, "", closePath);
    window.setTimeout(() => setOpenedComp(null), 320);
  }

  return {
    openedComp,
    drawerOpen,
    openComp,
    closeDrawer,
  };
}
