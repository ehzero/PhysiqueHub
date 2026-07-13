export const SITE_NAME = "피지크허브";
export const SITE_NAME_EN = "PhysiqueHub";
export const SITE_TAGLINE = "2026 피트니스·보디빌딩 대회 일정";
export const SITE_DESCRIPTION =
  "국내 피트니스·보디빌딩 대회 일정을 한곳에서 확인하고, 종목·지역·단체별 탐색과 주요 해외 대회 일정까지 살펴보세요.";
export const SUPPORT_EMAIL = "support@physiquehub.kr";
export const LOOFIT_APP_STORE_URL = "https://apps.apple.com/kr/app/id6789599963";
export const LOOFIT_PROMOTION_ID = "loofit-ios";
export const SHARE_IMAGE_VERSION = "20260525-2";
export const OPEN_GRAPH_IMAGE_PATH = `/share-image?v=${SHARE_IMAGE_VERSION}`;
export const TWITTER_IMAGE_PATH = OPEN_GRAPH_IMAGE_PATH;
export const OPEN_GRAPH_IMAGE_URL = `${getSiteUrl()}${OPEN_GRAPH_IMAGE_PATH}`;
export const TWITTER_IMAGE_URL = OPEN_GRAPH_IMAGE_URL;
export const SHARE_IMAGE_ALT = `${SITE_NAME} 공유 이미지`;

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://physiquehub.kr"
  );
}
