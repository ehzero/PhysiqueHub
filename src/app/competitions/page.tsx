import { PhysiqueHubPage } from "@/app/PhysiqueHubPage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "대회 목록",
  description:
    "국내 보디빌딩·피트니스 대회 일정을 주최 단체, 카테고리, 접수 상태별로 탐색해보세요.",
  path: "/competitions",
});

export default function CompetitionsPage() {
  return <PhysiqueHubPage initialRoute="list" />;
}
