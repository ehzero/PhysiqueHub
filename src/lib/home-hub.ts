import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getKoreaDateParam } from "@/lib/date";
import { serializePublicCompetitionListItem } from "@/lib/competition-api";
import { toCompetition } from "@/lib/competition-public";
import { getCompetitionFiltersPayload } from "@/lib/competition-server";
import { KOREAN_REGION_ORDER } from "@/lib/location";
import type { Competition } from "@/lib/data";

export interface HomeHubStats {
  totalShows: number;
  upcomingShows: number;
  domesticShows: number;
  majorShows: number;
  nextShow: { title: string; date: string } | null;
}

export interface HomeExploreType {
  key: string;
  kr: string;
  en: string;
  hint: string;
  href: string;
  count: number;
}

export interface HomeHubData {
  seasonYear: number;
  today: string;
  stats: HomeHubStats;
  globalMajors: Competition[];
  upcoming: Competition[];
  rookieFriendly: Competition[];
  exploreCategories: Array<{ name: string; count: number }>;
  exploreTypes: HomeExploreType[];
  exploreRegions: Array<{ name: string; count: number }>;
  exploreOrganizations: Array<{
    id: string;
    name: string;
    shortName?: string | null;
    count: number;
  }>;
}

export const getHomeHubData = cache(async (): Promise<HomeHubData> => {
  const today = getKoreaDateParam();
  const seasonYear = Number(today.slice(0, 4));
  const todayDate = new Date(`${today}T00:00:00+09:00`);

  const [
    totalShows,
    upcomingShows,
    domesticShows,
    globalMajorRecords,
    upcomingRecords,
    rookieRecords,
    globalProShowCount,
    filterOptions,
  ] = await Promise.all([
    prisma.competitionSchedule.count({ where: { seasonYear } }),

    prisma.competitionSchedule.count({
      where: { seasonYear, dateStartsOn: { gte: todayDate } },
    }),

    prisma.competitionSchedule.count({
      where: { seasonYear, country: "KR" },
    }),

    prisma.competitionSchedule.findMany({
      where: {
        seasonYear,
        dateStartsOn: { gte: todayDate },
        OR: [
          { title: { contains: "Olympia", mode: "insensitive" } },
          { title: { contains: "Arnold", mode: "insensitive" } },
        ],
      },
      orderBy: [{ dateStartsOn: "asc" }],
      take: 3,
    }),

    prisma.competitionSchedule.findMany({
      where: { seasonYear, dateStartsOn: { gte: todayDate } },
      orderBy: [{ dateStartsOn: "asc" }, { title: "asc" }],
      take: 5,
    }),

    prisma.competitionSchedule.findMany({
      where: {
        seasonYear,
        dateStartsOn: { gte: todayDate },
        OR: [
          { flagsJson: { contains: '"beginnerFriendly":true' } },
          { flagsJson: { contains: '"rookieClass":true' } },
        ],
      },
      orderBy: [{ dateStartsOn: "asc" }],
      take: 3,
    }),

    prisma.competitionSchedule.count({
      where: {
        seasonYear,
        organizationId: "ifbb-pro-league",
      },
    }),

    getCompetitionFiltersPayload({
      seasonYear,
      page: 1,
      pageSize: 1,
      organizationIds: [],
      registrationStatuses: [],
      sort: "date-asc",
    }),
  ]);

  const { flags } = filterOptions;
  const koreaRegionNames = new Set<string>(KOREAN_REGION_ORDER);

  const exploreTypes: HomeExploreType[] = sortByCountThenName(
    [
    {
      key: "natural",
      kr: "내추럴",
      en: "Natural",
      hint: "내추럴 유형",
      href: "/competitions?natural=true",
      count: flags.natural,
    },
    {
      key: "beginner",
      kr: "루키·입문",
      en: "Rookie / Beginner",
      hint: "입문 성격의 부문",
      href: "/competitions?beginnerAny=true",
      count: flags.beginnerAny,
    },
    {
      key: "regional",
      kr: "리저널",
      en: "Regional",
      hint: "지역·리저널 대회",
      href: "/competitions?regional=true",
      count: flags.regional,
    },
    {
      key: "qualifier",
      kr: "프로 퀄리파이어",
      en: "Pro Qualifier",
      hint: "프로카드 진입 대회",
      href: "/competitions?proQualifier=true",
      count: flags.proQualifier,
    },
    {
      key: "international",
      kr: "국제대회·국가대표",
      en: "International / National",
      hint: "국제대회·대표 루트",
      href: "/competitions?internationalRoute=true",
      count: flags.internationalRoute,
    },
    {
      key: "globalPro",
      kr: "글로벌 프로 무대",
      en: "Global Pro",
      hint: "IFBB Pro League",
      href: "/competitions?organizationId=ifbb-pro-league",
      count: globalProShowCount,
    },
    ],
    (item) => item.kr,
  );

  return {
    seasonYear,
    today,
    stats: {
      totalShows,
      upcomingShows,
      domesticShows,
      majorShows: globalMajorRecords.length,
      nextShow: upcomingRecords[0]
        ? {
            title: upcomingRecords[0].title,
            date: toKoreaDateStr(upcomingRecords[0].dateStartsOn),
          }
        : null,
    },
    globalMajors: globalMajorRecords.map((r) =>
      toCompetition(serializePublicCompetitionListItem(r)),
    ),
    upcoming: upcomingRecords.map((r) =>
      toCompetition(serializePublicCompetitionListItem(r)),
    ),
    rookieFriendly: rookieRecords.map((r) =>
      toCompetition(serializePublicCompetitionListItem(r)),
    ),
    exploreCategories: sortByCountThenName(
      filterOptions.categories,
      (item) => item.name,
    ),
    exploreTypes,
    exploreRegions: sortByCountThenName(
      filterOptions.regions.filter((region) => koreaRegionNames.has(region.name)),
      (item) => item.name,
    ),
    exploreOrganizations: sortByCountThenName(
      filterOptions.organizations,
      (item) => item.name,
    ),
  };
});

function sortByCountThenName<T extends { count: number }>(
  items: T[],
  getName: (item: T) => string,
): T[] {
  return [...items].sort(
    (a, b) => b.count - a.count || getName(a).localeCompare(getName(b), "ko-KR"),
  );
}

function toKoreaDateStr(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
