"use client";

import Link from "next/link";
import { Icons } from "./Icons";

interface NavProps {
  route: string;
  savedCount: number;
  onOpenContact: () => void;
}

export function Nav({ route, savedCount, onOpenContact }: NavProps) {
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
    </header>
  );
}
