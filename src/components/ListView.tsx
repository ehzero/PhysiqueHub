"use client";

import { Competition, Filters } from "@/lib/data";
import type { CompetitionFilterOptions } from "@/lib/competition-public";
import { Icons } from "./Icons";
import { CompRow } from "./CompRow";
import { FilterRail } from "./FilterRail";
import { EmptyState, PageHeader, PageMain } from "./PageLayout";

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
  return (
    <PageMain>
      <PageHeader
        title="대회 목록"
        subtitle="필터와 검색으로 출전할 무대를 빠르게 찾아보세요."
        count={comps.length}
        actions={
          <div className="search-box">
            {Icons.search}
            <input
              placeholder="대회명, 단체, 지역 검색…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")}>{Icons.close}</button>}
          </div>
        }
      />

      <div className="container">
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
                  <button className="cta-btn" onClick={() => setFilters(() => ({ }))}>
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
    </PageMain>
  );
}
