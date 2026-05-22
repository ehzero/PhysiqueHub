"use client";

import { useEffect } from "react";
import { Competition, parseDate, regStatus, daysBetween, fmtDate, TODAY } from "@/lib/data";
import { Icons } from "./Icons";
import { PosterFigure, posterFigureColor } from "./PosterFigure";

const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

interface CompDrawerProps {
  comp: Competition | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

export function CompDrawer({ comp, isOpen, onClose, isSaved, onToggleSave }: CompDrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!comp) {
    return (
      <>
        <div className={`drawer-back ${isOpen ? "open" : ""}`} onClick={onClose} />
        <aside className={`drawer ${isOpen ? "open" : ""}`} />
      </>
    );
  }

  const status = regStatus(comp);
  const compDate = parseDate(comp.date);
  const ddComp = Math.round((compDate.getTime() - TODAY.getTime()) / 86400000);
  const ddClose = daysBetween(TODAY, comp.regClose);
  const variant = comp.id.charCodeAt(2) % 6;

  return (
    <>
      <div className={`drawer-back ${isOpen ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <span className="crumb">대회 상세 · {comp.orgShort}</span>
          <div className="drawer-actions">
            <button
              className="icon-btn"
              onClick={() => onToggleSave(comp.id)}
              aria-label="save"
            >
              {isSaved ? Icons.bookmarkFilled : Icons.bookmark}
            </button>
            <button className="icon-btn" aria-label="share">{Icons.share}</button>
            <button className="icon-btn" onClick={onClose} aria-label="close">{Icons.close}</button>
          </div>
        </div>

        <div className={`drawer-poster poster-${comp.poster}`}>
          <div className="poster-figure">
            <PosterFigure variant={variant} color={posterFigureColor(comp.poster)} />
          </div>
          <div className="label-overlay">
            <div className="ord">{comp.org} · {comp.region}</div>
            <div className="ttl">{comp.title}</div>
          </div>
        </div>

        <div className="drawer-body">
          <div className="drawer-status-bar">
            <div className="cell">
              <div className="lbl">대회일</div>
              <div className="val">D{ddComp >= 0 ? "-" : "+"}{Math.abs(ddComp)}</div>
            </div>
            <div className={`cell ${status.kind === "urgent" ? "urgent" : ""}`}>
              <div className="lbl">접수 마감</div>
              <div className="val">{ddClose >= 0 ? `D-${ddClose}` : "마감"}</div>
            </div>
            <div className="cell">
              <div className="lbl">참가비</div>
              <div className="val">{(comp.fee / 10000).toFixed(0)}만원</div>
            </div>
            <div className="cell">
              <div className="lbl">참가 가능</div>
              <div className="val" style={{ fontSize: 14 }}>
                {comp.beginner ? "초보 환영" : "경력자"}
              </div>
            </div>
          </div>

          <p className="drawer-desc">{comp.desc}</p>

          <dl className="kv-grid">
            <dt>개최일</dt>
            <dd>
              {fmtDate(comp.date, { style: "long" })} ({DAYS_KO[parseDate(comp.date).getDay()]}요일)
            </dd>

            <dt>접수 기간</dt>
            <dd>
              {fmtDate(comp.regOpen, { style: "long" })} → {fmtDate(comp.regClose, { style: "long" })}
            </dd>

            <dt>장소</dt>
            <dd>{comp.venue}, {comp.region}</dd>

            <dt>주최</dt>
            <dd>{comp.org}</dd>

            <dt>종목</dt>
            <dd>
              <div className="cat-pill-row">
                {comp.categories.map((c, i) => (
                  <span key={i} className="cat-pill">{c}</span>
                ))}
              </div>
            </dd>

            <dt>체급 구분</dt>
            <dd>{comp.classes}</dd>

            <dt>참가비</dt>
            <dd className="mono">₩ {comp.fee.toLocaleString()}</dd>

            <dt>대회 이력</dt>
            <dd>
              {comp.historyYears}회 개최 · {comp.scale} 규모 ·{" "}
              {comp.natural ? "내추럴 도핑테스트 있음" : "오픈"}
            </dd>

            <dt>특징</dt>
            <dd>
              <div className="cat-pill-row">
                {comp.tags.map((t, i) => (
                  <span
                    key={i}
                    className="cat-pill"
                    style={{ background: "var(--bg)", borderColor: "var(--ink)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </dd>

            <dt>공식 채널</dt>
            <dd>
              <a
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  borderBottom: "1px solid currentColor",
                  paddingBottom: 1,
                }}
              >
                Instagram {comp.instagram} {Icons.ext}
              </a>
            </dd>
          </dl>
        </div>

        <div className="drawer-actions-row">
          <button className="cta-btn accent">
            {status.kind === "closed"
              ? "접수 마감"
              : status.kind === "soon"
              ? "접수 예정"
              : "접수 페이지로 →"}
          </button>
        </div>
      </aside>
    </>
  );
}
