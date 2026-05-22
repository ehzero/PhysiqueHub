import type { Competition } from "@/lib/data";

interface ApiCompetitionListResponse {
  items: ApiCompetitionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

interface ApiCompetitionFiltersResponse {
  seasonYear: number;
  organizations: CompetitionFilterOrganization[];
  regions: CompetitionFilterCount[];
  categories: CompetitionFilterCount[];
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
    internationalRoute: number;
    regional: number;
  };
}

export interface CompetitionFilterOrganization {
  id: string;
  name: string;
  shortName?: string;
  count: number;
}

export interface CompetitionFilterCount {
  name: string;
  count: number;
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

interface ApiCompetitionListItem {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationShortName?: string;
  title: string;
  seasonYear?: number;
  date: {
    startsOn?: string;
    endsOn?: string;
    timezone?: string;
  };
  registration: {
    opensAt?: string;
    closesAt?: string;
    status: string;
    registrationUrl?: string;
    fee?: {
      currency?: string;
      minAmount?: number;
      maxAmount?: number;
    };
  };
  location: {
    country: string;
    region?: string;
    city?: string;
    venue?: string;
  };
  divisions: Array<{
    name?: string;
    group?: string;
  }>;
  tags: string[];
  flags: Record<string, unknown>;
  source: {
    sourceUrl: string;
    detailUrl?: string;
  };
}

const POSTER_THEMES: Competition["poster"][] = [
  "amber",
  "deep",
  "sage",
  "navy",
  "rose",
  "lime",
];

export async function fetchCompetitionList(
  seasonYear: number,
  options: { startsFrom?: string; beginnerAny?: boolean } = {},
): Promise<Competition[]> {
  const page = await fetchCompetitionPage(seasonYear, {
    startsFrom: options.startsFrom,
    beginnerAny: options.beginnerAny,
    page: 1,
    pageSize: 500,
  });

  return page.items;
}

export async function fetchCompetitionPage(
  seasonYear: number,
  options: {
    startsFrom?: string;
    beginnerAny?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<CompetitionListPage> {
  const params = new URLSearchParams({
    seasonYear: String(seasonYear),
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 10),
    sort: "date-asc",
  });

  if (options.startsFrom) {
    params.set("startsFrom", options.startsFrom);
  }
  if (options.beginnerAny !== undefined) {
    params.set("beginnerAny", String(options.beginnerAny));
  }

  const response = await fetch(`/api/competitions?${params.toString()}`);

  if (!response.ok) {
    throw new Error("대회 목록을 불러오지 못했습니다.");
  }

  const payload = (await response.json()) as ApiCompetitionListResponse;

  return {
    ...payload,
    items: payload.items.map(toCompetition),
  };
}

export async function fetchCompetitionFilters(
  seasonYear: number,
  options: { startsFrom?: string } = {},
): Promise<CompetitionFilterOptions> {
  const params = new URLSearchParams({
    seasonYear: String(seasonYear),
  });

  if (options.startsFrom) {
    params.set("startsFrom", options.startsFrom);
  }

  const response = await fetch(`/api/competition-filters?${params.toString()}`);

  if (!response.ok) {
    throw new Error("대회 필터를 불러오지 못했습니다.");
  }

  return (await response.json()) as ApiCompetitionFiltersResponse;
}

function toCompetition(item: ApiCompetitionListItem): Competition {
  const categories = getCategories(item);
  const startsOn = item.date.startsOn ?? `${item.seasonYear ?? new Date().getFullYear()}-12-31`;
  const closesOn = toDateOnly(item.registration.closesAt) ?? startsOn;
  const opensOn = toDateOnly(item.registration.opensAt) ?? startsOn;
  const flags = item.flags ?? {};
  const orgShort = item.organizationShortName || makeShortName(item.organizationName);

  return {
    id: item.id,
    title: item.title,
    org: item.organizationName,
    orgShort,
    date: startsOn,
    dateEnd: item.date.endsOn,
    regOpen: opensOn,
    regClose: closesOn,
    registrationStatus: item.registration.status,
    registrationUrl: item.registration.registrationUrl ?? item.source.detailUrl,
    sourceUrl: item.source.detailUrl ?? item.source.sourceUrl,
    region: item.location.region ?? item.location.city ?? item.location.country,
    venue: item.location.venue ?? "장소 확인 필요",
    categories,
    classes: categories.length > 0 ? `${categories.length}개 종목` : "종목 확인 필요",
    fee: item.registration.fee?.minAmount ?? item.registration.fee?.maxAmount ?? 0,
    natural: flags.natural === true,
    beginner: flags.beginnerFriendly === true || flags.rookieClass === true,
    rookie: flags.rookieClass === true,
    regional: isRegional(item),
    proPath: flags.proQualifier === true || flags.proCard === true,
    internationalRoute: flags.international === true || flags.nationalTeamRoute === true,
    scale: getScale(item),
    poster: POSTER_THEMES[Math.abs(hashCode(item.organizationId)) % POSTER_THEMES.length],
    tags: getTags(item),
    desc: "공식 소스에서 수집한 대회 일정입니다.",
    historyYears: item.seasonYear ?? new Date().getFullYear(),
    instagram: item.source.detailUrl ?? item.source.sourceUrl,
  };
}

function getCategories(item: ApiCompetitionListItem): string[] {
  const divisionNames = item.divisions
    .map((division) => division.name)
    .filter((name): name is string => Boolean(name));

  if (divisionNames.length > 0) {
    return Array.from(new Set(divisionNames));
  }

  return item.tags.slice(0, 6);
}

function getTags(item: ApiCompetitionListItem): string[] {
  const tags = [...item.tags];

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

function isRegional(item: ApiCompetitionListItem): boolean {
  if (item.flags.regional === true) {
    return true;
  }

  return /리저널|regional/i.test([item.title, ...item.tags].join(" "));
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

function toDateOnly(value: string | undefined): string | undefined {
  return value?.slice(0, 10);
}

function makeShortName(value: string): string {
  return value
    .split(/[ /·()]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 8)
    .toUpperCase();
}

function hashCode(value: string): number {
  return value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
}
