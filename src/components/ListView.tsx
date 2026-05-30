"use client";

import { useMemo, useState, useRef, useEffect, type PointerEvent } from "react";
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
  const [sortOpen, setSortOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetDraggingRef = useRef(false);
  const sheetDragStartYRef = useRef(0);
  const sheetDragOffsetRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortDropRef.current && !sortDropRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  useEffect(() => {
    if (!filterSheetOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousRootOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior = previousRootOverscroll;
    };
  }, [filterSheetOpen]);

  const closeFilterSheet = () => {
    setFilterSheetOpen(false);
    setSheetDragging(false);
    sheetDraggingRef.current = false;
    setSheetDragOffset(0);
    sheetDragOffsetRef.current = 0;
  };

  const handleSheetDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (!filterSheetOpen) return;
    if ((event.target as HTMLElement).closest("button")) return;

    event.preventDefault();
    sheetDragStartYRef.current = event.clientY;
    sheetDragOffsetRef.current = 0;
    setSheetDragOffset(0);
    setSheetDragging(true);
    sheetDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetDragMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!sheetDraggingRef.current) return;

    event.preventDefault();
    const offset = Math.max(0, event.clientY - sheetDragStartYRef.current);
    sheetDragOffsetRef.current = offset;
    setSheetDragOffset(offset);
  };

  const handleSheetDragEnd = () => {
    if (!sheetDraggingRef.current) return;

    const shouldClose = sheetDragOffsetRef.current > 48;
    setSheetDragging(false);
    sheetDraggingRef.current = false;
    setSheetDragOffset(0);
    sheetDragOffsetRef.current = 0;

    if (shouldClose) {
      setFilterSheetOpen(false);
    }
  };

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
    const groups = new Map<string, Competition[]>();
    for (const c of sorted) {
      const d = new Date(c.date + "T00:00:00");
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return Array.from(groups.entries()).map(([key, items]) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month, items };
    });
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

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "date", label: "빠른 일정순" },
    { key: "deadline", label: "접수 마감순" },
  ];
  const currentSortLabel = sortOptions.find((o) => o.key === sortKey)?.label ?? sortOptions[0].label;

  return (
    <PageMain className="competition-index">
      {/* ── Page head ─────────────────────────────────────── */}
      <div className="lv-head">
        <div className="container">
          <span className="hub-eyebrow lv-eyebrow">전체 대회 · By Schedule</span>
          <h1 className="lv-title">
            보디빌딩·피트니스 대회 목록을{" "}
            <span style={{ color: ACCENT }}>한눈에.</span>
          </h1>
          <p className="lv-sub">{description}</p>
        </div>
      </div>

      {/* ── Sticky segment bar ─────────────────────────────── */}
      <div className="lv-segbar">
        <div className="container lv-segrow">
          <div className="lv-segs">
            {segmentTabs.map((t) => (
              <button
                key={t.id}
                className={`lv-seg${scope === t.id ? " is-active" : ""}`}
                onClick={() => setScope(t.id)}
              >
                {t.label}
                <span className="cnt mono">{t.count}</span>
              </button>
            ))}
          </div>
          <span className="lv-segcount mono">
            결과 <b>{sorted.length.toLocaleString("ko-KR")}</b>개
          </span>
        </div>
      </div>

      {/* ── Body: filter rail + main content ───────────────── */}
      <div className="lv-body-wrap">
        <div className="container lv-body-grid">
          <FilterRail
            filters={filters}
            setFilters={setFilters}
            allComps={allComps}
            today={today}
            filterOptions={filterOptions}
          />

          <div className="lv-main">
            {/* Toolbar: search + sort controls */}
            <div className="lv-toolbar">
              {/* Search bar */}
              <label className="lv-search">
                <span className="lv-search-ico">{Icons.search}</span>
                <input
                  ref={searchInputRef}
                  className="lv-search-input"
                  placeholder="대회명·단체·지역으로 검색 (예: IFBB Pro, KBBF, 서울)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="lv-search-clear"
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    {Icons.close}
                  </button>
                )}
                <kbd className="lv-search-kbd">⌘ K</kbd>
              </label>

              {/* Sort + view toggle */}
              <div className="lv-sort">
                {/* Mobile filter button */}
                <button
                  className="lv-filter-btn"
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  aria-label="필터 열기"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
                  필터
                  {activeFilterChips.length > 0 && (
                    <span className="fb-count mono">{activeFilterChips.length}</span>
                  )}
                </button>
                <span className="lv-sort-spacer" />

                {/* Sort dropdown */}
                <div className="lv-sortdrop" ref={sortDropRef}>
                  <button
                    className="lv-sortdrop-btn"
                    onClick={() => setSortOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    <span className="lv-sortdrop-ico">{Icons.sort}</span>
                    <span>{currentSortLabel}</span>
                    <span className={`lv-sortdrop-chev${sortOpen ? " open" : ""}`}>
                      {Icons.chevronDown}
                    </span>
                  </button>
                  {sortOpen && (
                    <div className="lv-sortdrop-menu" role="listbox">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.key}
                          className={`lv-sortopt${sortKey === opt.key ? " is-active" : ""}`}
                          role="option"
                          aria-selected={sortKey === opt.key}
                          onClick={() => {
                            setSortKey(opt.key);
                            setSortOpen(false);
                          }}
                        >
                          <span>{opt.label}</span>
                          {sortKey === opt.key && (
                            <span className="lv-sortopt-check">{Icons.check}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* View toggle */}
                <div className="lv-view">
                  <button
                    className={viewMode === "list" ? "is-active" : ""}
                    onClick={() => setViewMode("list")}
                    aria-label="리스트 뷰"
                    title="리스트 뷰"
                  >
                    {Icons.list}
                  </button>
                  <button
                    className={viewMode === "grid" ? "is-active" : ""}
                    onClick={() => setViewMode("grid")}
                    aria-label="그리드 뷰"
                    title="그리드 뷰"
                  >
                    {Icons.grid}
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="lv-active-chips">
                {activeFilterChips.map((chip) => (
                  <span key={chip.key} className="lv-chip">
                    {chip.label}
                    <button
                      className="lv-chip-remove"
                      onClick={chip.onRemove}
                      aria-label={`${chip.label} 필터 제거`}
                    >
                      {Icons.close}
                    </button>
                  </span>
                ))}
                <button
                  className="lv-chips-reset"
                  onClick={() => {
                    setFilters(() => ({}));
                    setSearch("");
                  }}
                >
                  모두 지우기
                </button>
              </div>
            )}

            {/* Results */}
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
                {byMonth.map(({ year, month, items }) => (
                  <div key={`${year}-${month}`} className="mo-group">
                    <div className="mo-head">
                      <span className="mo-name">
                        {year}년 {MONTH_KR[month]}
                        <span className="mono mo-name-sub">
                          {" "}{year}.{String(month + 1).padStart(2, "0")}
                        </span>
                      </span>
                      <span className="mo-cnt mono">{items.length}개</span>
                    </div>
                    <div className="lv-list">
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
      {/* Mobile filter bottom sheet */}
      <div
        className={`lv-sheet-backdrop${filterSheetOpen ? " is-open" : ""}`}
        onClick={closeFilterSheet}
        aria-hidden="true"
      />
      <div
        className={`lv-sheet${filterSheetOpen ? " is-open" : ""}${sheetDragging ? " is-dragging" : ""}`}
        style={sheetDragOffset > 0 ? { transform: `translateY(${sheetDragOffset}px)` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="필터"
      >
        <div
          className="lv-sheet-grip"
          onPointerDown={handleSheetDragStart}
          onPointerMove={handleSheetDragMove}
          onPointerUp={handleSheetDragEnd}
          onPointerCancel={handleSheetDragEnd}
        >
          <span className="lv-sheet-bar" />
          <button
            className="lv-sheet-x"
            type="button"
            onClick={closeFilterSheet}
            aria-label="필터 닫기"
          >
            {Icons.close}
          </button>
        </div>
        <div className="lv-sheet-body">
          <FilterRail
            filters={filters}
            setFilters={setFilters}
            allComps={allComps}
            today={today}
            filterOptions={filterOptions}
          />
        </div>
        <div className="lv-sheet-foot">
          <button
            className="lv-sheet-apply"
            type="button"
            onClick={closeFilterSheet}
          >
            결과 <b>{sorted.length.toLocaleString("ko-KR")}</b>개 보기
          </button>
        </div>
      </div>
    </PageMain>
  );
}
