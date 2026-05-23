"use client";

import {
  Competition,
  Filters,
} from "@/lib/data";
import type { CompetitionFilterOptions } from "@/lib/competition-public";
import { FilterOption } from "./FilterOption";

interface FilterRailProps {
  filters: Filters;
  setFilters: (fn: (f: Filters) => Filters) => void;
  allComps: Competition[];
  filterOptions?: CompetitionFilterOptions;
}

export function FilterRail({
  filters,
  setFilters,
  allComps,
  filterOptions,
}: FilterRailProps) {
  void allComps;
  const regions = filterOptions?.regions ?? [];
  const orgs =
    filterOptions?.organizations.map((organization) => ({
      name: organization.name,
      count: organization.count,
    })) ?? [];
  const categories = filterOptions?.categories ?? [];
  const flags = filterOptions?.flags;

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
        <h4>주최 단체 <span className="cnt">{orgs.length}</span></h4>
        <div className="filter-options">
          {!filterOptions && (
            <FilterOption on={false} onClick={() => setFilters((f) => ({ ...f, orgs: [] }))} count={0}>
              전체 단체
            </FilterOption>
          )}
          {orgs.map((o) => (
            <FilterOption key={o.name} on={isOn("orgs", o.name)} onClick={() => toggle("orgs", o.name)} count={o.count}>
              {o.name}
            </FilterOption>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>지역 <span className="cnt">{regions.length}</span></h4>
        <div className="filter-options">
          {!filterOptions && (
            <FilterOption on={false} onClick={() => setFilters((f) => ({ ...f, regions: [] }))} count={0}>
              전체 지역
            </FilterOption>
          )}
          {regions.map((r) => (
            <FilterOption key={r.name} on={isOn("regions", r.name)} onClick={() => toggle("regions", r.name)} count={r.count}>
              {r.name}
            </FilterOption>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>종목 <span className="cnt">{categories.length}</span></h4>
        <div className="filter-options">
          {!filterOptions && (
            <FilterOption on={false} onClick={() => setFilters((f) => ({ ...f, cats: [] }))} count={0}>
              전체 카테고리
            </FilterOption>
          )}
          {categories.map((c) => (
            <FilterOption key={c.name} on={isOn("cats", c.name)} onClick={() => toggle("cats", c.name)} count={c.count}>
              {c.name}
            </FilterOption>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>접수 상태</h4>
        <div className="filter-options">
          {(["open", "urgent", "soon", "closed", "unknown"] as const).map((k) => {
            const labels = { open: "접수 중", urgent: "마감 임박", soon: "접수 예정", closed: "마감", unknown: "확인 필요" };
            return (
              <FilterOption key={k} on={isOn("status", k)} onClick={() => toggle("status", k)}>
                {labels[k]}
              </FilterOption>
            );
          })}
        </div>
      </div>

      <div className="filter-group">
        <h4>대회 유형</h4>
        <div className="filter-options">
          <FilterOption
            count={flags?.natural}
            on={!!filters.natural}
            onClick={() => setFilters((f) => ({ ...f, natural: !f.natural }))}
          >
            내추럴
          </FilterOption>
          <FilterOption
            count={flags?.beginnerAny}
            on={!!filters.beginner}
            onClick={() => setFilters((f) => ({ ...f, beginner: !f.beginner }))}
          >
            루키·입문
          </FilterOption>
          <FilterOption
            count={flags?.regional}
            on={!!filters.regional}
            onClick={() => setFilters((f) => ({ ...f, regional: !f.regional }))}
          >
            리저널
          </FilterOption>
          <FilterOption
            count={flags?.proPath}
            on={!!filters.proPath}
            onClick={() => setFilters((f) => ({ ...f, proPath: !f.proPath }))}
          >
            프로카드·퀄리파이어
          </FilterOption>
          <FilterOption
            count={flags?.internationalRoute}
            on={!!filters.internationalRoute}
            onClick={() => setFilters((f) => ({ ...f, internationalRoute: !f.internationalRoute }))}
          >
            국제·대표 루트
          </FilterOption>
        </div>
      </div>

      <button
        className="filter-opt filter-reset"
        onClick={() => setFilters(() => ({}))}
      >
        필터 초기화
      </button>
    </aside>
  );
}
