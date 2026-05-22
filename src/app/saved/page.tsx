import { PhysiqueHubPage } from "@/app/PhysiqueHubPage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "내 대회",
  description:
    "관심 있는 보디빌딩·피트니스 대회를 저장하고 시즌 일정을 관리하세요.",
  path: "/saved",
});

export default function SavedPage() {
  return <PhysiqueHubPage initialRoute="saved" />;
}
