import { createHash } from "node:crypto";
import { normalizeCompetitionDivision } from "../lib/competition-division";
import { FETCH_TIMEOUT_MS } from "./config";
import type {
  CompetitionConfidence,
  CompetitionDateRange,
  CompetitionDivision,
  CompetitionLocation,
  CompetitionOrganizationId,
  CompetitionQualityIssue,
  CompetitionRegistrationStatus,
  CompetitionRegistrationWindow,
  CompetitionScheduleDraft,
  CompetitionSourceSnapshot,
  CompetitionSourceType,
} from "../types/competitionSchedule";

const USER_AGENT =
  "PhysiqueHubCrawlerPreview/0.1 (+https://physiquehub.kr; contact: support@physiquehub.kr)";

const KOREA_TIMEZONE = "Asia/Seoul" as const;
const UNCERTAIN_LOCATION_PATTERN = /추후\s*공지|공지\s*예정|예정|미정|확인\s*필요|인근|수도권/i;
const VENUE_PATTERN =
  /(?:홀|센터|센타|체육관|아레나|호텔|컨벤션|방송센터|방송센타|경기장|문화|회관|문예회관|문화예술회관|대강당|공연장|아트홀|극장|대학교|캠퍼스|리조트|시청|구청|도청|공원|웨이브파크|플랫폼|플렛폼|볼룸|스테이지|百老匯|Broadway)/i;

interface RegionCityHint {
  region: string;
  city?: string;
}

const METRO_REGION_HINTS: Array<[RegExp, RegionCityHint]> = [
  [/서울|Seoul/i, { region: "서울특별시", city: "서울특별시" }],
  [/부산|Busan/i, { region: "부산광역시", city: "부산광역시" }],
  [/대구|Daegu/i, { region: "대구광역시", city: "대구광역시" }],
  [/인천|Incheon/i, { region: "인천광역시", city: "인천광역시" }],
  [/광주|Gwangju/i, { region: "광주광역시", city: "광주광역시" }],
  [/대전|Daejeon/i, { region: "대전광역시", city: "대전광역시" }],
  [/울산|Ulsan/i, { region: "울산광역시", city: "울산광역시" }],
  [/세종|Sejong/i, { region: "세종특별자치시", city: "세종특별자치시" }],
  [/제주/, { region: "제주특별자치도" }],
];

const PROVINCE_REGION_HINTS: Array<[RegExp, RegionCityHint]> = [
  [/경기도|경기/, { region: "경기도" }],
  [/강원특별자치도|강원도|강원/, { region: "강원특별자치도" }],
  [/충청남도|충남/, { region: "충청남도" }],
  [/충청북도|충북/, { region: "충청북도" }],
  [/전북특별자치도|전라북도|전북/, { region: "전북특별자치도" }],
  [/전라남도|전남/, { region: "전라남도" }],
  [/경상북도|경북/, { region: "경상북도" }],
  [/경상남도|경남/, { region: "경상남도" }],
];

const CITY_REGION_HINTS: Array<[RegExp, RegionCityHint]> = [
  [/화성시|화성/, { region: "경기도", city: "화성시" }],
  [/오산시|오산/, { region: "경기도", city: "오산시" }],
  [/수원시|수원/, { region: "경기도", city: "수원시" }],
  [/용인시|용인/, { region: "경기도", city: "용인시" }],
  [/부천시|부천/, { region: "경기도", city: "부천시" }],
  [/파주시|파주/, { region: "경기도", city: "파주시" }],
  [/고양시|고양|일산/, { region: "경기도", city: "고양시" }],
  [/광명시|광명/, { region: "경기도", city: "광명시" }],
  [/안양시|안양/, { region: "경기도", city: "안양시" }],
  [/의왕시|의왕/, { region: "경기도", city: "의왕시" }],
  [/군포시|군포/, { region: "경기도", city: "군포시" }],
  [/시흥시|시흥/, { region: "경기도", city: "시흥시" }],
  [/안산시|안산/, { region: "경기도", city: "안산시" }],
  [/평택시|평택/, { region: "경기도", city: "평택시" }],
  [/김포시|김포/, { region: "경기도", city: "김포시" }],
  [/남양주시|남양주/, { region: "경기도", city: "남양주시" }],
  [/양주시|양주/, { region: "경기도", city: "양주시" }],
  [/성남시|성남/, { region: "경기도", city: "성남시" }],
  [/의정부시|의정부/, { region: "경기도", city: "의정부시" }],
  [/공주시|공주/, { region: "충청남도", city: "공주시" }],
  [/당진시|당진/, { region: "충청남도", city: "당진시" }],
  [/천안시|천안/, { region: "충청남도", city: "천안시" }],
  [/보령시|보령/, { region: "충청남도", city: "보령시" }],
  [/문경시|문경/, { region: "경상북도", city: "문경시" }],
  [/경산시|경산/, { region: "경상북도", city: "경산시" }],
  [/구미시|구미/, { region: "경상북도", city: "구미시" }],
  [/창원시|창원|동읍/, { region: "경상남도", city: "창원시" }],
  [/김해시|김해/, { region: "경상남도", city: "김해시" }],
  [/양산시|양산/, { region: "경상남도", city: "양산시" }],
  [/순천시|순천/, { region: "전라남도", city: "순천시" }],
  [/김제시|김제/, { region: "전북특별자치도", city: "김제시" }],
  [/정선군|정선/, { region: "강원특별자치도", city: "정선군" }],
  [/서귀포시|서귀포/, { region: "제주특별자치도", city: "서귀포시" }],
];

const VENUE_REGION_HINTS: Array<[RegExp, RegionCityHint]> = [
  [/계양문화회관|인천\s*계양구|계양구\s*계양산로/i, { region: "인천광역시", city: "인천광역시" }],
  [/세종대학교\s*컨벤션센터/i, { region: "서울특별시", city: "서울특별시" }],
  [/화성시청/, { region: "경기도", city: "화성시" }],
  [/장안대학교/, { region: "경기도", city: "화성시" }],
  [/루터대학교/, { region: "경기도", city: "용인시" }],
  [/공주(?:대학교|대)\s*백제교육문화관/, { region: "충청남도", city: "공주시" }],
  [/대교\s*미디어센터/, { region: "경기도", city: "부천시" }],
  [/호서대학교\s*산학융합캠퍼스/, { region: "충청남도", city: "당진시" }],
  [/호남대학교\s*문화체육관/, { region: "광주광역시", city: "광주광역시" }],
  [/대구한의대학교/, { region: "경상북도", city: "경산시" }],
  [/에스플렉스\s*센터/, { region: "서울특별시", city: "서울특별시" }],
  [/KBS\s*울산홀|울산\s*KBS홀/i, { region: "울산광역시", city: "울산광역시" }],
  [/KBS\s*아레나홀/i, { region: "서울특별시", city: "서울특별시" }],
  [/국민대학교\s*체육관/, { region: "서울특별시", city: "서울특별시" }],
  [/동읍실내체육관/, { region: "경상남도", city: "창원시" }],
  [/하이원리조트/, { region: "강원특별자치도", city: "정선군" }],
  [/엠파이브\s*방송센(?:터|타)|M5\s*방송센(?:터|타)/i, { region: "경기도", city: "파주시" }],
  [/베스트웨스턴\s*하버파크호텔/, { region: "인천광역시", city: "인천광역시" }],
  [/웨이브파크/, { region: "경기도", city: "시흥시" }],
  [/배재대학교\s*콘서트홀/, { region: "대전광역시", city: "대전광역시" }],
  [/순천문화건강센터/, { region: "전라남도", city: "순천시" }],
  [/보령문화예술회관/, { region: "충청남도", city: "보령시" }],
  [/김제시문화예술회관/, { region: "전북특별자치도", city: "김제시" }],
  [/상상플(?:랫|렛)폼|월미로\s*33/, { region: "인천광역시", city: "인천광역시" }],
  [/충청대학교\s*컨벤션센터/, { region: "충청북도", city: "청주시" }],
  [/하버파크\s*그랜드볼룸/, { region: "인천광역시", city: "인천광역시" }],
  [/서귀포\s*월드컵리조트/, { region: "제주특별자치도", city: "서귀포시" }],
  [/가야대학교\s*공연장/, { region: "경상남도", city: "김해시" }],
  [/동명대학교\s*대강당/, { region: "부산광역시", city: "부산광역시" }],
  [/농심호텔/, { region: "부산광역시", city: "부산광역시" }],
  [/밀리토피아\s*호텔/, { region: "경기도", city: "성남시" }],
  [/경기대학교\s*씨름장|경기대학교/, { region: "경기도", city: "수원시" }],
  [/안양대학교/, { region: "경기도", city: "안양시" }],
  [/문경새재도립공원/, { region: "경상북도", city: "문경시" }],
  [/미사토시|Misato City/i, { region: "사이타마현", city: "미사토시" }],
  [/澳門百老匯|브로드웨이\s*스테이지|Broadway/i, { region: "마카오", city: "마카오" }],
];

interface FetchHtmlResult {
  html: string;
  fetchedAt: string;
}

export async function fetchHtml(
  url: string,
  options: { encoding?: string } = {},
): Promise<FetchHtmlResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.7,en;q=0.6",
        "user-agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const fetchedAt = new Date().toISOString();

    if (options.encoding) {
      return {
        html: new TextDecoder(options.encoding).decode(
          Buffer.from(await response.arrayBuffer()),
        ),
        fetchedAt,
      };
    }

    return {
      html: await response.text(),
      fetchedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function cleanText(value: string | undefined | null): string {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueTexts(values: string[]): string[] {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)));
}

export function absoluteUrl(href: string | undefined, baseUrl: string): string | undefined {
  const cleanHref = cleanText(href);

  if (!cleanHref || cleanHref === "#") {
    return undefined;
  }

  try {
    return new URL(cleanHref, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function rawHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function slugify(value: string): string {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || rawHash(value);
}

function makeDeterministicId(
  organizationId: CompetitionOrganizationId,
  sourceEventId: string | undefined,
  fallbackParts: string[],
): string {
  return `${organizationId}:${sourceEventId || slugify(fallbackParts.join(" "))}`;
}

export function getYearFromText(text: string, fallbackYear = 2026): number {
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : fallbackYear;
}

export function parseKoreanDateRange(
  rawText: string | undefined,
  fallbackYear = 2026,
  confidence: CompetitionConfidence = "medium",
): CompetitionDateRange {
  const raw = cleanText(rawText);
  const dateText = raw
    .replace(/\((?:월|화|수|목|금|토|일)\)/g, "")
    .replace(/（(?:월|화|수|목|금|토|일)）/g, "")
    .replace(/\s[~-]\s*\d{1,2}:\d{2}(?::\d{2})?/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const empty: CompetitionDateRange = {
    timezone: KOREA_TIMEZONE,
    rawText: raw || undefined,
    confidence: raw ? confidence : "low",
  };

  if (!raw) {
    return empty;
  }

  const isoRange = dateText.match(
    /(20\d{2})[-./](\d{1,2})[-./](\d{1,2})(?:\s+(?:~|-|–)\s+(20\d{2})[-./](\d{1,2})[-./](\d{1,2}))?/,
  );
  if (isoRange) {
    return {
      startsOn: toDateString(Number(isoRange[1]), Number(isoRange[2]), Number(isoRange[3])),
      endsOn: isoRange[4]
        ? toDateString(Number(isoRange[4]), Number(isoRange[5]), Number(isoRange[6]))
        : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  const fullRange = dateText.match(
    /(20\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})\s*(?:일)?\.?\s*(?:[~\-–]\s*(?:(\d{1,2})[.\-/월\s]+)?(\d{1,2}))?/,
  );
  if (fullRange) {
    const year = Number(fullRange[1]);
    const month = Number(fullRange[2]);
    const day = Number(fullRange[3]);
    const endMonth = fullRange[4] ? Number(fullRange[4]) : month;
    const endDay = fullRange[5] ? Number(fullRange[5]) : day;

    return {
      startsOn: toDateString(year, month, day),
      endsOn: fullRange[5] ? toDateString(year, endMonth, endDay) : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  const koreanRange = dateText.match(
    /(?:(20\d{2})년\s*)?(\d{1,2})월\s*(\d{1,2})일?(?:\s*[~\-–]\s*(?:(\d{1,2})월\s*)?(\d{1,2})일?)?/,
  );
  if (koreanRange) {
    const year = koreanRange[1] ? Number(koreanRange[1]) : fallbackYear;
    const month = Number(koreanRange[2]);
    const day = Number(koreanRange[3]);
    const endMonth = koreanRange[4] ? Number(koreanRange[4]) : month;
    const endDay = koreanRange[5] ? Number(koreanRange[5]) : day;

    return {
      startsOn: toDateString(year, month, day),
      endsOn: koreanRange[5] ? toDateString(year, endMonth, endDay) : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  const numericMonthDay = dateText.match(
    /(\d{1,2})\s*[.]\s*(\d{1,2})\s*[.]?(?:\s*[~\-–]\s*(?:(\d{1,2})\s*[.]\s*)?(\d{1,2})\s*[.]?)?/,
  );
  if (numericMonthDay) {
    const month = Number(numericMonthDay[1]);
    const day = Number(numericMonthDay[2]);
    const endMonth = numericMonthDay[3] ? Number(numericMonthDay[3]) : month;
    const endDay = numericMonthDay[4] ? Number(numericMonthDay[4]) : day;

    return {
      startsOn: toDateString(fallbackYear, month, day),
      endsOn: numericMonthDay[4] ? toDateString(fallbackYear, endMonth, endDay) : undefined,
      timezone: KOREA_TIMEZONE,
      rawText: raw,
      confidence,
    };
  }

  return empty;
}

export function parseKoreanDeadline(
  rawText: string | undefined,
  fallbackYear = 2026,
): string | undefined {
  const raw = cleanText(rawText);
  const range = parseKoreanDateRange(rawText, fallbackYear, "medium");
  if (!range.startsOn) {
    return undefined;
  }

  const colonTime = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  const koreanTime = raw.match(/(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  const hour = colonTime?.[1] ?? koreanTime?.[1] ?? "23";
  const minute = colonTime?.[2] ?? koreanTime?.[2] ?? "59";

  return `${range.startsOn}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+09:00`;
}

export function toKoreaIsoDateTime(rawValue: string | undefined): string | undefined {
  const value = cleanText(rawValue);

  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return `${value}+09:00`;
  }

  return value;
}

export function inferRegistrationStatus(
  opensAt: string | undefined,
  closesAt: string | undefined,
  applyOpen?: string,
): CompetitionRegistrationStatus {
  const normalizedApplyOpen = cleanText(applyOpen).toLowerCase();
  const now = Date.now();
  const openMs = opensAt ? Date.parse(opensAt) : Number.NaN;
  const closeMs = closesAt ? Date.parse(closesAt) : Number.NaN;

  if (Number.isFinite(closeMs) && closeMs < now) {
    return "closed";
  }

  if (normalizedApplyOpen === "true" || normalizedApplyOpen === "ture") {
    return "open";
  }

  if (Number.isFinite(openMs) && openMs > now) {
    return "scheduled";
  }

  if (Number.isFinite(openMs) && openMs <= now) {
    return "open";
  }

  return "unknown";
}

export function extractDivisions(rawText: string | undefined): CompetitionDivision[] {
  const text = cleanText(rawText);
  if (!text) {
    return [];
  }

  return text
    .split(/[,/·]/)
    .map((name) => cleanText(name))
    .filter((name) => name.length > 1)
    .map((name) =>
      normalizeCompetitionDivision({
        name,
        genderGroup: inferDivisionGroup(name),
        rawText: name,
      }),
    );
}

export function createScheduleDraft(input: {
  organizationId: CompetitionOrganizationId;
  organizationName: string;
  organizationShortName?: string;
  title: string;
  seasonYear?: number;
  date: CompetitionDateRange;
  registration?: Partial<CompetitionRegistrationWindow>;
  location?: Partial<CompetitionLocation>;
  divisions?: CompetitionDivision[];
  tags?: string[];
  flags?: CompetitionScheduleDraft["flags"];
  media?: CompetitionScheduleDraft["media"];
  source: CompetitionSourceSnapshot;
  confidence?: CompetitionConfidence;
  qualityIssues?: CompetitionQualityIssue[];
  notes?: string;
}): CompetitionScheduleDraft {
  const createdAt = input.source.fetchedAt;
  const dateConfidence = input.date.confidence;
  const registrationConfidence = input.registration?.confidence ?? "low";
  const locationConfidence = input.location?.confidence ?? "low";
  const fallbackConfidence =
    input.confidence ??
    getOverallEventConfidence({
      hasDate: Boolean(input.date.startsOn),
      hasLocation: hasConcreteLocation(input.location),
      dateConfidence,
      registrationConfidence,
      locationConfidence,
    });
  const sourceEventId = input.source.sourceEventId;

  return {
    id: makeDeterministicId(input.organizationId, sourceEventId, [
      input.title,
      input.date.rawText ?? "",
      input.source.sourceUrl,
    ]),
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    organizationShortName: input.organizationShortName,
    title: input.title,
    seasonYear: input.seasonYear,
    date: input.date,
    registration: {
      status: input.registration?.status ?? "unknown",
      opensAt: input.registration?.opensAt,
      closesAt: input.registration?.closesAt,
      fee: input.registration?.fee,
      registrationUrl: input.registration?.registrationUrl,
      rawText: input.registration?.rawText,
      confidence: registrationConfidence,
    },
    location: {
      country: input.location?.country ?? "KR",
      region: input.location?.region,
      city: input.location?.city,
      venue: input.location?.venue,
      address: input.location?.address,
      rawText: input.location?.rawText,
      confidence: locationConfidence,
    },
    divisions: (input.divisions ?? []).map((division) =>
      normalizeCompetitionDivision(division),
    ),
    tags: uniqueTexts(input.tags ?? []),
    flags: input.flags ?? {},
    media: input.media,
    source: input.source,
    crawlStatus: "sample-collected",
    reviewStatus: "needs-review",
    confidence: fallbackConfidence,
    qualityIssues: input.qualityIssues ?? [],
    notes: input.notes,
    createdAt,
    updatedAt: createdAt,
    normalizedAt: createdAt,
  };
}

export function createSourceSnapshot(input: {
  sourceType: CompetitionSourceType;
  sourceUrl: string;
  detailUrl?: string;
  sourceEventId?: string;
  sourceUpdatedAt?: string;
  fetchedAt: string;
  parserName: string;
  rawHtml?: string;
  rawTitle?: string;
  rawDateText?: string;
  rawLocationText?: string;
  rawRegistrationText?: string;
}): CompetitionSourceSnapshot {
  return {
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    detailUrl: input.detailUrl,
    sourceEventId: input.sourceEventId,
    sourceUpdatedAt: input.sourceUpdatedAt,
    fetchedAt: input.fetchedAt,
    parserName: input.parserName,
    parserVersion: "0.1.0",
    rawHash: input.rawHtml ? rawHash(input.rawHtml) : undefined,
    rawTitle: input.rawTitle,
    rawDateText: input.rawDateText,
    rawLocationText: input.rawLocationText,
    rawRegistrationText: input.rawRegistrationText,
  };
}

export function inferLocation(texts: string[]): Partial<CompetitionLocation> {
  const cleaned = uniqueTexts(texts);
  const rawText = cleaned.join(" ");
  const isUncertainLocation = UNCERTAIN_LOCATION_PATTERN.test(rawText);
  const country = inferCountry(rawText);
  const venue = !isUncertainLocation
    ? cleaned.find((text) => VENUE_PATTERN.test(text))
    : undefined;
  const hint =
    findLocationHint(rawText, VENUE_REGION_HINTS) ??
    findLocationHint(rawText, CITY_REGION_HINTS) ??
    findLocationHint(rawText, METRO_REGION_HINTS) ??
    findLocationHint(rawText, PROVINCE_REGION_HINTS);
  const region = !isUncertainLocation ? hint?.region : undefined;
  const city = !isUncertainLocation ? hint?.city : undefined;

  return {
    country,
    region,
    city,
    venue,
    rawText: rawText || undefined,
    confidence: getLocationConfidence({
      city,
      region,
      venue,
      isUncertainLocation,
    }),
  };
}

function inferCountry(rawText: string): string {
  if (/필리핀|마닐라/i.test(rawText)) {
    return "PH";
  }

  if (/일본|Japan|미사토시|Misato City/i.test(rawText)) {
    return "JP";
  }

  if (/마카오|澳門|Macau|Macao/i.test(rawText)) {
    return "MO";
  }

  return "KR";
}

function findLocationHint(
  rawText: string,
  hints: Array<[RegExp, RegionCityHint]>,
): RegionCityHint | undefined {
  return hints.find(([pattern]) => pattern.test(rawText))?.[1];
}

function getLocationConfidence(input: {
  city?: string;
  region?: string;
  venue?: string;
  isUncertainLocation: boolean;
}): CompetitionConfidence {
  if (input.isUncertainLocation) {
    return "low";
  }

  if (input.city) {
    return "high";
  }

  if (input.region || input.venue) {
    return "medium";
  }

  return "low";
}

export function getLocationAwareEventConfidence(
  hasCoreFields: boolean,
  locationConfidence: CompetitionConfidence | undefined,
): CompetitionConfidence {
  return getOverallEventConfidence({
    hasDate: hasCoreFields,
    hasLocation: hasCoreFields,
    dateConfidence: hasCoreFields ? "high" : "low",
    registrationConfidence: "medium",
    locationConfidence: locationConfidence ?? "low",
  });
}

export function sourceEventIdFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return (
      parsed.searchParams.get("idx") ??
      parsed.searchParams.get("id") ??
      parsed.searchParams.get("index_no") ??
      parsed.searchParams.get("ps_goid") ??
      undefined
    );
  } catch {
    return undefined;
  }
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferDivisionGroup(name: string): CompetitionDivision["group"] {
  if (/(비키니|웰니스|피겨|여자|우먼|womens?)/i.test(name)) {
    return "womens";
  }

  if (/(멘즈|남자|클래식 피지크|보디빌딩|mens?)/i.test(name)) {
    return "mens";
  }

  return "unknown";
}

function hasConcreteLocation(location: Partial<CompetitionLocation> | undefined): boolean {
  if (!location) {
    return false;
  }

  return Boolean(location.rawText || location.address || location.venue || location.city || location.region);
}

function getOverallEventConfidence(input: {
  hasDate: boolean;
  hasLocation: boolean;
  dateConfidence: CompetitionConfidence;
  registrationConfidence: CompetitionConfidence;
  locationConfidence: CompetitionConfidence;
}): CompetitionConfidence {
  if (
    !input.hasDate ||
    !input.hasLocation ||
    input.dateConfidence === "low" ||
    input.locationConfidence === "low"
  ) {
    return "low";
  }

  if (
    input.dateConfidence === "high" &&
    input.locationConfidence === "high" &&
    input.registrationConfidence !== "low"
  ) {
    return "high";
  }

  return "medium";
}
