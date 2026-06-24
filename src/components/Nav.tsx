"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Icons } from "./Icons";
import { VisitorStatsBadge } from "./VisitorStatsBadge";

const NAV_LINKS = [
  { label: "홈", href: "/", key: "home" },
  { label: "대회 일정", href: "/competitions", key: "list" },
  { label: "가이드", href: "/guide", key: "guide" },
  { label: "아티클", href: "/articles", key: "articles" },
];

type ThemePreference = "dark" | "light";

const THEME_STORAGE_KEY = "ph-theme";
interface NavProps {
  route: string;
  savedCount: number;
  onOpenContact: () => void;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "dark" || value === "light";
}

function applyThemePreference(theme: ThemePreference) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

function readThemePreference(): ThemePreference {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function getServerThemePreference(): ThemePreference {
  return "light";
}

function subscribeThemePreference(onStoreChange: () => void) {
  if (typeof document === "undefined") return () => {};

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY || !isThemePreference(event.newValue)) return;
    applyThemePreference(event.newValue);
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", handleStorage);
  };
}

function useTheme() {
  const theme = useSyncExternalStore(
    subscribeThemePreference,
    readThemePreference,
    getServerThemePreference,
  );

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    applyThemePreference(next);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      document.cookie = `${THEME_STORAGE_KEY}=${next};path=/;max-age=31536000;SameSite=Lax`;
    } catch { /* noop */ }
  }, [theme]);

  return { isDark: theme === "dark", toggle };
}

export function Nav({ route, savedCount, onOpenContact }: NavProps) {
  const savedLabel = savedCount > 0 ? `내 대회 (${savedCount})` : "내 대회";
  const { isDark, toggle } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreRoute = route === "guide" || route === "articles";
  const closeMore = useCallback(() => setMoreOpen(false), []);

  useEffect(() => {
    if (!moreOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moreOpen]);

  const openContactFromMore = () => {
    setMoreOpen(false);
    onOpenContact();
  };

  return (
    <header className="nav">
      {/* Desktop nav */}
      <div className="container nav-container">
        <div className="nav-desktop">
          <div className="nav-left">
            <Link href="/" className="nav-brand" prefetch={false}>
              <span className="nav-brand-logo">P</span>
              <span className="nav-brand-name">피지크허브</span>
            </Link>
            <nav className="nav-links">
              {NAV_LINKS.map(({ label, href, key }) => (
                <Link
                  key={key}
                  href={href}
                  className={`nav-link-item${route === key ? " is-active" : ""}`}
                  prefetch={href === "/competitions"}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="nav-right">
            <VisitorStatsBadge />
            <button
              className="nav-contact-btn nav-theme-btn"
              type="button"
              onClick={toggle}
              aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              title={isDark ? "라이트 모드" : "다크 모드"}
            >
              <span className="theme-sun">{Icons.sun}</span>
              <span className="theme-moon">{Icons.moon}</span>
            </button>
            <button
              className="nav-contact-btn nav-contact-action"
              type="button"
              onClick={onOpenContact}
            >
              {Icons.contact}
              <span>문의</span>
            </button>
            <Link
              href="/competitions"
              className="nav-contact-btn nav-search-action"
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

      <div
        className={`mobile-more-backdrop${moreOpen ? " is-open" : ""}`}
        onClick={closeMore}
        aria-hidden="true"
      />
      <div
        className={`mobile-more-sheet${moreOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="더보기 메뉴"
      >
        <div className="mobile-more-grip" aria-hidden="true" />
        <div className="mobile-more-head">
          <div>
            <div className="mobile-more-eyebrow">MORE</div>
            <div className="mobile-more-title">더보기</div>
          </div>
          <button
            className="mobile-more-close"
            type="button"
            onClick={closeMore}
            aria-label="더보기 닫기"
          >
            {Icons.close}
          </button>
        </div>
        <div className="mobile-more-list">
          <Link
            className="mobile-more-item"
            href="/guide"
            onClick={closeMore}
            prefetch={false}
          >
            <span className="mobile-more-icon">{Icons.book}</span>
            <span className="mobile-more-copy">
              <span>가이드</span>
              <small>종목·단체·첫 대회 준비</small>
            </span>
            <span className="mobile-more-arrow">{Icons.arrow}</span>
          </Link>
          <Link
            className="mobile-more-item"
            href="/articles"
            onClick={closeMore}
            prefetch={false}
          >
            <span className="mobile-more-icon">{Icons.article}</span>
            <span className="mobile-more-copy">
              <span>아티클</span>
              <small>대회 준비와 시즌 읽을거리</small>
            </span>
            <span className="mobile-more-arrow">{Icons.arrow}</span>
          </Link>
          <button
            className="mobile-more-item"
            type="button"
            onClick={openContactFromMore}
          >
            <span className="mobile-more-icon">{Icons.contact}</span>
            <span className="mobile-more-copy">
              <span>문의하기</span>
              <small>대회 등록·정정·광고 문의</small>
            </span>
            <span className="mobile-more-arrow">{Icons.arrow}</span>
          </button>
          <button
            className="mobile-more-item"
            type="button"
            onClick={toggle}
          >
            <span className="mobile-more-icon">
              {isDark ? Icons.sun : Icons.moon}
            </span>
            <span className="mobile-more-copy">
              <span>{isDark ? "라이트 모드" : "다크 모드"}</span>
              <small>화면 테마 변경</small>
            </span>
            <span className="mobile-more-state">{isDark ? "Dark" : "Light"}</span>
          </button>
        </div>
      </div>

      {/* Mobile tabbar — 핵심 이동 + 더보기 */}
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
          <span>대회 일정</span>
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
        <button
          className={`mobile-tab ${isMoreRoute ? "active" : ""}${moreOpen ? " is-open" : ""}`}
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-label="더보기 메뉴"
          aria-expanded={moreOpen}
        >
          <span className="mt-ico mobile-tab-more-icon">{Icons.more}</span>
          <span>더보기</span>
        </button>
      </nav>
    </header>
  );
}
