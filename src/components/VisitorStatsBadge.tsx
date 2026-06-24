"use client";

import { useEffect, useState } from "react";
import { getVisitorStats } from "@/lib/analytics-api";

interface VisitorStats {
  todayVisitors: number;
  totalVisitors: number;
}

export function VisitorStatsBadge() {
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const data = await getVisitorStats();
        if (
          cancelled ||
          typeof data.todayVisitors !== "number" ||
          typeof data.totalVisitors !== "number"
        ) {
          return;
        }

        setStats({
          todayVisitors: data.todayVisitors,
          totalVisitors: data.totalVisitors,
        });
      } catch {
        // Header stats are decorative; keep navigation usable if analytics is unavailable.
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  return (
    <div className="nav-visitor-stats" aria-label={getVisitorStatsLabel(stats)}>
      <span>
        오늘{" "}
        <b className="mono">{stats.todayVisitors.toLocaleString("ko-KR")}</b>
      </span>
      <span className="nav-visitor-divider" aria-hidden="true" />
      <span>
        전체{" "}
        <b className="mono">{stats.totalVisitors.toLocaleString("ko-KR")}</b>
      </span>
    </div>
  );
}

function getVisitorStatsLabel(stats: VisitorStats) {
  return `오늘 방문자 ${stats.todayVisitors.toLocaleString(
    "ko-KR",
  )}명, 전체 방문자 ${stats.totalVisitors.toLocaleString("ko-KR")}명`;
}
