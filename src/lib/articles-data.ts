export type ArticleTheme = "amber" | "deep" | "sage" | "navy" | "rose" | "lime";

export type ArticleBodyBlock =
  | { t: "p"; x: string }
  | { t: "h"; x: string }
  | { t: "quote"; x: string }
  | { t: "list"; items: string[] }
  | { t: "summary"; items: string[] }
  | { t: "checklist"; items: string[] }
  | { t: "table"; columns: string[]; rows: string[][] }
  | { t: "faq"; items: { q: string; a: string }[] }
  | { t: "links"; items: { label: string; href: string; note?: string }[] };

export interface Article {
  id: string;
  cat: string;
  tag: string;
  title: string;
  dek: string;
  metaDescription?: string;
  author: string;
  date: string;
  read: number;
  theme: ArticleTheme;
  /** SVG figure variant index 0-5 */
  fig: number;
  feat?: boolean;
  body: ArticleBodyBlock[];
  publishedAt?: string;
  updatedAt?: string;
}

export const ARTICLE_CATS = ["전체", "가이드", "대회 결과", "트레이닝", "영양", "인터뷰"] as const;
export type ArticleCat = (typeof ARTICLE_CATS)[number];

export function getArticlePath(article: Pick<Article, "id">): string {
  return `/articles/${encodeURIComponent(article.id)}`;
}

/** Returns the stroke color for a given poster theme (for SVG figures) */
export function articleFigStroke(theme: ArticleTheme): string {
  return theme === "deep" || theme === "navy" || theme === "rose"
    ? "rgba(255,255,255,0.40)"
    : "rgba(0,0,0,0.30)";
}
