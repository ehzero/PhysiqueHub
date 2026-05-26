"use client";

import type { ReactNode } from "react";
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
  const classFilters = filterOptions?.classFilters ?? getClassFilterCounts(allComps);
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
    ageGroups: filters.ageGroups?.length ?? 0,
    experienceClasses: filters.experienceClasses?.length ?? 0,
    measurementClasses: filters.measurementClasses?.length ?? 0,
    classTexts: filters.classTexts?.length ?? 0,
    status: filters.status?.length ?? 0,
    tiers: filters.tiers?.length ?? 0,
    attributes: attributeOptions.filter((option) => filters[option.key]).length,
  };
  const activeTotal = Object.values(activeCounts).reduce(
    (total, count) => total + count,
    0,
  );

  function toggle(
    group:
      | "regions"
      | "orgs"
      | "cats"
      | "ageGroups"
      | "experienceClasses"
      | "measurementClasses"
      | "classTexts"
      | "status",
    val: string,
  ) {
    setFilters((f) => {
      const cur = new Set<string>(f[group] || []);
      if (cur.has(val)) cur.delete(val); else cur.add(val);
      return { ...f, [group]: Array.from(cur) };
    });
  }

  function isOn(
    group:
      | "regions"
      | "orgs"
      | "cats"
      | "ageGroups"
      | "experienceClasses"
      | "measurementClasses"
      | "classTexts"
      | "status",
    val: string,
  ) {
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
              세부 클래스
              <span>
                {activeCounts.ageGroups +
                  activeCounts.experienceClasses +
                  activeCounts.measurementClasses +
                  activeCounts.classTexts ||
                  classFilters.ageGroups.length +
                    classFilters.experienceClasses.length +
                    classFilters.measurementClasses.length +
                    classFilters.classTexts.length}
              </span>
            </summary>
            <div className="filter-options">
              <FilterSubheading>경력·오픈 클래스</FilterSubheading>
              {classFilters.experienceClasses.map((option) => (
                <FilterOption
                  key={option.name}
                  on={isOn("experienceClasses", option.name)}
                  onClick={() => toggle("experienceClasses", option.name)}
                  count={option.count}
                >
                  {option.label}
                </FilterOption>
              ))}
              <FilterSubheading>연령·자격</FilterSubheading>
              {classFilters.ageGroups.map((option) => (
                <FilterOption
                  key={option.name}
                  on={isOn("ageGroups", option.name)}
                  onClick={() => toggle("ageGroups", option.name)}
                  count={option.count}
                >
                  {option.label}
                </FilterOption>
              ))}
              <FilterSubheading>계측 기준</FilterSubheading>
              {classFilters.measurementClasses.map((option) => (
                <FilterOption
                  key={option.name}
                  on={isOn("measurementClasses", option.name)}
                  onClick={() => toggle("measurementClasses", option.name)}
                  count={option.count}
                >
                  {option.label}
                </FilterOption>
              ))}
              {classFilters.classTexts.length > 0 && (
                <FilterSubheading>원문 클래스</FilterSubheading>
              )}
              {classFilters.classTexts.map((option) => (
                <FilterOption
                  key={option.name}
                  on={isOn("classTexts", option.name)}
                  onClick={() => toggle("classTexts", option.name)}
                  count={option.count}
                >
                  {option.name}
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
              대회 유형
              <span>
                {activeCounts.tiers + activeCounts.attributes ||
                  tierOptions.length + attributeOptions.length}
              </span>
            </summary>
            <div className="filter-options">
              <FilterSubheading>티어</FilterSubheading>
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
              <FilterSubheading>속성</FilterSubheading>
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
          <h4>
            세부 클래스{" "}
            <span className="cnt">
              {classFilters.ageGroups.length +
                classFilters.experienceClasses.length +
                classFilters.measurementClasses.length +
                classFilters.classTexts.length}
            </span>
          </h4>
          <div className="filter-options">
            <FilterSubheading>경력·오픈 클래스</FilterSubheading>
            {classFilters.experienceClasses.map((option) => (
              <FilterOption
                key={option.name}
                on={isOn("experienceClasses", option.name)}
                onClick={() => toggle("experienceClasses", option.name)}
                count={option.count}
              >
                {option.label}
              </FilterOption>
            ))}
            <FilterSubheading>연령·자격</FilterSubheading>
            {classFilters.ageGroups.map((option) => (
              <FilterOption
                key={option.name}
                on={isOn("ageGroups", option.name)}
                onClick={() => toggle("ageGroups", option.name)}
                count={option.count}
              >
                {option.label}
              </FilterOption>
            ))}
            <FilterSubheading>계측 기준</FilterSubheading>
            {classFilters.measurementClasses.map((option) => (
              <FilterOption
                key={option.name}
                on={isOn("measurementClasses", option.name)}
                onClick={() => toggle("measurementClasses", option.name)}
                count={option.count}
              >
                {option.label}
              </FilterOption>
            ))}
            {classFilters.classTexts.length > 0 && (
              <FilterSubheading>원문 클래스</FilterSubheading>
            )}
            {classFilters.classTexts.map((option) => (
              <FilterOption
                key={option.name}
                on={isOn("classTexts", option.name)}
                onClick={() => toggle("classTexts", option.name)}
                count={option.count}
              >
                {option.name}
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
          <h4>
            대회 유형{" "}
            <span className="cnt">{tierOptions.length + attributeOptions.length}</span>
          </h4>
          <div className="filter-options">
            <FilterSubheading>티어</FilterSubheading>
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
            <FilterSubheading>속성</FilterSubheading>
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

function FilterSubheading({ children }: { children: ReactNode }) {
  return <div className="filter-subheading">{children}</div>;
}

function getClassFilterCounts(comps: Competition[]) {
  const ageGroups = new Map<string, { label: string; count: number }>();
  const experienceClasses = new Map<string, { label: string; count: number }>();
  const measurementClasses = new Map<string, { label: string; count: number }>();
  const classTexts = new Map<string, number>();

  for (const competition of comps) {
    const seenAge = new Set<string>();
    const seenExperience = new Set<string>();
    const seenMeasurement = new Set<string>();
    const seenClassTexts = new Set(competition.classTexts);

    for (const facet of competition.classFacets) {
      if (facet.type === "age") seenAge.add(facet.value);
      if (facet.type === "experience") seenExperience.add(facet.value);
      if (facet.type === "measurement") seenMeasurement.add(facet.value);
    }

    for (const value of seenAge) {
      const facet = competition.classFacets.find(
        (item) => item.type === "age" && item.value === value,
      );
      const current = ageGroups.get(value);
      ageGroups.set(value, {
        label: facet?.label ?? value,
        count: (current?.count ?? 0) + 1,
      });
    }
    for (const value of seenExperience) {
      const facet = competition.classFacets.find(
        (item) => item.type === "experience" && item.value === value,
      );
      const current = experienceClasses.get(value);
      experienceClasses.set(value, {
        label: facet?.label ?? value,
        count: (current?.count ?? 0) + 1,
      });
    }
    for (const value of seenMeasurement) {
      const facet = competition.classFacets.find(
        (item) => item.type === "measurement" && item.value === value,
      );
      const current = measurementClasses.get(value);
      measurementClasses.set(value, {
        label: facet?.label ?? value,
        count: (current?.count ?? 0) + 1,
      });
    }
    for (const value of seenClassTexts) {
      classTexts.set(value, (classTexts.get(value) ?? 0) + 1);
    }
  }

  return {
    ageGroups: mapFacetOptions(ageGroups),
    experienceClasses: mapFacetOptions(experienceClasses),
    measurementClasses: mapFacetOptions(measurementClasses),
    classTexts: Array.from(classTexts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 24),
  };
}

function mapFacetOptions(values: Map<string, { label: string; count: number }>) {
  return Array.from(values.entries())
    .map(([name, item]) => ({ name, label: item.label, count: item.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
