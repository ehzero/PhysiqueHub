"use client";

import { useMemo, useState } from "react";
import { Competition, Filters } from "@/lib/data";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import type { CompetitionFilterOptions } from "@/lib/competition-public";
import type { CompetitionLocationScope } from "@/lib/filter-query";
import { Icons } from "./Icons";
import { CompRow } from "./CompRow";
import { CompetitionGridCard } from "./CompetitionListItem";
import { FilterRail } from "./FilterRail";
import { EmptyState, PageMain } from "./PageLayout";

const ACCENT = "#B85C3C";
const MUTE = "#86827C";

const MONTH_KR = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

type SortKey = "date" | "deadline";
type ViewMode = "list" | "grid";

interface ListViewProps {
  comps: Competition[];
  allComps: Competition[];
  saved: string[];
  toggleSave: (id: string) => void;
  openComp: (c: Competition) => void;
  filters: Filters;
  setFilters: (fn: (f: Filters) => Filters) => void;
  filterOptions?: CompetitionFilterOptions;
  search: string;
  setSearch: (s: string) => void;
  scope: CompetitionLocationScope;
  setScope: (scope: CompetitionLocationScope) => void;
  today: Date | null;
  description: string;
}

export function ListView({
  comps,
  allComps,
  saved,
  toggleSave,
  openComp,
  filters,
  setFilters,
  filterOptions,
  search,
  setSearch,
  scope,
  setScope,
  today,
  description,
}: ListViewProps) {
  void saved;
  void toggleSave;
  void allComps;

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const segmented = useMemo(() => {
    if (scope === "domestic") return comps.filter((c) => c.country === "KR");
    if (scope === "overseas") return comps.filter((c) => c.country !== "KR");
    return comps;
  }, [comps, scope]);

  const sorted = useMemo(() => {
    if (sortKey === "deadline") {
      return [...segmented].sort((a, b) => {
        if (!a.regClose && !b.regClose) return 0;
        if (!a.regClose) return 1;
        if (!b.regClose) return -1;
        return a.regClose.localeCompare(b.regClose);
      });
    }
    return [...segmented].sort((a, b) => a.date.localeCompare(b.date));
  }, [segmented, sortKey]);

  const byMonth = useMemo(() => {
    const groups = new Map<number, Competition[]>();
    for (const c of sorted) {
      const m = new Date(c.date).getMonth();
      if (!groups.has(m)) groups.set(m, []);
      groups.get(m)!.push(c);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [sorted]);

  const domesticCount = useMemo(
    () => comps.filter((c) => c.country === "KR").length,
    [comps],
  );
  const overseasCount = useMemo(
    () => comps.filter((c) => c.country !== "KR").length,
    [comps],
  );

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    for (const r of filters.regions ?? []) {
      chips.push({
        key: `region:${r}`,
        label: r,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            regions: f.regions?.filter((x) => x !== r),
          })),
      });
    }
    for (const o of filters.orgs ?? []) {
      chips.push({
        key: `org:${o}`,
        label: o,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            orgs: f.orgs?.filter((x) => x !== o),
          })),
      });
    }
    for (const c of filters.cats ?? []) {
      chips.push({
        key: `cat:${c}`,
        label: c,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            cats: f.cats?.filter((x) => x !== c),
          })),
      });
    }
    for (const t of filters.tiers ?? []) {
      chips.push({
        key: `tier:${t}`,
        label: COMPETITION_TIER_LABELS[t],
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            tiers: f.tiers?.filter((x) => x !== t),
          })),
      });
    }
    for (const s of filters.status ?? []) {
      const labels: Record<string, string> = {
        open: "접수 중",
        urgent: "마감 임박",
        soon: "접수 예정",
        closed: "마감",
        unknown: "확인 필요",
      };
      chips.push({
        key: `status:${s}`,
        label: labels[s] ?? s,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            status: f.status?.filter((x) => x !== s),
          })),
      });
    }
    if (filters.beginner) {
      chips.push({
        key: "beginner",
        label: "입문·루키",
        onRemove: () => setFilters((f) => ({ ...f, beginner: undefined })),
      });
    }
    if (filters.natural) {
      chips.push({
        key: "natural",
        label: "내추럴",
        onRemove: () => setFilters((f) => ({ ...f, natural: undefined })),
      });
    }
    if (filters.global) {
      chips.push({
        key: "global",
        label: "글로벌",
        onRemove: () => setFilters((f) => ({ ...f, global: undefined })),
      });
    }
    if (filters.nationalSelection) {
      chips.push({
        key: "nationalSelection",
        label: "국가대표 선발",
        onRemove: () =>
          setFilters((f) => ({ ...f, nationalSelection: undefined })),
      });
    }
    if (filters.nationalTeamEvent) {
      chips.push({
        key: "nationalTeamEvent",
        label: "국가대표전",
        onRemove: () =>
          setFilters((f) => ({ ...f, nationalTeamEvent: undefined })),
      });
    }
    if (filters.nationalSportsFestival) {
      chips.push({
        key: "nationalSportsFestival",
        label: "전국체전",
        onRemove: () =>
          setFilters((f) => ({ ...f, nationalSportsFestival: undefined })),
      });
    }
    return chips;
  }, [filters, setFilters]);

  const hasActiveFilters = activeFilterChips.length > 0 || !!search;

  const segmentTabs: { id: CompetitionLocationScope; label: string; count: number }[] = [
    { id: "all", label: "전체", count: comps.length },
    { id: "domestic", label: "국내 대회", count: domesticCount },
    { id: "overseas", label: "해외 대회", count: overseasCount },
  ];

  return (
    <PageMain className="competition-index">
      {/* ── Page intro ─────────────────────────────────────────────── */}
      <section className="comp-intro-section">
        <div className="container">
          <div className="comp-intro-grid">
            <div className="comp-intro-left">
              <div className="hub-eyebrow" style={{ color: ACCENT, marginBottom: 14 }}>
                ● Competitions · 대회 목록
              </div>
              <h1 className="comp-intro-h1">
                대회 일정을{" "}
                <span style={{ color: ACCENT }}>조건별로</span>{" "}
                찾아보세요.
              </h1>
              <p className="comp-intro-body">{description}</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <section className="comp-search-section">
        <div className="container">
          <label className="comp-search-bar">
            <span className="comp-search-icon">{Icons.search}</span>
            <input
              className="comp-search-input"
              placeholder="대회명·단체·지역으로 검색 (예: IFBB Pro, KBBF, 서울)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="comp-search-clear" onClick={() => setSearch("")}>
                {Icons.close}
              </button>
            )}
            <kbd className="comp-search-kbd">⌘ K</kbd>
          </label>
        </div>
      </section>

      {/* ── Segment tabs ───────────────────────────────────────────── */}
      <div className="comp-segment-tabs-wrap">
        <div className="container">
          <div className="comp-segment-tabs">
            {segmentTabs.map((t) => (
              <button
                key={t.id}
                className={`comp-segment-tab${scope === t.id ? " active" : ""}`}
                onClick={() => setScope(t.id)}
              >
                {t.label}
                <span className="comp-segment-count mono">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + list ────────────────────────────────────── */}
      <section className="comp-body-section">
        <div className="container">
          <div className="list-layout">
            <FilterRail
              filters={filters}
              setFilters={setFilters}
              allComps={allComps}
              today={today}
              filterOptions={filterOptions}
            />

            <div>
              {/* Active chips */}
              {hasActiveFilters && (
                <div className="comp-active-chips">
                  <span className="comp-chips-label mono">
                    적용 중 {activeFilterChips.length}
                  </span>
                  {activeFilterChips.map((chip) => (
                    <span key={chip.key} className="comp-chip">
                      {chip.label}
                      <button
                        className="comp-chip-remove"
                        onClick={chip.onRemove}
                        aria-label={`${chip.label} 필터 제거`}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M1 1l8 8M9 1l-8 8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  <span className="comp-chips-sep" />
                  <button
                    className="comp-chips-reset"
                    onClick={() => {
                      setFilters(() => ({}));
                      setSearch("");
                    }}
                  >
                    모두 지우기
                  </button>
                </div>
              )}

              {/* Sort row */}
              <div className="comp-sort-row">
                <div className="comp-result-count">
                  결과{" "}
                  <span className="comp-result-num" style={{ color: ACCENT }}>
                    {sorted.length.toLocaleString("ko-KR")}
                  </span>
                  <span style={{ color: MUTE, fontWeight: 500 }}>개</span>
                </div>
                <div className="comp-sort-controls">
                  <span className="comp-sort-label mono">정렬</span>
                  <div className="comp-sort-pills">
                    {(
                      [
                        { key: "date", label: "빠른 일정순" },
                        { key: "deadline", label: "접수 마감순" },
                      ] as { key: SortKey; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        className={`comp-sort-pill${sortKey === opt.key ? " active" : ""}`}
                        onClick={() => setSortKey(opt.key)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className="comp-sort-divider" />
                  <div className="comp-view-toggle">
                    <button
                      className={`comp-view-btn${viewMode === "list" ? " active" : ""}`}
                      onClick={() => setViewMode("list")}
                      aria-label="리스트 뷰"
                      title="리스트 뷰"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 3h12M1 7h12M1 11h12" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      className={`comp-view-btn${viewMode === "grid" ? " active" : ""}`}
                      onClick={() => setViewMode("grid")}
                      aria-label="그리드 뷰"
                      title="그리드 뷰"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="5" height="5" rx="1" />
                        <rect x="8" y="1" width="5" height="5" rx="1" />
                        <rect x="1" y="8" width="5" height="5" rx="1" />
                        <rect x="8" y="8" width="5" height="5" rx="1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Competition list / grid */}
              {sorted.length === 0 ? (
                <EmptyState
                  eyebrow="NO RESULTS"
                  title="조건에 맞는 대회가 없습니다."
                  action={
                    <button
                      className="cta-btn"
                      onClick={() => {
                        setFilters(() => ({}));
                        setSearch("");
                        setScope("all");
                      }}
                    >
                      필터 초기화
                    </button>
                  }
                />
              ) : viewMode === "grid" ? (
                <div className="comp-grid">
                  {sorted.map((c) => (
                    <CompetitionGridCard
                      key={c.id}
                      competition={c}
                      today={today}
                      onClick={(e) => {
                        if (
                          e.defaultPrevented ||
                          e.button !== 0 ||
                          e.metaKey ||
                          e.ctrlKey ||
                          e.shiftKey ||
                          e.altKey
                        ) return;
                        e.preventDefault();
                        openComp(c);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="comp-month-list">
                  {byMonth.map(([month, items]) => (
                    <div key={month} className="comp-month-group">
                      <div className="comp-month-header">
                        <span className="comp-month-name">{MONTH_KR[month]}</span>
                        <span className="comp-month-meta mono">
                          {new Date(items[0].date).getFullYear()} · {items.length}개
                        </span>
                      </div>
                      <div className="comp-list">
                        {items.map((c) => (
                          <CompRow
                            key={c.id}
                            comp={c}
                            onOpen={openComp}
                            isSaved={saved.includes(c.id)}
                            onToggleSave={toggleSave}
                            today={today}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageMain>
  );
}
