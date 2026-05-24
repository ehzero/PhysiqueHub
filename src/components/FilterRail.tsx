"use client";

import {
  Competition,
  Filters,
} from "@/lib/data";
import {
  COMPETITION_TIER_LABELS,
  COMPETITION_TIERS,
  type CompetitionTier,
} from "@/lib/competition-classification";
import type { CompetitionFilterOptions } from "@/lib/competition-public";
import { FilterOption } from "./FilterOption";

type AttributeFlagKey =
  | "global"
  | "major"
  | "nationalSelection"
  | "nationalTeamEvent"
  | "nationalSportsFestival";
type TypeFlagKey = AttributeFlagKey | "beginner" | "natural";

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
  const regions = filterOptions?.regions ?? [];
  const orgs =
    filterOptions?.organizations.map((organization) => ({
      name: organization.name,
      count: organization.count,
    })) ?? [];
  const categories = filterOptions?.categories ?? [];
  const flags = filterOptions?.flags;
  const tiers = filterOptions?.tiers ?? getTierCounts(allComps);
  const attributes = filterOptions?.attributes ?? getAttributeCounts(allComps);
  const statusOptions = (["open", "urgent", "soon", "closed", "unknown"] as const).map(
    (key) => ({
      key,
      label: {
        open: "접수 중",
        urgent: "마감 임박",
        soon: "접수 예정",
        closed: "마감",
        unknown: "확인 필요",
      }[key],
    }),
  );
  const tierOptions: {
    key: CompetitionTier;
    label: string;
    count?: number;
  }[] = COMPETITION_TIERS.map((tier) => ({
    key: tier,
    label: COMPETITION_TIER_LABELS[tier],
    count: tiers[tier],
  }));
  const attributeOptions: {
    key: TypeFlagKey;
    label: string;
    count?: number;
  }[] = [
    { key: "global", label: "글로벌", count: attributes.global },
    { key: "major", label: "메이저", count: attributes.major },
    {
      key: "nationalSelection",
      label: "국가대표 선발",
      count: attributes.nationalSelection,
    },
    {
      key: "nationalTeamEvent",
      label: "국가대표전",
      count: attributes.nationalTeamEvent,
    },
    {
      key: "nationalSportsFestival",
      label: "전국체전",
      count: attributes.nationalSportsFestival,
    },
    { key: "beginner", label: "입문·루키", count: attributes.beginner },
    { key: "natural", label: "내추럴", count: flags?.natural },
  ];
  const activeCounts = {
    orgs: filters.orgs?.length ?? 0,
    regions: filters.regions?.length ?? 0,
    cats: filters.cats?.length ?? 0,
    status: filters.status?.length ?? 0,
    tiers: filters.tiers?.length ?? 0,
    attributes: attributeOptions.filter((option) => filters[option.key]).length,
  };
  const activeTotal = Object.values(activeCounts).reduce(
    (total, count) => total + count,
    0,
  );

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

  function toggleTier(key: CompetitionTier) {
    setFilters((f) => {
      const current = new Set(f.tiers ?? []);
      if (current.has(key)) current.delete(key); else current.add(key);
      return { ...f, tiers: Array.from(current) };
    });
  }

  function toggleFlag(key: TypeFlagKey) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <aside className="filter-rail" aria-label="대회 필터">
      <div className="filter-mobile">
        <div className="filter-mobile-head">
          <div>
            <span className="filter-mobile-kicker">FILTERS</span>
            <strong>필터 {activeTotal > 0 ? activeTotal : "전체"}</strong>
          </div>
          <button
            className="filter-mobile-reset"
            onClick={() => setFilters(() => ({}))}
          >
            초기화
          </button>
        </div>

        <div className="filter-mobile-groups">
          <details className="filter-mobile-group">
            <summary>
              주최 단체
              <span>{activeCounts.orgs || orgs.length}</span>
            </summary>
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
          </details>

          <details className="filter-mobile-group">
            <summary>
              지역
              <span>{activeCounts.regions || regions.length}</span>
            </summary>
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
          </details>

          <details className="filter-mobile-group">
            <summary>
              종목
              <span>{activeCounts.cats || categories.length}</span>
            </summary>
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
          </details>

          <details className="filter-mobile-group">
            <summary>
              접수 상태
              <span>{activeCounts.status || statusOptions.length}</span>
            </summary>
            <div className="filter-options">
              {statusOptions.map((option) => (
                <FilterOption key={option.key} on={isOn("status", option.key)} onClick={() => toggle("status", option.key)}>
                  {option.label}
                </FilterOption>
              ))}
            </div>
          </details>

          <details className="filter-mobile-group">
            <summary>
              대회 티어
              <span>{activeCounts.tiers || tierOptions.length}</span>
            </summary>
            <div className="filter-options">
              {tierOptions.map((option) => (
                <FilterOption
                  key={option.key}
                  count={option.count}
                  on={!!filters.tiers?.includes(option.key)}
                  onClick={() => toggleTier(option.key)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </div>
          </details>

          <details className="filter-mobile-group">
            <summary>
              보조 속성
              <span>{activeCounts.attributes || attributeOptions.length}</span>
            </summary>
            <div className="filter-options">
              {attributeOptions.map((option) => (
                <FilterOption
                  key={option.key}
                  count={option.count}
                  on={!!filters[option.key]}
                  onClick={() => toggleFlag(option.key)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </div>
          </details>
        </div>
      </div>

      <div className="filter-desktop">
        <div className="filter-group">
          <h4>
            주최 단체 <span className="cnt">{orgs.length}</span>
          </h4>
          <div className="filter-options">
            {!filterOptions && (
              <FilterOption
                on={false}
                onClick={() => setFilters((f) => ({ ...f, orgs: [] }))}
                count={0}
              >
                전체 단체
              </FilterOption>
            )}
            {orgs.map((o) => (
              <FilterOption
                key={o.name}
                on={isOn("orgs", o.name)}
                onClick={() => toggle("orgs", o.name)}
                count={o.count}
              >
                {o.name}
              </FilterOption>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>
            지역 <span className="cnt">{regions.length}</span>
          </h4>
          <div className="filter-options">
            {!filterOptions && (
              <FilterOption
                on={false}
                onClick={() => setFilters((f) => ({ ...f, regions: [] }))}
                count={0}
              >
                전체 지역
              </FilterOption>
            )}
            {regions.map((r) => (
              <FilterOption
                key={r.name}
                on={isOn("regions", r.name)}
                onClick={() => toggle("regions", r.name)}
                count={r.count}
              >
                {r.name}
              </FilterOption>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>
            종목 <span className="cnt">{categories.length}</span>
          </h4>
          <div className="filter-options">
            {!filterOptions && (
              <FilterOption
                on={false}
                onClick={() => setFilters((f) => ({ ...f, cats: [] }))}
                count={0}
              >
                전체 카테고리
              </FilterOption>
            )}
            {categories.map((c) => (
              <FilterOption
                key={c.name}
                on={isOn("cats", c.name)}
                onClick={() => toggle("cats", c.name)}
                count={c.count}
              >
                {c.name}
              </FilterOption>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>접수 상태</h4>
          <div className="filter-options">
            {statusOptions.map((option) => (
              <FilterOption
                key={option.key}
                on={isOn("status", option.key)}
                onClick={() => toggle("status", option.key)}
              >
                {option.label}
              </FilterOption>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>대회 티어</h4>
          <div className="filter-options">
            {tierOptions.map((option) => (
              <FilterOption
                key={option.key}
                count={option.count}
                on={!!filters.tiers?.includes(option.key)}
                onClick={() => toggleTier(option.key)}
              >
                {option.label}
              </FilterOption>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>보조 속성</h4>
          <div className="filter-options">
            {attributeOptions.map((option) => (
              <FilterOption
                key={option.key}
                count={option.count}
                on={!!filters[option.key]}
                onClick={() => toggleFlag(option.key)}
              >
                {option.label}
              </FilterOption>
            ))}
          </div>
        </div>

        <button
          className="filter-opt filter-reset"
          onClick={() => setFilters(() => ({}))}
        >
          필터 초기화
        </button>
      </div>
    </aside>
  );
}

function getTierCounts(comps: Competition[]) {
  return Object.fromEntries(
    COMPETITION_TIERS.map((tier) => [
      tier,
      comps.filter((competition) => competition.tier === tier).length,
    ]),
  ) as Record<CompetitionTier, number>;
}

function getAttributeCounts(comps: Competition[]) {
  return {
    global: comps.filter((competition) => competition.attributes.global).length,
    major: comps.filter((competition) => competition.attributes.major).length,
    nationalSelection: comps.filter(
      (competition) => competition.attributes.nationalSelection,
    ).length,
    nationalTeamEvent: comps.filter(
      (competition) => competition.attributes.nationalTeamEvent,
    ).length,
    nationalSportsFestival: comps.filter(
      (competition) => competition.attributes.nationalSportsFestival,
    ).length,
    beginner: comps.filter((competition) => competition.attributes.beginner).length,
  };
}
