export interface Competition {
  id: string;
  title: string;
  org: string;
  orgShort: string;
  date: string;
  dateEnd?: string;
  regOpen: string;
  regClose: string;
  registrationStatus?: string;
  registrationUrl?: string;
  sourceUrl?: string;
  updatedAt?: string;
  region: string;
  venue: string;
  categories: string[];
  classes: string;
  fee: number;
  natural: boolean;
  beginner: boolean;
  rookie: boolean;
  regional?: boolean;
  proPath?: boolean;
  internationalRoute?: boolean;
  scale: "대형" | "중형" | "소형";
  poster: "amber" | "deep" | "sage" | "navy" | "rose" | "lime";
  tags: string[];
  desc: string;
  historyYears: number;
  instagram: string;
}

interface RegStatus {
  label: string;
  short: string;
  kind: "open" | "urgent" | "closed" | "soon" | "unknown";
}

interface CategoryGuide {
  key: string;
  desc: string;
  scope: string;
  organizations: string;
  judgingPoints: string[];
  checkpoints: string[];
  caution: string;
}

export const CATEGORY_GUIDE: CategoryGuide[] = [
  {
    key: "보디빌딩",
    scope: "Men's Bodybuilding / Women's Bodybuilding",
    desc: "근육량, 컨디셔닝, 대칭성, 포징 완성도를 가장 강하게 보는 전통 종목입니다.",
    organizations: "IFBB Pro/NPC, IFBB International, KBBF, NABBA, WNBF, OCB 등",
    judgingPoints: [
      "전신 근육량과 부위별 완성도",
      "체지방·수분 조절로 드러나는 컨디셔닝",
      "좌우 균형, 상하체 밸런스, 필수 포즈 수행력",
    ],
    checkpoints: [
      "체급, 계측 방식, 필수 포즈는 단체별 룰북을 확인",
      "KBBF·IFBB International 축과 NPC·IFBB Pro League 축의 여성 종목 운영 차이 확인",
    ],
    caution: "Novice, Junior, Masters는 보통 종목이 아니라 경력·연령 클래스입니다.",
  },
  {
    key: "클래식 피지크",
    scope: "Classic Physique",
    desc: "보디빌딩보다 고전적 비율과 라인을 강조하며, 신장 대비 체중 제한을 두는 경우가 많습니다.",
    organizations: "IFBB Pro/NPC, NPC Worldwide, IFBB International, PCA, SSA 등",
    judgingPoints: [
      "넓은 어깨, 좁은 허리, 균형 잡힌 하체",
      "과도한 매스보다 미적 비율과 라인",
      "클래식 포즈와 무대 표현의 정확성",
    ],
    checkpoints: [
      "신장별 체중 제한과 계측 시점",
      "복장, 허용 포즈, 오버롤 산정 방식",
    ],
    caution: "Classic Bodybuilding과 이름이 비슷하지만 같은 종목으로 처리되지 않을 수 있습니다.",
  },
  {
    key: "클래식 보디빌딩",
    scope: "Classic Bodybuilding",
    desc: "보디빌딩의 근육 완성도를 보되, 신장·체중 비율을 통해 과도한 매스를 제한하는 종목입니다.",
    organizations: "IFBB International, KBBF, NABBA, PCA 등",
    judgingPoints: [
      "보디빌딩에 가까운 근육 선명도와 밀도",
      "신장 대비 체중 기준 안에서 만드는 균형",
      "정면·측면·후면 포즈의 전체 실루엣",
    ],
    checkpoints: [
      "대회별 신장·체중 공식과 계측 허용 오차",
      "Classic Physique와 중복 출전 가능 여부",
    ],
    caution: "국내 민간 대회에서는 명칭과 기준이 단체별로 달라 접수 페이지 기준 확인이 필요합니다.",
  },
  {
    key: "남자 피지크",
    scope: "Men's Physique",
    desc: "보드숏을 착용하고 상체 라인, 어깨-허리 비율, 자연스러운 무대 표현을 평가합니다.",
    organizations: "IFBB Pro/NPC, NPC Worldwide, PCA, WBFF, SSA, ICN 등",
    judgingPoints: [
      "V 테이퍼와 상체 비율",
      "과하지 않은 근육량과 깔끔한 컨디셔닝",
      "워킹, 전환, 표정 등 무대 매너",
    ],
    checkpoints: [
      "보드숏 규정과 문양·길이 제한",
      "단체가 모델성을 더 보는지, 근육·컨디셔닝을 더 보는지 확인",
    ],
    caution: "입문자가 많이 선택하지만 단체에 따라 요구 컨디션과 포징 난도는 크게 달라집니다.",
  },
  {
    key: "스포츠모델 / 피트니스모델",
    scope: "Sports Model / Fitness Model / Runway Model",
    desc: "피트니스 체형에 워킹, 스타일링, 무대 표현을 결합한 모델형 종목입니다.",
    organizations: "WBFF, WFF, PCA, NABBA Korea, SSA/K-Classic 등",
    judgingPoints: [
      "균형 잡힌 피트니스 체형",
      "수트·비치웨어·테마웨어 등 라운드별 표현력",
      "런웨이, 자신감, 시장성에 가까운 이미지 완성도",
    ],
    checkpoints: [
      "라운드 구성과 복장 변경 여부",
      "보디빌딩형 심사인지 패션·엔터테인먼트형 심사인지 확인",
    ],
    caution: "Bodybuilding 계열 종목이라기보다 모델형 피트니스에 가까운 경우가 많습니다.",
  },
  {
    key: "비키니",
    scope: "Bikini",
    desc: "여성 피트니스 대회에서 가장 대중적인 모델형 피지크 종목으로, 균형과 자연스러운 라인을 봅니다.",
    organizations: "IFBB Pro/NPC, IFBB International, PCA, WBFF, ICN 등",
    judgingPoints: [
      "과하지 않은 근육 톤과 전체 비율",
      "둔근·하체 라인과 상체 균형",
      "워킹, 포즈 전환, 무대 프레젠테이션",
    ],
    checkpoints: [
      "힐, 비키니 컷, 액세서리 규정",
      "단체별 허용 근육량과 컨디셔닝 수위",
    ],
    caution: "같은 Bikini라도 NPC, IFBB International, 민간 대회 기준이 1:1로 대응되지는 않습니다.",
  },
  {
    key: "웰니스",
    scope: "Wellness",
    desc: "비키니보다 하체 발달과 곡선미를 더 강하게 보는 여성 피지크 종목입니다.",
    organizations: "IFBB Pro/NPC, IFBB International, PCA, WBFF 등",
    judgingPoints: [
      "둔근, 대퇴부, 하체 볼륨",
      "상체와 하체의 의도적인 비율 차이",
      "여성 피지크 특유의 라인과 무대 표현",
    ],
    checkpoints: [
      "Bikini와의 체형 기준 차이",
      "대회가 Wellness를 별도 종목으로 운영하는지 확인",
    ],
    caution: "하체가 강조되지만 보디빌딩식 극단적 컨디셔닝을 요구하는 종목은 아닙니다.",
  },
  {
    key: "피규어 / 보디피트니스",
    scope: "Figure / Bodyfitness",
    desc: "여성 종목 중 비키니보다 근육 톤과 대칭성을 더 강조하며, 보디빌딩보다는 완화된 기준을 적용합니다.",
    organizations: "IFBB Pro/NPC, IFBB International, KBBF, WNBF 등",
    judgingPoints: [
      "어깨-허리-하체의 X 프레임",
      "근육 톤, 선명도, 좌우 대칭",
      "정면·측면·후면 쿼터턴의 정확성",
    ],
    checkpoints: [
      "Figure와 Bodyfitness 명칭의 단체별 대응 관계",
      "루틴 유무와 포즈 제한",
    ],
    caution: "IFBB International/KBBF의 Bodyfitness와 NPC Figure는 비슷해 보여도 룰북상 완전한 동의어가 아닐 수 있습니다.",
  },
  {
    key: "핏모델 / 모노키니",
    scope: "Fit Model / Monokini",
    desc: "피트니스 모델형 라인, 복장 완성도, 무대 표현을 보는 종목으로 국내 민간 대회에서 자주 등장합니다.",
    organizations: "IFBB International 일부, SSA/K-Classic, 국내 민간 대회 등",
    judgingPoints: [
      "슬림하고 정돈된 피트니스 실루엣",
      "복장과 스타일링의 무대 적합성",
      "워킹, 포즈, 표정의 안정감",
    ],
    checkpoints: [
      "국제 표준 종목명인지 국내 대회 고유 명칭인지 확인",
      "비키니·스포츠모델과 중복 출전 가능 여부",
    ],
    caution: "Monokini는 국제 표준보다 국내 민간 대회 명칭으로 쓰이는 경우가 많습니다.",
  },
];

export interface Filters {
  regions?: string[];
  orgs?: string[];
  cats?: string[];
  status?: string[];
  beginner?: boolean;
  natural?: boolean;
  savedOnly?: boolean;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(a: Date | string, b: string): number {
  const ms = parseDate(b).getTime() - (a instanceof Date ? a : parseDate(a)).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function ddayAt(dateStr: string, today: Date): number {
  return daysBetween(today, dateStr);
}

export function formatDday(days: number): string {
  if (days === 0) return "D-Day";
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export function regStatusAt(c: Competition, today: Date): RegStatus {
  if (c.registrationStatus === "closed" || c.registrationStatus === "cancelled") {
    return { label: "접수 마감", short: "마감", kind: "closed" };
  }
  if (c.registrationStatus === "scheduled") {
    return { label: "접수 예정", short: "예정", kind: "soon" };
  }
  if (c.registrationStatus === "unknown" && c.regClose === c.date) {
    if (ddayAt(c.date, today) <= 0) {
      return { label: "접수 마감", short: "마감", kind: "closed" };
    }
    return { label: "확인 필요", short: "확인", kind: "unknown" };
  }

  const dOpen = daysBetween(today, c.regOpen);
  const dClose = daysBetween(today, c.regClose);
  if (dOpen > 0) return { label: "접수 예정", short: formatDday(dOpen), kind: "soon" };
  if (dClose < 0) return { label: "접수 마감", short: "마감", kind: "closed" };
  if (dClose <= 7) return { label: "마감 임박", short: formatDday(dClose), kind: "urgent" };
  return { label: "접수 중", short: formatDday(dClose), kind: "open" };
}

export function fmtDate(s: string, opts: { style?: "long" | "mono" } = {}): string {
  const d = parseDate(s);
  if (opts.style === "long")
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  if (opts.style === "mono")
    return `${d.getMonth() + 1}월 ${String(d.getDate()).padStart(2, "0")}일`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
