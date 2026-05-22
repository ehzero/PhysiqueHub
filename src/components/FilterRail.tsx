"use client";

import {
  Competition,
  Filters,
  REGIONS,
  ORGS_ALL,
  CATEGORIES_ALL,
} from "@/lib/data";
import { Icons } from "./Icons";

interface FilterRailProps {
  filters: Filters;
  setFilters: (fn: (f: Filters) => Filters) => void;
  allComps: Competition[];
}

function FilterOption({
  on,
  onClick,
  children,
  count,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button className={`filter-opt ${on ? "on" : ""}`} onClick={onClick}>
      <span className="check">{Icons.check}</span>
      <span>{children}</span>
      {count !== undefined && <span className="cnt">{count}</span>}
    </button>
  );
}

export function FilterRail({ filters, setFilters, allComps }: FilterRailProps) {
  const byRegion: Record<string, number> = {};
  const byCat: Record<string, number> = {};
  const byOrg: Record<string, number> = {};

  allComps.forEach((c) => {
    byRegion[c.region] = (byRegion[c.region] || 0) + 1;
    c.categories.forEach((cat) => { byCat[cat] = (byCat[cat] || 0) + 1; });
    byOrg[c.org] = (byOrg[c.org] || 0) + 1;
  });

  function toggle(group: "regions" | "orgs" | "cats" | "status", val: string) {
    setFilters((f) => {
      const cur = new Set<string>(f[group] || []);
      if (cur.has(val)) cur.delete(val); else cur.add(val);
      return { ...f, [group]: Array.from(cur) };
    });
  }

  function isOn(group: "regions" | "orgs" | "cats" | "status", val: string) {
    return (filters[group] || []).includes(val);
  }

  return (
    <aside className="filter-rail">
      <div className="filter-group">
        <h4>지역 <span className="cnt">{REGIONS.length}</span></h4>
        <div className="filter-options">
          {REGIONS.map((r) => (
            <FilterOption key={r} on={isOn("regions", r)} onClick={() => toggle("regions", r)} count={byRegion[r] || 0}>
              {r}
            </FilterOption>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>주최 단체 <span className="cnt">{ORGS_ALL.length}</span></h4>
        <div className="filter-options">
          {ORGS_ALL.map((o) => (
            <FilterOption key={o} on={isOn("orgs", o)} onClick={() => toggle("orgs", o)} count={byOrg[o] || 0}>
              {o}
            </FilterOption>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>종목 <span className="cnt">{CATEGORIES_ALL.length}</span></h4>
        <div className="filter-options">
          {CATEGORIES_ALL.map((c) => (
            <FilterOption key={c} on={isOn("cats", c)} onClick={() => toggle("cats", c)} count={byCat[c] || 0}>
              {c}
            </FilterOption>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>접수 상태</h4>
        <div className="filter-options">
          {(["open", "urgent", "soon", "closed"] as const).map((k) => {
            const labels = { open: "접수 중", urgent: "마감 임박", soon: "접수 예정", closed: "마감" };
            return (
              <FilterOption key={k} on={isOn("status", k)} onClick={() => toggle("status", k)}>
                {labels[k]}
              </FilterOption>
            );
          })}
        </div>
      </div>

      <div className="filter-group">
        <h4>기타</h4>
        <div className="filter-options">
          <FilterOption on={!!filters.beginner} onClick={() => setFilters((f) => ({ ...f, beginner: !f.beginner }))}>
            입문자 환영 대회
          </FilterOption>
          <FilterOption on={!!filters.natural} onClick={() => setFilters((f) => ({ ...f, natural: !f.natural }))}>
            내추럴 대회만
          </FilterOption>
          <FilterOption on={!!filters.savedOnly} onClick={() => setFilters((f) => ({ ...f, savedOnly: !f.savedOnly }))}>
            관심 저장 대회만
          </FilterOption>
        </div>
      </div>

      <button
        className="filter-opt"
        onClick={() => setFilters(() => ({}))}
        style={{ justifyContent: "center", padding: "12px", border: "1px solid var(--line-soft)", color: "var(--ink-3)" }}
      >
        필터 초기화
      </button>
    </aside>
  );
}
