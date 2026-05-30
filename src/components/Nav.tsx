"use client";

import Link from "next/link";
import { Icons } from "./Icons";

const INK = "#0E0E0C";
const MUTE = "#86827C";

const NAV_LINKS = [
  { label: "홈", href: "/", key: "home" },
  { label: "대회 목록", href: "/competitions", key: "list" },
  { label: "가이드", href: "/guide", key: "guide" },
];

interface NavProps {
  route: string;
  savedCount: number;
  onOpenContact: () => void;
}

export function Nav({ route, savedCount, onOpenContact }: NavProps) {
  const savedLabel = savedCount > 0 ? `내 대회 (${savedCount})` : "내 대회";

  return (
    <header className="nav">
      {/* Desktop nav */}
      <div className="container nav-container">
        <div className="nav-desktop">
          <div className="nav-left">
            <Link href="/" className="nav-brand" prefetch={false}>
              <span className="nav-brand-logo">P</span>
              <span className="nav-brand-name">PhysiqueHub</span>
            </Link>
            <nav className="nav-links">
              {NAV_LINKS.map(({ label, href, key }) => (
                <Link
                  key={key}
                  href={href}
                  className="nav-link-item"
                  prefetch={href === "/competitions"}
                  style={{
                    fontWeight: route === key ? 600 : 500,
                    color: route === key ? INK : MUTE,
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="nav-right">
            <button
              className="nav-contact-btn"
              type="button"
              onClick={onOpenContact}
            >
              {Icons.contact}
              <span>문의</span>
            </button>
            <Link
              href="/competitions"
              className="nav-contact-btn"
              prefetch
            >
              {Icons.search}
              <span>대회 검색</span>
            </Link>
            <Link
              href="/saved"
              className="nav-cta-btn"
              aria-label={savedLabel}
              prefetch
            >
              {savedLabel}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile tabbar — 4 tabs: 홈 · 대회 목록 · 가이드 · 내 대회 (문의는 헤더 아이콘으로) */}
      <nav className="mobile-tabbar" aria-label="주요 메뉴">
        <Link
          className={`mobile-tab ${route === "home" ? "active" : ""}`}
          href="/"
          prefetch
        >
          <svg className="mt-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/>
          </svg>
          <span>홈</span>
        </Link>
        <Link
          className={`mobile-tab ${["list", "categories", "types", "regions", "organizations"].includes(route) ? "active" : ""}`}
          href="/competitions"
          prefetch
        >
          <svg className="mt-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>
          </svg>
          <span>대회 목록</span>
        </Link>
        <Link
          className={`mobile-tab ${route === "guide" ? "active" : ""}`}
          href="/guide"
          prefetch={false}
        >
          <svg className="mt-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>가이드</span>
        </Link>
        <Link
          className={`mobile-tab ${route === "saved" ? "active" : ""}`}
          href="/saved"
          aria-label={savedLabel}
          prefetch
        >
          <span className="mobile-tab-icon-wrap">
            {savedCount > 0 && (
              <span className="mobile-tab-badge mono">{savedCount}</span>
            )}
            <svg className="mt-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span>내 대회</span>
        </Link>
      </nav>
    </header>
  );
}
