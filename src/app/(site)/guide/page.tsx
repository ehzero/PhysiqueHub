import { GuideView } from "@/components/GuideView";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "출전 가이드",
  description:
    "첫 출전 준비, 종목별 심사 기준, 단체별 출전 루트를 한 페이지에서 비교하고 URL 앵커로 바로 이동하세요.",
  path: "/guide",
});

export default function GuidePage() {
  return <GuideView />;
}
