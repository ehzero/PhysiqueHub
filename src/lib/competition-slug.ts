import type { Competition } from "@/lib/data";

const KOREAN_SLUG_REPLACEMENTS: Array<[RegExp, string]> = [
  [/내추럴/g, " natural "],
  [/리저널/g, " regional "],
  [/오픈/g, " open "],
  [/프로\s*퀄리파이어/g, " pro qualifier "],
  [/퀄리파이어/g, " qualifier "],
  [/프로쇼/g, " pro show "],
  [/프로\s*쇼/g, " pro show "],
  [/프로/g, " pro "],
  [/아마추어/g, " amateur "],
  [/올림피아/g, " olympia "],
  [/클래식\s*피지크/g, " classic physique "],
  [/피지크/g, " physique "],
  [/보디빌딩/g, " bodybuilding "],
  [/피트니스/g, " fitness "],
  [/비키니/g, " bikini "],
  [/웰니스/g, " wellness "],
  [/스포츠\s*모델/g, " sports model "],
  [/핏\s*모델/g, " fit model "],
  [/모노키니/g, " monokini "],
  [/챔피언십/g, " championship "],
  [/챔피언쉽/g, " championship "],
  [/선수권/g, " championship "],
  [/국가대표/g, " national team "],
  [/전국체전/g, " national sports festival "],
  [/대회종료/g, " "],
  [/대회/g, " "],
];

export function getCompetitionSlug(competition: Competition) {
  const year = getCompetitionYear(competition);
  const titleSlug = stripLeadingYear(
    slugifyCompetitionText(competition.title),
    year,
  );
  const titleWithOptionalDate = shouldIncludeDateSuffix(titleSlug)
    ? [titleSlug, getCompetitionDateSuffix(competition), getLocationSuffix(competition)]
        .filter(Boolean)
        .join("-")
    : titleSlug;
  const fallbackSlug = slugifyCompetitionText(
    competition.orgShort || competition.org || competition.id,
  );

  return `${year}-${titleWithOptionalDate || fallbackSlug || competition.id}`;
}

export function getCompetitionPath(competition: Competition) {
  return `/competitions/${encodeURIComponent(getCompetitionSlug(competition))}`;
}

export function normalizeCompetitionRouteSlug(value: string) {
  return value.trim().toLowerCase();
}

function getCompetitionYear(competition: Competition) {
  const dateYear = Number(competition.date.slice(0, 4));

  if (Number.isInteger(dateYear) && dateYear >= 2000 && dateYear <= 2100) {
    return dateYear;
  }

  return competition.historyYears;
}

function slugifyCompetitionText(value: string) {
  let text = value.normalize("NFKC");

  for (const [pattern, replacement] of KOREAN_SLUG_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[(){}\[\]]/g, " ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function stripLeadingYear(slug: string, year: number) {
  return slug.replace(new RegExp(`^${year}-?`), "");
}

function shouldIncludeDateSuffix(slug: string) {
  return !/\d/.test(slug);
}

function getCompetitionDateSuffix(competition: Competition) {
  const match = competition.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  return match ? `${match[2]}-${match[3]}` : "date-tbd";
}

function getLocationSuffix(competition: Competition) {
  const venue = /확인 필요|추후|예정|미정/.test(competition.venue)
    ? ""
    : competition.venue;
  const region = /확인 필요|추후|예정|미정/.test(competition.region)
    ? ""
    : competition.region;
  const locationSlug = slugifyCompetitionText(`${venue} ${region}`);

  return locationSlug || slugifyCompetitionText(competition.orgShort);
}
