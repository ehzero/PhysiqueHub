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

  return (
    <div className="nav-visitor-stats" aria-label={getVisitorStatsLabel(stats)}>
      <span>
        오늘{" "}
        <b className="mono">{formatVisitorCount(stats?.todayVisitors)}</b>
      </span>
      <span className="nav-visitor-divider" aria-hidden="true" />
      <span>
        전체{" "}
        <b className="mono">{formatVisitorCount(stats?.totalVisitors)}</b>
      </span>
    </div>
  );
}

function formatVisitorCount(value: number | undefined) {
  return typeof value === "number" ? value.toLocaleString("ko-KR") : "-";
}

function getVisitorStatsLabel(stats: VisitorStats | null) {
  if (!stats) {
    return "방문자 수를 불러오는 중";
  }

  return `오늘 방문자 ${stats.todayVisitors.toLocaleString(
    "ko-KR",
  )}명, 전체 방문자 ${stats.totalVisitors.toLocaleString("ko-KR")}명`;
}
