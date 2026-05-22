"use client";

import { useState } from "react";
import {
  Competition,
  COMPETITIONS,
  TODAY,
  parseDate,
  regStatus,
  dday,
  fmtDate,
} from "@/lib/data";
import { FeatCard } from "./FeatCard";
import { CompRow } from "./CompRow";
import { Icons } from "./Icons";

const DOWS = ["일", "월", "화", "수", "목", "금", "토"];

interface HomeViewProps {
  saved: string[];
  toggleSave: (id: string) => void;
  openComp: (c: Competition) => void;
  setRoute: (r: string) => void;
}

export function HomeView({
  saved,
  toggleSave,
  openComp,
  setRoute,
}: HomeViewProps) {
  const [activePreset, setActivePreset] = useState("all");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("date");

  const upcoming = COMPETITIONS.filter((c) => dday(c.date) >= -1);

  const counts = {
    all: upcoming.length,
    open: upcoming.filter((c) => ["open", "urgent"].includes(regStatus(c).kind))
      .length,
    urgent: upcoming.filter((c) => regStatus(c).kind === "urgent").length,
    thisMonth: upcoming.filter((c) => {
      const d = parseDate(c.date);
      return (
        d.getMonth() === TODAY.getMonth() &&
        d.getFullYear() === TODAY.getFullYear()
      );
    }).length,
    nextMonth: upcoming.filter((c) => {
      const d = parseDate(c.date);
      const nm = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 1);
      return (
        d.getMonth() === nm.getMonth() && d.getFullYear() === nm.getFullYear()
      );
    }).length,
    beginner: upcoming.filter((c) => c.beginner).length,
    natural: upcoming.filter((c) => c.natural).length,
    saved: saved.length,
  };

  let feed = upcoming.slice();
  if (activePreset === "open")
    feed = feed.filter((c) => ["open", "urgent"].includes(regStatus(c).kind));
  else if (activePreset === "urgent")
    feed = feed.filter((c) => regStatus(c).kind === "urgent");
  else if (activePreset === "thisMonth") {
    feed = feed.filter((c) => {
      const d = parseDate(c.date);
      return (
        d.getMonth() === TODAY.getMonth() &&
        d.getFullYear() === TODAY.getFullYear()
      );
    });
  } else if (activePreset === "nextMonth") {
    feed = feed.filter((c) => {
      const d = parseDate(c.date);
      const nm = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 1);
      return (
        d.getMonth() === nm.getMonth() && d.getFullYear() === nm.getFullYear()
      );
    });
  } else if (activePreset === "beginner") feed = feed.filter((c) => c.beginner);
  else if (activePreset === "natural") feed = feed.filter((c) => c.natural);
  else if (activePreset === "saved")
    feed = feed.filter((c) => saved.includes(c.id));

  if (activeRegion) feed = feed.filter((c) => c.region === activeRegion);

  feed.sort((a, b) => {
    if (sortBy === "deadline")
      return parseDate(a.regClose).getTime() - parseDate(b.regClose).getTime();
    if (sortBy === "scale") {
      const order: Record<string, number> = { 대형: 0, 중형: 1, 소형: 2 };
      return order[a.scale] - order[b.scale];
    }
    return parseDate(a.date).getTime() - parseDate(b.date).getTime();
  });

  const featured = feed.slice(0, 3);
  const restList = feed.slice(3);

  const regionCounts: Record<string, number> = {};
  upcoming.forEach((c) => {
    regionCounts[c.region] = (regionCounts[c.region] || 0) + 1;
  });
  const regionsSorted = Object.entries(regionCounts).sort(
    (a, b) => b[1] - a[1],
  );

  const dateLine = `${TODAY.getFullYear()}.${String(TODAY.getMonth() + 1).padStart(2, "0")}.${String(TODAY.getDate()).padStart(2, "0")} (${DOWS[TODAY.getDay()]})`;

  const presets = [
    { id: "all", label: "전체", n: counts.all },
    { id: "open", label: "접수 중", n: counts.open },
    { id: "urgent", label: "마감 임박", n: counts.urgent, accent: true },
    {
      id: "thisMonth",
      label: `${TODAY.getMonth() + 1}월 대회`,
      n: counts.thisMonth,
    },
    {
      id: "nextMonth",
      label: `${TODAY.getMonth() + 2 > 12 ? 1 : TODAY.getMonth() + 2}월 대회`,
      n: counts.nextMonth,
    },
    { id: "beginner", label: "입문자 환영", n: counts.beginner },
    { id: "natural", label: "내추럴", n: counts.natural },
    {
      id: "saved",
      label: "저장 대회",
      n: counts.saved,
      disabled: counts.saved === 0,
    },
  ];

  const feedLabel =
    {
      all: "전체 대회",
      open: "접수 중인 대회",
      urgent: "마감이 임박한 대회",
      thisMonth: `${TODAY.getMonth() + 1}월 대회`,
      nextMonth: `${TODAY.getMonth() + 2 > 12 ? 1 : TODAY.getMonth() + 2}월 대회`,
      beginner: "입문자가 나가기 좋은 대회",
      natural: "내추럴 대회",
      saved: "저장한 대회",
    }[activePreset] || "전체 대회";

  return (
    <main className="home-main">
      {/* Dashboard top bar */}
      <section className="dash-bar">
        <div className="container">
          <div className="dash-row">
            <div className="dash-meta">
              <span className="eyebrow" style={{ color: "var(--ink)" }}>
                SEASON {TODAY.getFullYear()}
              </span>
              <span className="mono dash-date">{dateLine}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Preset chip tabs */}
      <section className="preset-bar">
        <div className="container">
          <div className="preset-row">
            <div className="preset-chips" role="tablist">
              {presets.map((p) => (
                <button
                  key={p.id}
                  className={`preset-chip ${activePreset === p.id ? "on" : ""} ${p.accent && p.n > 0 ? "accent" : ""}`}
                  disabled={!!p.disabled}
                  onClick={() => setActivePreset(p.id)}
                >
                  <span>{p.label}</span>
                  <span className="preset-sep" aria-hidden="true">|</span>
                  <span className="preset-cnt mono">{p.n}</span>
                </button>
              ))}
            </div>
            <div className="preset-actions">
              <label className="sort-pick">
                <span className="sort-icon" aria-label="정렬">
                  {Icons.sort}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">대회일 빠른 순</option>
                  <option value="deadline">접수 마감 임박 순</option>
                  <option value="scale">대회 규모 큰 순</option>
                </select>
                <span className="sort-chevron">{Icons.chevronDown}</span>
              </label>
            </div>
          </div>
          <div className="region-chips">
            <button
              className={`region-chip ${activeRegion === null ? "on" : ""}`}
              onClick={() => setActiveRegion(null)}
            >
              전체 지역
            </button>
            {regionsSorted.map(([r, n]) => (
              <button
                key={r}
                className={`region-chip ${activeRegion === r ? "on" : ""}`}
                onClick={() => setActiveRegion(activeRegion === r ? null : r)}
              >
                {r} <span className="mono">{n}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="section home-feed">
        <div className="container">
          <div className="feed-head">
            <div>
              <h2 className="page-title feed-h">
                {feedLabel}
                {activeRegion && (
                  <span className="page-title-sub feed-h-sub"> · {activeRegion}</span>
                )}
              </h2>
              <p className="page-subtitle feed-sub mono">{feed.length} EVENTS</p>
            </div>
          </div>

          {feed.length === 0 ? (
            <div
              style={{
                padding: "80px 20px",
                textAlign: "center",
                border: "1px dashed var(--line-soft)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                NO RESULTS
              </div>
              <p style={{ fontSize: 18, marginBottom: 16 }}>
                조건에 맞는 대회가 없습니다.
              </p>
              <button
                className="cta-btn"
                onClick={() => {
                  setActivePreset("all");
                  setActiveRegion(null);
                }}
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <div className="feat-grid" style={{ marginBottom: 12 }}>
                  {featured.map((c) => (
                    <FeatCard
                      key={c.id}
                      comp={c}
                      onOpen={openComp}
                      isSaved={saved.includes(c.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              )}
              {restList.length > 0 && (
                <div className="comp-list" style={{ marginTop: 40 }}>
                  {restList.map((c) => (
                    <CompRow
                      key={c.id}
                      comp={c}
                      onOpen={openComp}
                      isSaved={saved.includes(c.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button className="cta-btn" onClick={() => setRoute("list")}>
              필터 더 보기 / 전체 목록 페이지로 {Icons.arrow}
            </button>
          </div>
        </div>
      </section>

      {/* Beginner picks */}
      {activePreset !== "beginner" && (
        <section
          className="section"
          style={{ paddingTop: 64, background: "var(--bg-sub)" }}
        >
          <div className="container">
            <BeginnerPicks onOpen={openComp} />
          </div>
        </section>
      )}
    </main>
  );
}

function BeginnerPicks({ onOpen }: { onOpen: (c: Competition) => void }) {
  const picks = COMPETITIONS.filter(
    (c) => c.beginner && dday(c.date) > 0,
  ).slice(0, 5);
  return (
    <div className="pick-row">
      <div className="pick-head">
        <div className="num">04 / FIRST STAGE</div>
        <h3 className="page-title">입문자가 찾는 대회</h3>
        <p className="page-subtitle">
          첫 무대를 준비 중이라면 루키 부문이 있거나, 입문자 비중이 높은
          대회부터 살펴보세요.
        </p>
      </div>
      <ul className="pick-list">
        {picks.map((c, i) => (
          <li key={c.id} className="pick-item" onClick={() => onOpen(c)}>
            <span className="pick-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="pick-ttl">
              {c.title}
              <span className="sub">
                {c.org} · {c.region} · {fmtDate(c.date, { style: "long" })}
              </span>
            </span>
            <span className="pick-tag">
              {c.rookie ? "루키 부문" : "입문 환영"}
            </span>
            <span className="pick-arrow">{Icons.arrow}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
