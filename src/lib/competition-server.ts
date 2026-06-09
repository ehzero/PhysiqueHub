import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getKoreaDateParam } from "@/lib/date";
import {
  getCompetitionSlug,
  normalizeCompetitionRouteSlug,
} from "@/lib/competition-slug";
import { compareRegionNames } from "@/lib/location";
import {
  serializePublicCompetitionListItem,
  type CompetitionListQuery,
} from "@/lib/competition-api";
import { getOrganizationPriority } from "@/lib/organization-priority";
import {
  COMPETITION_TIERS,
  type CompetitionAttributes,
  type CompetitionTier,
} from "@/lib/competition-classification";
import {
  competitionMatchesTaxon,
  getAllCompetitionLandingTaxons,
  getCompetitionLandingPath,
  getCompetitionLandingTaxon,
  getRelatedCompetitionTaxons,
  type CompetitionLandingAxis,
  type CompetitionLandingTaxon,
} from "@/lib/competition-taxonomy";
import {
  toCompetition,
  type ApiCompetitionFiltersResponse,
  type CompetitionListPage,
  type CompetitionPageOptions,
} from "@/lib/competition-public";
import type { Competition } from "@/lib/data";
import {
  COMPETITIONS_CACHE_TAG,
  PUBLIC_DATA_REVALIDATE_SECONDS,
} from "@/lib/public-cache";

interface UpcomingCompetitionContextOptions {
  includeFilters?: boolean;
}

interface UpcomingCompetitionContext {
  today: string;
  seasonYear: number;
  competitionPage: CompetitionListPage;
  filterOptions?: ApiCompetitionFiltersResponse;
}

export interface CompetitionLandingContext {
  today: string;
  seasonYear: number;
  taxon: CompetitionLandingTaxon;
  path: string;
  competitions: CompetitionListPage["items"];
  total: number;
  relatedTaxons: CompetitionLandingTaxon[];
  isIndexable: boolean;
}

interface CachedCompetitionItem extends Competition {
  sourceFlags: SourceFlags;
}

type SourceFlags = Record<
  | "natural"
  | "beginnerFriendly"
  | "rookieClass"
  | "proQualifier"
  | "proCard"
  | "international"
  | "nationalTeamRoute"
  | "nationalTeamEvent"
  | "nationalSportsFestival",
  boolean
>;

const competitionCacheOptions = {
  revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
  tags: [COMPETITIONS_CACHE_TAG],
};

export const getCompetitionSeasonPage = cache(async (
  seasonYear: number,
  options: Pick<CompetitionPageOptions, "sort" | "startsFrom"> = {},
): Promise<CompetitionListPage> => {
  const sort = options.sort ?? "date-asc";
  const startsFrom = options.startsFrom ?? "";
  const query = toCompetitionListQuery(seasonYear, {
    page: 1,
    pageSize: 1,
    startsFrom: startsFrom || undefined,
    sort,
  });
  const items = sortPublicCompetitionItems(
    filterPublicCompetitionItems(
      await getCompetitionSeasonItems(seasonYear),
      query,
    ),
    sort,
  );

  return {
    items: items.map(stripCachedCompetitionItem),
    page: 1,
    pageSize: items.length,
    total: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    hasNextPage: false,
  };
});

const getCompetitionSeasonItems = cache(async (
  seasonYear: number,
): Promise<CachedCompetitionItem[]> => getCachedCompetitionSeasonItems(seasonYear));

const getCachedCompetitionSeasonItems = unstable_cache(
  async (seasonYear: number): Promise<CachedCompetitionItem[]> => {
    const items = await prisma.competitionSchedule.findMany({
      where: { seasonYear },
      orderBy: [{ dateStartsOn: "asc" }, { title: "asc" }],
    });

    return items.map((item) => {
      const publicItem = serializePublicCompetitionListItem(item);

      return {
        ...toCompetition(publicItem),
        sourceFlags: getSourceFlags(publicItem.flags),
      };
    });
  },
  ["competition-season-items"],
  competitionCacheOptions,
);

function getSourceFlags(flags: Record<string, unknown>): SourceFlags {
  return {
    natural: flags.natural === true,
    beginnerFriendly: flags.beginnerFriendly === true,
    rookieClass: flags.rookieClass === true,
    proQualifier: flags.proQualifier === true,
    proCard: flags.proCard === true,
    international: flags.international === true,
    nationalTeamRoute: flags.nationalTeamRoute === true,
    nationalTeamEvent: flags.nationalTeamEvent === true,
    nationalSportsFestival: flags.nationalSportsFestival === true,
  };
}

function stripCachedCompetitionItem({
  sourceFlags: _sourceFlags,
  ...competition
}: CachedCompetitionItem): Competition {
  void _sourceFlags;
  return competition;
}

export const getCompetitionBySlug = cache(async (value: string) =>
  getCachedCompetitionBySlug(value),
);

const getCachedCompetitionBySlug = unstable_cache(async (value: string) => {
  const decoded = decodeURIComponent(value);
  const normalizedSlug = normalizeCompetitionRouteSlug(decoded);
  const year = Number(normalizedSlug.match(/^(\d{4})-/)?.[1]);

  if (!Number.isInteger(year)) {
    const record = await prisma.competitionSchedule.findUnique({
      where: { id: decoded },
    });

    return record ? toCompetition(serializePublicCompetitionListItem(record)) : null;
  }

  const match = (await getCompetitionSeasonItems(year))
    .find(
      (competition) =>
        normalizeCompetitionRouteSlug(getCompetitionSlug(competition)) ===
        normalizedSlug,
    );

  return match ? stripCachedCompetitionItem(match) : null;
}, ["competition-by-slug"], competitionCacheOptions);

export async function getUpcomingCompetitionContext(
  options: UpcomingCompetitionContextOptions = {},
): Promise<UpcomingCompetitionContext> {
  const includeFilters = options.includeFilters === true;
  const base = await getUpcomingCompetitionBase();

  if (!includeFilters) {
    return base;
  }

  const filterOptions = await getUpcomingCompetitionFilters(
    base.seasonYear,
    base.today,
  );

  return {
    ...base,
    filterOptions,
  };
}

export async function getCompetitionLandingContext(
  axis: CompetitionLandingAxis,
  slug: string,
): Promise<CompetitionLandingContext | null> {
  const taxon = getCompetitionLandingTaxon(axis, slug);

  if (!taxon) {
    return null;
  }

  const base = await getUpcomingCompetitionBase();
  const competitions = base.competitionPage.items.filter((competition) =>
    competitionMatchesTaxon(competition, taxon),
  );

  return {
    today: base.today,
    seasonYear: base.seasonYear,
    taxon,
    path: getCompetitionLandingPath(taxon),
    competitions,
    total: competitions.length,
    relatedTaxons: getRelatedCompetitionTaxons(taxon),
    isIndexable: true,
  };
}

export function getCompetitionLandingSitemapTaxons() {
  return getAllCompetitionLandingTaxons();
}

const getUpcomingCompetitionBase = cache(async () => {
  const today = getKoreaDateParam();
  const seasonYear = Number(today.slice(0, 4));
  const competitionPage = await getCompetitionSeasonPage(seasonYear, {
    startsFrom: today,
    sort: "date-asc",
  });

  return {
    today,
    seasonYear,
    competitionPage,
  };
});

const getUpcomingCompetitionFilters = cache(
  async (seasonYear: number, startsFrom: string) =>
    getCompetitionFiltersPayload(
      toCompetitionListQuery(seasonYear, {
        startsFrom,
        page: 1,
        pageSize: 1,
        sort: "date-asc",
      }),
    ),
);

export const getCompetitionFiltersPayload = cache(async (
  query: CompetitionListQuery,
): Promise<ApiCompetitionFiltersResponse> => {
  const filterRecords = filterPublicCompetitionItems(
    await getCompetitionSeasonItems(query.seasonYear),
    query,
  );
  const organizationCounts = new Map<
    string,
    { id: string; name: string; shortName?: string | null; count: number }
  >();
  const registrationStatusCounts = new Map<string, number>();

  const monthCounts = new Map<string, number>();
  const flagCounts = {
    natural: 0,
    beginnerFriendly: 0,
    rookieClass: 0,
    beginnerAny: 0,
    proQualifier: 0,
    proCard: 0,
    proPath: 0,
    international: 0,
    nationalTeamRoute: 0,
    nationalTeamEvent: 0,
    nationalSportsFestival: 0,
    internationalRoute: 0,
    regional: 0,
  };
  const tierCounts = Object.fromEntries(
    COMPETITION_TIERS.map((tier) => [tier, 0]),
  ) as Record<CompetitionTier, number>;
  const attributeCounts: Record<keyof CompetitionAttributes, number> = {
    global: 0,
    major: 0,
    nationalSelection: 0,
    nationalTeamEvent: 0,
    nationalSportsFestival: 0,
    beginner: 0,
  };
  const regionCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const ageGroupCounts = new Map<string, number>();
  const experienceClassCounts = new Map<string, number>();
  const measurementClassCounts = new Map<string, number>();
  const classTextCounts = new Map<string, number>();

  for (const item of filterRecords) {
    const orgKey = item.organizationId ?? item.org;
    const organization = organizationCounts.get(orgKey);
    organizationCounts.set(orgKey, {
      id: item.organizationId ?? item.org,
      name: item.org,
      shortName: item.orgShort,
      count: (organization?.count ?? 0) + 1,
    });
    registrationStatusCounts.set(
      item.registrationStatus ?? "unknown",
      (registrationStatusCounts.get(item.registrationStatus ?? "unknown") ?? 0) + 1,
    );

    const month = toKoreaMonthString(item.date);
    if (month) {
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    }

    const flags = item.sourceFlags;
    const isRegional = item.tier === "regional";
    const isBeginner = item.attributes.beginner;
    const isProPath = item.tier === "pro_qualifier";
    const isInternationalRoute =
      item.attributes.global ||
      item.attributes.nationalSelection ||
      item.attributes.nationalTeamEvent ||
      item.attributes.nationalSportsFestival;

    for (const key of ["natural", "beginnerFriendly", "rookieClass", "proQualifier", "proCard", "international", "nationalTeamRoute", "nationalTeamEvent", "nationalSportsFestival"] as const) {
      if (flags[key] === true) flagCounts[key] += 1;
    }
    if (isBeginner) flagCounts.beginnerAny += 1;
    if (isProPath) flagCounts.proPath += 1;
    if (isInternationalRoute) flagCounts.internationalRoute += 1;
    if (isRegional) flagCounts.regional += 1;
    tierCounts[item.tier] += 1;
    for (const key of ["global", "major", "nationalSelection", "nationalTeamEvent", "nationalSportsFestival", "beginner"] as const) {
      if (item.attributes[key]) attributeCounts[key] += 1;
    }

    const region = item.region;
    if (region) {
      regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
    }

    for (const category of item.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    for (const value of new Set(item.classFacets.filter((facet) => facet.type === "age").map((facet) => facet.value))) {
      ageGroupCounts.set(value, (ageGroupCounts.get(value) ?? 0) + 1);
    }
    for (const value of new Set(item.classFacets.filter((facet) => facet.type === "experience").map((facet) => facet.value))) {
      experienceClassCounts.set(value, (experienceClassCounts.get(value) ?? 0) + 1);
    }
    for (const value of new Set(item.classFacets.filter((facet) => facet.type === "measurement").map((facet) => facet.value))) {
      measurementClassCounts.set(value, (measurementClassCounts.get(value) ?? 0) + 1);
    }
    for (const value of new Set(item.classTexts)) {
      classTextCounts.set(value, (classTextCounts.get(value) ?? 0) + 1);
    }
  }

  return {
    seasonYear: query.seasonYear,
    organizations: Array.from(organizationCounts.values()).sort((a, b) =>
      getOrganizationPriority(a.name) - getOrganizationPriority(b.name) ||
      b.count - a.count ||
      a.name.localeCompare(b.name),
    ),
    regions: mapCounts(regionCounts, compareRegionNames),
    categories: mapCounts(categoryCounts),
    classFilters: {
      ageGroups: mapFacetCounts(ageGroupCounts, getAgeGroupLabel),
      experienceClasses: mapFacetCounts(
        experienceClassCounts,
        getExperienceClassLabel,
      ),
      measurementClasses: mapFacetCounts(
        measurementClassCounts,
        getMeasurementClassLabel,
      ),
      classTexts: mapCounts(classTextCounts).slice(0, 24),
    },
    registrationStatuses: Array.from(registrationStatusCounts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => a.status.localeCompare(b.status)),
    months: Array.from(monthCounts.entries()).map(([month, count]) => ({
      month,
      count,
    })),
    flags: flagCounts,
    tiers: tierCounts,
    attributes: attributeCounts,
  };
});

function toCompetitionListQuery(
  seasonYear: number,
  options: CompetitionPageOptions = {},
): CompetitionListQuery {
  return {
    seasonYear,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 20,
    organizationIds: options.organizationId ? [options.organizationId] : [],
    registrationStatuses: normalizeStringList(options.registrationStatus),
    ageGroups: [],
    experienceClasses: [],
    measurementClasses: [],
    classTexts: [],
    startsFrom: parseKoreaDateParam(options.startsFrom),
    startsTo: undefined,
    keyword: undefined,
    hasDate: undefined,
    natural: options.natural,
    beginnerAny: options.beginnerAny,
    beginnerFriendly: undefined,
    rookieClass: undefined,
    proQualifier: undefined,
    tiers: options.tiers ?? [],
    global: options.global,
    nationalSelection: options.nationalSelection,
    nationalTeamEvent: options.nationalTeamEvent,
    nationalSportsFestival: options.nationalSportsFestival,
    sort: options.sort ?? "date-asc",
  };
}

function normalizeStringList(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseKoreaDateParam(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00+09:00`);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function mapCounts(
  counts: Map<string, number>,
  compareNames?: (a: string, b: string) => number,
) {
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) =>
      compareNames
        ? compareNames(a.name, b.name)
        : b.count - a.count || a.name.localeCompare(b.name),
    );
}

function mapFacetCounts(
  counts: Map<string, number>,
  getLabel: (value: string) => string,
) {
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, label: getLabel(name), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function getAgeGroupLabel(value: string) {
  return (
    {
      middle_school: "중등부",
      high_school: "고등부",
      junior: "주니어",
      university: "대학부",
      open: "오픈",
      masters: "마스터즈",
      senior: "시니어",
      unknown: "연령 확인 필요",
    }[value] ?? value
  );
}

function getExperienceClassLabel(value: string) {
  return (
    {
      first_timer: "첫 출전",
      rookie: "루키",
      novice: "노비스",
      open: "오픈",
      unknown: "경력 확인 필요",
    }[value] ?? value
  );
}

function getMeasurementClassLabel(value: string) {
  return (
    {
      weight: "체급",
      height: "신장급",
      height_weight_cap: "신장·체중 제한",
      none: "계측 없음",
      unknown: "계측 확인 필요",
    }[value] ?? value
  );
}

function toKoreaMonthString(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = typeof value === "string" ? getKoreaDate(value) : value;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  });

  return Number.isNaN(date.getTime()) ? undefined : formatter.format(date);
}

function filterPublicCompetitionItems(
  items: CachedCompetitionItem[],
  query: CompetitionListQuery,
): CachedCompetitionItem[] {
  return items.filter((item) => {
    if (item.historyYears !== query.seasonYear) {
      return false;
    }

    if (
      query.organizationIds.length > 0 &&
      !query.organizationIds.includes(item.organizationId ?? "")
    ) {
      return false;
    }

    if (
      query.registrationStatuses.length > 0 &&
      !query.registrationStatuses.includes(item.registrationStatus ?? "unknown")
    ) {
      return false;
    }

    const startsOn = item.date ? getKoreaDate(item.date) : null;

    if (query.startsFrom && (!startsOn || startsOn < query.startsFrom)) {
      return false;
    }

    if (query.startsTo && (!startsOn || startsOn > query.startsTo)) {
      return false;
    }

    if (query.hasDate !== undefined && Boolean(item.date) !== query.hasDate) {
      return false;
    }

    if (query.keyword && !publicCompetitionMatchesKeyword(item, query.keyword)) {
      return false;
    }

    for (const [flag, value] of [
      ["natural", query.natural],
      ["beginnerFriendly", query.beginnerFriendly],
      ["rookieClass", query.rookieClass],
      ["proQualifier", query.proQualifier],
    ] as const) {
      if (value !== undefined && item.sourceFlags[flag] !== value) {
        return false;
      }
    }

    if (
      query.beginnerAny !== undefined ||
      query.tiers.length > 0 ||
      query.global !== undefined ||
      query.nationalSelection !== undefined ||
      query.nationalTeamEvent !== undefined ||
      query.nationalSportsFestival !== undefined
    ) {
      if (
        query.beginnerAny !== undefined &&
        item.attributes.beginner !== query.beginnerAny
      ) {
        return false;
      }

      if (query.tiers.length > 0 && !query.tiers.includes(item.tier)) {
        return false;
      }

      for (const [attribute, value] of [
        ["global", query.global],
        ["nationalSelection", query.nationalSelection],
        ["nationalTeamEvent", query.nationalTeamEvent],
        ["nationalSportsFestival", query.nationalSportsFestival],
      ] as const) {
        if (value !== undefined && item.attributes[attribute] !== value) {
          return false;
        }
      }
    }

    return true;
  });
}

function sortPublicCompetitionItems(
  items: CachedCompetitionItem[],
  sort: NonNullable<CompetitionPageOptions["sort"]>,
): CachedCompetitionItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "date-desc":
        return compareNullableTime(
          getKoreaDateTime(b.date),
          getKoreaDateTime(a.date),
        ) || a.title.localeCompare(b.title, "ko-KR");
      case "deadline-asc":
        return compareNullableTime(
          getKoreaDateTime(a.regClose),
          getKoreaDateTime(b.regClose),
        ) || compareNullableTime(
          getKoreaDateTime(a.date),
          getKoreaDateTime(b.date),
        ) || a.title.localeCompare(b.title, "ko-KR");
      case "updated-desc":
        return compareNullableTime(
          getDateTime(b.updatedAt),
          getDateTime(a.updatedAt),
        ) || compareNullableTime(
          getKoreaDateTime(a.date),
          getKoreaDateTime(b.date),
        );
      case "date-asc":
      default:
        return compareNullableTime(
          getKoreaDateTime(a.date),
          getKoreaDateTime(b.date),
        ) || a.title.localeCompare(b.title, "ko-KR");
    }
  });
}

function publicCompetitionMatchesKeyword(
  item: CachedCompetitionItem,
  keyword: string,
) {
  const normalized = keyword.trim().toLowerCase();
  const haystack = [
    item.title,
    item.org,
    item.orgShort,
    item.region,
    item.venue,
    JSON.stringify(item.tags),
    JSON.stringify(item.categories),
    JSON.stringify(item.classTexts),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function getKoreaDate(value: string) {
  return new Date(`${value}T00:00:00+09:00`);
}

function getKoreaDateTime(value: string | null | undefined) {
  return value ? getKoreaDate(value).getTime() : null;
}

function getDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function compareNullableTime(a: number | null, b: number | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}
