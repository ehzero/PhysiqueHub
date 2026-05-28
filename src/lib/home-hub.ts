import "server-only";

import { cache } from "react";
import type { CompetitionSchedule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getKoreaDateParam } from "@/lib/date";
import { serializePublicCompetitionListItem } from "@/lib/competition-api";
import { normalizeCompetitionDivision } from "@/lib/competition-division";
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

const GLOBAL_MAJOR_LIMIT = 3;

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
    upcomingCandidateRecords,
    upcomingRecords,
    filterOptions,
    categoryGroupRecords,
  ] = await Promise.all([
    prisma.competitionSchedule.count({ where: { seasonYear } }),

    prisma.competitionSchedule.count({
      where: { seasonYear, dateStartsOn: { gte: todayDate } },
    }),

    prisma.competitionSchedule.count({
      where: { seasonYear, country: "KR", dateStartsOn: { gte: todayDate } },
    }),

    prisma.competitionSchedule.findMany({
      where: {
        seasonYear,
        dateStartsOn: { gte: todayDate },
      },
      orderBy: [{ dateStartsOn: "asc" }, { title: "asc" }],
    }),

    prisma.competitionSchedule.findMany({
      where: { seasonYear, country: "KR", dateStartsOn: { gte: todayDate } },
      orderBy: [{ dateStartsOn: "asc" }, { title: "asc" }],
      take: 5,
    }),

    getCompetitionFiltersPayload({
      seasonYear,
      page: 1,
      pageSize: 1,
      organizationIds: [],
      registrationStatuses: [],
      ageGroups: [],
      experienceClasses: [],
      measurementClasses: [],
      classTexts: [],
      startsFrom: todayDate,
      tiers: [],
      sort: "date-asc",
    }),

    prisma.competitionSchedule.findMany({
      where: { seasonYear, dateStartsOn: { gte: todayDate } },
      select: {
        divisionsJson: true,
      },
    }),
  ]);

  const globalMajors = getGlobalMajorCompetitions(upcomingCandidateRecords);
  const { flags } = filterOptions;
  const rookieFriendly = upcomingCandidateRecords
    .map((record) => toCompetition(serializePublicCompetitionListItem(record)))
    .filter((competition) => competition.attributes.beginner)
    .slice(0, 3);
  const koreaRegionNames = new Set<string>(KOREAN_REGION_ORDER);
  const naturalTaxon = getCompetitionLandingTaxon("type", "natural");
  const rookieTaxon = getCompetitionLandingTaxon("type", "rookie");
  const regionalTaxon = getCompetitionLandingTaxon("type", "regional");
  const proPathTaxon = getCompetitionLandingTaxon("type", "pro-qualifier");
  const proShowTaxon = getCompetitionLandingTaxon("type", "pro-show");
  const championshipTaxon = getCompetitionLandingTaxon("type", "championship");
  const globalTaxon = getCompetitionLandingTaxon("type", "global");
  const nationalSelectionTaxon = getCompetitionLandingTaxon(
    "type",
    "national-selection",
  );
  const nationalTeamEventTaxon = getCompetitionLandingTaxon(
    "type",
    "national-team-event",
  );
  const nationalSportsFestivalTaxon = getCompetitionLandingTaxon(
    "type",
    "national-sports-festival",
  );

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
        count: filterOptions.attributes.beginner,
      },
      {
        key: "regional",
        kr: "리저널",
        en: "Regional",
        hint: "지역·리저널 대회",
        href: regionalTaxon ? getCompetitionLandingPath(regionalTaxon) : "/competitions",
        count: filterOptions.tiers.regional,
      },
      {
        key: "qualifier",
        kr: "프로 퀄리파이어",
        en: "Pro Qualifier",
        hint: "프로카드 진입 대회",
        href: proPathTaxon ? getCompetitionLandingPath(proPathTaxon) : "/competitions",
        count: filterOptions.tiers.pro_qualifier,
      },
      {
        key: "proShow",
        kr: "프로쇼",
        en: "Pro Show",
        hint: "프로 선수전 · IFBB Pro Show 등 프로 전용 무대",
        href: proShowTaxon ? getCompetitionLandingPath(proShowTaxon) : "/competitions",
        count: filterOptions.tiers.pro_show,
      },
      {
        key: "championship",
        kr: "챔피언십",
        en: "Championship",
        hint: "최상위 타이틀전 · 올림피아, 아놀드 클래식 등 상징적 무대",
        href: championshipTaxon ? getCompetitionLandingPath(championshipTaxon) : "/competitions",
        count: filterOptions.tiers.championship,
      },
      {
        key: "global",
        kr: "글로벌",
        en: "Global",
        hint: "해외·세계 단위",
        href: globalTaxon ? getCompetitionLandingPath(globalTaxon) : "/competitions",
        count: filterOptions.attributes.global,
      },
      {
        key: "nationalSelection",
        kr: "국가대표 선발",
        en: "National Selection",
        hint: "국가대표 선발전",
        href: nationalSelectionTaxon ? getCompetitionLandingPath(nationalSelectionTaxon) : "/competitions",
        count: filterOptions.attributes.nationalSelection,
      },
      {
        key: "nationalTeamEvent",
        kr: "국가대표전",
        en: "National Team Event",
        hint: "대표팀 국제전",
        href: nationalTeamEventTaxon ? getCompetitionLandingPath(nationalTeamEventTaxon) : "/competitions",
        count: filterOptions.attributes.nationalTeamEvent,
      },
      {
        key: "nationalSportsFestival",
        kr: "전국체전",
        en: "National Sports Festival",
        hint: "시도 대표전",
        href: nationalSportsFestivalTaxon ? getCompetitionLandingPath(nationalSportsFestivalTaxon) : "/competitions",
        count: filterOptions.attributes.nationalSportsFestival,
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
      majorShows: globalMajors.length,
      nextShow: upcomingRecords[0]
        ? {
            title: upcomingRecords[0].title,
            date: toKoreaDateStr(upcomingRecords[0].dateStartsOn),
          }
        : null,
    },
    globalMajors,
    upcoming: upcomingRecords.map((r) =>
      toCompetition(serializePublicCompetitionListItem(r)),
    ),
    rookieFriendly,
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
    divisionsJson: string;
  }>,
) {
  const countBySlug = new Map<string, number>();

  for (const record of records) {
    const slugs = new Set<string>();

    for (const value of getNormalizedCategoryTexts(record)) {
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

function getGlobalMajorCompetitions(records: CompetitionSchedule[]) {
  return records
    .map((record) => toCompetition(serializePublicCompetitionListItem(record)))
    .filter(isGlobalMajorCompetition)
    .sort(compareGlobalMajorCompetitions)
    .slice(0, GLOBAL_MAJOR_LIMIT);
}

function isGlobalMajorCompetition(competition: Competition) {
  return (
    competition.attributes.global &&
    (competition.attributes.major || competition.tier === "championship")
  );
}

function compareGlobalMajorCompetitions(a: Competition, b: Competition) {
  return (
    getGlobalMajorPriority(a.title) - getGlobalMajorPriority(b.title) ||
    a.date.localeCompare(b.date) ||
    a.title.localeCompare(b.title, "ko-KR")
  );
}

function getGlobalMajorPriority(title: string) {
  const normalized = title.toLowerCase();

  if (/olympia|올림피아/.test(normalized)) {
    return 0;
  }

  if (/arnold|아놀드/.test(normalized)) {
    return 1;
  }

  return 2;
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

function getNormalizedCategoryTexts(record: {
  divisionsJson: string;
}) {
  return parseJsonArray(record.divisionsJson).flatMap((division) => {
    if (!isRecord(division) && typeof division !== "string") return [];

    const normalized = normalizeCompetitionDivision(division);

    return normalized.baseDivision === "unknown" ? [] : [normalized.name];
  });
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
