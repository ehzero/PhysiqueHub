"use client";

import { Fragment, useMemo, useState, useRef, useEffect, type PointerEvent } from "react";
import { Competition, Filters } from "@/lib/data";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import type { CompetitionFilterOptions } from "@/lib/competition-public";
import type { CompetitionLocationScope } from "@/lib/filter-query";
import { Icons } from "./Icons";
import { AdInquiryBanner } from "./AdInquiryBanner";
import { CompRow } from "./CompRow";
import { CompetitionGridCard } from "./CompetitionListItem";
import { FilterRail } from "./FilterRail";
import { EmptyState, PageMain } from "./PageLayout";
import { Intro, SegmentButton, StickyControlBar } from "./UIPrimitives";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

const MONTH_KR = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const INLINE_AD_AFTER_INDEX = 2;

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
  const searchReadyRef = useRef(false);
  const filterReadyRef = useRef(false);
  const lastFilterSignatureRef = useRef("");
  const searchAnalyticsContextRef = useRef({
    activeFilterCount: 0,
    resultCount: 0,
    scope,
  });

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
  const inlineAdAfterCompetitionId =
    sorted.length > 0
      ? sorted[Math.min(INLINE_AD_AFTER_INDEX, sorted.length - 1)].id
      : null;

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
  const activeFilterCount = activeFilterChips.length + (scope !== "all" ? 1 : 0);
  const filterSignature = JSON.stringify({ filters, scope });

  useEffect(() => {
    searchAnalyticsContextRef.current = {
      activeFilterCount,
      resultCount: sorted.length,
      scope,
    };
  }, [activeFilterCount, scope, sorted.length]);

  useEffect(() => {
    if (!searchReadyRef.current) {
      searchReadyRef.current = true;
      return;
    }

    const query = search.trim();
    if (!query) return;

    const timer = window.setTimeout(() => {
      const context = searchAnalyticsContextRef.current;
      trackAnalyticsEvent("search_performed", {
        searchQuery: query,
        resultCount: context.resultCount,
        properties: {
          scope: context.scope,
          activeFilterCount: context.activeFilterCount,
        },
      });

      if (context.resultCount === 0) {
        trackAnalyticsEvent("empty_search_result", {
          searchQuery: query,
          resultCount: 0,
          properties: {
            scope: context.scope,
            activeFilterCount: context.activeFilterCount,
          },
        });
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!filterReadyRef.current) {
      filterReadyRef.current = true;
      lastFilterSignatureRef.current = filterSignature;
      return;
    }

    if (lastFilterSignatureRef.current === filterSignature) return;
    lastFilterSignatureRef.current = filterSignature;

    const appliedFilterLabels = [
      ...activeFilterChips.map((chip) => chip.label),
      ...(scope === "all" ? [] : [scope === "domestic" ? "국내 대회" : "해외 대회"]),
    ];

    trackAnalyticsEvent(activeFilterCount > 0 ? "filter_applied" : "filter_reset", {
      searchQuery: search || undefined,
      resultCount: sorted.length,
      properties: {
        scope,
        activeFilterCount,
        // 어떤 필터가 켜졌는지 어드민 "상위 필터" 집계용으로 라벨을 구분자로 이어 기록.
        // 주최/지역/종목 라벨은 자유 문자열이라 '|' 같은 흔한 문자는 충돌 위험이 있어,
        // 라벨에 절대 나오지 않는 제어문자 US(\x1f)로 구분한다(서버도 동일 분리).
        // filter_reset(0개)일 때는 의미가 없어 생략한다.
        ...(activeFilterCount > 0
          ? { filterKeys: appliedFilterLabels.join("\u001f") }
          : {}),
      },
    });

    if (activeFilterCount > 0 && sorted.length === 0) {
      trackAnalyticsEvent("empty_search_result", {
        searchQuery: search || undefined,
        resultCount: 0,
        properties: {
          scope,
          activeFilterCount,
        },
      });
    }
  }, [activeFilterChips, activeFilterCount, filterSignature, scope, search, sorted.length]);

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
      <div className="ph-page-surface lv-head">
        <div className="container">
          <Intro
            eyebrow="전체 대회 · By Schedule"
            title={
              <>
                2026 피트니스·보디빌딩{" "}
                <span className="ph-accent-text">대회 일정</span>
              </>
            }
            description={description}
            level={1}
            variant="page"
            classNames={{
              eyebrow: "lv-eyebrow",
              title: "lv-title",
              description: "lv-sub",
            }}
          />
        </div>
      </div>

      {/* ── Sticky segment bar ─────────────────────────────── */}
      <StickyControlBar className="lv-segbar" containerClassName="container lv-segrow">
          <div className="lv-segs">
            {segmentTabs.map((t) => (
              <SegmentButton
                key={t.id}
                active={scope === t.id}
                className="lv-seg"
                onClick={() => setScope(t.id)}
              >
                {t.label}
                <span className="cnt mono">{t.count}</span>
              </SegmentButton>
            ))}
          </div>
          <span className="lv-segcount mono">
            결과 <b>{sorted.length.toLocaleString("ko-KR")}</b>개
          </span>
      </StickyControlBar>

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
                            if (sortKey === opt.key) {
                              setSortOpen(false);
                              return;
                            }
                            setSortKey(opt.key);
                            setSortOpen(false);
                            trackAnalyticsEvent("sort_changed", {
                              resultCount: sorted.length,
                              properties: {
                                sortKey: opt.key,
                              },
                            });
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
                    onClick={() => {
                      if (viewMode === "list") return;
                      setViewMode("list");
                      trackAnalyticsEvent("view_mode_changed", {
                        resultCount: sorted.length,
                        properties: {
                          viewMode: "list",
                        },
                      });
                    }}
                    aria-label="리스트 뷰"
                    title="리스트 뷰"
                  >
                    {Icons.list}
                  </button>
                  <button
                    className={viewMode === "grid" ? "is-active" : ""}
                    onClick={() => {
                      if (viewMode === "grid") return;
                      setViewMode("grid");
                      trackAnalyticsEvent("view_mode_changed", {
                        resultCount: sorted.length,
                        properties: {
                          viewMode: "grid",
                        },
                      });
                    }}
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
                  <Fragment key={c.id}>
                    <CompetitionGridCard
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
                    {inlineAdAfterCompetitionId === c.id && (
                      <AdInquiryBanner
                        className="lv-grid-inline-ad"
                        source="competition_grid_inline_ad"
                      />
                    )}
                  </Fragment>
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
                        <Fragment key={c.id}>
                          <CompRow
                            comp={c}
                            onOpen={openComp}
                            isSaved={saved.includes(c.id)}
                            onToggleSave={toggleSave}
                            today={today}
                          />
                          {inlineAdAfterCompetitionId === c.id && (
                            <>
                              <AdInquiryBanner
                                className="lv-list-inline-ad"
                                source="competition_list_inline_ad"
                              />
                              <AdInquiryBanner
                                className="lv-list-mobile-ad"
                                source="competition_list_mobile_ad"
                              />
                            </>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AdInquiryBanner
            className="lv-ad-rail"
            source="competition_list_ad_rail"
            title="광고 문의"
            description="헬스·웨이트 트레이닝 관심층이 모이는 화면에 브랜드를 노출하세요."
          />
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
