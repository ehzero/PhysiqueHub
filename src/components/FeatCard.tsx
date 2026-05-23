"use client";

import {
  Competition,
  ddayAt,
  fmtDate,
  formatDday,
  regStatusAt,
} from "@/lib/data";
import { Icons } from "./Icons";
import { PosterFigure, posterFigureColor } from "./PosterFigure";

interface FeatCardProps {
  comp: Competition;
  onOpen: (c: Competition) => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  today: Date | null;
}

export function FeatCard({
  comp,
  onOpen,
  isSaved,
  onToggleSave,
  today,
}: FeatCardProps) {
  const status = today ? regStatusAt(comp, today) : null;
  const dd = today ? ddayAt(comp.date, today) : null;
  const variant = comp.id.charCodeAt(2) % 6;

  return (
    <article className="feat-card" onClick={() => onOpen(comp)}>
      <div className={`feat-poster poster-${comp.poster}`}>
        <div className="poster-figure">
          <PosterFigure
            variant={variant}
            color={posterFigureColor(comp.poster)}
          />
        </div>
        <button
          className={`bookmark-fab ${isSaved ? "on" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(comp.id);
          }}
          aria-label="save"
        >
          {isSaved ? Icons.bookmarkFilled : Icons.bookmark}
        </button>
        <div className="poster-date">
          <span className="day">{dd === null ? "-" : formatDday(dd)}</span>
          <span className="mo">{fmtDate(comp.date, { style: "long" })}</span>
        </div>
      </div>
      <div className="feat-body">
        <div className="org">{comp.org}</div>
        <h3 className="title">{comp.title}</h3>
        <div className="feat-meta">
          <span className="meta-cell">
            {Icons.pin}
            <span>{comp.region}</span>
          </span>
          <span className="meta-cell">
            {Icons.tag}
            <span>
              {comp.categories.slice(0, 3).map((category, index) => (
                <span key={category}>
                  {category}
                  {index < Math.min(comp.categories.length, 3) - 1 ? " · " : ""}
                </span>
              ))}
              {comp.categories.length > 3 && (
                <span className="muted"> +{comp.categories.length - 3}</span>
              )}
            </span>
          </span>
        </div>
      </div>
      <div className="feat-foot">
        <span
          className={`row-status ${status ? `status-${status.kind}` : "status-loading"}`}
        >
          {status && <span className="dot" />}
          <span>{status?.label ?? "-"}</span>
        </span>
      </div>
    </article>
  );
}
