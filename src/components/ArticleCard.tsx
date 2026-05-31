import Link from "next/link";
import type { Article } from "@/lib/articles-data";
import { getArticlePath } from "@/lib/articles-data";
import { ArticleFigure } from "./ArticleFigure";

type ArticleCardVariant = "grid" | "related";

interface ArticleCardProps {
  article: Article;
  variant?: ArticleCardVariant;
}

export function ArticleCard({ article, variant = "grid" }: ArticleCardProps) {
  if (variant === "related") {
    return (
      <Link href={getArticlePath(article)} className="rel-card ph-lift-card">
        <div className={`rel-media pt-${article.theme}`}>
          <span className="rel-cat">{article.cat}</span>
          <ArticleFigure theme={article.theme} fig={article.fig} className="rel-fig" />
          <div className="rd-cover-wash" />
        </div>
        <div className="rel-body">
          <h3 className="rel-title">{article.title}</h3>
          <div className="rel-meta">
            {article.author} · {article.read}분
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={getArticlePath(article)} className="ar-card ph-lift-card">
      <div className={`ar-card-media pt-${article.theme}`}>
        <span className="ar-card-cat">{article.cat}</span>
        <ArticleFigure
          theme={article.theme}
          fig={article.fig}
          className="ar-card-fig"
        />
        <div className="ar-feat-wash" />
      </div>
      <div className="ar-card-body">
        <h3 className="ar-card-title">{article.title}</h3>
        <p className="ar-card-dek">{article.dek}</p>
        <div className="ar-card-foot">
          <b>{article.author}</b>
          <span className="dot" />
          <span>{article.date}</span>
          <span className="dot" />
          <span>{article.read}분</span>
        </div>
      </div>
    </Link>
  );
}
