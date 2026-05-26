export type CompetitionTier =
  | "general"
  | "regional"
  | "pro_qualifier"
  | "pro_show"
  | "championship";

export interface CompetitionAttributes {
  global: boolean;
  major: boolean;
  nationalSelection: boolean;
  nationalTeamEvent: boolean;
  nationalSportsFestival: boolean;
  beginner: boolean;
}

export interface CompetitionClassification {
  tier: CompetitionTier;
  attributes: CompetitionAttributes;
}

export interface CompetitionClassificationInput {
  title: string;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationShortName?: string | null;
  country?: string | null;
  divisions?: unknown[];
  tags?: unknown[];
  flags?: Record<string, unknown>;
}

export const COMPETITION_TIER_LABELS: Record<CompetitionTier, string> = {
  general: "일반",
  regional: "리저널",
  pro_qualifier: "프로 퀄리파이어",
  pro_show: "프로쇼",
  championship: "챔피언십",
};

export const COMPETITION_TIERS = Object.keys(
  COMPETITION_TIER_LABELS,
) as CompetitionTier[];

export function classifyCompetition(
  input: CompetitionClassificationInput,
): CompetitionClassification {
  const flags = input.flags ?? {};
  const title = normalizeText(input.title);
  const normalized = normalizeText(getEventText(input));
  const isAmateurOlympia = /amateur\s*olympia|아마추어\s*올림피아/.test(title);
  const isProQualifier = isProQualifierText(normalized, flags);
  const isProShow = isProShowText(input, normalized, flags, isProQualifier);
  const isRegional = isRegionalText(normalized, flags);
  const nationalSportsFestival = isNationalSportsFestivalText(normalized, flags);
  const isChampionship = isChampionshipText(title, flags, nationalSportsFestival);
  const global = isGlobalText(input, normalized, flags);
  const nationalSelection = isNationalSelectionText(
    normalized,
    flags,
    nationalSportsFestival,
  );
  const nationalTeamEvent = isNationalTeamEventText(
    input,
    normalized,
    flags,
    nationalSelection,
  );
  const beginner = isBeginnerText(normalized, flags);
  const major = isMajorText(input, title, flags);

  return {
    tier: getTier({
      isProShow,
      isProQualifier,
      isRegional,
      isChampionship,
      isMajor: major,
      isAmateurOlympia,
    }),
    attributes: {
      global,
      major,
      nationalSelection,
      nationalTeamEvent,
      nationalSportsFestival,
      beginner,
    },
  };
}

function getTier(options: {
  isProShow: boolean;
  isProQualifier: boolean;
  isRegional: boolean;
  isChampionship: boolean;
  isMajor: boolean;
  isAmateurOlympia: boolean;
}): CompetitionTier {
  if (
    options.isChampionship &&
    options.isMajor &&
    !options.isRegional &&
    !options.isAmateurOlympia
  ) {
    return "championship";
  }

  if (
    options.isChampionship &&
    !options.isProQualifier &&
    !options.isRegional
  ) {
    return "championship";
  }
  if (options.isProShow) return "pro_show";
  if (options.isProQualifier) return "pro_qualifier";
  if (options.isRegional) return "regional";
  return "general";
}

function isProQualifierText(
  normalized: string,
  flags: Record<string, unknown>,
): boolean {
  return (
    flags.proQualifier === true ||
    flags.proCard === true ||
    /프로\s*퀄리파이어|프로\s*카드|pro\s*qualifier|super\s*pro\s*qualifier|pro\s*card|amateur\s*olympia|아마추어\s*올림피아/.test(
      normalized,
    )
  );
}

function isProShowText(
  input: CompetitionClassificationInput,
  normalized: string,
  flags: Record<string, unknown>,
  isProQualifier: boolean,
): boolean {
  if (input.organizationId === "ifbb-pro-league") {
    return true;
  }

  if (
    flags.proShow === true ||
    /프로\s*쇼|프로쇼|프로\s*올스타|pro\s*show|pro\s*all\s*stars|pro\s*championships?|pro\s*world\s*championships?/.test(
      normalized,
    )
  ) {
    return true;
  }

  return !isProQualifier && /\bpro\b/.test(normalized);
}

function isRegionalText(
  normalized: string,
  flags: Record<string, unknown>,
): boolean {
  return flags.regional === true || /리저널|regional/.test(normalized);
}

function isChampionshipText(
  normalized: string,
  flags: Record<string, unknown>,
  nationalSportsFestival: boolean,
): boolean {
  if (nationalSportsFestival) {
    return false;
  }

  if (flags.championship === true) {
    return true;
  }

  if (/유니버시티/.test(normalized)) {
    return false;
  }

  return /championships?|챔피언십|챔피언쉽|선수권|world\s*championships?|worlds\b|월드|세계|universe|유니버스|olympia|올림피아|arnold|아놀드|final|파이널/.test(
    normalized,
  );
}

function isGlobalText(
  input: CompetitionClassificationInput,
  normalized: string,
  flags: Record<string, unknown>,
): boolean {
  return (
    flags.international === true ||
    Boolean(input.country && input.country !== "KR") ||
    /글로벌|국제|아시아|asian|asia|worlds?|월드|세계|universe|유니버스|olympia|올림피아|arnold|아놀드/.test(
      normalized,
    )
  );
}

function isNationalSelectionText(
  normalized: string,
  flags: Record<string, unknown>,
  nationalSportsFestival: boolean,
): boolean {
  if (nationalSportsFestival) {
    return false;
  }

  if (/국가대표.*선발/.test(normalized)) {
    return true;
  }

  return flags.nationalTeamRoute === true && !isRepresentativeEventTitle(normalized);
}

function isNationalSportsFestivalText(
  normalized: string,
  flags: Record<string, unknown>,
): boolean {
  return (
    flags.nationalSportsFestival === true ||
    /전국\s*체전|전국\s*체육|전국\s*체육대회/.test(normalized)
  );
}

function isNationalTeamEventText(
  input: CompetitionClassificationInput,
  normalized: string,
  flags: Record<string, unknown>,
  nationalSelection: boolean,
): boolean {
  if (nationalSelection) {
    return false;
  }

  if (flags.nationalTeamEvent === true) {
    return true;
  }

  if (!isKbbfContext(input, normalized)) {
    return false;
  }

  return (
    (flags.international === true || /국제\s*대회/.test(normalized)) &&
    isRepresentativeEventTitle(normalized)
  );
}

function isKbbfContext(
  input: CompetitionClassificationInput,
  normalized: string,
): boolean {
  return (
    input.organizationId === "kbbf" ||
    /대한\s*보디\s*빌딩\s*협회|kbbf/.test(
      normalizeText(
        [input.organizationName, input.organizationShortName, normalized]
          .filter(Boolean)
          .join(" "),
      ),
    )
  );
}

function isRepresentativeEventTitle(normalized: string): boolean {
  return /ifbb|세계|아시아|동아시아|한\s*중\s*일|친선|선수권|olympia|올림피아|universe|유니버스|mr\.?\s*universe/.test(
    normalized,
  );
}

function isBeginnerText(
  normalized: string,
  flags: Record<string, unknown>,
): boolean {
  return (
    flags.beginnerFriendly === true ||
    flags.rookieClass === true ||
    /입문|루키|노비스|비기너|초보|first\s*timer|first\s*time|novice|rookie|beginner/.test(
      normalized,
    )
  );
}

function isMajorText(
  input: CompetitionClassificationInput,
  normalized: string,
  flags: Record<string, unknown>,
): boolean {
  if (flags.major === true) {
    return true;
  }

  if (
    /mr\.?\s*olympia|미스터\s*올림피아|olympia|올림피아|arnold|아놀드|natural\s*olympia/.test(
      normalized,
    )
  ) {
    return true;
  }

  if (/worlds\b|세계.*선수권|world\s*championships?/.test(normalized)) {
    return true;
  }

  if (/universe|유니버스/.test(normalized)) {
    return true;
  }

  return Boolean(
    input.organizationId &&
      /^(wnbf|nabba|wff|musclemania|nac|wbff|inba|pnba)/i.test(
        input.organizationId,
      ) &&
      /월드|world|championship|championships/.test(normalized),
  );
}

function getEventText(input: CompetitionClassificationInput): string {
  const tags = (input.tags ?? [])
    .filter((tag): tag is string => typeof tag === "string")
    .join(" ");

  return [input.title, tags].filter(Boolean).join(" ");
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[·_/()[\]{}"'’‘“”:+,&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
