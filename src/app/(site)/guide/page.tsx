import { GuideView } from "@/components/GuideView";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "종목별·단체별 출전 가이드",
  description:
    "보디빌딩·피트니스 대회 선택에 필요한 종목별 심사 기준과 단체별 출전 루트를 한 페이지에서 비교하세요.",
  path: "/guide",
});

export default function GuidePage() {
  return <GuideView />;
}
