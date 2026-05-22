"use client";

import { Competition, regStatusAt, ddayAt, fmtDate, formatDday } from "@/lib/data";
import { Icons } from "./Icons";

interface CompRowProps {
  comp: Competition;
  onOpen: (c: Competition) => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  today: Date;
}

export function CompRow({ comp, onOpen, today }: CompRowProps) {
  const status = regStatusAt(comp, today);
  const dd = ddayAt(comp.date, today);

  return (
    <div className="comp-row" onClick={() => onOpen(comp)}>
      <div className="row-date">
        <span className="day">{formatDday(dd)}</span>
        <span className="mo">{fmtDate(comp.date, { style: "long" })}</span>
      </div>
      <div>
        <h3 className="row-title">{comp.title}</h3>
        <div className="row-org">{comp.org} · {comp.venue}</div>
      </div>
      <div className="row-meta">
        <span className="lbl">지역</span>
        {comp.region}
      </div>
      <div className="row-cats">
        {comp.categories.slice(0, 3).map((c, i) => (
          <span key={i}>
            {c}{i < Math.min(comp.categories.length, 3) - 1 ? " ·" : ""}
          </span>
        ))}
        {comp.categories.length > 3 && (
          <span style={{ color: "var(--ink-3)" }}>+{comp.categories.length - 3}</span>
        )}
      </div>
      <div className={`row-status status-${status.kind}`}>
        <span className="dot" />
        <span>{status.label}</span>
      </div>
      <div className="row-arrow">{Icons.arrow}</div>
    </div>
  );
}
