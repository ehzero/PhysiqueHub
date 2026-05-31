"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article, ArticleBodyBlock } from "@/lib/articles-data";
import { ArticleCard } from "./ArticleCard";
import { ArticleFigure } from "./ArticleFigure";
import { Icons } from "./Icons";
import { ShareButton } from "./ShareButton";

interface ArticleDetailViewProps {
  article: Article;
  relatedArticles: Article[];
}

function BodyBlock({ block }: { block: ArticleBodyBlock }) {
  if (block.t === "h") return <h2 className="rd-body-h2">{block.x}</h2>;
  if (block.t === "quote") return <blockquote className="rd-quote">{block.x}</blockquote>;
  if (block.t === "list" || block.t === "summary" || block.t === "checklist") return (
    <ul className={`rd-body-list rd-body-${block.t}`}>
      {block.items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
  if (block.t === "table") return (
    <div className="rd-table-wrap">
      <table className="rd-table">
        <thead>
          <tr>
            {block.columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {block.columns.map((column, columnIndex) => (
                <td key={`${column}-${columnIndex}`}>{row[columnIndex] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (block.t === "faq") return (
    <div className="rd-faq-list">
      {block.items.map((item) => (
        <details key={item.q} className="rd-faq-item">
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
  if (block.t === "links") return (
    <ul className="rd-body-list rd-link-list">
      {block.items.map((item) => {
        const external = /^https?:\/\//.test(item.href);

        return (
          <li key={`${item.href}-${item.label}`}>
            {external ? (
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <Link href={item.href}>{item.label}</Link>
            )}
            {item.note && <span>{item.note}</span>}
          </li>
        );
      })}
    </ul>
  );
  return <p className="rd-body-p">{block.x}</p>;
}

interface ArticleActionsProps {
  saved: boolean;
  onSave: () => void;
  showLabel?: boolean;
}

function ArticleActions({
  saved,
  onSave,
  showLabel = false,
}: ArticleActionsProps) {
  return (
    <div className={showLabel ? "rd-share" : "rd-byline-actions"}>
      {showLabel && <span className="rd-share-label">공유</span>}
      <button
        className={`icon-btn${saved ? " saved" : ""}`}
        onClick={onSave}
        type="button"
        aria-label={saved ? "저장 해제" : "저장"}
      >
        {saved ? Icons.bookmarkFilled : Icons.bookmark}
      </button>
      <ShareButton iconOnly />
    </div>
  );
}

function ArticleDisclaimer() {
  return (
    <div className="rd-disclaimer">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, color: "var(--ph-warn)", marginTop: 1 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      <span>
        본 콘텐츠는 일반적인 정보 제공을 위한 것으로, 개인별 상태에 따라 적용이
        달라질 수 있습니다. 트레이닝·식이·체중 조절은 전문가와 상담 후
        본인에게 맞게 조정하세요.
      </span>
    </div>
  );
}

function ArticleBody({ article }: { article: Article }) {
  return (
    <article className="read-col rd-body">
      {article.body.map((block, i) => (
        <BodyBlock key={i} block={block} />
      ))}

      <ArticleDisclaimer />
    </article>
  );
}

function RelatedArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="rd-related" aria-labelledby="related-articles-title">
      <h2 id="related-articles-title">이어 읽기</h2>
      <div className="rel-grid">
        {articles.map((item) => (
          <ArticleCard key={item.id} article={item} variant="related" />
        ))}
      </div>
    </section>
  );
}

export function ArticleDetailView({
  article,
  relatedArticles,
}: ArticleDetailViewProps) {
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const initials = article.author.slice(0, 2);

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0;
      setProgress(pct);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleSave = () => setSaved((value) => !value);

  return (
    <>
      {/* Reading progress bar */}
      <div
        className="read-progress"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />

      <main className="container rd-main">
        <nav className="read-col rd-crumb" aria-label="breadcrumb">
          <Link href="/articles">아티클</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <span>{article.cat}</span>
        </nav>

        {/* Header */}
        <header className="read-col rd-head">
          <span className="rd-cat">{article.cat}</span>
          <h1 className="rd-title">{article.title}</h1>
          <p className="rd-dek">{article.dek}</p>
          <div className="rd-byline">
            <span className="rd-avatar">{initials}</span>
            <b>{article.author}</b>
            <span className="rd-dot" />
            <span>{article.date}</span>
            <span className="rd-dot" />
            <span>읽기 {article.read}분</span>
            <ArticleActions
              saved={saved}
              onSave={toggleSave}
            />
          </div>
        </header>

        {/* Cover */}
        <div className="read-col">
          <div className={`rd-cover pt-${article.theme}`}>
            <ArticleFigure
              theme={article.theme}
              fig={article.fig}
              className="rd-cover-fig"
            />
            <div className="rd-cover-wash" />
          </div>
        </div>

        <ArticleBody article={article} />

        <div className="read-col">
          <div className="rd-foot">
            <div className="rd-tags">
              <span className="rd-tag">#{article.cat}</span>
              <span className="rd-tag">#{article.tag}</span>
            </div>
            <ArticleActions
              saved={saved}
              onSave={toggleSave}
              showLabel
            />
          </div>
        </div>

        {/* Back link */}
        <div className="read-col">
          <Link href="/articles" className="rd-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            아티클 목록으로
          </Link>
        </div>

        <RelatedArticles articles={relatedArticles} />
      </main>
    </>
  );
}
