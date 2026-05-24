"use client";

import Link from "next/link";
import { Icons } from "./Icons";

const INK = "#0E0E0C";
const MUTE = "#86827C";

const NAV_LINKS = [
  { label: "홈", href: "/", key: "home" },
  { label: "대회 목록", href: "/competitions", key: "list" },
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
                  prefetch
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
              prefetch={false}
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

      {/* Mobile tabbar */}
      <nav className="mobile-tabbar" aria-label="주요 메뉴">
        <Link
          className={`mobile-tab ${route === "home" ? "active" : ""}`}
          href="/"
          prefetch
        >
          {Icons.home}
          <span>홈</span>
        </Link>
        <Link
          className={`mobile-tab ${["list", "categories", "types", "regions", "organizations"].includes(route) ? "active" : ""}`}
          href="/competitions"
          prefetch
        >
          {Icons.list}
          <span>대회 목록</span>
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
            {Icons.bookmark}
          </span>
          <span>내 대회</span>
        </Link>
      </nav>
    </header>
  );
}
