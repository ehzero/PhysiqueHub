"use client";

import { Competition, Filters } from "@/lib/data";
import { Icons } from "./Icons";
import { CompRow } from "./CompRow";
import { FilterRail } from "./FilterRail";

interface ListViewProps {
  comps: Competition[];
  allComps: Competition[];
  saved: string[];
  toggleSave: (id: string) => void;
  openComp: (c: Competition) => void;
  filters: Filters;
  setFilters: (fn: (f: Filters) => Filters) => void;
  search: string;
  setSearch: (s: string) => void;
}

export function ListView({
  comps,
  allComps,
  saved,
  toggleSave,
  openComp,
  filters,
  setFilters,
  search,
  setSearch,
}: ListViewProps) {
  return (
    <main>
      <section className="page-head">
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 className="page-title">
                대회 탐색
                <span
                  style={{
                    color: "var(--ink-4)",
                    fontFamily: "var(--mono)",
                    fontSize: "0.56em",
                    marginLeft: 10,
                    letterSpacing: 0,
                  }}
                >
                  {comps.length}
                </span>
              </h1>
              <p className="page-subtitle">필터와 검색으로 출전할 무대를 빠르게 찾아보세요.</p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div className="search-box">
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
        </div>
      </section>

      <div className="container">
        <div className="list-layout">
          <FilterRail
            filters={filters}
            setFilters={setFilters}
            allComps={allComps}
          />
          <div>
            {comps.length === 0 ? (
              <div
                style={{
                  padding: "80px 20px",
                  textAlign: "center",
                  border: "1px dashed var(--line-soft)",
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 12 }}>NO RESULTS</div>
                <p style={{ fontSize: 18, marginBottom: 16 }}>조건에 맞는 대회가 없습니다.</p>
                <button className="cta-btn" onClick={() => setFilters(() => ({}))}>
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="comp-list">
                {comps.map((c) => (
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
          </div>
        </div>
      </div>
    </main>
  );
}
