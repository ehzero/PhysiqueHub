"use client";

import { useState, type ReactNode } from "react";
import { Competition, Filters, parseDate, regStatusAt } from "@/lib/data";
import {
  COMPETITION_TIER_LABELS,
  COMPETITION_TIERS,
  type CompetitionTier,
} from "@/lib/competition-classification";
import { KOREAN_REGION_ORDER } from "@/lib/location";
import { getOrganizationDisplayName } from "@/lib/organization-display";
import type { CompetitionFilterOptions } from "@/lib/competition-public";
import { Icons } from "./Icons";

const ACCENT = "#B85C3C";
const INK = "#0E0E0C";
const MUTE = "#86827C";
const SOFT = "#54514C";
const OK = "#2D7A3E";

const KOREAN_REGION_SET = new Set<string>(KOREAN_REGION_ORDER);

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
  today?: Date | null;
  filterOptions?: CompetitionFilterOptions;
}

// ── Custom checkbox row ──────────────────────────────────────────────
function FilterCheckRow({
  selected,
  onClick,
  dot,
  count,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  dot?: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <button className="rail-row" onClick={onClick}>
      <span
        className="rail-check"
        style={{
          background: selected ? INK : "#fff",
          borderColor: selected ? INK : "#C9C6BF",
          color: selected ? "#fff" : "transparent",
        }}
      >
        {selected && Icons.check}
      </span>
      {dot && (
        <span
          className="rail-dot"
          style={{ background: dot }}
        />
      )}
      <span
        className="rail-row-label"
        style={{ fontWeight: selected ? 600 : 400 }}
      >
        {children}
      </span>
      {count !== undefined && (
        <span className="rail-row-count mono">{count}</span>
      )}
    </button>
  );
}

// ── Collapsible section ──────────────────────────────────────────────
function FilterSection({
  title,
  hint,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rail-section">
      <button className="rail-section-head" onClick={onToggle}>
        <span className="rail-section-left">
          <span className="rail-section-title">{title}</span>
          {hint && <span className="rail-section-hint mono">{hint}</span>}
          {count != null && <span className="rail-section-hint mono">{count}</span>}
        </span>
        <span
          className="rail-chevron"
          style={{
            color: MUTE,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          {Icons.chevronDown}
        </span>
      </button>
      {open && <div className="rail-section-body">{children}</div>}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export function FilterRail({
  filters,
  setFilters,
  allComps,
  today,
  filterOptions,
}: FilterRailProps) {
  const regions = filterOptions?.regions ?? getRegionCounts(allComps);
  const orgs =
    filterOptions?.organizations.map((o) => ({
      name: getOrganizationDisplayName(o),
      count: o.count,
    })) ??
    getOrganizationCounts(allComps);
  const categories = filterOptions?.categories ?? getCategoryCounts(allComps);
  const tiers = filterOptions?.tiers ?? getTierCounts(allComps);
  const attributes = filterOptions?.attributes ?? getAttributeCounts(allComps);
  const naturalCount =
    filterOptions?.flags?.natural ?? allComps.filter((competition) => competition.natural).length;

  // Open/close state — order: 지역 > 주최단체 > 종목 > 대회 유형 > 부가속성 > 접수상태
  const [openOrgs, setOpenOrgs] = useState(true);
  const [openTiers, setOpenTiers] = useState(true);
  const [openCats, setOpenCats] = useState(true);
  const [openRegions, setOpenRegions] = useState(true);
  const [openAttrs, setOpenAttrs] = useState(true);
  const [openStatus, setOpenStatus] = useState(true);
  const [showOverseas, setShowOverseas] = useState(false);

  // Domestic vs overseas regions
  const domesticRegions = regions.filter((r) => KOREAN_REGION_SET.has(r.name));
  const overseasRegions = regions.filter((r) => !KOREAN_REGION_SET.has(r.name));
  const hasSelectedOverseas = overseasRegions.some((r) =>
    filters.regions?.includes(r.name),
  );
  const showOverseasRegions = showOverseas || hasSelectedOverseas;
  const effectiveToday = today ?? getKoreaTodayDate();
  const statusCounts = getRegistrationStatusCounts(allComps, effectiveToday);

  const statusOptions: { key: string; label: string; dot?: string; count?: number }[] = [
    { key: "open", label: "접수 중", dot: OK, count: statusCounts.get("open") ?? 0 },
    { key: "urgent", label: "마감 임박", dot: ACCENT, count: statusCounts.get("urgent") ?? 0 },
    { key: "soon", label: "접수 예정", dot: SOFT, count: statusCounts.get("soon") ?? 0 },
    { key: "closed", label: "마감", dot: "#9C9890", count: statusCounts.get("closed") ?? 0 },
    { key: "unknown", label: "확인 필요", dot: "#C0A04A", count: statusCounts.get("unknown") ?? 0 },
  ];

  const attributeOptions: { key: TypeFlagKey; label: string; count?: number }[] = [
    { key: "beginner", label: "입문·루키", count: attributes.beginner },
    { key: "natural", label: "내추럴", count: naturalCount },
    { key: "global", label: "글로벌", count: attributes.global },
    { key: "nationalSelection", label: "국가대표 선발", count: attributes.nationalSelection },
    { key: "nationalTeamEvent", label: "국가대표전", count: attributes.nationalTeamEvent },
    { key: "nationalSportsFestival", label: "전국체전", count: attributes.nationalSportsFestival },
  ];

  const tierOptions: { key: CompetitionTier; label: string; count?: number }[] =
    COMPETITION_TIERS.map((tier) => ({
      key: tier,
      label: COMPETITION_TIER_LABELS[tier],
      count: tiers[tier] ?? 0,
    }));

  const activeTotal = [
    ...(filters.status ?? []),
    ...(filters.orgs ?? []),
    ...(filters.regions ?? []),
    ...(filters.cats ?? []),
    ...(filters.tiers ?? []),
    filters.beginner ? ["beginner"] : [],
    filters.natural ? ["natural"] : [],
    filters.global ? ["global"] : [],
    filters.nationalSelection ? ["nationalSelection"] : [],
    filters.nationalTeamEvent ? ["nationalTeamEvent"] : [],
    filters.nationalSportsFestival ? ["nationalSportsFestival"] : [],
  ].flat().length;

  function toggle(
    group: "regions" | "orgs" | "cats" | "status",
    val: string,
  ) {
    setFilters((f) => {
      const cur = new Set<string>(f[group] || []);
      if (cur.has(val)) cur.delete(val);
      else cur.add(val);
      return { ...f, [group]: Array.from(cur) };
    });
  }

  function isOn(group: "regions" | "orgs" | "cats" | "status", val: string) {
    return (filters[group] || []).includes(val);
  }

  function toggleTier(key: CompetitionTier) {
    setFilters((f) => {
      const current = new Set(f.tiers ?? []);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return { ...f, tiers: Array.from(current) };
    });
  }

  function toggleFlag(key: TypeFlagKey) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <aside className="filter-rail" aria-label="대회 필터">
      {/* ── Desktop ─────────────────────────────────────── */}
      <div className="filter-desktop rail-wrap">
        {/* Header */}
        <div className="rail-header">
          <span className="rail-title">
            필터{activeTotal > 0 && <span className="rail-active-badge">{activeTotal}</span>}
          </span>
          {activeTotal > 0 && (
            <button className="rail-reset-link" onClick={() => setFilters(() => ({}))}>
              초기화
            </button>
          )}
        </div>

        {/* 지역 */}
        <FilterSection
          title="지역"
          count={regions.length}
          open={openRegions}
          onToggle={() => setOpenRegions((o) => !o)}
        >
          {domesticRegions.map((r) => (
            <FilterCheckRow
              key={r.name}
              selected={isOn("regions", r.name)}
              onClick={() => toggle("regions", r.name)}
              count={r.count}
            >
              {r.name}
            </FilterCheckRow>
          ))}
          {overseasRegions.length > 0 && (
            <>
              <button
                className="rail-overseas-toggle"
                onClick={() => setShowOverseas((s) => !s)}
              >
                <span>
                  {showOverseasRegions
                    ? "해외/기타 지역 접기"
                    : "해외/기타 지역 보기"}
                </span>
                <span className="rail-overseas-count">
                  +{overseasRegions.length}
                  <span
                    className="rail-chevron"
                    style={{
                      color: MUTE,
                      transform: showOverseasRegions
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    {Icons.chevronDown}
                  </span>
                </span>
              </button>
              {showOverseasRegions &&
                overseasRegions.map((r) => (
                  <FilterCheckRow
                    key={r.name}
                    selected={isOn("regions", r.name)}
                    onClick={() => toggle("regions", r.name)}
                    count={r.count}
                  >
                    {r.name}
                  </FilterCheckRow>
                ))}
            </>
          )}
        </FilterSection>

        {/* 주최 단체 */}
        <FilterSection
          title="주최 단체"
          count={orgs.length}
          open={openOrgs}
          onToggle={() => setOpenOrgs((o) => !o)}
        >
          {orgs.map((o) => (
            <FilterCheckRow
              key={o.name}
              selected={isOn("orgs", o.name)}
              onClick={() => toggle("orgs", o.name)}
              count={o.count}
            >
              {o.name}
            </FilterCheckRow>
          ))}
        </FilterSection>

        {/* 종목 */}
        {categories.length > 0 && (
          <FilterSection
            title="종목"
            count={categories.length}
            open={openCats}
            onToggle={() => setOpenCats((o) => !o)}
          >
            {categories.map((c) => (
              <FilterCheckRow
                key={c.name}
                selected={isOn("cats", c.name)}
                onClick={() => toggle("cats", c.name)}
                count={c.count}
              >
                {c.name}
              </FilterCheckRow>
            ))}
          </FilterSection>
        )}

        {/* 대회 유형 */}
        <FilterSection
          title="대회 유형"
          count={tierOptions.length}
          open={openTiers}
          onToggle={() => setOpenTiers((o) => !o)}
        >
          {tierOptions.map((opt) => (
            <FilterCheckRow
              key={opt.key}
              selected={!!filters.tiers?.includes(opt.key)}
              onClick={() => toggleTier(opt.key)}
              count={opt.count}
            >
              {opt.label}
            </FilterCheckRow>
          ))}
        </FilterSection>

        {/* 부가 속성 */}
        <FilterSection
          title="부가 속성"
          count={attributeOptions.length}
          open={openAttrs}
          onToggle={() => setOpenAttrs((o) => !o)}
        >
          {attributeOptions.map((opt) => (
            <FilterCheckRow
              key={opt.key}
              selected={!!filters[opt.key]}
              onClick={() => toggleFlag(opt.key)}
              count={opt.count}
            >
              {opt.label}
            </FilterCheckRow>
          ))}
        </FilterSection>

        {/* 접수 상태 */}
        <FilterSection
          title="접수 상태"
          count={statusOptions.length}
          open={openStatus}
          onToggle={() => setOpenStatus((o) => !o)}
        >
          {statusOptions.map((opt) => (
            <FilterCheckRow
              key={opt.key}
              selected={isOn("status", opt.key)}
              onClick={() => toggle("status", opt.key)}
              dot={opt.dot}
              count={opt.count}
            >
              {opt.label}
            </FilterCheckRow>
          ))}
        </FilterSection>
      </div>

    </aside>
  );
}

function getTierCounts(comps: Competition[]) {
  return Object.fromEntries(
    COMPETITION_TIERS.map((tier) => [
      tier,
      comps.filter((c) => c.tier === tier).length,
    ]),
  ) as Record<CompetitionTier, number>;
}

function getRegionCounts(comps: Competition[]) {
  return mapCounts(comps.map((competition) => competition.region));
}

function getOrganizationCounts(comps: Competition[]) {
  return mapCounts(comps.map((competition) => competition.org));
}

function getCategoryCounts(comps: Competition[]) {
  return mapCounts(comps.flatMap((competition) => competition.categories));
}

function getRegistrationStatusCounts(comps: Competition[], today: Date) {
  return comps.reduce((counts, competition) => {
    const status = regStatusAt(competition, today).kind;
    counts.set(status, (counts.get(status) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
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

function mapCounts(values: string[]) {
  return Array.from(
    values.reduce((counts, value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko-KR"));
}

function getKoreaTodayDate() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return parseDate(today);
}

// keep export for any legacy usage
export { getTierCounts };
