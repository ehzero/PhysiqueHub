"use client";

import { useState } from "react";
import Link from "next/link";
import { ARTICLE_CATS, getArticlePath } from "@/lib/articles-data";
import type { Article, ArticleCat } from "@/lib/articles-data";
import { ArticleCard } from "./ArticleCard";
import { ArticleFigure } from "./ArticleFigure";
import { EmptyState, PageMain } from "./PageLayout";
import { ActionButton, SegmentButton, StickyControlBar } from "./UIPrimitives";

const PAGE_SIZE = 6;

interface ArticleListViewProps {
  featured: Article | null;
  pool: Article[];
}

export function ArticleListView({ featured, pool }: ArticleListViewProps) {
  const [activeCat, setActiveCat] = useState<ArticleCat>("전체");
  const [shown, setShown] = useState(PAGE_SIZE);

  const filtered =
    activeCat === "전체" ? pool : pool.filter((article) => article.cat === activeCat);
  const slice = filtered.slice(0, shown);
  const hasMore = shown < filtered.length;

  function handleCatChange(cat: ArticleCat) {
    setActiveCat(cat);
    setShown(PAGE_SIZE);
  }

  return (
    <PageMain className="articles-page">
      <section className="page-head ar-head">
        <div className="container">
          <div className="page-head-row">
            <div>
              <span className="hub-eyebrow ar-eyebrow">아티클 · Read</span>
              <h1 className="page-title ar-title">
                대회 결과와 트레이닝,{" "}
                <span className="ar-title-accent">읽을거리.</span>
              </h1>
              <p className="page-subtitle ar-sub">
                현장 대회 리포트부터 종목별 트레이닝·컨디셔닝·영양 가이드,
                선수 인터뷰까지. 무대를 준비하는 데 필요한 깊이 있는 글을 모았습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {featured && (
        <section className="container" aria-labelledby="featured-article-title">
          <article>
            <Link
              href={getArticlePath(featured)}
              className="ar-featured ph-lift-card"
              aria-labelledby="featured-article-title"
            >
              <div className={`ar-feat-media pt-${featured.theme}`}>
                <span className="ar-feat-badge">★ 이번 주 추천</span>
                <ArticleFigure
                  theme={featured.theme}
                  fig={featured.fig}
                  className="ar-feat-fig"
                />
                <div className="ar-feat-wash" />
              </div>
              <div className="ar-feat-body">
                <div className="ar-feat-cat">{featured.cat}</div>
                <h2 id="featured-article-title" className="ar-feat-title">
                  {featured.title}
                </h2>
                <p className="ar-feat-dek">{featured.dek}</p>
                <div className="ar-meta">
                  <b>{featured.author}</b>
                  <span className="dot" />
                  <span>{featured.date}</span>
                  <span className="dot" />
                  <span>읽기 {featured.read}분</span>
                </div>
              </div>
            </Link>
          </article>
        </section>
      )}

      <StickyControlBar
        className="ar-tabs"
        containerClassName="container ar-tabs-row"
        role="navigation"
        aria-label="아티클 카테고리"
      >
        {ARTICLE_CATS.map((cat) => {
          const count =
            cat === "전체"
              ? pool.length
              : pool.filter((a) => a.cat === cat).length;
          return (
            <SegmentButton
              key={cat}
              active={activeCat === cat}
              className="ar-tab"
              onClick={() => handleCatChange(cat)}
              aria-pressed={activeCat === cat}
              variant="neutral"
            >
              {cat}
              <span className="ar-tab-cnt mono">{count}</span>
            </SegmentButton>
          );
        })}
      </StickyControlBar>

      <section className="container" aria-label="아티클 목록">
        {slice.length === 0 ? (
          <div className="ar-empty">
            <EmptyState
              eyebrow="Articles"
              title="해당 카테고리의 아티클이 아직 없습니다."
              description="다른 카테고리를 선택해보세요."
            />
          </div>
        ) : (
          <div className="ar-grid">
            {slice.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="ar-more">
            <ActionButton
              onClick={() => setShown((n) => n + PAGE_SIZE)}
              variant="outline"
            >
              더 많은 아티클 보기
            </ActionButton>
          </div>
        )}
      </section>
    </PageMain>
  );
}
