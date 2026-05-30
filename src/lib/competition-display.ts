import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import {
  fmtDate,
  regStatusAt,
  type Competition,
  type CompetitionClassFilterFacet,
} from "@/lib/data";

const UNCERTAIN_TEXT_PATTERN = /장소 확인 필요|지역 확인 필요|추후 공지|예정|미정|확인 필요/;

export function getCompetitionDateLabel(competition: Competition) {
  if (competition.dateEnd) {
    return `${fmtDate(competition.date, { style: "long" })} - ${fmtDate(competition.dateEnd, { style: "long" })}`;
  }

  return fmtDate(competition.date, { style: "long" });
}

export function getCompetitionLocationLabel(competition: Competition) {
  const region = competition.region || "지역 확인 필요";
  const venue = competition.venue || "";

  if (!venue || venue === region || isUncertainText(venue)) {
    return region;
  }

  if (isUncertainText(region)) {
    return venue;
  }

  return `${region} · ${venue}`;
}

export function hasReliableCompetitionLocation(
  competition: Pick<Competition, "region" | "venue">,
) {
  const locationText = `${competition.venue || ""} ${competition.region || ""}`.trim();

  return Boolean(locationText) && !isUncertainText(locationText);
}

export function getCompetitionRegistrationLabel(
  competition: Competition,
  today?: Date | null,
) {
  const status = today ? regStatusAt(competition, today) : null;

  if (competition.registrationStatus === "unknown") {
    return competition.regClose === competition.date
      ? status?.kind === "closed"
        ? "접수 마감"
        : "공식 접수 정보 확인 필요"
      : `마감 ${fmtDate(competition.regClose, { style: "long" })}`;
  }

  if (competition.regOpen === competition.regClose) {
    return `마감 ${fmtDate(competition.regClose, { style: "long" })}`;
  }

  return `${fmtDate(competition.regOpen, { style: "long" })} - ${fmtDate(competition.regClose, { style: "long" })}`;
}

export function getCompetitionFeeLabel(competition: Competition) {
  return competition.fee > 0
    ? `₩ ${competition.fee.toLocaleString("ko-KR")}`
    : "확인 필요";
}

export function getCompetitionCategoryCountLabel(competition: Competition) {
  return competition.categories.length > 0
    ? `${competition.categories.length}개`
    : "확인";
}

export function getCompetitionClassLabel(competition: Competition) {
  if (competition.classTexts.length > 0) {
    return competition.classTexts.join(", ");
  }

  const facetLabels = competition.classFacets
    .map(getClassFacetDisplayLabel)
    .filter((label): label is string => Boolean(label));

  if (facetLabels.length > 0) {
    return Array.from(new Set(facetLabels)).join(", ");
  }

  return "공식 접수 페이지 확인 필요";
}

export function getCompetitionClassificationTags(competition: Competition) {
  const tags = [
    COMPETITION_TIER_LABELS[competition.tier],
    competition.attributes.global ? "글로벌" : "",
    competition.attributes.nationalSelection ? "국가대표 선발" : "",
    competition.attributes.nationalTeamEvent ? "국가대표전" : "",
    competition.attributes.nationalSportsFestival ? "전국체전" : "",
    competition.attributes.beginner ? "입문·루키" : "",
    competition.natural ? "내추럴" : "",
  ].filter(Boolean);

  return Array.from(new Set(tags));
}

export function getCompetitionFeatureTags(competition: Competition) {
  const classificationTags = new Set(getCompetitionClassificationTags(competition));
  const tags = competition.tags.filter((tag) => !classificationTags.has(tag));

  return tags.length > 0 ? tags : ["공식 소스 기준 정보 확인 필요"];
}

function getClassFacetDisplayLabel(facet: CompetitionClassFilterFacet) {
  if (/확인 필요/.test(facet.label)) {
    return undefined;
  }

  return facet.label || facet.rawText;
}

function isUncertainText(value: string) {
  return UNCERTAIN_TEXT_PATTERN.test(value);
}
