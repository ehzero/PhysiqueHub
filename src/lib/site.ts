export const SITE_NAME = "PhysiqueHub";
export const SITE_TAGLINE = "보디빌딩·피트니스 대회 일정을 한눈에";
export const SITE_DESCRIPTION =
  "국내 보디빌딩·피트니스 대회 일정, 접수 기간, 지역, 종목 정보를 탐색하고 비교할 수 있는 대회 일정 허브입니다.";
export const SUPPORT_EMAIL = "help@physiquehub.kr";

export const SITE_NAV_LINKS = [
  { href: "/", label: "홈" },
  { href: "/about", label: "서비스 소개" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보 처리방침" },
] as const;

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://physiquehub.kr"
  );
}
