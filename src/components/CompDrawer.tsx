"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getCompetitionPath } from "@/lib/competition-slug";
import {
  getCompetitionDateLabel,
  getCompetitionLocationLabel,
  getCompetitionRegistrationLabel,
} from "@/lib/competition-display";
import { Competition, parseDate, regStatusAt } from "@/lib/data";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import { Icons } from "./Icons";
import { PosterFigure, posterFigureColor } from "./PosterFigure";
import { ShareButton } from "./ShareButton";

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  open:    { label: "접수 중",    color: "#2D7A3E", bg: "rgba(45,122,62,.08)" },
  urgent:  { label: "마감 임박", color: "#B85C3C", bg: "rgba(184,92,60,.10)" },
  soon:    { label: "접수 예정", color: "#54514C", bg: "#F7F5F0" },
  closed:  { label: "마감",      color: "#9C9890", bg: "#F7F5F0" },
  unknown: { label: "확인 필요", color: "#C0A04A", bg: "rgba(192,160,74,.10)" },
};

function posterVariant(id: string): number {
  return Array.from(id).reduce((h, ch) => (h + ch.charCodeAt(0)) % 6, 0);
}

interface CompDrawerProps {
  comp: Competition | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  today: Date | null;
}

export function CompDrawer({
  comp,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  today,
}: CompDrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!comp) {
    return (
      <>
        <div className={`drawer-back ${isOpen ? "open" : ""}`} onClick={onClose} />
        <aside className={`drawer ${isOpen ? "open" : ""}`} />
      </>
    );
  }

  const status = today ? regStatusAt(comp, today) : null;
  const statusInfo = STATUS_INFO[status?.kind ?? "unknown"] ?? STATUS_INFO.unknown;
  const compDate = parseDate(comp.date);
  const daysToComp = today ? Math.round((compDate.getTime() - today.getTime()) / 86_400_000) : null;
  const ddayTxt = daysToComp === null ? "—" : daysToComp > 0 ? `D−${daysToComp}` : daysToComp === 0 ? "D-DAY" : "종료";
  const isUrgent = status?.kind === "urgent";
  const isClosed = status?.kind === "closed";

  const variant = posterVariant(comp.id);
  const theme = comp.poster || "amber";
  const figColor = posterFigureColor(theme);
  const locationLabel = getCompetitionLocationLabel(comp);
  const dateLabel = getCompetitionDateLabel(comp);
  const registrationLabel = getCompetitionRegistrationLabel(comp, today ?? undefined);
  const tierLabel = COMPETITION_TIER_LABELS[comp.tier];
  const dateMonthSub = `${comp.date.slice(5, 7)}월 ${comp.date.slice(8, 10)}일 개최`;
  const actionUrl = comp.registrationUrl || comp.sourceUrl;
  const actionLabel = comp.registrationUrl ? "접수 페이지로 →" : "공식 공지 확인 →";

  return (
    <>
      <div className={`drawer-back ${isOpen ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${isOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="대회 상세">

        {/* Header */}
        <div className="drawer-head">
          <span className="crumb">대회 상세</span>
          <div className="drawer-actions">
            <button
              className={`icon-btn${isSaved ? " saved" : ""}`}
              onClick={() => onToggleSave(comp.id)}
              aria-label={isSaved ? "저장 취소" : "저장"}
              type="button"
            >
              {isSaved ? Icons.bookmarkFilled : Icons.bookmark}
            </button>
            <ShareButton iconOnly path={getCompetitionPath(comp)} />
            <button className="icon-btn" onClick={onClose} aria-label="닫기" type="button">
              {Icons.close}
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="drawer-body">
          {/* Poster */}
          <div className={`drawer-poster poster-${theme}`}>
            <div className="poster-figure">
              <PosterFigure variant={variant} color={figColor} />
            </div>
            <div className="poster-overlay" />
            <div className="label-overlay">
              <div className="ord">● {comp.orgShort} · {comp.date.slice(0, 4)}</div>
              <div className="ttl">{comp.title}</div>
            </div>
          </div>

          {/* Status section */}
          <div className="drawer-section">
            <div className="drawer-section-status">
              <div className="drawer-section-status-left">
                <div
                  className="drawer-status-pill"
                  style={{ background: statusInfo.bg, color: statusInfo.color }}
                >
                  <span className="drawer-status-dot" style={{ background: statusInfo.color }} />
                  <span className="drawer-status-pill-label">{statusInfo.label}</span>
                </div>
                <div className="drawer-section-status-sub">{dateMonthSub}</div>
              </div>
              <div
                className="drawer-dday mono"
                style={{ color: isUrgent ? "#B85C3C" : "#0E0E0C" }}
              >
                {ddayTxt}
              </div>
            </div>
          </div>

          {/* KV info section */}
          <div className="drawer-section">
            <div className="drawer-kv">
              <div className="drawer-kv-label">일정</div>
              <div className="drawer-kv-value">{dateLabel}</div>
              <div className="drawer-kv-label">장소</div>
              <div className="drawer-kv-value">{locationLabel}</div>
              <div className="drawer-kv-label">주최</div>
              <div className="drawer-kv-value">{comp.org}</div>
              <div className="drawer-kv-label">유형</div>
              <div className="drawer-kv-value">{tierLabel}</div>
              <div className="drawer-kv-label">접수 기간</div>
              <div className="drawer-kv-value drawer-kv-value--mono">
                {registrationLabel}
              </div>
            </div>
          </div>

          {/* Categories */}
          {comp.categories.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-cats-head">
                진행 종목 · {comp.categories.length}개
              </div>
              <div className="drawer-cats">
                {comp.categories.map((c) => (
                  <span key={c} className="drawer-cat">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer note */}
          <div className="drawer-section" style={{ borderBottom: 0 }}>
            <div className="drawer-note">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <span>
                표시된 일정·접수 정보는 참고용입니다. 정확한 내용은 단체·주최측 공식 공지를 확인하세요.
              </span>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="drawer-actions-row">
          <Link
            href={getCompetitionPath(comp)}
            className="cta-ghost"
            onClick={onClose}
            prefetch={false}
          >
            상세 페이지
          </Link>
          <a
            className={`cta-btn accent${isClosed ? " disabled" : ""}`}
            href={isClosed ? undefined : (actionUrl || undefined)}
            target={actionUrl && !isClosed ? "_blank" : undefined}
            rel={actionUrl && !isClosed ? "noreferrer noopener" : undefined}
            aria-disabled={isClosed}
          >
            {isClosed ? "접수 마감" : actionLabel}
          </a>
        </div>
      </aside>
    </>
  );
}
