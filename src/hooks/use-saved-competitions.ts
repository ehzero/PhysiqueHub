"use client";

import { useCallback, useEffect, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

const SAVED_STORAGE_KEY = "ph-saved";

export function useSavedCompetitions() {
  const [saved, setSaved] = useState<string[]>([]);
  const [savedReady, setSavedReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedSaved = JSON.parse(
          localStorage.getItem(SAVED_STORAGE_KEY) || "[]",
        );
        if (Array.isArray(storedSaved)) {
          setSaved(storedSaved);
        }
      } catch {
        // Ignore broken localStorage payloads.
      } finally {
        setSavedReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!savedReady) {
      return;
    }

    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));
  }, [saved, savedReady]);

  const toggleSave = useCallback((id: string) => {
    setSaved((current) => {
      const alreadySaved = current.includes(id);
      const next = alreadySaved
        ? current.filter((savedId) => savedId !== id)
        : [...current, id];

      trackAnalyticsEvent(alreadySaved ? "unsave_competition" : "save_competition", {
        competitionId: id,
        properties: {
          savedCount: next.length,
        },
      });

      return next;
    });
  }, []);

  return {
    saved,
    toggleSave,
  };
}
