import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ARTICLES_CACHE_TAG,
  PUBLIC_DATA_REVALIDATE_SECONDS,
} from "@/lib/public-cache";
import type {
  Article,
  ArticleBodyBlock,
  ArticleTheme,
} from "@/lib/articles-data";

const ARTICLE_THEMES = new Set<ArticleTheme>([
  "amber",
  "deep",
  "sage",
  "navy",
  "rose",
  "lime",
]);

const articleCacheOptions = {
  revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
  tags: [ARTICLES_CACHE_TAG],
};

export interface ArticleListContext {
  featured: Article | null;
  pool: Article[];
  articles: Article[];
}

export interface ArticleSitemapEntry {
  article: Article;
  lastModified?: Date;
}

export const getArticleListContext = cache(async (): Promise<ArticleListContext> => {
  const articles = await getPublishedArticles();
  const featured = articles.find((article) => article.feat) ?? articles[0] ?? null;
  const pool = featured
    ? articles.filter((article) => article.id !== featured.id)
    : articles;

  return {
    featured,
    pool,
    articles,
  };
});

export const getArticleBySlug = cache(async (slug: string) => {
  const articles = await getPublishedArticles();
  const normalizedSlug = decodeURIComponent(slug);

  return articles.find((article) => article.id === normalizedSlug) ?? null;
});

export const getRelatedArticles = cache(async (
  article: Article,
  count = 3,
): Promise<Article[]> => {
  const articles = await getPublishedArticles();

  return articles
    .filter((item) => item.id !== article.id)
    .sort((a, b) => {
      const categoryScore = Number(a.cat !== article.cat) - Number(b.cat !== article.cat);

      if (categoryScore !== 0) {
        return categoryScore;
      }

      return compareArticleDatesDesc(a, b);
    })
    .slice(0, count);
});

export const getArticleStaticParams = cache(async () => {
  const articles = await getPublishedArticles();

  return articles.map((article) => ({ slug: article.id }));
});

export const getArticleSitemapEntries = cache(async (): Promise<ArticleSitemapEntry[]> => {
  const articles = await getPublishedArticles();

  return articles.map((article) => ({
    article,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : undefined,
  }));
});

const getPublishedArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const now = new Date();
    const records = await prisma.article.findMany({
      where: {
        status: "published",
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: now } },
        ],
      },
      orderBy: [
        { isFeatured: "desc" },
        { publishedAt: "desc" },
        { sortOrder: "asc" },
        { title: "asc" },
      ],
    });

    return records.map(serializeArticle);
  },
  ["published-articles"],
  articleCacheOptions,
);

function serializeArticle(record: Awaited<ReturnType<typeof prisma.article.findMany>>[number]): Article {
  const publishedAt = record.publishedAt ?? record.createdAt;

  return {
    id: record.slug,
    cat: record.category,
    tag: record.tag,
    title: record.title,
    dek: record.excerpt,
    author: record.authorName,
    date: formatArticleDate(publishedAt),
    read: record.readMinutes,
    theme: toArticleTheme(record.posterTheme),
    fig: toFigureVariant(record.posterFigure),
    feat: record.isFeatured,
    body: parseBodyBlocks(record.bodyBlocksJson, record.bodyMarkdown),
    publishedAt: record.publishedAt?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function parseBodyBlocks(value: string, fallbackMarkdown: string): ArticleBodyBlock[] {
  const parsed = safeJsonParse(value, []);

  if (Array.isArray(parsed)) {
    const blocks = parsed.flatMap(toBodyBlock);

    if (blocks.length > 0) {
      return blocks;
    }
  }

  return markdownToBodyBlocks(fallbackMarkdown);
}

function toBodyBlock(value: unknown): ArticleBodyBlock[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const block = value as Record<string, unknown>;

  if ((block.t === "p" || block.t === "h" || block.t === "quote") && typeof block.x === "string") {
    return [{ t: block.t, x: block.x }];
  }

  if (block.t === "list" && Array.isArray(block.items)) {
    return [{
      t: "list",
      items: block.items.filter((item): item is string => typeof item === "string"),
    }];
  }

  return [];
}

function markdownToBodyBlocks(value: string): ArticleBodyBlock[] {
  const blocks: ArticleBodyBlock[] = [];
  const lines = value.split(/\r?\n/);
  let paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    const text = paragraph.join(" ").trim();
    paragraph = [];

    if (text) {
      blocks.push({ t: "p", x: text });
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ t: "list", items: listItems });
      listItems = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ t: "h", x: trimmed.slice(3).trim() });
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ t: "quote", x: trimmed.slice(2).trim() });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      listItems.push(trimmed.slice(2).trim());
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks.length > 0 ? blocks : [{ t: "p", x: value }];
}

function safeJsonParse(value: string, fallback: unknown): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toArticleTheme(value: string): ArticleTheme {
  return ARTICLE_THEMES.has(value as ArticleTheme) ? (value as ArticleTheme) : "navy";
}

function toFigureVariant(value: number): number {
  return Number.isInteger(value) && value >= 0 && value <= 5 ? value : 0;
}

function compareArticleDatesDesc(a: Article, b: Article) {
  return getArticleTime(b) - getArticleTime(a);
}

function getArticleTime(article: Article) {
  const value = article.publishedAt ?? article.updatedAt;

  return value ? new Date(value).getTime() : 0;
}

function formatArticleDate(value: Date): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return [year, month, day].filter(Boolean).join(".");
}
