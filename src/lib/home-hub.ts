import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getKoreaDateParam } from "@/lib/date";
import { serializePublicCompetitionListItem } from "@/lib/competition-api";
import { toCompetition } from "@/lib/competition-public";
import { getCompetitionFiltersPayload } from "@/lib/competition-server";
import {
  getCategoryTaxonForName,
  getCompetitionLandingPath,
  getCompetitionLandingTaxon,
  getCompetitionLandingTaxons,
  getOrganizationTaxonForId,
  getRegionTaxonForName,
} from "@/lib/competition-taxonomy";
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
  exploreCategories: Array<{
    name: string;
    href: string;
    count: number;
  }>;
  exploreTypes: HomeExploreType[];
  exploreRegions: Array<{ name: string; count: number; href: string }>;
  exploreOrganizations: Array<{
    id: string;
    name: string;
    shortName?: string | null;
    count: number;
    href: string;
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
    categoryGroupRecords,
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

    prisma.competitionSchedule.findMany({
      where: { seasonYear },
      select: {
        title: true,
        divisionsJson: true,
        tagsJson: true,
      },
    }),
  ]);

  const { flags } = filterOptions;
  const koreaRegionNames = new Set<string>(KOREAN_REGION_ORDER);
  const naturalTaxon = getCompetitionLandingTaxon("type", "natural");
  const rookieTaxon = getCompetitionLandingTaxon("type", "rookie");
  const regionalTaxon = getCompetitionLandingTaxon("type", "regional");
  const proPathTaxon = getCompetitionLandingTaxon("type", "pro-path");
  const internationalTaxon = getCompetitionLandingTaxon(
    "type",
    "international-route",
  );
  const ifbbTaxon = getCompetitionLandingTaxon("organization", "ifbb");

  const exploreTypes: HomeExploreType[] = sortByCountThenName(
    [
      {
        key: "natural",
        kr: "내추럴",
        en: "Natural",
        hint: "내추럴 유형",
        href: naturalTaxon ? getCompetitionLandingPath(naturalTaxon) : "/competitions",
        count: flags.natural,
      },
      {
        key: "beginner",
        kr: "루키·입문",
        en: "Rookie / Beginner",
        hint: "입문 성격의 부문",
        href: rookieTaxon ? getCompetitionLandingPath(rookieTaxon) : "/competitions",
        count: flags.beginnerAny,
      },
      {
        key: "regional",
        kr: "리저널",
        en: "Regional",
        hint: "지역·리저널 대회",
        href: regionalTaxon ? getCompetitionLandingPath(regionalTaxon) : "/competitions",
        count: flags.regional,
      },
      {
        key: "qualifier",
        kr: "프로 퀄리파이어",
        en: "Pro Qualifier",
        hint: "프로카드 진입 대회",
        href: proPathTaxon ? getCompetitionLandingPath(proPathTaxon) : "/competitions",
        count: flags.proQualifier,
      },
      {
        key: "international",
        kr: "국제대회·국가대표",
        en: "International / National",
        hint: "국제대회·대표 루트",
        href: internationalTaxon ? getCompetitionLandingPath(internationalTaxon) : "/competitions",
        count: flags.internationalRoute,
      },
      {
        key: "globalPro",
        kr: "글로벌 프로 무대",
        en: "Global Pro",
        hint: "IFBB Pro League",
        href: ifbbTaxon ? getCompetitionLandingPath(ifbbTaxon) : "/competitions",
        count: globalProShowCount,
      },
    ],
    (item) => item.kr,
  );
  const exploreCategories = getHomeCategoryGroups(categoryGroupRecords);

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
    exploreCategories,
    exploreTypes,
    exploreRegions: sortByCountThenName(
      filterOptions.regions
        .filter((region) => koreaRegionNames.has(region.name))
        .map((region) => {
          const taxon = getRegionTaxonForName(region.name);

          return {
            ...region,
            href: taxon ? getCompetitionLandingPath(taxon) : "/competitions",
          };
        }),
      (item) => item.name,
    ),
    exploreOrganizations: sortByCountThenName(
      getHomeOrganizationGroups(filterOptions.organizations),
      (item) => item.name,
    ),
  };
});

function getHomeCategoryGroups(
  records: Array<{
    title: string;
    divisionsJson: string;
    tagsJson: string;
  }>,
) {
  const countBySlug = new Map<string, number>();

  for (const record of records) {
    const slugs = new Set<string>();

    for (const value of getCategoryCandidateTexts(record)) {
      const taxon = getCategoryTaxonForName(value);

      if (taxon) {
        slugs.add(taxon.slug);
      }
    }

    for (const slug of slugs) {
      countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
    }
  }

  return sortByCountThenName(
    getCompetitionLandingTaxons("category")
      .map((taxon) => ({
        name: taxon.shortLabel ?? taxon.label,
        href: getCompetitionLandingPath(taxon),
        count: countBySlug.get(taxon.slug) ?? 0,
      }))
      .filter((item) => item.count > 0),
    (item) => item.name,
  );
}

function getHomeOrganizationGroups(
  organizations: Array<{
    id: string;
    name: string;
    shortName?: string | null;
    count: number;
  }>,
) {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      shortName?: string | null;
      count: number;
      href: string;
    }
  >();

  for (const organization of organizations) {
    const taxon = getOrganizationTaxonForId(organization.id);

    if (!taxon) {
      grouped.set(organization.id, {
        ...organization,
        href: `/competitions?org=${encodeURIComponent(organization.name)}`,
      });
      continue;
    }

    const current = grouped.get(taxon.slug);
    grouped.set(taxon.slug, {
      id: taxon.slug,
      name: taxon.label,
      shortName: taxon.shortLabel,
      count: (current?.count ?? 0) + organization.count,
      href: getCompetitionLandingPath(taxon),
    });
  }

  return Array.from(grouped.values());
}

function getCategoryCandidateTexts(record: {
  title: string;
  divisionsJson: string;
  tagsJson: string;
}) {
  const divisions = parseJsonArray(record.divisionsJson).flatMap((division) => {
    if (!isRecord(division)) return [];

    return [division.name, division.group].filter(isString);
  });
  const tags = parseJsonArray(record.tagsJson).filter(isString);

  return [record.title, ...divisions, ...tags];
}

function parseJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

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
