export interface Competition {
  id: string;
  title: string;
  org: string;
  orgShort: string;
  date: string;
  regOpen: string;
  regClose: string;
  region: string;
  venue: string;
  categories: string[];
  classes: string;
  fee: number;
  natural: boolean;
  beginner: boolean;
  rookie: boolean;
  scale: "대형" | "중형" | "소형";
  poster: "amber" | "deep" | "sage" | "navy" | "rose" | "lime";
  tags: string[];
  desc: string;
  historyYears: number;
  instagram: string;
}

export interface RegStatus {
  label: string;
  short: string;
  kind: "open" | "urgent" | "closed" | "soon";
}

const now = new Date();
export const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const COMPETITIONS: Competition[] = [
  {
    id: "c01",
    title: "스프링 오픈 챔피언십",
    org: "IFBB Korea",
    orgShort: "IFBB",
    date: "2026-06-06",
    regOpen: "2026-04-01",
    regClose: "2026-05-30",
    region: "서울",
    venue: "올림픽공원 SK핸드볼경기장",
    categories: ["남자 피지크", "클래식 피지크", "보디빌딩", "비키니", "스포츠모델"],
    classes: "신장별 5체급",
    fee: 130000,
    natural: false,
    beginner: true,
    rookie: true,
    scale: "대형",
    poster: "amber",
    tags: ["입문자 환영", "5종목"],
    desc: "수도권 최대 규모의 시즌 오픈전. 종목 구성이 다양해 입문자부터 상급자까지 참여 가능.",
    historyYears: 12,
    instagram: "@ifbb_korea",
  },
  {
    id: "c02",
    title: "NABBA 코리아 그랑프리",
    org: "NABBA Korea",
    orgShort: "NABBA",
    date: "2026-06-20",
    regOpen: "2026-04-15",
    regClose: "2026-06-10",
    region: "부산",
    venue: "벡스코 제2전시장",
    categories: ["보디빌딩", "남자 피지크", "비키니", "퍼포먼스", "마스터즈"],
    classes: "체급별 4체급",
    fee: 150000,
    natural: false,
    beginner: false,
    rookie: false,
    scale: "대형",
    poster: "deep",
    tags: ["글로벌 퀄리파이어", "상급자 비중 높음"],
    desc: "NABBA 월드 본선 진출권이 걸린 국내 최상위 무대.",
    historyYears: 8,
    instagram: "@nabba_korea",
  },
  {
    id: "c03",
    title: "WNBF 내추럴 클래식",
    org: "WNBF Korea",
    orgShort: "WNBF",
    date: "2026-07-04",
    regOpen: "2026-05-01",
    regClose: "2026-06-25",
    region: "인천",
    venue: "송도컨벤시아",
    categories: ["내추럴 보디빌딩", "내추럴 피지크", "비키니"],
    classes: "신장별 3체급",
    fee: 120000,
    natural: true,
    beginner: true,
    rookie: true,
    scale: "중형",
    poster: "sage",
    tags: ["100% 내추럴", "도핑테스트"],
    desc: "WNBF 공인 내추럴 대회. 약물검사 의무.",
    historyYears: 6,
    instagram: "@wnbf_korea",
  },
  {
    id: "c04",
    title: "KBBF 전국선수권대회",
    org: "대한보디빌딩협회",
    orgShort: "KBBF",
    date: "2026-07-18",
    regOpen: "2026-05-10",
    regClose: "2026-07-01",
    region: "대전",
    venue: "충무체육관",
    categories: ["보디빌딩", "클래식 피지크", "남자 피지크", "여자 피지크", "비키니"],
    classes: "체급별 7체급",
    fee: 100000,
    natural: false,
    beginner: false,
    rookie: false,
    scale: "대형",
    poster: "navy",
    tags: ["국가대표 선발전", "공식 협회전"],
    desc: "대한보디빌딩협회 주관 국가대표 선발전.",
    historyYears: 24,
    instagram: "@kbbf_official",
  },
  {
    id: "c05",
    title: "WFF 코리아 오픈",
    org: "WFF Korea",
    orgShort: "WFF",
    date: "2026-08-08",
    regOpen: "2026-06-01",
    regClose: "2026-07-30",
    region: "서울",
    venue: "장충체육관",
    categories: ["피트니스 모델", "스포츠모델", "비키니", "퍼포먼스"],
    classes: "신장별 4체급",
    fee: 140000,
    natural: false,
    beginner: true,
    rookie: true,
    scale: "중형",
    poster: "rose",
    tags: ["모델 종목 특화", "여성 친화적"],
    desc: "피트니스 모델 종목 비중이 높은 무대. 첫 출전자 비율 약 40%.",
    historyYears: 5,
    instagram: "@wff_korea",
  },
  {
    id: "c06",
    title: "GNC 루키 챌린지",
    org: "PCA Korea",
    orgShort: "PCA",
    date: "2026-06-13",
    regOpen: "2026-04-20",
    regClose: "2026-06-05",
    region: "경기",
    venue: "수원컨벤션센터",
    categories: ["남자 피지크", "비키니", "스포츠모델"],
    classes: "오픈 + 루키 분리",
    fee: 90000,
    natural: false,
    beginner: true,
    rookie: true,
    scale: "중형",
    poster: "lime",
    tags: ["루키 전용 부문", "첫 무대 추천"],
    desc: "출전 경력 1년 미만 선수만 참가하는 루키 부문이 별도 운영됨.",
    historyYears: 3,
    instagram: "@pca_korea",
  },
  {
    id: "c07",
    title: "이스트코스트 클래식",
    org: "IFBB Korea",
    orgShort: "IFBB",
    date: "2026-08-22",
    regOpen: "2026-06-15",
    regClose: "2026-08-10",
    region: "강원",
    venue: "강릉아레나",
    categories: ["클래식 피지크", "보디빌딩", "남자 피지크"],
    classes: "신장별 4체급",
    fee: 130000,
    natural: false,
    beginner: false,
    rookie: false,
    scale: "중형",
    poster: "amber",
    tags: ["클래식 특화"],
    desc: "황금기 스타일 클래식 피지크에 비중을 둔 무대.",
    historyYears: 7,
    instagram: "@ifbb_korea",
  },
  {
    id: "c08",
    title: "사우스 코스트 인비테이셔널",
    org: "NABBA Korea",
    orgShort: "NABBA",
    date: "2026-09-05",
    regOpen: "2026-07-01",
    regClose: "2026-08-25",
    region: "부산",
    venue: "사직실내체육관",
    categories: ["보디빌딩", "퍼포먼스", "비키니"],
    classes: "체급별 3체급",
    fee: 160000,
    natural: false,
    beginner: false,
    rookie: false,
    scale: "중형",
    poster: "deep",
    tags: ["초청전", "프로카드 1장"],
    desc: "프로카드 1장이 걸린 인비테이셔널.",
    historyYears: 4,
    instagram: "@nabba_korea",
  },
  {
    id: "c09",
    title: "제주 내추럴 챔피언십",
    org: "WNBF Korea",
    orgShort: "WNBF",
    date: "2026-09-19",
    regOpen: "2026-07-10",
    regClose: "2026-09-05",
    region: "제주",
    venue: "제주국제컨벤션센터",
    categories: ["내추럴 보디빌딩", "내추럴 피지크", "비키니", "스포츠모델"],
    classes: "신장별 3체급",
    fee: 110000,
    natural: true,
    beginner: true,
    rookie: false,
    scale: "중형",
    poster: "sage",
    tags: ["내추럴", "휴양지"],
    desc: "제주에서 열리는 내추럴 시즌 마감전.",
    historyYears: 4,
    instagram: "@wnbf_korea",
  },
  {
    id: "c10",
    title: "오토엄 그랜드 챔피언십",
    org: "대한보디빌딩협회",
    orgShort: "KBBF",
    date: "2026-10-10",
    regOpen: "2026-08-01",
    regClose: "2026-09-25",
    region: "광주",
    venue: "염주체육관",
    categories: ["보디빌딩", "클래식 피지크", "피지크", "비키니", "여자 피지크"],
    classes: "체급별 6체급",
    fee: 100000,
    natural: false,
    beginner: false,
    rookie: false,
    scale: "대형",
    poster: "navy",
    tags: ["전국대회"],
    desc: "하반기 협회 주관 전국대회.",
    historyYears: 18,
    instagram: "@kbbf_official",
  },
  {
    id: "c11",
    title: "퍼시픽 모델 컵",
    org: "WFF Korea",
    orgShort: "WFF",
    date: "2026-10-24",
    regOpen: "2026-08-20",
    regClose: "2026-10-10",
    region: "서울",
    venue: "잠실학생체육관",
    categories: ["피트니스 모델", "비키니", "스포츠모델"],
    classes: "신장별 5체급",
    fee: 140000,
    natural: false,
    beginner: true,
    rookie: true,
    scale: "중형",
    poster: "rose",
    tags: ["모델 전문", "초보 환영"],
    desc: "비키니/모델 종목에 특화된 가을 무대.",
    historyYears: 4,
    instagram: "@wff_korea",
  },
  {
    id: "c12",
    title: "윈터 락 클래식",
    org: "PCA Korea",
    orgShort: "PCA",
    date: "2026-11-14",
    regOpen: "2026-09-01",
    regClose: "2026-11-01",
    region: "대구",
    venue: "엑스코",
    categories: ["보디빌딩", "남자 피지크", "비키니"],
    classes: "오픈",
    fee: 95000,
    natural: false,
    beginner: true,
    rookie: true,
    scale: "중형",
    poster: "lime",
    tags: ["루키 부문"],
    desc: "시즌 마감 직전 열리는 캐주얼 무대.",
    historyYears: 2,
    instagram: "@pca_korea",
  },
  {
    id: "c13",
    title: "사이드 체스트 컵",
    org: "IFBB Korea",
    orgShort: "IFBB",
    date: "2026-05-30",
    regOpen: "2026-03-15",
    regClose: "2026-05-20",
    region: "서울",
    venue: "SETEC 컨벤션홀",
    categories: ["보디빌딩", "클래식 피지크"],
    classes: "신장별 3체급",
    fee: 120000,
    natural: false,
    beginner: false,
    rookie: false,
    scale: "소형",
    poster: "amber",
    tags: ["접수 마감 임박"],
    desc: "프로카드 도전자 위주의 소규모 정예전.",
    historyYears: 6,
    instagram: "@ifbb_korea",
  },
  {
    id: "c14",
    title: "퍼스트 스테이지 트로피",
    org: "PCA Korea",
    orgShort: "PCA",
    date: "2026-06-27",
    regOpen: "2026-04-25",
    regClose: "2026-06-15",
    region: "경기",
    venue: "고양체육관",
    categories: ["남자 피지크", "비키니", "스포츠모델", "주니어"],
    classes: "오픈 + 루키 + 주니어",
    fee: 85000,
    natural: false,
    beginner: true,
    rookie: true,
    scale: "소형",
    poster: "lime",
    tags: ["첫 출전 추천", "주니어 부문"],
    desc: "첫 무대 데뷔에 가장 자주 추천되는 입문자 전용 대회.",
    historyYears: 3,
    instagram: "@pca_korea",
  },
  {
    id: "c15",
    title: "코리아 마스터즈 오픈",
    org: "NABBA Korea",
    orgShort: "NABBA",
    date: "2026-07-25",
    regOpen: "2026-05-20",
    regClose: "2026-07-15",
    region: "충북",
    venue: "청주체육관",
    categories: ["마스터즈 보디빌딩", "마스터즈 피지크", "마스터즈 비키니"],
    classes: "40+ / 50+ / 60+",
    fee: 130000,
    natural: false,
    beginner: false,
    rookie: false,
    scale: "중형",
    poster: "deep",
    tags: ["마스터즈 전용"],
    desc: "40세 이상 선수 전용 무대.",
    historyYears: 5,
    instagram: "@nabba_korea",
  },
];

export interface CategoryGuide {
  key: string;
  level: string;
  desc: string;
}

export const CATEGORY_GUIDE: CategoryGuide[] = [
  { key: "남자 피지크", level: "입문 친화", desc: "보드숏 착용. 상체 볼륨과 라인 강조. 입문자가 가장 많이 선택하는 종목." },
  { key: "클래식 피지크", level: "중급", desc: "황금기 스타일 비율. 체급 + 신장 기준. 포징이 까다로움." },
  { key: "보디빌딩", level: "상급", desc: "최대 근육량과 컨디션. 풀 포징 루틴 필수." },
  { key: "비키니", level: "입문 친화", desc: "여성 종목. 워킹·포즈 4종. 자연스러운 근육 라인." },
  { key: "스포츠모델", level: "입문 친화", desc: "수트 워킹 + 비치웨어. 모델 무대 가까운 종목." },
  { key: "클래식 보디빌딩", level: "상급", desc: "신장 + 체중 비율 제한이 있는 보디빌딩." },
];

export const REGIONS = ["서울", "경기", "인천", "강원", "충북", "대전", "대구", "부산", "광주", "제주"];
export const CATEGORIES_ALL = [
  "보디빌딩", "클래식 피지크", "남자 피지크", "여자 피지크", "비키니",
  "스포츠모델", "피트니스 모델", "퍼포먼스", "마스터즈", "주니어",
  "내추럴 보디빌딩", "내추럴 피지크",
];
export const ORGS_ALL = ["IFBB Korea", "NABBA Korea", "WNBF Korea", "WFF Korea", "대한보디빌딩협회", "PCA Korea"];

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

export function dday(dateStr: string): number {
  return daysBetween(TODAY, dateStr);
}

export function regStatus(c: Competition): RegStatus {
  const dOpen = daysBetween(TODAY, c.regOpen);
  const dClose = daysBetween(TODAY, c.regClose);
  if (dOpen > 0) return { label: "접수 예정", short: `D-${dOpen}`, kind: "soon" };
  if (dClose < 0) return { label: "접수 마감", short: "마감", kind: "closed" };
  if (dClose <= 7) return { label: "마감 임박", short: `D-${dClose}`, kind: "urgent" };
  return { label: "접수 중", short: `D-${dClose}`, kind: "open" };
}

export function fmtDate(s: string, opts: { style?: "long" | "mono" } = {}): string {
  const d = parseDate(s);
  if (opts.style === "long")
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  if (opts.style === "mono")
    return `${d.getMonth() + 1}월 ${String(d.getDate()).padStart(2, "0")}일`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function posterFigureColor(theme: string): string {
  if (theme === "deep" || theme === "navy" || theme === "rose") return "rgba(255,255,255,0.85)";
  return "rgba(0,0,0,0.85)";
}
