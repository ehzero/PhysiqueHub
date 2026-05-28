import type { Competition } from "@/lib/data";
import { KOREAN_REGION_ORDER } from "@/lib/location";

export type CompetitionLandingAxis =
  | "category"
  | "region"
  | "organization"
  | "type";

export interface CompetitionLandingTaxon {
  axis: CompetitionLandingAxis;
  slug: string;
  label: string;
  shortLabel?: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  filterHref: string;
  keywords: string[];
  organizationIds?: string[];
}

const CATEGORY_TAXONS: CompetitionLandingTaxon[] = [
  {
    axis: "category",
    slug: "bodybuilding",
    label: "보디빌딩",
    title: "보디빌딩 대회 일정",
    description:
      "국내 보디빌딩 대회 일정을 날짜, 지역, 주최 단체별로 확인하고 공식 요강을 비교해보세요.",
    h1: "보디빌딩 대회 일정",
    intro:
      "보디빌딩 예정 대회를 모았습니다. 체급, 필수 포즈, 계측 기준은 단체와 대회별 공식 요강에서 다시 확인하세요.",
    filterHref: "/competitions?q=%EB%B3%B4%EB%94%94%EB%B9%8C%EB%94%A9",
    keywords: ["보디빌딩 대회", "바디빌딩 대회", "bodybuilding"],
  },
  {
    axis: "category",
    slug: "classic-physique",
    label: "클래식 피지크",
    title: "클래식 피지크 대회 일정",
    description:
      "클래식 피지크 대회 일정을 모아 날짜, 지역, 단체별로 비교할 수 있습니다.",
    h1: "클래식 피지크 대회 일정",
    intro:
      "클래식 피지크는 신장·체중 기준과 포징 규정이 대회마다 다를 수 있습니다. 예정 대회를 비교한 뒤 공식 참가요강을 함께 확인하세요.",
    filterHref:
      "/competitions?q=%ED%81%B4%EB%9E%98%EC%8B%9D%20%ED%94%BC%EC%A7%80%ED%81%AC",
    keywords: ["클래식 피지크 대회", "classic physique"],
  },
  {
    axis: "category",
    slug: "mens-physique",
    label: "맨즈 피지크",
    shortLabel: "맨즈 피지크",
    title: "맨즈 피지크 대회 일정",
    description:
      "맨즈 피지크 대회 일정을 모아 지역, 단체, 접수 상태를 비교해보세요.",
    h1: "맨즈 피지크 대회 일정",
    intro:
      "맨즈 피지크 오픈, 노비스, 시니어, 중·고등부, 내추럴 등 세부 부문을 함께 살펴볼 수 있습니다. 세부 출전 자격은 각 대회 공식 요강을 기준으로 확인하세요.",
    filterHref:
      "/competitions?q=%ED%94%BC%EC%A7%80%ED%81%AC",
    keywords: ["맨즈 피지크 대회", "mens physique"],
  },
  {
    axis: "category",
    slug: "sports-model",
    label: "스포츠모델",
    title: "스포츠모델 대회 일정",
    description:
      "스포츠모델·피트니스모델 계열 대회 일정을 날짜와 지역별로 확인하세요.",
    h1: "스포츠모델 대회 일정",
    intro:
      "스포츠모델과 피트니스모델 계열 대회는 단체별 라운드 구성과 복장 기준이 다를 수 있습니다. 예정 일정을 비교하고 공식 안내를 함께 확인하세요.",
    filterHref:
      "/competitions?q=%EC%8A%A4%ED%8F%AC%EC%B8%A0%EB%AA%A8%EB%8D%B8",
    keywords: ["스포츠모델 대회", "피트니스모델", "sports model"],
  },
  {
    axis: "category",
    slug: "bikini",
    label: "비키니",
    title: "비키니 대회 일정",
    description:
      "비키니 대회 일정을 지역, 날짜, 주최 단체별로 비교하고 접수 상태를 확인하세요.",
    h1: "비키니 대회 일정",
    intro:
      "비키니 상위 종목에 해당하는 예정 대회를 모았습니다. 노비스, 오픈, 연령대별 클래스는 대회별 운영 방식이 다르므로 공식 요강을 함께 확인하세요.",
    filterHref: "/competitions?q=%EB%B9%84%ED%82%A4%EB%8B%88",
    keywords: ["비키니 대회", "bikini"],
  },
  {
    axis: "category",
    slug: "wellness",
    label: "웰니스",
    title: "웰니스 대회 일정",
    description:
      "웰니스 대회 일정을 모아 날짜, 지역, 단체별 예정 대회를 비교할 수 있습니다.",
    h1: "웰니스 대회 일정",
    intro:
      "웰니스 종목을 운영하는 예정 대회를 모았습니다. 세부 심사 기준과 복장 규정은 단체별로 다를 수 있어 공식 참가요강 확인이 필요합니다.",
    filterHref: "/competitions?q=%EC%9B%B0%EB%8B%88%EC%8A%A4",
    keywords: ["웰니스 대회", "wellness"],
  },
  {
    axis: "category",
    slug: "figure",
    label: "피규어",
    title: "피규어 대회 일정",
    description:
      "피규어·보디피트니스 계열 대회 일정을 지역과 단체별로 확인하세요.",
    h1: "피규어 대회 일정",
    intro:
      "피규어와 보디피트니스 계열 예정 대회를 모았습니다. 명칭과 심사 기준은 단체마다 다를 수 있으므로 공식 룰북을 함께 확인하세요.",
    filterHref:
      "/competitions?q=%ED%94%BC%EA%B7%9C%EC%96%B4",
    keywords: ["피규어 대회", "피겨 대회", "보디피트니스", "figure"],
  },
  {
    axis: "category",
    slug: "fit-model",
    label: "핏모델",
    title: "핏모델 대회 일정",
    description:
      "핏모델·모노키니 계열 대회 일정을 모아 날짜, 지역, 단체별로 비교하세요.",
    h1: "핏모델 대회 일정",
    intro:
      "핏모델과 모노키니 계열 예정 대회를 모았습니다. 국내 대회 고유 명칭으로 운영되는 경우가 있어 출전 전 공식 종목표를 확인하세요.",
    filterHref:
      "/competitions?q=%ED%95%8F%EB%AA%A8%EB%8D%B8",
    keywords: ["핏모델 대회", "모노키니", "fit model"],
  },
];

const REGION_SLUGS = {
  서울: "seoul",
  부산: "busan",
  대구: "daegu",
  인천: "incheon",
  광주: "gwangju",
  대전: "daejeon",
  울산: "ulsan",
  세종: "sejong",
  경기: "gyeonggi",
  강원: "gangwon",
  충북: "chungbuk",
  충남: "chungnam",
  전북: "jeonbuk",
  전남: "jeonnam",
  경북: "gyeongbuk",
  경남: "gyeongnam",
  제주: "jeju",
} as const;

const REGION_TAXONS: CompetitionLandingTaxon[] = KOREAN_REGION_ORDER.map(
  (region) => ({
    axis: "region",
    slug: REGION_SLUGS[region],
    label: region,
    title: `${region} 보디빌딩 대회 일정`,
    description: `${region}에서 열리는 국내 보디빌딩·피트니스 예정 대회를 날짜, 단체, 종목별로 확인하세요.`,
    h1: `${region} 보디빌딩 대회 일정`,
    intro: `${region} 지역에서 열리는 국내 보디빌딩·피트니스 예정 대회를 모았습니다. 대회장, 접수 일정, 세부 종목은 공식 안내에서 확인하세요.`,
    filterHref: `/competitions?region=${encodeURIComponent(region)}`,
    keywords: [`${region} 보디빌딩 대회`, `${region} 피트니스 대회`],
  }),
);

const ORGANIZATION_TAXONS: CompetitionLandingTaxon[] = [
  {
    axis: "organization",
    slug: "ifbb",
    label: "IFBB Pro · NPC",
    title: "IFBB Pro · NPC 대회 일정",
    description:
      "IFBB Pro와 NPC/NPC Worldwide 계열 대회 일정을 날짜와 지역별로 비교하세요.",
    h1: "IFBB Pro · NPC 보디빌딩·피트니스 대회 일정",
    intro:
      "IFBB Pro와 NPC/NPC Worldwide 계열 대회 일정을 모았습니다. 리저널, 프로 퀄리파이어, 프로전 등 세부 성격은 대회별 공식 요강에서 확인하세요.",
    filterHref: "/competitions?q=IFBB%20Pro",
    keywords: ["IFBB Pro 대회", "NPC 대회", "NPC Worldwide"],
    organizationIds: ["npc-ifbb-pro-korea", "agp", "ifbb-pro-league"],
  },
  {
    axis: "organization",
    slug: "kbbf",
    label: "대한보디빌딩협회",
    shortLabel: "KBBF",
    title: "KBBF 대회 일정",
    description:
      "대한보디빌딩협회(KBBF) 대회 일정을 날짜, 지역, 접수 상태별로 확인하세요.",
    h1: "KBBF 대회 일정",
    intro:
      "대한보디빌딩협회(KBBF) 계열 예정 대회를 모았습니다. 선수 등록, 체급, 국가대표·협회 대회 흐름은 공식 공지 기준으로 확인하세요.",
    filterHref:
      "/competitions?org=%EB%8C%80%ED%95%9C%EB%B3%B4%EB%94%94%EB%B9%8C%EB%94%A9%ED%98%91%ED%9A%8C",
    keywords: ["KBBF 대회", "대한보디빌딩협회"],
    organizationIds: ["kbbf"],
  },
  {
    axis: "organization",
    slug: "nabba",
    label: "NABBA Korea",
    title: "NABBA 대회 일정",
    description:
      "NABBA Korea 대회 일정을 모아 예정 일정과 지역, 종목 정보를 확인하세요.",
    h1: "NABBA 대회 일정",
    intro:
      "NABBA Korea 계열 예정 대회를 모았습니다. 종목 운영과 오버롤, 프로전 연결 구조는 대회별 공식 안내를 확인하세요.",
    filterHref: "/competitions?org=NABBA%20Korea",
    keywords: ["NABBA 대회", "NABBA Korea"],
    organizationIds: ["nabba-korea"],
  },
  {
    axis: "organization",
    slug: "pca",
    label: "PCA / NPCA",
    title: "PCA 대회 일정",
    description:
      "PCA와 NPCA 계열 대회 일정을 날짜, 지역, 접수 상태별로 확인하세요.",
    h1: "PCA 대회 일정",
    intro:
      "PCA와 NPCA 계열 예정 대회를 모았습니다. 세부 클래스와 심사 기준은 대회별 공지에서 확인하세요.",
    filterHref: "/competitions?q=PCA",
    keywords: ["PCA 대회", "NPCA 대회"],
    organizationIds: ["pca-korea", "npca-korea"],
  },
  {
    axis: "organization",
    slug: "wnbf",
    label: "WNBF Korea",
    title: "WNBF 대회 일정",
    description:
      "WNBF Korea 대회 일정을 모아 날짜, 지역, 종목 정보를 확인하세요.",
    h1: "WNBF 대회 일정",
    intro:
      "WNBF Korea 계열 예정 대회를 모았습니다. 내추럴 관련 출전 기준과 검사 방식은 공식 요강에서 중립적으로 확인하세요.",
    filterHref: "/competitions?org=WNBF%20Korea",
    keywords: ["WNBF 대회", "WNBF Korea"],
    organizationIds: ["wnbf-korea"],
  },
  {
    axis: "organization",
    slug: "icn",
    label: "ICN Korea",
    title: "ICN 대회 일정",
    description:
      "ICN Korea 계열 대회 일정을 날짜, 지역, 접수 상태별로 확인하세요.",
    h1: "ICN 대회 일정",
    intro:
      "ICN Korea 계열 예정 대회를 모았습니다. 내추럴 관련 정책과 세부 출전 자격은 공식 안내를 기준으로 확인하세요.",
    filterHref: "/competitions?org=ICN%20Korea",
    keywords: ["ICN 대회", "ICN Korea"],
    organizationIds: ["icn-korea"],
  },
  {
    axis: "organization",
    slug: "musclemania",
    label: "Musclemania",
    title: "Musclemania 대회 일정",
    description:
      "Musclemania 대회 일정을 모아 날짜, 지역, 접수 상태를 확인하세요.",
    h1: "Musclemania 대회 일정",
    intro:
      "Musclemania 계열 예정 대회를 모았습니다. 모델형 라운드와 종목 운영 방식은 대회별 공식 안내를 확인하세요.",
    filterHref: "/competitions?org=Musclemania",
    keywords: ["Musclemania 대회", "머슬마니아"],
    organizationIds: ["musclemania"],
  },
  {
    axis: "organization",
    slug: "one-classic",
    label: "ONE CLASSIC",
    title: "ONE CLASSIC 대회 일정",
    description:
      "ONE CLASSIC 대회 일정을 모아 날짜, 지역, 종목 정보를 확인하세요.",
    h1: "ONE CLASSIC 대회 일정",
    intro:
      "ONE CLASSIC 예정 대회를 모았습니다. 내추럴·오픈 등 세부 운영 방식은 공식 참가요강에서 확인하세요.",
    filterHref: "/competitions?org=ONE%20CLASSIC",
    keywords: ["ONE CLASSIC 대회", "원클래식"],
    organizationIds: ["one-classic"],
  },
];

const TYPE_TAXONS: CompetitionLandingTaxon[] = [
  {
    axis: "type",
    slug: "natural",
    label: "내추럴",
    title: "내추럴 대회 일정",
    description:
      "내추럴 성격의 보디빌딩·피트니스 대회 일정을 모아 비교하세요.",
    h1: "내추럴 대회 일정",
    intro:
      "내추럴 성격의 예정 대회를 모았습니다. 금지 약물 기준, 검사 방식, 출전 자격은 단체와 대회별 공식 안내에서 확인하세요.",
    filterHref: "/competitions?natural=1",
    keywords: ["내추럴 대회", "natural bodybuilding"],
  },
  {
    axis: "type",
    slug: "rookie",
    label: "루키·입문",
    title: "루키 대회 일정",
    description:
      "루키·입문 성격의 보디빌딩·피트니스 대회 일정을 확인하세요.",
    h1: "루키·입문 대회 일정",
    intro:
      "루키, 노비스, 입문 친화 성격의 예정 대회를 모았습니다. 출전 가능 여부는 경력, 입상 이력, 나이 기준 등 대회별 요강에 따라 달라질 수 있습니다.",
    filterHref: "/competitions?beginner=1",
    keywords: ["루키 대회", "노비스 대회", "입문 대회"],
  },
  {
    axis: "type",
    slug: "regional",
    label: "리저널",
    title: "리저널 대회 일정",
    description:
      "리저널 성격의 보디빌딩·피트니스 대회 일정을 날짜와 지역 기준으로 확인하세요.",
    h1: "리저널 대회 일정",
    intro:
      "리저널 성격의 예정 대회를 모았습니다. 상위 대회와의 관계, 출전 조건, 중복 출전 가능 여부는 공식 안내에서 확인하세요.",
    filterHref: "/competitions?tier=regional",
    keywords: ["리저널 대회", "regional"],
  },
  {
    axis: "type",
    slug: "pro-qualifier",
    label: "프로 퀄리파이어",
    title: "프로 퀄리파이어 대회 일정",
    description:
      "프로카드 또는 프로 자격으로 이어지는 퀄리파이어 일정을 모아 비교하세요.",
    h1: "프로 퀄리파이어 대회 일정",
    intro:
      "프로카드 또는 퀄리파이어 성격의 예정 대회를 모았습니다. 실제 자격 부여 방식과 조건은 대회별 공식 요강에서 확인하세요.",
    filterHref: "/competitions?tier=pro_qualifier",
    keywords: ["프로카드 대회", "프로 퀄리파이어"],
  },
  {
    axis: "type",
    slug: "pro-show",
    label: "프로쇼",
    title: "프로쇼 대회 일정",
    description:
      "프로 자격 보유 선수가 출전하는 프로쇼 일정을 확인하세요.",
    h1: "프로쇼 대회 일정",
    intro:
      "프로쇼 성격의 예정 대회를 모았습니다. 출전 자격과 디비전 운영 방식은 대회별 공식 요강에서 확인하세요.",
    filterHref: "/competitions?tier=pro_show",
    keywords: ["프로쇼", "프로 대회"],
  },
  {
    axis: "type",
    slug: "championship",
    label: "챔피언십",
    title: "챔피언십 대회 일정",
    description:
      "월드, 유니버스, 올림피아, 파이널 등 대표급 챔피언십 일정을 확인하세요.",
    h1: "챔피언십 대회 일정",
    intro:
      "단체 대표급 챔피언십 성격의 예정 대회를 모았습니다. 같은 챔피언십 명칭이라도 실제 권위와 출전 조건은 단체별 공식 안내 기준으로 확인하세요.",
    filterHref: "/competitions?tier=championship",
    keywords: ["챔피언십 대회", "월드 대회", "유니버스 대회"],
  },
  {
    axis: "type",
    slug: "global",
    label: "글로벌",
    title: "글로벌 대회 일정",
    description:
      "해외 개최 또는 세계 단위 브랜드와 연결된 글로벌 대회 일정을 확인하세요.",
    h1: "글로벌 대회 일정",
    intro:
      "글로벌 성격의 예정 대회를 모았습니다. 국가대표 선발 루트와는 별개로 해외 개최, 세계 단위 브랜드, 글로벌 단체 일정을 함께 보여줍니다.",
    filterHref: "/competitions?global=1",
    keywords: ["글로벌 대회", "해외 대회"],
  },
  {
    axis: "type",
    slug: "national-selection",
    label: "국가대표 선발",
    title: "국가대표 선발 대회 일정",
    description:
      "국가대표 선발 루트와 관련된 대회 일정을 확인하세요.",
    h1: "국가대표 선발 대회 일정",
    intro:
      "국가대표 선발 루트와 관련된 예정 대회를 모았습니다. 선발 기준과 참가 자격은 공식 공지에서 확인하세요.",
    filterHref: "/competitions?national=1",
    keywords: ["국가대표 선발전", "전국체전", "대표 선발"],
  },
  {
    axis: "type",
    slug: "national-team-event",
    label: "국가대표전",
    title: "국가대표전 대회 일정",
    description:
      "국가대표 또는 협회 대표단이 출전하는 국제·권역 대회 일정을 확인하세요.",
    h1: "국가대표전 대회 일정",
    intro:
      "국가대표 또는 협회 대표단 출전 맥락이 있는 예정 대회를 모았습니다. 실제 파견·선발·참가 자격은 협회 공식 공지에서 확인하세요.",
    filterHref: "/competitions?nationalTeamEvent=1",
    keywords: ["국가대표전", "국가대표 국제대회", "대표팀 대회"],
  },
  {
    axis: "type",
    slug: "national-sports-festival",
    label: "전국체전",
    title: "전국체전 대회 일정",
    description:
      "전국체육대회 본대회와 시도 대표 선발·예선 성격의 일정을 확인하세요.",
    h1: "전국체전 대회 일정",
    intro:
      "전국체육대회 본대회와 시도 대표 선발·예선 맥락의 예정 대회를 모았습니다. 실제 대표 선발 방식과 참가 자격은 시도 협회 및 공식 공지 기준으로 확인하세요.",
    filterHref: "/competitions?nationalSportsFestival=1",
    keywords: ["전국체전", "전국체육대회", "시도 대표 선발"],
  },
];

const TAXON_BY_AXIS = {
  category: CATEGORY_TAXONS,
  region: REGION_TAXONS,
  organization: ORGANIZATION_TAXONS,
  type: TYPE_TAXONS,
} satisfies Record<CompetitionLandingAxis, CompetitionLandingTaxon[]>;

const AXIS_SEGMENTS = {
  category: "categories",
  region: "regions",
  organization: "organizations",
  type: "types",
} satisfies Record<CompetitionLandingAxis, string>;

export function getCompetitionLandingTaxons(axis: CompetitionLandingAxis) {
  return TAXON_BY_AXIS[axis];
}

export function getAllCompetitionLandingTaxons() {
  return [
    ...CATEGORY_TAXONS,
    ...REGION_TAXONS,
    ...ORGANIZATION_TAXONS,
    ...TYPE_TAXONS,
  ];
}

export function getCompetitionLandingTaxon(
  axis: CompetitionLandingAxis,
  slug: string,
) {
  return TAXON_BY_AXIS[axis].find((taxon) => taxon.slug === slug) ?? null;
}

export function getCompetitionLandingPath(taxon: CompetitionLandingTaxon) {
  return `/competitions/${AXIS_SEGMENTS[taxon.axis]}/${taxon.slug}`;
}

export function getCompetitionLandingStaticParams(axis: CompetitionLandingAxis) {
  return TAXON_BY_AXIS[axis].map((taxon) => ({ slug: taxon.slug }));
}

export function getCategoryTaxonForName(name: string) {
  const slug = getCategorySlugForText(name);
  return slug ? getCompetitionLandingTaxon("category", slug) : null;
}

export function getOrganizationTaxonForId(organizationId: string) {
  return (
    ORGANIZATION_TAXONS.find((taxon) =>
      taxon.organizationIds?.includes(organizationId),
    ) ?? null
  );
}

export function getRegionTaxonForName(region: string) {
  return REGION_TAXONS.find((taxon) => taxon.label === region) ?? null;
}

export function getTypeTaxonForKey(key: string) {
  return getCompetitionLandingTaxon("type", key);
}

export function competitionMatchesTaxon(
  competition: Competition,
  taxon: CompetitionLandingTaxon,
) {
  switch (taxon.axis) {
    case "category":
      return getCompetitionCategorySlugs(competition).some(
        (slug) => slug === taxon.slug,
      );
    case "region":
      return competition.region === taxon.label;
    case "organization":
      return Boolean(
        competition.organizationId &&
          taxon.organizationIds?.includes(competition.organizationId),
      );
    case "type":
      return competitionMatchesType(competition, taxon.slug);
  }
}

export function getRelatedCompetitionTaxons(taxon: CompetitionLandingTaxon) {
  const sameAxis = TAXON_BY_AXIS[taxon.axis]
    .filter((item) => item.slug !== taxon.slug)
    .slice(0, 4);

  if (taxon.axis === "category") {
    return [...sameAxis.slice(0, 3), TYPE_TAXONS[0]].filter(Boolean);
  }

  if (taxon.axis === "type") {
    return [...sameAxis.slice(0, 2), CATEGORY_TAXONS[2], CATEGORY_TAXONS[0]].filter(
      Boolean,
    );
  }

  if (taxon.axis === "organization") {
    return [...sameAxis.slice(0, 3), TYPE_TAXONS[3]].filter(Boolean);
  }

  return [...sameAxis.slice(0, 3), CATEGORY_TAXONS[2]].filter(Boolean);
}

export function getCategorySlugForText(value: string) {
  const text = normalizeSearchText(value);

  if (!text) return null;
  if (/클래식\s*피지크|classic\s*physique/.test(text)) return "classic-physique";
  if (/웰니스|wellness/.test(text)) return "wellness";
  if (/비키니|bikini/.test(text)) return "bikini";
  if (/피규어|피겨|figure|보디\s*피트니스|body\s*fitness|bodyfitness/.test(text)) {
    return "figure";
  }
  if (/핏\s*모델|fit\s*model|모노키니|monokini/.test(text)) return "fit-model";
  if (/스포츠\s*모델|피트니스\s*모델|sports?\s*model|fitness\s*model|머슬\s*모델/.test(text)) {
    return "sports-model";
  }
  if (/피지크|physique/.test(text) && !/여자|여성|우먼|women|womens/.test(text)) {
    return "mens-physique";
  }
  if (/보디\s*빌딩|바디\s*빌딩|body\s*building|bodybuilding|212/.test(text)) {
    return "bodybuilding";
  }

  return null;
}

function getCompetitionCategorySlugs(competition: Competition) {
  const values = [
    competition.title,
    ...competition.categories,
    ...competition.tags,
  ];

  return Array.from(
    new Set(
      values
        .map((value) => getCategorySlugForText(value))
        .filter(
          (slug): slug is NonNullable<ReturnType<typeof getCategorySlugForText>> =>
            Boolean(slug),
        ),
    ),
  );
}

function competitionMatchesType(competition: Competition, slug: string) {
  switch (slug) {
    case "natural":
      return competition.natural === true;
    case "rookie":
      return competition.beginner === true || competition.rookie === true;
    case "regional":
      return competition.tier === "regional";
    case "pro-qualifier":
      return competition.tier === "pro_qualifier";
    case "pro-show":
      return competition.tier === "pro_show";
    case "championship":
      return competition.tier === "championship";
    case "global":
      return competition.attributes.global === true;
    case "national-selection":
      return competition.attributes.nationalSelection === true;
    case "national-team-event":
      return competition.attributes.nationalTeamEvent === true;
    case "national-sports-festival":
      return competition.attributes.nationalSportsFestival === true;
    default:
      return false;
  }
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[·_/()[\]{}"'’‘“”:+,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
