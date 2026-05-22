import { prisma } from "@/lib/prisma";
import {
  buildCompetitionWhere,
  parseCompetitionListQuery,
  parseJsonArray,
  parseJsonObject,
} from "@/lib/competition-api";
import { getOrganizationPriority } from "@/lib/organization-priority";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseCompetitionListQuery(url.searchParams);
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

  return Response.json({
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
  });
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

function toKoreaMonthString(value: Date | null): string | undefined {
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
