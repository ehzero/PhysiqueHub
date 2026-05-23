"use client";

import Link from "next/link";
import { Icons } from "./Icons";
import { ShareButton } from "./ShareButton";

interface NavProps {
  route: string;
  savedCount: number;
  onOpenContact: () => void;
}

export function Nav({ route, savedCount, onOpenContact }: NavProps) {
  const savedLabel = savedCount > 0 ? `내 대회 ${savedCount}` : "내 대회";

  return (
    <header className="nav">
      <div className="container">
        <div className="nav-row">
          <Link className="brand" href="/">
            <span>피지크 허브</span>
          </Link>
          <span className="nav-divider" aria-hidden="true" />
          <span className="brand-tagline">
            보디빌딩·피트니스 대회 일정을 한눈에
          </span>
          <nav className="nav-menu">
            <Link
              className={`nav-link ${route === "home" ? "active" : ""}`}
              href="/"
            >
              홈
            </Link>
            <Link
              className={`nav-link ${route === "list" ? "active" : ""}`}
              href="/competitions"
            >
              대회 목록
            </Link>
            <Link
              className={`nav-link ${route === "guide" ? "active" : ""}`}
              href="/guide"
            >
              종목 가이드
            </Link>
            <Link
              className={`nav-link ${route === "saved" ? "active" : ""}`}
              href="/saved"
            >
              내 대회{" "}
              {savedCount > 0 && (
                <span
                  className="mono"
                  style={{ marginLeft: 4, color: "var(--accent)" }}
                >
                  ({savedCount})
                </span>
              )}
            </Link>
          </nav>
          <span className="nav-divider" aria-hidden="true" />
          <div className="nav-actions">
            <ShareButton
              iconOnly
              text="보디빌딩·피트니스 대회 일정을 한눈에 확인하세요."
              title="PhysiqueHub"
            />
            <button
              className="icon-btn"
              aria-label="문의"
              onClick={onOpenContact}
            >
              {Icons.contact}
            </button>
            <Link
              className={`icon-btn ${route === "list" ? "active" : ""}`}
              aria-label="대회 검색"
              href="/competitions"
            >
              {Icons.search}
            </Link>
          </div>
        </div>
      </div>
      <nav className="mobile-tabbar" aria-label="주요 메뉴">
        <Link
          className={`mobile-tab ${route === "home" ? "active" : ""}`}
          href="/"
        >
          {Icons.home}
          <span>홈</span>
        </Link>
        <Link
          className={`mobile-tab ${route === "list" ? "active" : ""}`}
          href="/competitions"
        >
          {Icons.list}
          <span>대회</span>
        </Link>
        <Link
          className={`mobile-tab ${route === "guide" ? "active" : ""}`}
          href="/guide"
        >
          {Icons.book}
          <span>가이드</span>
        </Link>
        <Link
          className={`mobile-tab ${route === "saved" ? "active" : ""}`}
          href="/saved"
          aria-label={savedLabel}
        >
          <span className="mobile-tab-icon-wrap">
            {savedCount > 0 && (
              <span className="mobile-tab-badge mono">{savedCount}</span>
            )}
            {Icons.bookmark}
          </span>
          <span>내 대회</span>
        </Link>
      </nav>
    </header>
  );
}
