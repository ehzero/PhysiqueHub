"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
import { StatusPill } from "./UIPrimitives";

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  open:    { label: "접수 중",    color: "var(--ph-success)", bg: "var(--ph-success-bg)" },
  urgent:  { label: "마감 임박", color: "var(--ph-accent)", bg: "var(--ph-accent-soft)" },
  soon:    { label: "접수 예정", color: "var(--ph-ink-3)", bg: "var(--ph-sub)" },
  closed:  { label: "마감",      color: "var(--ph-ink-5)", bg: "var(--ph-sub)" },
  unknown: { label: "확인 필요", color: "var(--ph-warn)", bg: "var(--ph-warn-bg)" },
};

const SWIPE_INTENT_PX = 6;
const SWIPE_CLOSE_PX = 56;
const SWIPE_FAST_CLOSE_PX = 24;
const SWIPE_FAST_VELOCITY = 0.45;

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

function statusVars(info: { color: string; bg: string }): CSSVars {
  return {
    "--status-color": info.color,
    "--status-bg": info.bg,
  };
}

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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<"idle" | "pending" | "dragging" | "cancelled">("idle");
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragLastXRef = useRef(0);
  const dragLastTimeRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const dragVelocityRef = useRef(0);

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

  const resetDrag = () => {
    dragStateRef.current = "idle";
    dragOffsetRef.current = 0;
    dragVelocityRef.current = 0;
    dragLastXRef.current = 0;
    dragLastTimeRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  const closeDrawer = () => {
    resetDrag();
    onClose();
  };

  const isMobileDrawerGesture = () =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches;

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 720px)").matches) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (dragStateRef.current === "idle" || dragStateRef.current === "cancelled") return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - dragStartXRef.current;
      const deltaY = Math.abs(touch.clientY - dragStartYRef.current);
      const hasHorizontalIntent = deltaX > 4 && deltaX >= deltaY * 0.35;

      if (dragStateRef.current === "dragging" || hasHorizontalIntent) {
        if (event.cancelable) event.preventDefault();
      }
    };

    drawer.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => drawer.removeEventListener("touchmove", handleTouchMove);
  }, [isOpen]);

  const handleDragStart = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isOpen || !isMobileDrawerGesture()) return;
    if ((event.target as HTMLElement).closest("button,a,input,textarea,select")) return;

    dragStateRef.current = "pending";
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragLastXRef.current = event.clientX;
    dragLastTimeRef.current = event.timeStamp;
    dragOffsetRef.current = 0;
    dragVelocityRef.current = 0;
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStateRef.current === "idle" || dragStateRef.current === "cancelled") return;

    const deltaX = event.clientX - dragStartXRef.current;
    const deltaY = Math.abs(event.clientY - dragStartYRef.current);
    const absDeltaX = Math.abs(deltaX);
    const hasHorizontalIntent = deltaX > 4 && deltaX >= deltaY * 0.35;

    if (hasHorizontalIntent) event.preventDefault();

    if (dragStateRef.current === "pending") {
      if (deltaY > 28 && deltaY > absDeltaX * 1.9) {
        dragStateRef.current = "cancelled";
        return;
      }
      if (deltaX < SWIPE_INTENT_PX || deltaX < deltaY * 0.45) return;

      dragStateRef.current = "dragging";
      setIsDragging(true);
    }

    event.preventDefault();
    const elapsed = Math.max(1, event.timeStamp - dragLastTimeRef.current);
    dragVelocityRef.current = (event.clientX - dragLastXRef.current) / elapsed;
    dragLastXRef.current = event.clientX;
    dragLastTimeRef.current = event.timeStamp;

    const nextOffset = Math.max(0, deltaX);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const shouldCloseFromDrag = () => {
    const velocity = Math.max(0, dragVelocityRef.current);

    return (
      dragOffsetRef.current > SWIPE_CLOSE_PX ||
      (dragOffsetRef.current > SWIPE_FAST_CLOSE_PX && velocity > SWIPE_FAST_VELOCITY)
    );
  };

  const handleDragEnd = () => {
    if (dragStateRef.current === "dragging" && shouldCloseFromDrag()) {
      resetDrag();
      onClose();
      return;
    }

    resetDrag();
  };

  const handleDragCancel = () => {
    if (dragStateRef.current === "dragging" && shouldCloseFromDrag()) {
      resetDrag();
      onClose();
      return;
    }

    resetDrag();
  };

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
      <div className={`drawer-back ${isOpen ? "open" : ""}`} onClick={closeDrawer} />
      <aside
        className={`drawer ${isOpen ? "open" : ""}${isOpen && isDragging ? " is-dragging" : ""}`}
        style={isOpen && dragOffset > 0 ? { transform: `translateX(${dragOffset}px)` } : undefined}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="대회 상세"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragCancel}
      >

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
            <button className="icon-btn" onClick={closeDrawer} aria-label="닫기" type="button">
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
                <StatusPill
                  className="drawer-status-pill"
                  dotClassName="drawer-status-dot"
                  label={statusInfo.label}
                  labelClassName="drawer-status-pill-label"
                  style={statusVars(statusInfo)}
                />
                <div className="drawer-section-status-sub">{dateMonthSub}</div>
              </div>
              <div
                className={`drawer-dday mono${isUrgent ? " is-urgent" : ""}`}
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
          <div className="drawer-section is-last">
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
            onClick={closeDrawer}
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
