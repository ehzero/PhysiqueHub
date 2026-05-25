import "server-only";

import { cache } from "react";
import type { CompetitionSchedule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getKoreaDateParam } from "@/lib/date";
import {
  getCompetitionSlug,
  normalizeCompetitionRouteSlug,
} from "@/lib/competition-slug";
import { compareRegionNames, normalizeCompetitionRegion } from "@/lib/location";
import {
  buildCompetitionWhere,
  getCompetitionOrderBy,
  normalizePageMeta,
  parseJsonArray,
  parseJsonObject,
  serializePublicCompetitionListItem,
  type CompetitionListQuery,
} from "@/lib/competition-api";
import { getOrganizationPriority } from "@/lib/organization-priority";
import {
  COMPETITION_TIERS,
  classifyCompetition,
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
  type ApiCompetitionListResponse,
  type CompetitionListPage,
  type CompetitionPageOptions,
} from "@/lib/competition-public";

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

export async function getCompetitionListPayload(
  query: CompetitionListQuery,
): Promise<ApiCompetitionListResponse> {
  const where = buildCompetitionWhere(query);
  const skip = (query.page - 1) * query.pageSize;
  const orderBy = getCompetitionOrderBy(query.sort);

  if (hasClassificationFilters(query)) {
    const records = await prisma.competitionSchedule.findMany({
      where,
      orderBy,
    });
    const filtered = records.filter((record) =>
      competitionMatchesClassificationQuery(record, query),
    );

    return {
      items: filtered
        .slice(skip, skip + query.pageSize)
        .map(serializePublicCompetitionListItem),
      ...normalizePageMeta(query.page, query.pageSize, filtered.length),
    };
  }

  const [items, total] = await Promise.all([
    prisma.competitionSchedule.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
    }),
    prisma.competitionSchedule.count({ where }),
  ]);

  return {
    items: items.map(serializePublicCompetitionListItem),
    ...normalizePageMeta(query.page, query.pageSize, total),
  };
}

function hasClassificationFilters(query: CompetitionListQuery) {
  return (
    query.tiers.length > 0 ||
    query.beginnerAny !== undefined ||
    query.global !== undefined ||
    query.major !== undefined ||
    query.nationalSelection !== undefined ||
    query.nationalTeamEvent !== undefined ||
    query.nationalSportsFestival !== undefined
  );
}

function competitionMatchesClassificationQuery(
  record: CompetitionSchedule,
  query: CompetitionListQuery,
) {
  const classification = classifyCompetition({
    title: record.title,
    organizationId: record.organizationId,
    organizationName: record.organizationName,
    organizationShortName: record.organizationShortName,
    country: record.country,
    tags: parseJsonArray(record.tagsJson),
    flags: parseJsonObject(record.flagsJson),
  });

  if (query.tiers.length > 0 && !query.tiers.includes(classification.tier)) {
    return false;
  }
  if (
    query.beginnerAny !== undefined &&
    classification.attributes.beginner !== query.beginnerAny
  ) {
    return false;
  }
  if (
    query.global !== undefined &&
    classification.attributes.global !== query.global
  ) {
    return false;
  }
  if (
    query.major !== undefined &&
    classification.attributes.major !== query.major
  ) {
    return false;
  }
  if (
    query.nationalSelection !== undefined &&
    classification.attributes.nationalSelection !== query.nationalSelection
  ) {
    return false;
  }
  if (
    query.nationalTeamEvent !== undefined &&
    classification.attributes.nationalTeamEvent !== query.nationalTeamEvent
  ) {
    return false;
  }
  if (
    query.nationalSportsFestival !== undefined &&
    classification.attributes.nationalSportsFestival !== query.nationalSportsFestival
  ) {
    return false;
  }

  return true;
}

export async function getCompetitionSeasonPage(
  seasonYear: number,
  options: Pick<CompetitionPageOptions, "sort" | "startsFrom"> = {},
): Promise<CompetitionListPage> {
  const query = toCompetitionListQuery(seasonYear, {
    page: 1,
    pageSize: 1,
    startsFrom: options.startsFrom,
    sort: options.sort ?? "date-asc",
  });
  const where = buildCompetitionWhere(query);
  const items = await prisma.competitionSchedule.findMany({
    where,
    orderBy: getCompetitionOrderBy(query.sort),
  });

  return {
    items: items.map(serializePublicCompetitionListItem).map(toCompetition),
    page: 1,
    pageSize: items.length,
    total: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    hasNextPage: false,
  };
}

export const getCompetitionBySlug = cache(async (value: string) => {
  const decoded = decodeURIComponent(value);
  const normalizedSlug = normalizeCompetitionRouteSlug(decoded);
  const year = Number(normalizedSlug.match(/^(\d{4})-/)?.[1]);

  if (!Number.isInteger(year)) {
    return null;
  }

  const records = await prisma.competitionSchedule.findMany({
    where: { seasonYear: year },
    orderBy: [{ dateStartsOn: "asc" }, { title: "asc" }],
  });

  const match = records
    .map(serializePublicCompetitionListItem)
    .map(toCompetition)
    .find(
      (competition) =>
        normalizeCompetitionRouteSlug(getCompetitionSlug(competition)) ===
        normalizedSlug,
    );

  return match ?? null;
});

export const getCompetitionIndexingMetaById = cache(async (id: string) => {
  const record = await prisma.competitionSchedule.findUnique({
    where: { id },
    select: {
      dateStartsOn: true,
      updatedAt: true,
    },
  });

  if (!record) {
    return null;
  }

  return {
    isIndexable: Boolean(
      record.dateStartsOn && record.dateStartsOn >= getKoreaTodayStart(),
    ),
    lastModified: record.updatedAt,
  };
});

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
    isIndexable: competitions.length > 0,
  };
}

export async function getIndexableCompetitionLandingTaxons() {
  const base = await getUpcomingCompetitionBase();

  return getAllCompetitionLandingTaxons().filter((taxon) =>
    base.competitionPage.items.some((competition) =>
      competitionMatchesTaxon(competition, taxon),
    ),
  );
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

function getKoreaTodayStart() {
  return new Date(`${getKoreaDateParam()}T00:00:00+09:00`);
}

export async function getCompetitionFiltersPayload(
  query: CompetitionListQuery,
): Promise<ApiCompetitionFiltersResponse> {
  const baseWhere = buildCompetitionWhere(query);
  const [organizations, registrationStatuses, filterRecords] =
    await Promise.all([
      prisma.competitionSchedule.groupBy({
        by: ["organizationId", "organizationName", "organizationShortName"],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { organizationName: "asc" },
      }),
      prisma.competitionSchedule.groupBy({
        by: ["registrationStatus"],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { registrationStatus: "asc" },
      }),
      prisma.competitionSchedule.findMany({
        where: baseWhere,
        select: {
          dateStartsOn: true,
          title: true,
          organizationId: true,
          organizationName: true,
          organizationShortName: true,
          region: true,
          city: true,
          country: true,
          divisionsJson: true,
          tagsJson: true,
          flagsJson: true,
        },
      }),
    ]);

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

  for (const item of filterRecords) {
    const month = toKoreaMonthString(item.dateStartsOn);
    if (month) {
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    }

    const flags = parseJsonObject(item.flagsJson);
    const tags = parseJsonArray(item.tagsJson);
    const classification = classifyCompetition({
      title: item.title,
      organizationId: item.organizationId,
      organizationName: item.organizationName,
      organizationShortName: item.organizationShortName,
      country: item.country,
      tags,
      flags,
    });
    const isRegional = classification.tier === "regional";
    const isBeginner = classification.attributes.beginner;
    const isProPath = classification.tier === "pro_qualifier";
    const isInternationalRoute =
      classification.attributes.global ||
      classification.attributes.nationalSelection ||
      classification.attributes.nationalTeamEvent ||
      classification.attributes.nationalSportsFestival;

    for (const key of ["natural", "beginnerFriendly", "rookieClass", "proQualifier", "proCard", "international", "nationalTeamRoute", "nationalTeamEvent", "nationalSportsFestival"] as const) {
      if (flags[key] === true) flagCounts[key] += 1;
    }
    if (isBeginner) flagCounts.beginnerAny += 1;
    if (isProPath) flagCounts.proPath += 1;
    if (isInternationalRoute) flagCounts.internationalRoute += 1;
    if (isRegional) flagCounts.regional += 1;
    tierCounts[classification.tier] += 1;
    for (const key of ["global", "major", "nationalSelection", "nationalTeamEvent", "nationalSportsFestival", "beginner"] as const) {
      if (classification.attributes[key]) attributeCounts[key] += 1;
    }

    const region = normalizeCompetitionRegion(item);
    if (region) {
      regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
    }

    for (const category of getRecordCategories(item.divisionsJson, item.tagsJson)) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }

  return {
    seasonYear: query.seasonYear,
    organizations: organizations.map((organization) => ({
      id: organization.organizationId,
      name: organization.organizationName,
      shortName: organization.organizationShortName,
      count: organization._count._all,
    })).sort((a, b) =>
      getOrganizationPriority(a.name) - getOrganizationPriority(b.name) ||
      b.count - a.count ||
      a.name.localeCompare(b.name),
    ),
    regions: mapCounts(regionCounts, compareRegionNames),
    categories: mapCounts(categoryCounts),
    registrationStatuses: registrationStatuses.map((status) => ({
      status: status.registrationStatus,
      count: status._count._all,
    })),
    months: Array.from(monthCounts.entries()).map(([month, count]) => ({
      month,
      count,
    })),
    flags: flagCounts,
    tiers: tierCounts,
    attributes: attributeCounts,
  };
}

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
    major: options.major,
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

function getRecordCategories(divisionsJson: string, tagsJson: string): string[] {
  const divisions = parseJsonArray(divisionsJson)
    .map((division) => getDivisionName(division))
    .filter((name): name is string => Boolean(name));

  if (divisions.length > 0) {
    return Array.from(new Set(divisions));
  }

  return parseJsonArray(tagsJson)
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

function getDivisionName(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const name = (value as { name?: unknown }).name;

  return typeof name === "string" ? name.trim() || undefined : undefined;
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

function toKoreaMonthString(value: CompetitionSchedule["dateStartsOn"]): string | undefined {
  if (!value) {
    return undefined;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  });

  return formatter.format(value);
}
