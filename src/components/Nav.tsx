"use client";

import Link from "next/link";
import { Icons } from "./Icons";

interface NavProps {
  route: string;
  setRoute: (r: string) => void;
  savedCount: number;
  onOpenContact: () => void;
}

export function Nav({ route, setRoute, savedCount, onOpenContact }: NavProps) {
  return (
    <header className="nav">
      <div className="container">
        <div className="nav-row">
          <Link className="brand" href="/" onClick={() => setRoute("home")}>
            <span className="brand-mark" />
            <span>피지크 허브</span>
          </Link>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-tagline">
            보디빌딩·피트니스 대회 일정을 한눈에
          </span>
          <nav className="nav-menu">
            <Link
              className={`nav-link ${route === "home" ? "active" : ""}`}
              href="/"
              onClick={() => setRoute("home")}
            >
              홈
            </Link>
            <Link
              className={`nav-link ${route === "list" ? "active" : ""}`}
              href="/competitions"
              onClick={() => setRoute("list")}
            >
              대회 목록
            </Link>
            <Link
              className={`nav-link ${route === "guide" ? "active" : ""}`}
              href="/guide"
              onClick={() => setRoute("guide")}
            >
              종목 가이드
            </Link>
            <Link
              className={`nav-link ${route === "saved" ? "active" : ""}`}
              href="/saved"
              onClick={() => setRoute("saved")}
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
              onClick={() => setRoute("list")}
            >
              {Icons.search}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
