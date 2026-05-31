import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getArticlePath,
} from "@/lib/articles-data";
import { ArticleDetailView } from "@/components/ArticleDetailView";
import {
  getArticleBySlug,
  getArticleStaticParams,
  getRelatedArticles,
} from "@/lib/article-server";
import { createPageMetadata } from "@/lib/metadata";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getArticleStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "아티클 · PhysiqueHub" };
  return createPageMetadata({
    title: article.title,
    description: article.metaDescription ?? article.dek,
    path: getArticlePath(article),
  });
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const relatedArticles = await getRelatedArticles(article);

  return <ArticleDetailView article={article} relatedArticles={relatedArticles} />;
}
