const KOREAN_REGION_ALIASES: Array<[RegExp, string]> = [
  [/^(서울|서울시|서울특별시|Seoul)$/i, "서울"],
  [/^(부산|부산시|부산광역시|Busan)$/i, "부산"],
  [/^(대구|대구시|대구광역시|Daegu)$/i, "대구"],
  [/^(인천|인천시|인천광역시|Incheon)$/i, "인천"],
  [/^(광주|광주시|광주광역시|Gwangju)$/i, "광주"],
  [/^(대전|대전시|대전광역시|Daejeon)$/i, "대전"],
  [/^(울산|울산시|울산광역시|Ulsan)$/i, "울산"],
  [/^(세종|세종시|세종특별시|세종특별자치시)(?:\/인근지역)?$/i, "세종"],
  [/^(제주|제주도|제주특별자치도)$/i, "제주"],
  [/^(경기|경기도)$/i, "경기"],
  [/^(강원|강원도|강원특별자치도)$/i, "강원"],
  [/^(충남|충청남도)$/i, "충남"],
  [/^(충북|충청북도)$/i, "충북"],
  [/^(전북|전라북도|전북특별자치도)$/i, "전북"],
  [/^(전남|전라남도)$/i, "전남"],
  [/^(경북|경상북도)$/i, "경북"],
  [/^(경남|경상남도)$/i, "경남"],
  [/^정선(?:군)?$/i, "강원"],
];

const KOREAN_CITY_REGION_ALIASES: Array<[RegExp, string]> = [
  [/^(Seoul|서울|서울시|서울특별시)$/i, "서울"],
  [/^(Busan|부산|부산시|부산광역시)$/i, "부산"],
  [/^(Daegu|대구|대구시|대구광역시)$/i, "대구"],
  [/^(Incheon|인천|인천시|인천광역시)$/i, "인천"],
  [/^(Gwangju|광주|광주시|광주광역시)$/i, "광주"],
  [/^(Daejeon|대전|대전시|대전광역시)$/i, "대전"],
  [/^(Ulsan|울산|울산시|울산광역시)$/i, "울산"],
  [/^(Sejong|세종|세종시|세종특별시|세종특별자치시)$/i, "세종"],
  [/^정선(?:군)?$/i, "강원"],
];

const REGION_COLLATOR = new Intl.Collator("ko-KR", {
  numeric: true,
  sensitivity: "base",
});

const KOREAN_REGION_ORDER = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

const KOREAN_REGION_ORDER_MAP: Map<string, number> = new Map(
  KOREAN_REGION_ORDER.map((region, index) => [region, index]),
);

export function normalizeCompetitionRegion(input: {
  country?: string | null;
  region?: string | null;
  city?: string | null;
}): string | undefined {
  const country = input.country?.trim();
  const region = normalizeLocationText(input.region);
  const city = normalizeLocationText(input.city);

  if (country === "KR") {
    return (
      findAlias(region, KOREAN_REGION_ALIASES) ??
      findAlias(city, KOREAN_CITY_REGION_ALIASES) ??
      region ??
      city
    );
  }

  return region ?? city ?? country ?? undefined;
}

export function compareRegionNames(a: string, b: string): number {
  const aOrder = KOREAN_REGION_ORDER_MAP.get(a);
  const bOrder = KOREAN_REGION_ORDER_MAP.get(b);

  if (aOrder !== undefined || bOrder !== undefined) {
    if (aOrder === undefined) return 1;
    if (bOrder === undefined) return -1;
    return aOrder - bOrder;
  }

  const aKorean = hasHangul(a);
  const bKorean = hasHangul(b);

  if (aKorean !== bKorean) {
    return aKorean ? -1 : 1;
  }

  return REGION_COLLATOR.compare(a, b);
}

function normalizeLocationText(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, " ");

  return normalized || undefined;
}

function findAlias(
  value: string | undefined,
  aliases: Array<[RegExp, string]>,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return aliases.find(([pattern]) => pattern.test(value))?.[1];
}

function hasHangul(value: string): boolean {
  return /[가-힣]/.test(value);
}
