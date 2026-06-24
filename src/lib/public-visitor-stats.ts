import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getKoreaDateParam } from "@/lib/date";

const VISITOR_STATS_REVALIDATE_SECONDS = 60;

export interface PublicVisitorStats {
  todayVisitors: number;
  totalVisitors: number;
  date: string;
}

export async function getPublicVisitorStats(
  date = getKoreaDateParam(),
): Promise<PublicVisitorStats> {
  return getCachedPublicVisitorStats(date);
}

const getCachedPublicVisitorStats = unstable_cache(
  async (date: string): Promise<PublicVisitorStats> => {
    const { start, end } = getKoreaDayBounds(date);
    const [todayRows, totalRows] = await Promise.all([
      prisma.$queryRaw<VisitorCountRow[]>`
        SELECT COUNT(DISTINCT "visitorId")::bigint AS count
        FROM "AnalyticsSession"
        WHERE "startedAt" >= ${start} AND "startedAt" < ${end}
      `,
      prisma.$queryRaw<VisitorCountRow[]>`
        SELECT COUNT(DISTINCT "visitorId")::bigint AS count
        FROM "AnalyticsSession"
      `,
    ]);

    return {
      todayVisitors: toCount(todayRows),
      totalVisitors: toCount(totalRows),
      date,
    };
  },
  ["public-visitor-stats"],
  { revalidate: VISITOR_STATS_REVALIDATE_SECONDS },
);

function getKoreaDayBounds(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, -9));
  const end = new Date(start.getTime() + 86_400_000);

  return { start, end };
}

type VisitorCountRow = {
  count: bigint | number;
};

function toCount(rows: VisitorCountRow[]) {
  const count = rows[0]?.count ?? 0;
  return Number(count);
}
