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
