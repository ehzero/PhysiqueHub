"use client";

import { useCallback, useEffect, useState } from "react";

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
    setSaved((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id],
    );
  }, []);

  return {
    saved,
    toggleSave,
  };
}
