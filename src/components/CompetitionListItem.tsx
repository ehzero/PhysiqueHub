"use client";

import Link from "next/link";
import type { CSSProperties, MouseEventHandler } from "react";
import { getCompetitionPath } from "@/lib/competition-slug";
import { getCompetitionLocationLabel } from "@/lib/competition-display";
import { regStatusAt, type Competition } from "@/lib/data";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import { Icons } from "./Icons";
import { StatusPill } from "./UIPrimitives";

const ACCENT = "var(--ph-accent)";
const SOFT = "var(--ph-ink-3)";
const PAPER = "var(--ph-sub)";
const OK = "var(--ph-success)";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

function toneVars({ color, bg }: { color: string; bg: string }): CSSVars {
  return {
    "--tone-color": color,
    "--tone-bg": bg,
  };
}

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
      return { label: "접수중", color: OK, bg: "var(--ph-success-bg)" };
    case "urgent":
      return { label: "마감 임박", color: ACCENT, bg: "var(--ph-accent-soft)" };
    case "soon":
      return { label: "접수 예정", color: SOFT, bg: PAPER };
    case "closed":
      return { label: "마감", color: "var(--ph-ink-5)", bg: PAPER };
    default:
      return { label: "확인 필요", color: "var(--ph-warn)", bg: "var(--ph-warn-bg)" };
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

type CompetitionCardVariant = "grid" | "list";

function CompetitionCard({
  competition,
  variant,
  today,
  href = getCompetitionPath(competition),
  onClick,
}: CompetitionListItemProps & { variant: CompetitionCardVariant }) {
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

  if (variant === "list") {
    return (
      <Link
        href={href}
        className="ph-surface-card ph-lift-card comp-card"
        prefetch={false}
        onClick={onClick}
      >
        <div className="comp-card-date">
          <div className="comp-card-year mono">{date.year}</div>
          <div className="comp-card-monthday">
            {mm}.{dd}
          </div>
          <div className="comp-card-weekday">{date.weekday}요일</div>
        </div>

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
                  style={toneVars(s)}
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

        <div className="comp-card-status-col">
          {statusInfo && (
            <StatusPill
              className="comp-card-status-pill"
              dotClassName="comp-card-status-dot"
              label={statusInfo.label}
              style={toneVars(statusInfo)}
            />
          )}
          {days !== null && days >= 0 && (
            <div
              className={`comp-card-dday${isUrgent ? " is-urgent" : ""}`}
            >
              D−{days}
            </div>
          )}
          <div className="comp-card-arrow mono">상세 보기 →</div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="ph-surface-card ph-lift-card comp-grid-card"
      prefetch={false}
      onClick={onClick}
    >
      {/* Top: status pill + D-day */}
      <div className="comp-grid-top">
        {statusInfo ? (
          <StatusPill
            className="comp-grid-status-pill"
            dotClassName="comp-grid-status-dot"
            label={statusInfo.label}
            labelClassName="comp-grid-status-label"
            style={toneVars(statusInfo)}
          />
        ) : (
          <div />
        )}
        <div className="comp-grid-dday-wrap">
          {days !== null && days >= 0 && (
            <div
              className={`comp-grid-dday mono${isUrgent ? " is-urgent" : ""}`}
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
              style={toneVars(s)}
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

export function CompetitionGridCard(props: CompetitionListItemProps) {
  return <CompetitionCard {...props} variant="grid" />;
}

export function CompetitionListItem(props: CompetitionListItemProps) {
  return <CompetitionCard {...props} variant="list" />;
}
