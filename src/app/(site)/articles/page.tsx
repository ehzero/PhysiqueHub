import { ArticleListView } from "@/components/ArticleListView";
import { getArticleListContext } from "@/lib/article-server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "보디빌딩 아티클",
  description:
    "현장 대회 리포트부터 종목별 트레이닝·컨디셔닝·영양 가이드, 선수 인터뷰까지. 무대를 준비하는 데 필요한 깊이 있는 글을 모았습니다.",
  path: "/articles",
});

export default async function ArticlesPage() {
  const { featured, pool } = await getArticleListContext();

  return <ArticleListView featured={featured} pool={pool} />;
}
