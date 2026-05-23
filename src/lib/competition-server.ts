import "server-only";

import { cache } from "react";
import type { CompetitionSchedule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getKoreaDateParam } from "@/lib/date";
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

export async function getCompetitionListPayload(
  query: CompetitionListQuery,
): Promise<ApiCompetitionListResponse> {
  const where = buildCompetitionWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    prisma.competitionSchedule.findMany({
      where,
      orderBy: getCompetitionOrderBy(query.sort),
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

export const getCompetitionById = cache(async (id: string) => {
  const record = await prisma.competitionSchedule.findUnique({
    where: { id },
  });

  if (!record) {
    return null;
  }

  return toCompetition(serializePublicCompetitionListItem(record));
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
    internationalRoute: 0,
    regional: 0,
  };
  const regionCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const item of filterRecords) {
    const month = toKoreaMonthString(item.dateStartsOn);
    if (month) {
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    }

    const flags = parseJsonObject(item.flagsJson);
    const isRegional = isRegionalRecord(item.title, item.tagsJson, flags);
    const isBeginner = flags.beginnerFriendly === true || flags.rookieClass === true;
    const isProPath = flags.proQualifier === true || flags.proCard === true;
    const isInternationalRoute =
      flags.international === true || flags.nationalTeamRoute === true;

    for (const key of ["natural", "beginnerFriendly", "rookieClass", "proQualifier", "proCard", "international", "nationalTeamRoute"] as const) {
      if (flags[key] === true) flagCounts[key] += 1;
    }
    if (isBeginner) flagCounts.beginnerAny += 1;
    if (isProPath) flagCounts.proPath += 1;
    if (isInternationalRoute) flagCounts.internationalRoute += 1;
    if (isRegional) flagCounts.regional += 1;

    const region = item.region ?? item.city ?? item.country;
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
    regions: mapCounts(regionCounts),
    categories: mapCounts(categoryCounts).slice(0, 24),
    registrationStatuses: registrationStatuses.map((status) => ({
      status: status.registrationStatus,
      count: status._count._all,
    })),
    months: Array.from(monthCounts.entries()).map(([month, count]) => ({
      month,
      count,
    })),
    flags: flagCounts,
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
    regional: options.regional,
    proPath: options.proPath,
    internationalRoute: options.internationalRoute,
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

function isRegionalRecord(
  title: string,
  tagsJson: string,
  flags: Record<string, unknown>,
): boolean {
  if (flags.regional === true) {
    return true;
  }

  const tags = parseJsonArray(tagsJson)
    .filter((tag): tag is string => typeof tag === "string")
    .join(" ");

  return /리저널|regional/i.test(`${title} ${tags}`);
}

function mapCounts(counts: Map<string, number>) {
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
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
