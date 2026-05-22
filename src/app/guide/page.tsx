import { PhysiqueHubPage } from "@/app/PhysiqueHubPage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "종목 가이드",
  description:
    "보디빌딩, 클래식 피지크, 피지크, 비키니, 스포츠모델 등 피트니스 대회 종목의 차이를 한눈에 비교해보세요.",
  path: "/guide",
});

export default function GuidePage() {
  return <PhysiqueHubPage initialRoute="guide" />;
}
