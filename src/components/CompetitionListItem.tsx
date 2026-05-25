"use client";

import Link from "next/link";
import type { MouseEventHandler } from "react";
import { getCompetitionPath } from "@/lib/competition-slug";
import { regStatusAt, type Competition } from "@/lib/data";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";

const A = "#B85C3C";
const INK = "#0E0E0C";
const MUTE = "#86827C";
const FAINT = "#E8E5DE";
const PAPER = "#F7F5F0";

interface CompetitionListItemProps {
  competition: Competition;
  today: Date | null;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

function parseDateParts(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return {
    monthKo: `${month}월`,
    day,
  };
}

function daysUntil(dateStr: string, today: Date): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}

function formatDday(days: number | null): string {
  if (days === null) return "-";
  if (days === 0) return "D-Day";
  if (days > 0) return `D−${days}`;
  return `D+${Math.abs(days)}`;
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
  const isOpen =
    registrationStatus?.kind === "open" ||
    registrationStatus?.kind === "urgent";
  const statusColor =
    registrationStatus?.kind === "open"
      ? "#2D7A3E"
      : registrationStatus?.kind === "urgent"
        ? A
        : registrationStatus?.kind === "closed"
          ? "#8A3A2E"
          : MUTE;

  return (
    <Link
      href={href}
      className="hub-upcoming-row"
      prefetch={false}
      onClick={onClick}
      style={{
        borderTop: `1px solid ${FAINT}`,
        textDecoration: "none",
        color: INK,
      }}
    >
      <div>
        <div
          className="hub-upcoming-dday mono"
          style={{ color: isOpen ? A : INK }}
        >
          {formatDday(days)}
        </div>
        <div className="hub-upcoming-month" style={{ color: MUTE }}>
          {date.monthKo} {date.day}일
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <span className="hub-tag" style={{ background: INK, color: "#fff" }}>
            {competition.orgShort}
          </span>
          <span
            className="hub-tag-outline"
            style={{ color: INK, borderColor: INK }}
          >
            {tierLabel}
          </span>
          {competition.attributes.major && (
            <span
              className="hub-tag-outline"
              style={{ color: A, borderColor: A }}
            >
              메이저
            </span>
          )}
          {competition.attributes.global && (
            <span
              className="hub-tag-outline"
              style={{ color: "#2D5A8F", borderColor: "#2D5A8F" }}
            >
              글로벌
            </span>
          )}
          {competition.attributes.nationalSelection && (
            <span
              className="hub-tag-outline"
              style={{ color: "#6D4B99", borderColor: "#6D4B99" }}
            >
              국가대표 선발
            </span>
          )}
          {competition.attributes.nationalTeamEvent && (
            <span
              className="hub-tag-outline"
              style={{ color: "#8A4F2C", borderColor: "#8A4F2C" }}
            >
              국가대표전
            </span>
          )}
          {competition.attributes.nationalSportsFestival && (
            <span
              className="hub-tag-outline"
              style={{ color: "#7A5A1D", borderColor: "#7A5A1D" }}
            >
              전국체전
            </span>
          )}
          {competition.attributes.beginner && (
            <span
              className="hub-tag-outline"
              style={{ color: "#6B6A32", borderColor: "#6B6A32" }}
            >
              입문·루키
            </span>
          )}
          {competition.natural && (
            <span
              className="hub-tag-outline"
              style={{ color: "#2D7A3E", borderColor: "#2D7A3E" }}
            >
              NATURAL
            </span>
          )}
        </div>
        <div className="hub-upcoming-name">{competition.title}</div>
      </div>

      <div className="hub-upcoming-region">
        <div style={{ fontSize: 13, fontWeight: 500 }}>
          {competition.region}
        </div>
      </div>

      <div className="hub-upcoming-cats">
        {competition.categories.slice(0, 3).map((category) => (
          <span
            key={category}
            className="hub-cat-chip"
            style={{ background: PAPER, color: INK }}
          >
            {category}
          </span>
        ))}
        {competition.categories.length > 3 && (
          <span style={{ fontSize: 11, color: MUTE }}>
            +{competition.categories.length - 3}
          </span>
        )}
      </div>

      <div style={{ textAlign: "right" }}>
        <div
          className="hub-status-dot"
          style={{
            color: statusColor,
            justifyContent: "flex-end",
          }}
        >
          {registrationStatus && (
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: statusColor,
                marginRight: 5,
                boxShadow:
                  registrationStatus.kind === "open"
                    ? "0 0 0 3px rgba(45,122,62,.15)"
                    : "none",
              }}
            />
          )}
          {registrationStatus?.label ?? "-"}
        </div>
      </div>
    </Link>
  );
}
