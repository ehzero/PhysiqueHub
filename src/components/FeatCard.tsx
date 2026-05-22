"use client";

import { Competition, dday, fmtDate, regStatus } from "@/lib/data";
import { Icons } from "./Icons";
import { PosterFigure, posterFigureColor } from "./PosterFigure";

interface FeatCardProps {
  comp: Competition;
  onOpen: (c: Competition) => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

export function FeatCard({ comp, onOpen, isSaved, onToggleSave }: FeatCardProps) {
  const status = regStatus(comp);
  const dd = dday(comp.date);
  const variant = comp.id.charCodeAt(2) % 6;

  return (
    <article className="feat-card" onClick={() => onOpen(comp)}>
      <div className={`feat-poster poster-${comp.poster}`}>
        <div className="poster-figure">
          <PosterFigure variant={variant} color={posterFigureColor(comp.poster)} />
        </div>
        <span className="poster-tag">{comp.orgShort}</span>
        <button
          className={`bookmark-fab ${isSaved ? "on" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleSave(comp.id); }}
          aria-label="save"
        >
          {isSaved ? Icons.bookmarkFilled : Icons.bookmark}
        </button>
        <div className="poster-date">
          <span className="day">D{dd >= 0 ? "-" : "+"}{Math.abs(dd)}</span>
          <span className="mo">{fmtDate(comp.date, { style: "long" })}</span>
        </div>
      </div>
      <div className="feat-body">
        <div className="org">{comp.org}</div>
        <h3 className="title">{comp.title}</h3>
        <div className="feat-meta">
          <span className="meta-cell">{Icons.pin}<span>{comp.region}</span></span>
          <span className="meta-cell">{Icons.tag}<span>{comp.categories.length}종목</span></span>
        </div>
      </div>
      <div className="feat-foot">
        <span className={`row-status status-${status.kind}`}>
          <span className="dot" />
          <span>{status.label}</span>
        </span>
        <span className="mono">{status.short}</span>
      </div>
    </article>
  );
}
