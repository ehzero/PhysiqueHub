export type CompetitionOrganizationId =
  | "npc-ifbb-pro-korea"
  | "agp"
  | "kbbf"
  | "nabba-korea"
  | "nac-korea"
  | "agonas"
  | "icn-korea"
  | "musa"
  | "wngp"
  | "bob"
  | "anbc"
  | "pca-korea"
  | "npca-korea"
  | "wnbf-korea"
  | "musclemania"
  | "k-classic"
  | "j-classic"
  | "ssa-korea"
  | "wff-korea"
  | "inba-pnba"
  | "ifbb-pro-league"
  | "monsterzym"
  | "one-classic"
  | "fitschedule"
  | "unknown";

export type CompetitionSourceType =
  | "official-homepage"
  | "official-registration-app"
  | "official-board"
  | "official-social"
  | "aggregator"
  | "manual";

export type CompetitionCrawlStatus =
  | "not-started"
  | "source-confirmed"
  | "parser-implemented"
  | "sample-collected"
  | "reviewed"
  | "excluded";

export type CompetitionReviewStatus =
  | "pending"
  | "needs-review"
  | "approved"
  | "rejected";

export type CompetitionRegistrationStatus =
  | "unknown"
  | "scheduled"
  | "open"
  | "closing-soon"
  | "closed"
  | "cancelled";

export type CompetitionConfidence = "low" | "medium" | "high";

export interface CompetitionMoney {
  currency: "KRW" | "USD" | "JPY" | "UNKNOWN";
  minAmount?: number;
  maxAmount?: number;
  rawText?: string;
}

export interface CompetitionDateRange {
  startsOn?: string;
  endsOn?: string;
  timezone: "Asia/Seoul" | "UTC" | "unknown";
  rawText?: string;
  confidence: CompetitionConfidence;
}

export interface CompetitionRegistrationWindow {
  opensAt?: string;
  closesAt?: string;
  status: CompetitionRegistrationStatus;
  fee?: CompetitionMoney;
  registrationUrl?: string;
  rawText?: string;
  confidence: CompetitionConfidence;
}

export interface CompetitionLocation {
  country: string;
  region?: string;
  city?: string;
  venue?: string;
  address?: string;
  rawText?: string;
  confidence: CompetitionConfidence;
}

export type CompetitionBaseDivision =
  | "bodybuilding"
  | "classic_physique"
  | "mens_physique"
  | "bikini"
  | "wellness"
  | "figure_bodyfitness"
  | "sports_model"
  | "fit_model"
  | "unknown";

export type CompetitionGenderGroup = "mens" | "womens" | "mixed" | "unknown";

export type CompetitionAgeGroup =
  | "middle_school"
  | "high_school"
  | "junior"
  | "university"
  | "open"
  | "masters"
  | "senior"
  | "unknown";

export type CompetitionExperienceClass =
  | "first_timer"
  | "rookie"
  | "novice"
  | "open"
  | "unknown";

export type CompetitionMeasurementClass =
  | "weight"
  | "height"
  | "height_weight_cap"
  | "none"
  | "unknown";

export type CompetitionClassFacet =
  | { type: "age"; value: CompetitionAgeGroup; rawText: string }
  | { type: "experience"; value: CompetitionExperienceClass; rawText: string }
  | { type: "measurement"; value: CompetitionMeasurementClass; rawText: string }
  | { type: "weight"; value: string; rawText: string }
  | { type: "height"; value: string; rawText: string }
  | { type: "height_weight_cap"; value: string; rawText: string }
  | { type: "natural"; value: "natural"; rawText: string }
  | {
      type: "pro";
      value: "pro_qualifier" | "pro_card" | "pro_show";
      rawText: string;
    };

export interface CompetitionDivision {
  rawText?: string;
  name: string;
  baseDivision?: CompetitionBaseDivision;
  genderGroup?: CompetitionGenderGroup;
  group?: CompetitionGenderGroup;
  classText?: string;
  classFacets?: CompetitionClassFacet[];
}

export interface CompetitionSourceSnapshot {
  sourceType: CompetitionSourceType;
  sourceUrl: string;
  canonicalUrl?: string;
  detailUrl?: string;
  sourceEventId?: string;
  sourceUpdatedAt?: string;
  fetchedAt: string;
  parserName?: string;
  parserVersion?: string;
  rawHash?: string;
  rawTitle?: string;
  rawDateText?: string;
  rawLocationText?: string;
  rawRegistrationText?: string;
}

export interface CompetitionQualityIssue {
  field:
    | "title"
    | "date"
    | "registration"
    | "location"
    | "division"
    | "fee"
    | "source"
    | "duplicate"
    | "other";
  severity: "info" | "warning" | "error";
  message: string;
}

export interface CompetitionSchedule {
  id: string;
  organizationId: CompetitionOrganizationId;
  organizationName: string;
  organizationShortName?: string;
  title: string;
  subtitle?: string;
  aliases?: string[];
  seasonYear?: number;
  date: CompetitionDateRange;
  registration: CompetitionRegistrationWindow;
  location: CompetitionLocation;
  divisions: CompetitionDivision[];
  tags: string[];
  flags: {
    natural?: boolean;
    beginnerFriendly?: boolean;
    rookieClass?: boolean;
    proQualifier?: boolean;
    proCard?: boolean;
    proShow?: boolean;
    regional?: boolean;
    championship?: boolean;
    major?: boolean;
    nationalTeamRoute?: boolean;
    nationalTeamEvent?: boolean;
    nationalSportsFestival?: boolean;
    international?: boolean;
    cancelled?: boolean;
  };
  media?: {
    posterImageUrl?: string;
    thumbnailUrl?: string;
    imageSourceUrl?: string;
  };
  source: CompetitionSourceSnapshot;
  crawlStatus: CompetitionCrawlStatus;
  reviewStatus: CompetitionReviewStatus;
  confidence: CompetitionConfidence;
  qualityIssues: CompetitionQualityIssue[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  normalizedAt?: string;
}

export type CompetitionScheduleDraft = Omit<
  CompetitionSchedule,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};
