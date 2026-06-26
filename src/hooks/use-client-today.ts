"use client";

import { useEffect, useState } from "react";
import { parseDate } from "@/lib/data";

export function useClientToday(initialToday?: string) {
  const [today, setToday] = useState<Date | null>(() =>
    initialToday ? parseDate(initialToday) : null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      setToday(parseDate(formatter.format(new Date())));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return today;
}
