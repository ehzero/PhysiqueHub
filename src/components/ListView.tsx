"use client";

import { Competition, Filters } from "@/lib/data";
import type { CompetitionFilterOptions } from "@/lib/competition-public";
import { Icons } from "./Icons";
import { CompRow } from "./CompRow";
import { FilterRail } from "./FilterRail";
import { EmptyState, PageMain } from "./PageLayout";

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
  today: Date | null;
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
  today,
}: ListViewProps) {
  const resultCountLabel = comps.length.toLocaleString("ko-KR");
  void allComps;

  return (
    <PageMain className="competition-index">
      <section className="competition-list-section">
        <div className="container">
          <div className="competition-section-head">
            <div>
              <div className="hub-eyebrow" style={{ color: "#B85C3C" }}>
                대회 목록
              </div>
              <h1 className="hub-h2">
                대회 일정을 조건별로 찾아보세요.
              </h1>
              <p className="hub-section-body" style={{ color: "#86827C" }}>
                필터 상태를 조정해 원하는 피트니스·보디빌딩 대회를 찾아보세요.
              </p>
            </div>
            <div className="competition-head-side">
              <div className="competition-result-count">
                <small>검색 결과</small>
                <span>{resultCountLabel}</span>
              </div>
              <div className="nav-search-pill competition-search-input">
                {Icons.search}
                <input
                  placeholder="대회명, 단체, 지역 검색…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")}>{Icons.close}</button>
                )}
              </div>
            </div>
          </div>

          <div className="list-layout">
            <FilterRail
              filters={filters}
              setFilters={setFilters}
              allComps={allComps}
              filterOptions={filterOptions}
            />
            <div>
              {comps.length === 0 ? (
                <EmptyState
                  eyebrow="NO RESULTS"
                  title="조건에 맞는 대회가 없습니다."
                  action={
                    <button
                      className="cta-btn"
                      onClick={() => setFilters(() => ({}))}
                    >
                      필터 초기화
                    </button>
                  }
                />
              ) : (
                <div className="comp-list">
                  {comps.map((c) => (
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
              )}
            </div>
          </div>
        </div>
      </section>
    </PageMain>
  );
}
