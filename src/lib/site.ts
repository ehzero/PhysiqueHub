export const SITE_NAME = "PhysiqueHub";
export const SITE_TAGLINE = "국내 보디빌딩·피트니스 대회 일정을 한눈에.";
export const SITE_DESCRIPTION =
  "국내 대회를 중심으로, 주요 단체의 보디빌딩·피트니스 대회 일정을 한곳에 모았습니다. 종목·유형·지역·단체별로 빠르게 탐색하고, Mr. Olympia와 Arnold Classic 등 주요 해외 무대 일정도 함께 확인할 수 있습니다.";
export const SUPPORT_EMAIL = "support@physiquehub.kr";
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
