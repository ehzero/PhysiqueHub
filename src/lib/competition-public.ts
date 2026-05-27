import type { Competition } from "@/lib/data";
import {
  classifyCompetition,
  type CompetitionAttributes,
  type CompetitionTier,
} from "@/lib/competition-classification";
import type {
  CompetitionBaseDivision,
  CompetitionClassFacet,
  CompetitionGenderGroup,
} from "@/types/competitionSchedule";
import { normalizeCompetitionRegion } from "@/lib/location";
import {
  getOrganizationDisplayName,
  getOrganizationDisplayShortName,
} from "@/lib/organization-display";

export interface ApiCompetitionListResponse {
  items: ApiCompetitionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface ApiCompetitionFiltersResponse {
  seasonYear: number;
  organizations: CompetitionFilterOrganization[];
  regions: CompetitionFilterCount[];
  categories: CompetitionFilterCount[];
  classFilters: {
    ageGroups: CompetitionFacetFilterCount[];
    experienceClasses: CompetitionFacetFilterCount[];
    measurementClasses: CompetitionFacetFilterCount[];
    classTexts: CompetitionFilterCount[];
  };
  registrationStatuses: Array<{
    status: string;
    count: number;
  }>;
  months: Array<{
    month: string;
    count: number;
  }>;
  flags: {
    natural: number;
    beginnerFriendly: number;
    rookieClass: number;
    beginnerAny: number;
    proQualifier: number;
    proCard: number;
    proPath: number;
    international: number;
    nationalTeamRoute: number;
    nationalTeamEvent: number;
    nationalSportsFestival: number;
    internationalRoute: number;
    regional: number;
  };
  tiers: Record<CompetitionTier, number>;
  attributes: Record<keyof CompetitionAttributes, number>;
}

interface CompetitionFilterOrganization {
  id: string;
  name: string;
  shortName?: string | null;
  count: number;
}

interface CompetitionFilterCount {
  name: string;
  count: number;
}

interface CompetitionFacetFilterCount extends CompetitionFilterCount {
  label: string;
}

export type CompetitionFilterOptions = ApiCompetitionFiltersResponse;

export interface CompetitionListPage {
  items: Competition[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

type CompetitionSortOption =
  | "date-asc"
  | "date-desc"
  | "deadline-asc"
  | "updated-desc";

export interface CompetitionPageOptions {
  startsFrom?: string;
  beginnerAny?: boolean;
  natural?: boolean;
  tiers?: CompetitionTier[];
  global?: boolean;
  nationalSelection?: boolean;
  nationalTeamEvent?: boolean;
  nationalSportsFestival?: boolean;
  organizationId?: string;
  registrationStatus?: string | string[];
  sort?: CompetitionSortOption;
  page?: number;
  pageSize?: number;
}

interface ApiCompetitionListItem {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationShortName?: string | null;
  title: string;
  seasonYear?: number | null;
  date: {
    startsOn?: string | null;
    endsOn?: string | null;
    timezone?: string;
  };
  registration: {
    opensAt?: string | null;
    closesAt?: string | null;
    status: string;
    registrationUrl?: string | null;
    fee?: {
      currency?: string;
      minAmount?: number | null;
      maxAmount?: number | null;
    };
  };
  location: {
    country: string;
    region?: string | null;
    city?: string | null;
    venue?: string | null;
  };
  divisions: Array<{
    name?: string;
    baseDivision?: CompetitionBaseDivision;
    genderGroup?: CompetitionGenderGroup;
    group?: CompetitionGenderGroup;
    classText?: string;
    classFacets?: CompetitionClassFacet[];
    rawText?: string;
  }>;
  tags: unknown[];
  flags: Record<string, unknown>;
  source: {
    sourceUrl: string;
    detailUrl?: string | null;
  };
  updatedAt?: string | null;
}

const POSTER_THEMES: Competition["poster"][] = [
  "amber",
  "deep",
  "sage",
  "navy",
  "rose",
  "lime",
];

const HIDDEN_CRAWL_TAG_PATTERN = /운동의모든것|unmo/i;

export function toCompetition(item: ApiCompetitionListItem): Competition {
  const categories = getCategories(item);
  const classFacets = getClassFacets(item);
  const classTexts = getClassTexts(item);
  const startsOn = item.date.startsOn ?? `${item.seasonYear ?? new Date().getFullYear()}-12-31`;
  const closesOn = toDateOnly(item.registration.closesAt) ?? startsOn;
  const opensOn = toDateOnly(item.registration.opensAt) ?? startsOn;
  const flags = item.flags ?? {};
  const orgShort = getOrganizationDisplayShortName({
    id: item.organizationId,
    name: item.organizationName,
    shortName: item.organizationShortName,
  });
  const org = getOrganizationDisplayName({
    id: item.organizationId,
    name: item.organizationName,
    shortName: item.organizationShortName,
  });
  const classification = classifyCompetition({
    title: item.title,
    organizationId: item.organizationId,
    organizationName: item.organizationName,
    organizationShortName: item.organizationShortName,
    country: item.location.country,
    divisions: item.divisions,
    tags: item.tags,
    flags,
  });

  return {
    id: item.id,
    organizationId: item.organizationId,
    title: item.title,
    org,
    orgShort,
    date: startsOn,
    dateEnd: item.date.endsOn ?? undefined,
    regOpen: opensOn,
    regClose: closesOn,
    registrationStatus: item.registration.status,
    registrationUrl: item.registration.registrationUrl ?? item.source.detailUrl ?? undefined,
    sourceUrl: item.source.detailUrl ?? item.source.sourceUrl ?? undefined,
    updatedAt: item.updatedAt ?? undefined,
    region: normalizeCompetitionRegion(item.location) ?? "지역 확인 필요",
    venue: item.location.venue ?? "장소 확인 필요",
    categories,
    classFacets,
    classTexts,
    classes: categories.length > 0 ? `${categories.length}개 종목` : "종목 확인 필요",
    fee: item.registration.fee?.minAmount ?? item.registration.fee?.maxAmount ?? 0,
    natural: flags.natural === true,
    beginner: classification.attributes.beginner,
    rookie: flags.rookieClass === true,
    tier: classification.tier,
    attributes: classification.attributes,
    scale: getScale(item),
    poster: POSTER_THEMES[Math.abs(hashCode(item.organizationId)) % POSTER_THEMES.length],
    tags: getTags(item),
    desc: "공식 소스에서 수집한 대회 일정입니다.",
    historyYears: item.seasonYear ?? new Date().getFullYear(),
    instagram: item.source.detailUrl ?? item.source.sourceUrl,
  };
}

function getClassFacets(item: ApiCompetitionListItem): Competition["classFacets"] {
  return Array.from(
    new Map(
      item.divisions
        .flatMap((division) => division.classFacets ?? [])
        .flatMap((facet) => {
          if (!["age", "experience", "measurement"].includes(facet.type)) {
            return [];
          }

          return [
            {
              type: facet.type as "age" | "experience" | "measurement",
              value: facet.value,
              label: getClassFacetLabel(facet.type, facet.value),
              rawText: facet.rawText,
            },
          ];
        })
        .map((facet) => [`${facet.type}:${facet.value}`, facet] as const),
    ).values(),
  );
}

function getClassTexts(item: ApiCompetitionListItem): string[] {
  return Array.from(
    new Set(
      item.divisions
        .map((division) => division.classText?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function getClassFacetLabel(type: string, value: string) {
  if (type === "age") {
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

  if (type === "experience") {
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

  if (type === "measurement") {
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

  return value;
}

function getCategories(item: ApiCompetitionListItem): string[] {
  const divisionNames = item.divisions
    .filter((division) => division.baseDivision !== "unknown")
    .map((division) => division.name)
    .filter((name): name is string => Boolean(name));

  if (divisionNames.length > 0) {
    return Array.from(new Set(divisionNames));
  }

  return [];
}

function getTags(item: ApiCompetitionListItem): string[] {
  const tags = item.tags
    .filter((tag): tag is string => typeof tag === "string")
    .map(getDisplayTag)
    .filter((tag) => !isHiddenCrawlTag(tag));

  if (item.flags.natural === true) {
    tags.push("내추럴");
  }
  if (item.flags.proQualifier === true) {
    tags.push("프로 퀄리파이어");
  }
  if (item.flags.proCard === true) {
    tags.push("프로카드");
  }

  return Array.from(new Set(tags)).slice(0, 6);
}

function getDisplayTag(tag: string) {
  return tag === "IFBB Pro League" || tag === "IFBB" ? "IFBB Pro" : tag;
}

function isHiddenCrawlTag(tag: string): boolean {
  return HIDDEN_CRAWL_TAG_PATTERN.test(tag);
}

function getScale(item: ApiCompetitionListItem): Competition["scale"] {
  if (item.flags.proQualifier === true || item.flags.international === true) {
    return "대형";
  }

  if (item.divisions.length >= 5) {
    return "중형";
  }

  return "소형";
}

function toDateOnly(value: string | null | undefined): string | undefined {
  return value?.slice(0, 10);
}

function hashCode(value: string): number {
  return value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
}
