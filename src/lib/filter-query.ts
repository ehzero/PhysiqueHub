import type { Filters } from "@/lib/data";
import {
  COMPETITION_TIERS,
  type CompetitionTier,
} from "@/lib/competition-classification";

export interface ListFilterQueryState {
  filters: Filters;
  search: string;
}

export interface HomeFilterQueryState {
  activeOrganizationId: string | null;
  activePreset: string;
  sortBy: string;
}

export type PageSearchParams = Record<string, string | string[] | undefined>;

interface QueryParamsLike {
  get(name: string): string | null;
  getAll(name: string): string[];
}

const LIST_KEYS = [
  "q",
  "region",
  "org",
  "cat",
  "status",
  "tier",
  "tiers",
  "beginner",
  "natural",
  "global",
  "major",
  "national",
  "nationalSelection",
  "regional",
  "pro",
  "intl",
];
const HOME_PRESETS = new Set([
  "all",
  "open",
  "natural",
  "beginner",
  "regional",
  "proPath",
  "internationalRoute",
]);
const HOME_SORTS = new Set(["date", "deadline", "updated"]);

export function parseListFilterQuery(
  params: QueryParamsLike,
): ListFilterQueryState {
  return {
    filters: {
      regions: getListParam(params, "region"),
      orgs: getListParam(params, "org"),
      cats: getListParam(params, "cat"),
      status: getListParam(params, "status"),
      tiers: getTierParams(params),
      beginner: getBooleanParam(params, "beginner"),
      natural: getBooleanParam(params, "natural"),
      global: getBooleanParam(params, "global") ?? getBooleanParam(params, "intl"),
      major: getBooleanParam(params, "major"),
      nationalSelection:
        getBooleanParam(params, "nationalSelection") ??
        getBooleanParam(params, "national"),
    },
    search: params.get("q")?.trim() ?? "",
  };
}

export function buildListFilterPath(
  pathname: string,
  state: ListFilterQueryState,
) {
  const params = new URLSearchParams();

  appendStringParam(params, "q", state.search);
  appendListParam(params, "region", state.filters.regions);
  appendListParam(params, "org", state.filters.orgs);
  appendListParam(params, "cat", state.filters.cats);
  appendListParam(params, "status", state.filters.status);
  appendListParam(params, "tier", state.filters.tiers);
  appendBooleanParam(params, "beginner", state.filters.beginner);
  appendBooleanParam(params, "natural", state.filters.natural);
  appendBooleanParam(params, "global", state.filters.global);
  appendBooleanParam(params, "major", state.filters.major);
  appendBooleanParam(params, "national", state.filters.nationalSelection);

  return withSearch(pathname, params);
}

export function parseHomeFilterQuery(
  params: QueryParamsLike,
): HomeFilterQueryState {
  const preset = params.get("preset")?.trim() ?? "all";
  const sort = params.get("sort")?.trim() ?? "date";

  return {
    activeOrganizationId: params.get("org")?.trim() || null,
    activePreset: HOME_PRESETS.has(preset) ? preset : "all",
    sortBy: HOME_SORTS.has(sort) ? sort : "date",
  };
}

export function buildHomeFilterPath(
  pathname: string,
  state: HomeFilterQueryState,
) {
  const params = new URLSearchParams();

  appendStringParam(params, "org", state.activeOrganizationId);
  if (state.activePreset !== "all") {
    appendStringParam(params, "preset", state.activePreset);
  }
  if (state.sortBy !== "date") {
    appendStringParam(params, "sort", state.sortBy);
  }

  return withSearch(pathname, params);
}

export function isListFilterQueryKey(key: string) {
  return LIST_KEYS.includes(key);
}

export function toURLSearchParams(input: PageSearchParams | undefined) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        appendRepeatedStringValue(params, key, item);
      }
      continue;
    }

    appendStringValue(params, key, value);
  }

  return params;
}

function getListParam(params: QueryParamsLike, key: string) {
  const values = params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? Array.from(new Set(values)) : undefined;
}

function getTierParams(params: QueryParamsLike): CompetitionTier[] | undefined {
  const values = [
    ...(getListParam(params, "tier") ?? []),
    ...(getListParam(params, "tiers") ?? []),
  ];

  if (getBooleanParam(params, "regional")) {
    values.push("regional");
  }
  if (getBooleanParam(params, "pro")) {
    values.push("pro_qualifier");
  }

  const tiers = Array.from(
    new Set(
      values.filter((value): value is CompetitionTier =>
        COMPETITION_TIERS.includes(value as CompetitionTier),
      ),
    ),
  );

  return tiers.length > 0 ? tiers : undefined;
}

function getBooleanParam(params: QueryParamsLike, key: string) {
  const value = params.get(key);

  return value === "1" || value === "true" ? true : undefined;
}

function appendStringParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  appendStringValue(params, key, value);
}

function appendStringValue(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  const normalized = value?.trim();

  if (normalized) {
    params.set(key, normalized);
  }
}

function appendRepeatedStringValue(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  const normalized = value?.trim();

  if (normalized) {
    params.append(key, normalized);
  }
}

function appendListParam(
  params: URLSearchParams,
  key: string,
  values: string[] | undefined,
) {
  for (const value of values ?? []) {
    const normalized = value.trim();

    if (normalized) {
      params.append(key, normalized);
    }
  }
}

function appendBooleanParam(
  params: URLSearchParams,
  key: string,
  value: boolean | undefined,
) {
  if (value) {
    params.set(key, "1");
  }
}

function withSearch(pathname: string, params: URLSearchParams) {
  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}
