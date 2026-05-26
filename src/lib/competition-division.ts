import type {
  CompetitionAgeGroup,
  CompetitionBaseDivision,
  CompetitionClassFacet,
  CompetitionDivision,
  CompetitionExperienceClass,
  CompetitionGenderGroup,
} from "../types/competitionSchedule";

export const COMPETITION_BASE_DIVISION_LABELS = {
  bodybuilding: "보디빌딩",
  classic_physique: "클래식 피지크",
  mens_physique: "맨즈 피지크",
  bikini: "비키니",
  wellness: "웰니스",
  figure_bodyfitness: "피규어",
  sports_model: "스포츠모델",
  fit_model: "핏모델",
  unknown: "종목 확인 필요",
} satisfies Record<CompetitionBaseDivision, string>;

export function normalizeCompetitionDivision(
  input: string | Partial<CompetitionDivision>,
): CompetitionDivision {
  const source = typeof input === "string" ? { name: input } : input;
  const rawText = cleanText(source.rawText ?? source.name ?? source.classText);
  const nameText = cleanText(source.name ?? rawText);
  const classText = cleanText(source.classText);
  const combinedText = [nameText || rawText, classText].filter(Boolean).join(" ");
  const baseDivision = inferBaseDivision(combinedText);
  const genderGroup = inferGenderGroup(combinedText, baseDivision, source.genderGroup ?? source.group);
  const classFacets = dedupeFacets([
    ...extractAgeFacets(combinedText),
    ...extractExperienceFacets(combinedText),
    ...extractMeasurementFacets(combinedText),
    ...extractSpecialFacets(combinedText),
    ...(source.classFacets ?? []),
  ]);
  const normalizedName =
    baseDivision === "unknown"
      ? COMPETITION_BASE_DIVISION_LABELS.unknown
      : COMPETITION_BASE_DIVISION_LABELS[baseDivision];

  return {
    rawText: rawText || nameText || undefined,
    name: normalizedName,
    baseDivision,
    genderGroup,
    group: genderGroup,
    classText: classText || getClassText(combinedText, baseDivision, classFacets),
    classFacets: classFacets.length > 0 ? classFacets : undefined,
  };
}

export function getCompetitionBaseDivisionLabel(
  value: CompetitionBaseDivision | undefined,
) {
  return COMPETITION_BASE_DIVISION_LABELS[value ?? "unknown"];
}

function inferBaseDivision(value: string): CompetitionBaseDivision {
  const text = normalizeText(value);

  if (!text) return "unknown";
  if (/클래식\s*보디\s*빌딩|classic\s*bodybuilding/.test(text)) {
    return "unknown";
  }
  if (/클래식\s*피지크|classic\s*physique/.test(text)) {
    return "classic_physique";
  }
  if (/웰니스|wellness/.test(text)) return "wellness";
  if (/비키니|bikini/.test(text)) return "bikini";
  if (/피규어|피겨|figure|보디\s*피트니스|body\s*fitness|bodyfitness/.test(text)) {
    return "figure_bodyfitness";
  }
  if (/핏\s*모델|fit\s*model/.test(text)) return "fit_model";
  if (/스포츠\s*모델|피트니스\s*모델|sports?\s*model|fitness\s*model|머슬\s*모델/.test(text)) {
    return "sports_model";
  }
  if (/맨즈\s*피지크|멘즈\s*피지크|남자\s*피지크|men'?s?\s*physique|mens\s*physique/.test(text)) {
    return "mens_physique";
  }
  if (/피지크|physique/.test(text) && !/여자|여성|우먼|women|womens/.test(text)) {
    return "mens_physique";
  }
  if (/보디\s*빌딩|바디\s*빌딩|body\s*building|bodybuilding|212/.test(text)) {
    return "bodybuilding";
  }

  return "unknown";
}

function inferGenderGroup(
  value: string,
  baseDivision: CompetitionBaseDivision,
  fallback: CompetitionGenderGroup | undefined,
): CompetitionGenderGroup {
  const text = normalizeText(value);

  if (/혼성|mixed|coed/.test(text)) return "mixed";
  if (/여자|여성|우먼|women|womens|female|ladies/.test(text)) return "womens";
  if (/남자|남성|맨즈|멘즈|men'?s?|mens|male/.test(text)) return "mens";
  if (["bikini", "wellness", "figure_bodyfitness"].includes(baseDivision)) return "womens";

  return fallback ?? "unknown";
}

function extractAgeFacets(value: string): CompetitionClassFacet[] {
  if (/중\s*\/\s*고등부/i.test(value)) {
    return [];
  }

  const facets: Array<[RegExp, CompetitionAgeGroup]> = [
    [/중등부|중학(?:교)?부|middle\s*school/i, "middle_school"],
    [/고등부|고교부|high\s*school/i, "high_school"],
    [/주니어|junior|jr\b/i, "junior"],
    [/대학부|대학교|유니버시티|university|college/i, "university"],
    [/마스터즈?|masters?|40\s*세\s*이상|50\s*세\s*이상|60\s*세\s*이상/i, "masters"],
    [/시니어|senior/i, "senior"],
    [/\bAGE\b/i, "unknown"],
  ];

  return facets
    .flatMap(([pattern, facetValue]) => {
      const rawText = value.match(pattern)?.[0];

      return rawText ? [{ type: "age" as const, value: facetValue, rawText }] : [];
    });
}

function extractExperienceFacets(value: string): CompetitionClassFacet[] {
  const facets: Array<[RegExp, CompetitionExperienceClass]> = [
    [/첫\s*출전|첫출전|first\s*timer|first-timer|debut/i, "first_timer"],
    [/루키|rookie|비기너|beginner/i, "rookie"],
    [/노비스|novice|초보/i, "novice"],
    [/\bopen\b|오픈|일반부/i, "open"],
  ];

  return facets
    .flatMap(([pattern, facetValue]) => {
      const rawText = value.match(pattern)?.[0];

      return rawText ? [{ type: "experience" as const, value: facetValue, rawText }] : [];
    });
}

function extractMeasurementFacets(value: string): CompetitionClassFacet[] {
  const facets: CompetitionClassFacet[] = [];
  const text = cleanText(value).replace(/[–—~]/g, "-");
  const normalized = normalizeText(text);
  const heightWeightCap = text.match(/\b\d{2,3}(?:\.\d+)?\s*cm\s*[-+]\s*\d{1,3}(?:\.\d+)?\s*kg\b/i);
  const weights = text.match(/(?:[-+]\s*)?\d{2,3}(?:\.\d+)?\s*kg(?:\s*(?:이하|이상|미만|초과))?/gi) ?? [];
  const heights = text.match(/(?:[-+]\s*)?\d{2,3}(?:\.\d+)?\s*cm(?:\s*(?:이하|이상|미만|초과))?/gi) ?? [];
  const heightLabels = text.match(/\b(?:short|medium|tall)\b|숏|미디움|미디엄|톨/gi) ?? [];

  if (heightWeightCap || /신장\s*대비\s*체중|height\s*weight/.test(normalized)) {
    facets.push({
      type: "measurement",
      value: "height_weight_cap",
      rawText: heightWeightCap?.[0] ?? "신장 대비 체중",
    });
    if (heightWeightCap) {
      facets.push({
        type: "height_weight_cap",
        value: cleanText(heightWeightCap[0]),
        rawText: cleanText(heightWeightCap[0]),
      });
    }

    return facets;
  }

  for (const weight of weights) {
    const rawText = cleanText(weight).replace(/\s+/g, "");
    facets.push({ type: "measurement", value: "weight", rawText });
    facets.push({ type: "weight", value: rawText, rawText });
  }

  for (const height of heights) {
    const rawText = cleanText(height).replace(/\s+/g, "");
    facets.push({ type: "measurement", value: "height", rawText });
    facets.push({ type: "height", value: rawText, rawText });
  }

  for (const heightLabel of heightLabels) {
    const rawText = normalizeHeightLabel(heightLabel);
    facets.push({ type: "measurement", value: "height", rawText });
    facets.push({ type: "height", value: rawText, rawText });
  }

  return facets;
}

function extractSpecialFacets(value: string): CompetitionClassFacet[] {
  const facets: CompetitionClassFacet[] = [];
  const natural = value.match(/내추럴|natural/i)?.[0];
  const proQualifier = value.match(/프로\s*퀄리파이어|pro\s*qualifier/i)?.[0];
  const proCard = value.match(/프로\s*카드|pro\s*card/i)?.[0];
  const proShow = value.match(/프로\s*쇼|프로쇼|pro\s*show/i)?.[0];

  if (natural) {
    facets.push({ type: "natural", value: "natural", rawText: natural });
  }
  if (proQualifier) {
    facets.push({ type: "pro", value: "pro_qualifier", rawText: proQualifier });
  }
  if (proCard) {
    facets.push({ type: "pro", value: "pro_card", rawText: proCard });
  }
  if (proShow) {
    facets.push({ type: "pro", value: "pro_show", rawText: proShow });
  }

  return facets;
}

function getClassText(
  value: string,
  baseDivision: CompetitionBaseDivision,
  facets: CompetitionClassFacet[],
): string | undefined {
  const rawParts = facets.map((facet) => facet.rawText).filter(Boolean);
  if (rawParts.length > 0) return Array.from(new Set(rawParts)).join(" ");
  if (baseDivision === "unknown") return undefined;

  const text = cleanText(value);
  const withoutDivision = cleanClassText(removeBaseDivisionText(text, baseDivision));

  return withoutDivision && withoutDivision !== text ? withoutDivision : undefined;
}

function removeBaseDivisionText(value: string, baseDivision: CompetitionBaseDivision) {
  const patterns = BASE_DIVISION_TEXT_PATTERNS[baseDivision] ?? [];

  return patterns.reduce((text, pattern) => text.replace(pattern, " "), value);
}

const BASE_DIVISION_TEXT_PATTERNS = {
  bodybuilding: [
    /보디\s*빌딩|바디\s*빌딩|body\s*building|bodybuilding|212/gi,
  ],
  classic_physique: [/클래식\s*피지크|classic\s*physique/gi],
  mens_physique: [
    /맨즈\s*피지크|멘즈\s*피지크|남자\s*피지크|men'?s?\s*physique|mens\s*physique|피지크|physique/gi,
  ],
  bikini: [/비키니|bikini/gi],
  wellness: [/웰니스|wellness/gi],
  figure_bodyfitness: [
    /피규어|피겨|figure|보디\s*피트니스|body\s*fitness|bodyfitness/gi,
  ],
  sports_model: [
    /스포츠\s*모델|피트니스\s*모델|sports?\s*model|fitness\s*model|머슬\s*모델/gi,
  ],
  fit_model: [/핏\s*모델|fit\s*model/gi],
  unknown: [],
} satisfies Record<CompetitionBaseDivision, RegExp[]>;

function cleanClassText(value: string) {
  return cleanText(value)
    .replace(/\b(?:PCA|NPCA|NABBA|IFBB|NPC|KBBF|WNBF|ICN|AGP|NAC|MUSA|WNGP|SSA)\b/gi, " ")
    .replace(/남자|남성|여자|여성|맨즈|멘즈|우먼|men'?s?|women'?s?|mens|womens|male|female/gi, " ")
    .replace(/\((?:\s|classic|physique|bodybuilding|body\s*fitness|bikini|wellness|figure|sports?\s*model|fitness\s*model|men'?s?|women'?s?)+\)/gi, " ")
    .replace(/[()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeFacets(facets: CompetitionClassFacet[]) {
  const seen = new Set<string>();
  const deduped: CompetitionClassFacet[] = [];

  for (const facet of facets) {
    const key =
      facet.type === "weight" ||
      facet.type === "height" ||
      facet.type === "height_weight_cap"
        ? `${facet.type}:${facet.value}:${facet.rawText}`
        : `${facet.type}:${facet.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(facet);
  }

  return deduped;
}

function normalizeHeightLabel(value: string) {
  return cleanText(value);
}

function normalizeText(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[·_/()[\]{}"'’‘“”:+,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
