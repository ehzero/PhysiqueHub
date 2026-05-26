"use client";

import { useEffect } from "react";
import { getCompetitionPath } from "@/lib/competition-slug";
import {
  Competition,
  parseDate,
  regStatusAt,
  daysBetween,
  fmtDate,
  formatDday,
} from "@/lib/data";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import { Icons } from "./Icons";
import { PosterFigure, posterFigureColor } from "./PosterFigure";
import { ShareButton } from "./ShareButton";

const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

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

  if (!comp) {
    return (
      <>
        <div className={`drawer-back ${isOpen ? "open" : ""}`} onClick={onClose} />
        <aside className={`drawer ${isOpen ? "open" : ""}`} />
      </>
    );
  }

  const status = today ? regStatusAt(comp, today) : null;
  const compDate = parseDate(comp.date);
  const ddComp = today
    ? Math.round((compDate.getTime() - today.getTime()) / 86400000)
    : null;
  const ddClose = today ? daysBetween(today, comp.regClose) : null;
  const variant = comp.id.charCodeAt(Math.min(2, comp.id.length - 1)) % 6;
  const dateLabel = comp.dateEnd
    ? `${fmtDate(comp.date, { style: "long" })} → ${fmtDate(comp.dateEnd, { style: "long" })}`
    : fmtDate(comp.date, { style: "long" });
  const officialUrl = comp.sourceUrl || comp.registrationUrl;
  const registrationLabel =
    comp.registrationStatus === "unknown"
      ? comp.regClose === comp.date
        ? status?.kind === "closed"
          ? "접수 마감"
          : "공식 접수 정보 확인 필요"
        : `마감 ${fmtDate(comp.regClose, { style: "long" })}`
      : `${fmtDate(comp.regOpen, { style: "long" })} → ${fmtDate(comp.regClose, { style: "long" })}`;
  const classificationTags = [
    COMPETITION_TIER_LABELS[comp.tier],
    comp.attributes.global ? "글로벌" : "",
    comp.attributes.nationalSelection ? "국가대표 선발" : "",
    comp.attributes.nationalTeamEvent ? "국가대표전" : "",
    comp.attributes.nationalSportsFestival ? "전국체전" : "",
    comp.attributes.beginner ? "입문·루키" : "",
  ].filter(Boolean);

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
            <ShareButton
              iconOnly
              path={getCompetitionPath(comp)}
            />
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
              <div className="val">{ddComp === null ? "-" : formatDday(ddComp)}</div>
            </div>
            <div className={`cell ${status?.kind === "urgent" ? "urgent" : ""}`}>
              <div className="lbl">접수 마감</div>
              <div className="val">
                {ddClose === null ? "-" : ddClose >= 0 ? formatDday(ddClose) : "마감"}
              </div>
            </div>
            <div className="cell">
              <div className="lbl">참가비</div>
              <div className="val">{comp.fee > 0 ? `${(comp.fee / 10000).toFixed(0)}만원` : "확인"}</div>
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
              {dateLabel} ({DAYS_KO[parseDate(comp.date).getDay()]}요일)
            </dd>

            <dt>접수 기간</dt>
            <dd>
              {registrationLabel}
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

            <dt>분류</dt>
            <dd>
              <div className="cat-pill-row">
                {classificationTags.map((tag) => (
                  <span key={tag} className="cat-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </dd>

            <dt>참가비</dt>
            <dd className="mono">{comp.fee > 0 ? `₩ ${comp.fee.toLocaleString()}` : "확인 필요"}</dd>

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
                href={officialUrl || "#"}
                target={officialUrl ? "_blank" : undefined}
                rel={officialUrl ? "noreferrer" : undefined}
                style={{
                  overflowWrap: "anywhere",
                  borderBottom: "1px solid currentColor",
                  paddingBottom: 1,
                }}
              >
                {officialUrl || "-"}
              </a>
            </dd>
          </dl>
        </div>

        <div className="drawer-actions-row">
          <a
            className="cta-btn accent"
            href={comp.registrationUrl || comp.sourceUrl || "#"}
            target={comp.registrationUrl || comp.sourceUrl ? "_blank" : undefined}
            rel={comp.registrationUrl || comp.sourceUrl ? "noreferrer" : undefined}
          >
            {status?.kind === "closed"
              ? "접수 마감"
              : status?.kind === "soon"
              ? "접수 예정"
              : "접수 페이지로 →"}
          </a>
        </div>
      </aside>
    </>
  );
}
