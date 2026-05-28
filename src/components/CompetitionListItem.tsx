"use client";

import Link from "next/link";
import type { MouseEventHandler } from "react";
import { getCompetitionPath } from "@/lib/competition-slug";
import { getCompetitionLocationLabel } from "@/lib/competition-display";
import { regStatusAt, type Competition } from "@/lib/data";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import { Icons } from "./Icons";

const ACCENT = "#B85C3C";
const INK = "#0E0E0C";
const SOFT = "#54514C";
const PAPER = "#F7F5F0";
const OK = "#2D7A3E";

interface CompetitionListItemProps {
  competition: Competition;
  today: Date | null;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

function parseDateParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return {
    year,
    month,
    day,
    weekday: weekdays[d.getDay()],
    monthKo: `${month}월`,
  };
}

function daysUntil(dateStr: string, today: Date): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}

interface StatusInfo {
  label: string;
  color: string;
  bg: string;
}

function getStatusInfo(kind: string): StatusInfo {
  switch (kind) {
    case "open":
      return { label: "접수중", color: OK, bg: "rgba(45,122,62,.08)" };
    case "urgent":
      return { label: "마감 임박", color: ACCENT, bg: "rgba(184,92,60,.10)" };
    case "soon":
      return { label: "접수 예정", color: SOFT, bg: PAPER };
    case "closed":
      return { label: "마감", color: "#9C9890", bg: PAPER };
    default:
      return { label: "확인 필요", color: "#C0A04A", bg: "rgba(192,160,74,.10)" };
  }
}

interface FlagStyle {
  color: string;
  bg: string;
}

function getFlagStyle(flag: string): FlagStyle {
  switch (flag) {
    case "글로벌":
      return { color: "#2D5A8F", bg: "rgba(45,90,143,.08)" };
    case "프로쇼":
      return { color: ACCENT, bg: "rgba(184,92,60,.10)" };
    case "내추럴":
      return { color: OK, bg: "rgba(45,122,62,.10)" };
    case "루키부문":
      return { color: "#7A6328", bg: "rgba(192,160,74,.16)" };
    case "국가대표 선발":
      return { color: "#2D5A8F", bg: "rgba(45,90,143,.10)" };
    case "국가대표전":
      return { color: "#6D4B99", bg: "rgba(109,75,153,.10)" };
    case "전국체전":
      return { color: "#7A5A1D", bg: "rgba(122,90,29,.12)" };
    case "프로 퀄리파이어":
      return { color: "#7A4F8F", bg: "rgba(122,79,143,.10)" };
    default:
      return { color: SOFT, bg: PAPER };
  }
}

function buildFlags(competition: Competition): string[] {
  const flags: string[] = [];
  if (competition.attributes.global) flags.push("글로벌");
  if (competition.natural) flags.push("내추럴");
  if (competition.beginner || competition.rookie) flags.push("루키부문");
  if (competition.attributes.nationalSelection) flags.push("국가대표 선발");
  if (competition.attributes.nationalTeamEvent) flags.push("국가대표전");
  if (competition.attributes.nationalSportsFestival) flags.push("전국체전");
  return flags;
}

export function CompetitionGridCard({
  competition,
  today,
  href = getCompetitionPath(competition),
  onClick,
}: CompetitionListItemProps) {
  const date = parseDateParts(competition.date);
  const days = today ? daysUntil(competition.date, today) : null;
  const registrationStatus = today ? regStatusAt(competition, today) : null;
  const tierLabel = COMPETITION_TIER_LABELS[competition.tier];
  const statusInfo = registrationStatus ? getStatusInfo(registrationStatus.kind) : null;
  const flags = buildFlags(competition);
  const isUrgent = registrationStatus?.kind === "urgent";
  const locationLabel = getCompetitionLocationLabel(competition);

  const mm = String(date.month).padStart(2, "0");
  const dd = String(date.day).padStart(2, "0");

  return (
    <Link
      href={href}
      className="comp-grid-card hub-lift-card"
      prefetch={false}
      onClick={onClick}
    >
      {/* Top: status pill + D-day */}
      <div className="comp-grid-top">
        {statusInfo ? (
          <div className="comp-grid-status-pill" style={{ background: statusInfo.bg }}>
            <span className="comp-grid-status-dot" style={{ background: statusInfo.color }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: statusInfo.color, letterSpacing: "0.04em" }}>
              {statusInfo.label}
            </span>
          </div>
        ) : (
          <div />
        )}
        <div className="comp-grid-dday-wrap">
          {days !== null && days >= 0 && (
            <div
              className="comp-grid-dday mono"
              style={{ color: isUrgent ? ACCENT : INK }}
            >
              D−{days}
            </div>
          )}
          <div className="comp-grid-dday-date mono">
            {date.year}.{mm}.{dd}
          </div>
        </div>
      </div>

      {/* Badges: org + tier + flags */}
      <div className="comp-grid-badges">
        <span className="comp-grid-org-pill">{competition.orgShort}</span>
        <span className="comp-grid-tier-label">{tierLabel}</span>
        {flags.slice(0, 2).map((f) => {
          const s = getFlagStyle(f);
          return (
            <span
              key={f}
              className="comp-grid-flag"
              style={{ color: s.color, background: s.bg }}
            >
              {f}
            </span>
          );
        })}
      </div>

      {/* Title */}
      <div className="comp-grid-title">{competition.title}</div>

      {/* Location */}
      <div className="comp-grid-location">
        {Icons.pin}
        {locationLabel}
      </div>

      {/* Categories */}
      <div className="comp-grid-cats">
        {competition.categories.slice(0, 3).map((c) => (
          <span key={c} className="comp-grid-cat">{c}</span>
        ))}
        {competition.categories.length > 3 && (
          <span className="comp-grid-cat-more mono">+{competition.categories.length - 3}</span>
        )}
      </div>
    </Link>
  );
}

export function CompetitionListItem({
  competition,
  today,
  href = getCompetitionPath(competition),
  onClick,
}: CompetitionListItemProps) {
  const date = parseDateParts(competition.date);
  const days = today ? daysUntil(competition.date, today) : null;
  const registrationStatus = today ? regStatusAt(competition, today) : null;
  const tierLabel = COMPETITION_TIER_LABELS[competition.tier];
  const statusInfo = registrationStatus
    ? getStatusInfo(registrationStatus.kind)
    : null;
  const flags = buildFlags(competition);
  const isUrgent = registrationStatus?.kind === "urgent";
  const locationLabel = getCompetitionLocationLabel(competition);

  const mm = String(date.month).padStart(2, "0");
  const dd = String(date.day).padStart(2, "0");

  return (
    <Link
      href={href}
      className="comp-card hub-lift-card"
      prefetch={false}
      onClick={onClick}
    >
      {/* Date block */}
      <div className="comp-card-date">
        <div className="comp-card-year mono">{date.year}</div>
        <div className="comp-card-monthday">
          {mm}.{dd}
        </div>
        <div className="comp-card-weekday">{date.weekday}요일</div>
      </div>

      {/* Main info */}
      <div className="comp-card-info">
        <div className="comp-card-badges">
          <span className="comp-card-org-pill">{competition.orgShort}</span>
          <span className="comp-card-divider" />
          <span className="comp-card-tier-label">{tierLabel}</span>
          {flags.map((f) => {
            const s = getFlagStyle(f);
            return (
              <span
                key={f}
                className="comp-card-flag"
                style={{ color: s.color, background: s.bg }}
              >
                {f}
              </span>
            );
          })}
        </div>

        <div className="comp-card-title">
          {competition.title}
        </div>

        <div className="comp-card-location">
          {Icons.pin}
          {locationLabel}
        </div>

        <div className="comp-card-cats">
          {competition.categories.slice(0, 5).map((c) => (
            <span key={c} className="comp-card-cat">
              {c}
            </span>
          ))}
          {competition.categories.length > 5 && (
            <span className="comp-card-cat-more mono">
              +{competition.categories.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Status + D-day */}
      <div className="comp-card-status-col">
        {statusInfo && (
          <div
            className="comp-card-status-pill"
            style={{ background: statusInfo.bg }}
          >
            <span
              className="comp-card-status-dot"
              style={{ background: statusInfo.color }}
            />
            <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
          </div>
        )}
        {days !== null && days >= 0 && (
          <div
            className="comp-card-dday"
            style={{ color: isUrgent ? ACCENT : INK }}
          >
            D−{days}
          </div>
        )}
        <div className="comp-card-arrow mono">상세 보기 →</div>
      </div>
    </Link>
  );
}
