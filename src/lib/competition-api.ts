import type { Prisma, CompetitionSchedule } from "@prisma/client";
import type { CompetitionTier } from "@/lib/competition-classification";
import { normalizeCompetitionDivision } from "@/lib/competition-division";
import { normalizeCompetitionRegion } from "@/lib/location";

type CompetitionSort =
  | "date-asc"
  | "date-desc"
  | "deadline-asc"
  | "updated-desc";

export interface CompetitionListQuery {
  seasonYear: number;
  page: number;
  pageSize: number;
  organizationIds: string[];
  registrationStatuses: string[];
  ageGroups: string[];
  experienceClasses: string[];
  measurementClasses: string[];
  classTexts: string[];
  startsFrom?: Date;
  startsTo?: Date;
  keyword?: string;
  hasDate?: boolean;
  natural?: boolean;
  beginnerAny?: boolean;
  beginnerFriendly?: boolean;
  rookieClass?: boolean;
  proQualifier?: boolean;
  tiers: CompetitionTier[];
  global?: boolean;
  nationalSelection?: boolean;
  nationalTeamEvent?: boolean;
  nationalSportsFestival?: boolean;
  sort: CompetitionSort;
}

export function buildCompetitionWhere(
  query: CompetitionListQuery,
): Prisma.CompetitionScheduleWhereInput {
  const where: Prisma.CompetitionScheduleWhereInput = {
    seasonYear: query.seasonYear,
  };

  if (query.organizationIds.length > 0) {
    where.organizationId = { in: query.organizationIds };
  }

  if (query.registrationStatuses.length > 0) {
    where.registrationStatus = { in: query.registrationStatuses };
  }

  if (query.startsFrom || query.startsTo) {
    where.dateStartsOn = {
      ...(query.startsFrom ? { gte: query.startsFrom } : {}),
      ...(query.startsTo ? { lte: query.startsTo } : {}),
    };
  }

  if (query.hasDate !== undefined) {
    where.dateStartsOn = query.hasDate ? { not: null } : null;
  }

  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword, mode: "insensitive" } },
      { organizationName: { contains: query.keyword, mode: "insensitive" } },
      { region: { contains: query.keyword, mode: "insensitive" } },
      { venue: { contains: query.keyword, mode: "insensitive" } },
      { locationRawText: { contains: query.keyword, mode: "insensitive" } },
      { tagsJson: { contains: query.keyword, mode: "insensitive" } },
      { divisionsJson: { contains: query.keyword, mode: "insensitive" } },
    ];
  }

  const flagFilters = [
    ["natural", query.natural],
    ["beginnerFriendly", query.beginnerFriendly],
    ["rookieClass", query.rookieClass],
    ["proQualifier", query.proQualifier],
  ] as const;
  const activeFlagFilters = flagFilters.filter(([, value]) => value !== undefined);

  if (activeFlagFilters.length > 0) {
    const andConditions = activeFlagFilters.map(([flag, value]) => ({
      flagsJson: {
        contains: `"${flag}":${value}`,
      },
    }));
    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), ...andConditions];
  }

  return where;
}

export function getCompetitionOrderBy(
  sort: CompetitionSort,
): Prisma.CompetitionScheduleOrderByWithRelationInput[] {
  switch (sort) {
    case "date-desc":
      return [{ dateStartsOn: "desc" }, { title: "asc" }];
    case "deadline-asc":
      return [{ registrationClosesAt: "asc" }, { dateStartsOn: "asc" }, { title: "asc" }];
    case "updated-desc":
      return [{ updatedAt: "desc" }, { dateStartsOn: "asc" }];
    case "date-asc":
    default:
      return [{ dateStartsOn: "asc" }, { title: "asc" }];
  }
}

export function serializePublicCompetition(record: CompetitionSchedule) {
  return {
    id: record.id,
    organizationId: record.organizationId,
    organizationName: record.organizationName,
    organizationShortName: record.organizationShortName,
    title: record.title,
    subtitle: record.subtitle,
    seasonYear: record.seasonYear,
    date: {
      startsOn: toKoreaDateString(record.dateStartsOn),
      endsOn: toKoreaDateString(record.dateEndsOn),
      timezone: record.dateTimezone,
    },
    registration: {
      opensAt: toIsoString(record.registrationOpensAt),
      closesAt: toIsoString(record.registrationClosesAt),
      status: record.registrationStatus,
      registrationUrl: record.registrationUrl,
      fee: {
        currency: record.feeCurrency,
        minAmount: record.feeMinAmount,
        maxAmount: record.feeMaxAmount,
      },
    },
    location: {
      country: record.country,
      region: record.region,
      city: record.city,
      venue: record.venue ?? toPublicVenueText(record),
      address: record.address,
    },
    divisions: parseJsonArray(record.divisionsJson).map(toPublicDivision),
    tags: parseJsonArray(record.tagsJson),
    flags: parseJsonObject(record.flagsJson),
    media: {
      posterImageUrl: record.posterImageUrl,
      thumbnailUrl: record.thumbnailUrl,
      imageSourceUrl: record.imageSourceUrl,
    },
    source: {
      sourceUrl: record.detailUrl ?? record.registrationUrl ?? record.sourceUrl,
      detailUrl: record.detailUrl,
    },
    updatedAt: toIsoString(record.updatedAt),
  };
}

export function serializePublicCompetitionListItem(record: CompetitionSchedule) {
  return serializePublicCompetition(record);
}

export function parseJsonArray(value: string): unknown[] {
  const parsed = safeJsonParse(value, []);

  return Array.isArray(parsed) ? parsed : [];
}

export function parseJsonObject(value: string): Record<string, unknown> {
  const parsed = safeJsonParse(value, {});

  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function safeJsonParse(value: string, fallback: unknown): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toPublicDivision(value: unknown) {
  if (typeof value === "string") {
    const division = normalizeCompetitionDivision(value);

    return {
      name: division.name,
      baseDivision: division.baseDivision,
      genderGroup: division.genderGroup,
      group: division.group,
      classText: division.classText,
      classFacets: division.classFacets,
      rawText: division.rawText,
    };
  }

  if (!value || typeof value !== "object") {
    return {
      name: undefined,
      baseDivision: undefined,
      genderGroup: undefined,
      group: undefined,
      classText: undefined,
      classFacets: undefined,
      rawText: undefined,
    };
  }

  const division = normalizeCompetitionDivision(value as Parameters<typeof normalizeCompetitionDivision>[0]);

  return {
    name: division.name,
    baseDivision: division.baseDivision,
    genderGroup: division.genderGroup,
    group: division.group,
    classText: division.classText,
    classFacets: division.classFacets,
    rawText: division.rawText,
  };
}

function toPublicVenueText(record: CompetitionSchedule): string | null {
  if (!record.locationRawText) {
    return null;
  }

  const cleaned = record.locationRawText
    .replace(/\s*\((?:보조 후보|보조)\)\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (isAdministrativeLocationText(cleaned, record)) {
    return null;
  }

  return cleaned || null;
}

function isAdministrativeLocationText(
  value: string,
  record: CompetitionSchedule,
): boolean {
  const normalizedRegion = normalizeCompetitionRegion(record);
  const normalizedParts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const administrativeNames = new Set(
    [
      normalizedRegion,
      record.region,
      record.city,
      record.country,
      record.country === "KR" ? "대한민국" : undefined,
      record.country === "KR" ? "Korea" : undefined,
      record.country === "KR" ? "South Korea" : undefined,
    ].filter((part): part is string => Boolean(part)),
  );

  return (
    normalizedParts.length > 0 &&
    normalizedParts.every((part) => {
      const normalizedPart = normalizeCompetitionRegion({
        country: record.country,
        region: part,
        city: part,
      });

      return administrativeNames.has(part) || Boolean(normalizedPart && administrativeNames.has(normalizedPart));
    })
  );
}

function toIsoString(value: Date | null): string | undefined {
  return value ? value.toISOString() : undefined;
}

function toKoreaDateString(value: Date | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(value);
}
