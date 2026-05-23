import type { Prisma, CompetitionSchedule } from "@prisma/client";
import { normalizeCompetitionRegion } from "@/lib/location";

const DEFAULT_COMPETITION_PAGE_SIZE = 20;
const MAX_COMPETITION_PAGE_SIZE = 500;

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
  startsFrom?: Date;
  startsTo?: Date;
  keyword?: string;
  hasDate?: boolean;
  natural?: boolean;
  beginnerAny?: boolean;
  beginnerFriendly?: boolean;
  rookieClass?: boolean;
  proQualifier?: boolean;
  regional?: boolean;
  proPath?: boolean;
  internationalRoute?: boolean;
  sort: CompetitionSort;
}

export function parseCompetitionListQuery(searchParams: URLSearchParams): CompetitionListQuery {
  return {
    seasonYear: parseInteger(searchParams.get("seasonYear"), new Date().getFullYear(), {
      min: 2000,
      max: 2100,
    }),
    page: parseInteger(searchParams.get("page"), 1, { min: 1, max: 10_000 }),
    pageSize: parseInteger(searchParams.get("pageSize"), DEFAULT_COMPETITION_PAGE_SIZE, {
      min: 1,
      max: MAX_COMPETITION_PAGE_SIZE,
    }),
    organizationIds: parseStringList(
      searchParams.get("organizationId") ?? searchParams.get("organizationIds"),
    ),
    registrationStatuses: parseStringList(
      searchParams.get("registrationStatus") ?? searchParams.get("status"),
    ),
    startsFrom: parseDateParam(searchParams.get("startsFrom")),
    startsTo: parseDateParam(searchParams.get("startsTo")),
    keyword: normalizeKeyword(searchParams.get("keyword") ?? searchParams.get("q")),
    hasDate: parseBooleanParam(searchParams.get("hasDate")),
    natural: parseBooleanParam(searchParams.get("natural")),
    beginnerAny: parseBooleanParam(searchParams.get("beginnerAny")),
    beginnerFriendly: parseBooleanParam(searchParams.get("beginnerFriendly")),
    rookieClass: parseBooleanParam(searchParams.get("rookieClass")),
    proQualifier: parseBooleanParam(searchParams.get("proQualifier")),
    regional: parseBooleanParam(searchParams.get("regional")),
    proPath: parseBooleanParam(searchParams.get("proPath")),
    internationalRoute: parseBooleanParam(searchParams.get("internationalRoute")),
    sort: parseSort(searchParams.get("sort")),
  };
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

  if (query.beginnerAny !== undefined) {
    addFlagAnyFilter(where, ["beginnerFriendly", "rookieClass"], query.beginnerAny);
  }

  if (query.proPath !== undefined) {
    addFlagAnyFilter(where, ["proQualifier", "proCard"], query.proPath);
  }

  if (query.internationalRoute !== undefined) {
    addFlagAnyFilter(
      where,
      ["international", "nationalTeamRoute"],
      query.internationalRoute,
    );
  }

  if (query.regional !== undefined) {
    addRegionalFilter(where, query.regional);
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

function addRegionalFilter(
  where: Prisma.CompetitionScheduleWhereInput,
  value: boolean,
) {
  const conditions: Prisma.CompetitionScheduleWhereInput[] = [
    { flagsJson: { contains: `"regional":${value}` } },
    { title: { contains: "리저널", mode: "insensitive" } },
    { title: { contains: "regional", mode: "insensitive" } },
    { tagsJson: { contains: "리저널", mode: "insensitive" } },
    { tagsJson: { contains: "regional", mode: "insensitive" } },
  ];

  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    value ? { OR: conditions } : { NOT: { OR: conditions } },
  ];
}

function addFlagAnyFilter(
  where: Prisma.CompetitionScheduleWhereInput,
  flags: string[],
  value: boolean,
) {
  const conditions: Prisma.CompetitionScheduleWhereInput[] = flags.map((flag) => ({
    flagsJson: { contains: `"${flag}":${value}` },
  }));

  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    value ? { OR: conditions } : { NOT: { OR: conditions } },
  ];
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

export function normalizePageMeta(page: number, pageSize: number, total: number) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
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
  if (!value || typeof value !== "object") {
    return { name: undefined, group: undefined };
  }

  const division = value as { name?: unknown; group?: unknown };

  return {
    name: typeof division.name === "string" ? division.name : undefined,
    group: typeof division.group === "string" ? division.group : undefined,
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

function parseStringList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(
  value: string | null,
  fallback: number,
  constraints: { min: number; max: number },
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, constraints.min), constraints.max);
}

function parseDateParam(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00+09:00`);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === null || value === "") {
    return undefined;
  }

  if (["1", "true", "yes"].includes(value.toLowerCase())) {
    return true;
  }

  if (["0", "false", "no"].includes(value.toLowerCase())) {
    return false;
  }

  return undefined;
}

function parseSort(value: string | null): CompetitionSort {
  if (
    value === "date-desc" ||
    value === "deadline-asc" ||
    value === "updated-desc" ||
    value === "date-asc"
  ) {
    return value;
  }

  return "date-asc";
}

function normalizeKeyword(value: string | null): string | undefined {
  const keyword = value?.trim();

  return keyword ? keyword : undefined;
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
