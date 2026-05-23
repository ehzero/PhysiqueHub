"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Competition,
  fmtDate,
  parseDate,
  regStatusAt,
} from "@/lib/data";
import { FeatCard } from "./FeatCard";
import { CompRow } from "./CompRow";
import { Icons } from "./Icons";
import { EmptyState, PageMain, PageSection } from "./PageLayout";
import {
  type CompetitionFilterOptions,
  type CompetitionListPage,
} from "@/lib/competition-public";
import type { HomeFilterQueryState } from "@/lib/filter-query";

const DOWS = ["일", "월", "화", "수", "목", "금", "토"];

const SORT_OPTIONS = [
  { value: "date", label: "대회일 빠른 순" },
  { value: "deadline", label: "접수 마감 임박 순" },
  { value: "updated", label: "최근 업데이트 순" },
];

type HomeChip = {
  id: string | null;
  label: string;
  n: number;
  title?: string;
};

interface HomeViewProps {
  seasonYear: number;
  initialCompetitionPage: CompetitionListPage;
  saved: string[];
  toggleSave: (id: string) => void;
  openComp: (c: Competition) => void;
  filterOptions?: CompetitionFilterOptions;
  filterState: HomeFilterQueryState;
  setFilterState: (state: HomeFilterQueryState) => void;
  today: Date | null;
}

export function HomeView({
  seasonYear,
  initialCompetitionPage,
  saved,
  toggleSave,
  openComp,
  filterOptions,
  filterState,
  setFilterState,
  today,
}: HomeViewProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const { activeOrganizationId, activePreset, sortBy } = filterState;

  const counts = {
    all: filterOptions ? sumCounts(filterOptions.organizations) : 0,
    open: sumStatusCounts(filterOptions?.registrationStatuses, ["open", "urgent"]),
    beginner: filterOptions?.flags.beginnerAny ?? 0,
    natural: filterOptions?.flags.natural ?? 0,
    regional: filterOptions?.flags.regional ?? 0,
    proPath: filterOptions?.flags.proPath ?? 0,
    internationalRoute:
      filterOptions?.flags.internationalRoute ?? 0,
  };

  const activeOrganizationName = filterOptions?.organizations.find(
    (organization) => organization.id === activeOrganizationId,
  )?.name;
  const fullFeed = useMemo(
    () =>
      sortCompetitions(
        initialCompetitionPage.items.filter((competition) =>
          matchesHomeFilter({
            competition,
            activeOrganizationName,
            activePreset,
            today,
          }),
        ),
        sortBy,
      ),
    [
      activeOrganizationName,
      activePreset,
      initialCompetitionPage.items,
      sortBy,
      today,
    ],
  );

  const feed = fullFeed.slice(0, visibleCount);
  const featured = feed.slice(0, 3);
  const restList = feed.slice(3);
  const hasMore = visibleCount < fullFeed.length;
  const beginnerComps = useMemo(
    () =>
      sortCompetitions(
        initialCompetitionPage.items.filter((competition) => competition.beginner),
        "date",
      ).slice(0, 5),
    [initialCompetitionPage.items],
  );

  const organizationFilters = filterOptions
    ? [
        {
          id: null,
          label: "전체 단체",
          n: sumCounts(filterOptions.organizations),
          title: "전체 단체",
        },
        ...filterOptions.organizations.map((organization) => ({
          id: organization.id,
          label: organization.shortName || organization.name,
          n: organization.count,
          title: organization.name,
        })),
      ]
    : [{ id: null, label: "전체 단체", n: 0, title: "전체 단체" }];

  const dateLine = today
    ? `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")} (${DOWS[today.getDay()]})`
    : "-";

  const presets = [
    { id: "all", label: "전체", n: counts.all },
    ...(filterOptions
      ? [
          { id: "open", label: "접수 중", n: counts.open },
          { id: "natural", label: "내추럴", n: counts.natural },
          { id: "beginner", label: "루키·입문", n: counts.beginner },
          { id: "regional", label: "리저널", n: counts.regional },
          { id: "proPath", label: "프로카드·퀄리파이어", n: counts.proPath },
          {
            id: "internationalRoute",
            label: "국제·대표 루트",
            n: counts.internationalRoute,
          },
        ]
      : []),
  ];

  const feedLabel =
    {
      all: "전체",
      open: "접수 중",
      natural: "내추럴",
      beginner: "루키·입문",
      regional: "리저널",
      proPath: "프로카드·퀄리파이어",
      internationalRoute: "국제·대표 루트",
    }[activePreset] || "전체";
  const isAllOrganization = !activeOrganizationId;
  const isAllCategory = activePreset === "all";
  const displayOrganizationName = organizationFilters.find(
    (organization) => organization.id === activeOrganizationId,
  )?.title ?? activeOrganizationId ?? "전체 단체";
  const feedTitle = isAllOrganization
    ? isAllCategory
      ? "전체 대회"
      : feedLabel
    : isAllCategory
      ? displayOrganizationName
      : `${displayOrganizationName} · ${feedLabel}`;
  const sortLabel = SORT_OPTIONS.find(
    (option) => option.value === sortBy,
  )?.label;
  const feedCount = fullFeed.length;

  return (
    <PageMain className="home-main">
      <HomeDashboardBar seasonYear={seasonYear} dateLine={dateLine} />
      <HomeFilterBars
        organizationFilters={organizationFilters}
        presets={presets}
        activeOrganizationId={activeOrganizationId}
        activePreset={activePreset}
        onSelectOrganization={(id) => {
          setFilterState({
            ...filterState,
            activeOrganizationId: activeOrganizationId === id ? null : id,
          });
          setVisibleCount(10);
        }}
        onSelectPreset={(id) => {
          setFilterState({ ...filterState, activePreset: id });
          setVisibleCount(10);
        }}
        onResetFilters={() => {
          setFilterState({
            ...filterState,
            activeOrganizationId: null,
            activePreset: "all",
          });
          setVisibleCount(10);
        }}
      />
      <HomeFeed
        feed={feed}
        featured={featured}
        restList={restList}
        feedTitle={feedTitle}
        feedCount={feedCount}
        sortBy={sortBy}
        sortLabel={sortLabel}
        sortOpen={sortOpen}
        saved={saved}
        hasMore={hasMore}
        today={today}
        openComp={openComp}
        toggleSave={toggleSave}
        setSortOpen={setSortOpen}
        onSelectSort={(value) => {
          setFilterState({ ...filterState, sortBy: value });
          setVisibleCount(10);
          setSortOpen(false);
        }}
        onShowMore={() => setVisibleCount((count) => count + 10)}
        onResetFilters={() => {
          setFilterState({
            ...filterState,
            activeOrganizationId: null,
            activePreset: "all",
          });
          setVisibleCount(10);
        }}
      />
      {activePreset !== "beginner" && (
        <PageSection className="beginner-section">
          <BeginnerPicks comps={beginnerComps} onOpen={openComp} />
        </PageSection>
      )}
    </PageMain>
  );
}

function HomeDashboardBar({
  seasonYear,
  dateLine,
}: {
  seasonYear: number;
  dateLine: string;
}) {
  return (
    <section className="dash-bar">
      <div className="container">
        <div className="dash-row">
          <div className="dash-meta">
            <span className="eyebrow dash-season">SEASON {seasonYear}</span>
            <span className="mono dash-date">{dateLine}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFilterBars({
  organizationFilters,
  presets,
  activeOrganizationId,
  activePreset,
  onSelectOrganization,
  onSelectPreset,
  onResetFilters,
}: {
  organizationFilters: HomeChip[];
  presets: HomeChip[];
  activeOrganizationId: string | null;
  activePreset: string;
  onSelectOrganization: (id: string | null) => void;
  onSelectPreset: (id: string) => void;
  onResetFilters: () => void;
}) {
  const [mobilePanel, setMobilePanel] =
    useState<"organization" | "preset" | null>(null);
  const activeOrganization = organizationFilters.find(
    (organization) => organization.id === activeOrganizationId,
  ) ?? organizationFilters[0];
  const activePresetChip =
    presets.find((preset) => preset.id === activePreset) ?? presets[0];
  const activeFilterCount =
    (activeOrganizationId ? 1 : 0) + (activePreset !== "all" ? 1 : 0);

  function selectOrganization(id: string | null) {
    onSelectOrganization(id);
    setMobilePanel(null);
  }

  function selectPreset(id: string | null) {
    onSelectPreset(id ?? "all");
    setMobilePanel(null);
  }

  function resetFilters() {
    onResetFilters();
    setMobilePanel(null);
  }

  return (
    <section className="preset-bar">
      <div className="container">
        <div className="preset-row desktop-filter-row">
          <div className="preset-chips" role="tablist">
            {organizationFilters.map((organization) => (
              <button
                key={organization.id ?? "all-organizations"}
                className={`preset-chip ${activeOrganizationId === organization.id ? "on" : ""}`}
                title={organization.title}
                onClick={() => onSelectOrganization(organization.id)}
              >
                <span>{organization.label}</span>
                <span className="preset-sep" aria-hidden="true">|</span>
                <span className="preset-cnt mono">{organization.n}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="organization-chips">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className={`organization-chip ${activePreset === preset.id ? "on" : ""}`}
              onClick={() => onSelectPreset(preset.id ?? "all")}
            >
              {preset.label} <span className="mono">{preset.n}</span>
            </button>
          ))}
          <Link className="organization-chip" href="/competitions">
            더보기
          </Link>
        </div>

        <div className="mobile-filter-shell">
          <div className="mobile-filter-summary">
            <button
              type="button"
              className="mobile-filter-select"
              aria-expanded={mobilePanel === "organization"}
              onClick={() =>
                setMobilePanel((panel) =>
                  panel === "organization" ? null : "organization",
                )
              }
            >
              <span className="mobile-filter-kicker">단체</span>
              <span className="mobile-filter-value">
                {activeOrganization?.title ?? "전체 단체"}
              </span>
              <span className="mobile-filter-icon">{Icons.chevronDown}</span>
            </button>
            <button
              type="button"
              className="mobile-filter-select compact"
              aria-expanded={mobilePanel === "preset"}
              onClick={() =>
                setMobilePanel((panel) => (panel === "preset" ? null : "preset"))
              }
            >
              <span className="mobile-filter-kicker">조건</span>
              <span className="mobile-filter-value">
                {activePresetChip?.label ?? "전체"}
              </span>
              <span className="mobile-filter-icon">{Icons.chevronDown}</span>
            </button>
          </div>

          {mobilePanel && (
            <div className="mobile-filter-panel">
              <div className="mobile-filter-panel-head">
                <span className="eyebrow">
                  {mobilePanel === "organization" ? "ORGANIZATION" : "FILTER"}
                </span>
                <button type="button" onClick={() => setMobilePanel(null)}>
                  {Icons.close}
                </button>
              </div>
              <div className="mobile-filter-options">
                {(mobilePanel === "organization" ? organizationFilters : presets).map(
                  (item) => {
                    const isOn =
                      mobilePanel === "organization"
                        ? activeOrganizationId === item.id
                        : activePreset === item.id;

                    return (
                      <button
                        key={item.id ?? "all"}
                        type="button"
                        className={`mobile-filter-option ${isOn ? "on" : ""}`}
                        onClick={() =>
                          mobilePanel === "organization"
                            ? selectOrganization(item.id)
                            : selectPreset(item.id)
                        }
                      >
                        <span className="mobile-filter-option-label">
                          {item.title ?? item.label}
                        </span>
                        <span className="mobile-filter-option-count mono">
                          {item.n}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="mobile-filter-reset"
                  onClick={resetFilters}
                >
                  필터 초기화
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HomeFeed({
  feed,
  featured,
  restList,
  feedTitle,
  feedCount,
  sortBy,
  sortLabel,
  sortOpen,
  saved,
  hasMore,
  today,
  openComp,
  toggleSave,
  setSortOpen,
  onSelectSort,
  onShowMore,
  onResetFilters,
}: {
  feed: Competition[];
  featured: Competition[];
  restList: Competition[];
  feedTitle: string;
  feedCount: number;
  sortBy: string;
  sortLabel?: string;
  sortOpen: boolean;
  saved: string[];
  hasMore: boolean;
  today: Date | null;
  openComp: (c: Competition) => void;
  toggleSave: (id: string) => void;
  setSortOpen: (fn: (open: boolean) => boolean) => void;
  onSelectSort: (value: string) => void;
  onShowMore: () => void;
  onResetFilters: () => void;
}) {
  return (
    <PageSection className="home-feed">
      <div className="feed-head">
        <div>
          <h2 className="page-title feed-h">{feedTitle}</h2>
          <p className="page-subtitle feed-sub mono">{feedCount} EVENTS</p>
        </div>
        <div
          className="sort-actions"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setSortOpen(() => false);
            }
          }}
        >
          <div className="sort-menu">
            <button
              type="button"
              className="sort-pick"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((open) => !open)}
            >
              <span className="sort-icon" aria-hidden="true">{Icons.sort}</span>
              <span className="sort-label">{sortLabel}</span>
              <span className="sort-chevron">{Icons.chevronDown}</span>
            </button>
            {sortOpen && (
              <div className="sort-menu-list" role="listbox">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`sort-option ${sortBy === option.value ? "on" : ""}`}
                    role="option"
                    aria-selected={sortBy === option.value}
                    onClick={() => onSelectSort(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {feed.length === 0 ? (
        <EmptyState
          eyebrow="NO RESULTS"
          title="조건에 맞는 대회가 없습니다."
          action={
            <button className="cta-btn" onClick={onResetFilters}>
              필터 초기화
            </button>
          }
        />
      ) : (
        <>
          <div className="home-desktop-feed">
            {featured.length > 0 && (
              <div className="feat-grid home-featured-grid">
                {featured.map((competition) => (
                  <FeatCard
                    key={competition.id}
                    comp={competition}
                    onOpen={openComp}
                    isSaved={saved.includes(competition.id)}
                    onToggleSave={toggleSave}
                    today={today}
                  />
                ))}
              </div>
            )}
            {restList.length > 0 && (
              <div className="comp-list home-rest-list">
                {restList.map((competition) => (
                  <CompRow
                    key={competition.id}
                    comp={competition}
                    onOpen={openComp}
                    isSaved={saved.includes(competition.id)}
                    onToggleSave={toggleSave}
                    today={today}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="comp-list home-mobile-feed">
            {feed.map((competition) => (
              <CompRow
                key={competition.id}
                comp={competition}
                onOpen={openComp}
                isSaved={saved.includes(competition.id)}
                onToggleSave={toggleSave}
                today={today}
              />
            ))}
          </div>
        </>
      )}

      <div className="home-feed-actions">
        <button className="cta-btn" disabled={!hasMore} onClick={onShowMore}>
          {hasMore ? "10개 더보기" : "더 불러올 대회 없음"}
        </button>
        <Link className="cta-btn" href="/competitions">
          전체 목록 보기 {Icons.arrow}
        </Link>
      </div>
    </PageSection>
  );
}

function sumCounts(items: Array<{ count: number }>): number {
  return items.reduce((total, item) => total + item.count, 0);
}

function sumStatusCounts(
  statuses: Array<{ status: string; count: number }> | undefined,
  activeStatuses: string[],
): number {
  if (!statuses) {
    return 0;
  }

  return statuses
    .filter((status) => activeStatuses.includes(status.status))
    .reduce((total, status) => total + status.count, 0);
}
function matchesHomeFilter({
  competition,
  activeOrganizationName,
  activePreset,
  today,
}: {
  competition: Competition;
  activeOrganizationName?: string;
  activePreset: string;
  today: Date | null;
}) {
  if (activeOrganizationName && competition.org !== activeOrganizationName) {
    return false;
  }

  if (activePreset === "open") {
    return today
      ? ["open", "urgent"].includes(regStatusAt(competition, today).kind)
      : false;
  }
  if (activePreset === "beginner") return competition.beginner;
  if (activePreset === "natural") return competition.natural;
  if (activePreset === "regional") return competition.regional;
  if (activePreset === "proPath") return competition.proPath;
  if (activePreset === "internationalRoute") return competition.internationalRoute;

  return true;
}

function sortCompetitions(competitions: Competition[], sortBy: string) {
  return [...competitions].sort((a, b) => {
    if (sortBy === "deadline") {
      return parseDate(a.regClose).getTime() - parseDate(b.regClose).getTime();
    }
    if (sortBy === "updated") {
      return (
        getTime(b.updatedAt ?? b.date) - getTime(a.updatedAt ?? a.date) ||
        parseDate(a.date).getTime() - parseDate(b.date).getTime()
      );
    }

    return parseDate(a.date).getTime() - parseDate(b.date).getTime();
  });
}

function getTime(value: string) {
  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? parseDate(value).getTime() : parsed;
}

function BeginnerPicks({
  comps,
  onOpen,
}: {
  comps: Competition[];
  onOpen: (c: Competition) => void;
}) {
  return (
    <div className="pick-row">
      <div className="pick-head">
        <h3 className="page-title">입문자가 찾는 대회</h3>
        <p className="page-subtitle">
          첫 무대를 준비 중이라면 루키 부문이 있거나, 입문자 비중이 높은
          대회부터 살펴보세요.
        </p>
      </div>
      <ul className="pick-list">
        {comps.map((c, i) => (
          <li key={c.id} className="pick-item" onClick={() => onOpen(c)}>
            <span className="pick-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="pick-ttl">
              {c.title}
              <span className="sub">
                {c.org} · {c.region} · {fmtDate(c.date, { style: "long" })}
              </span>
            </span>
            <span className="pick-tag">
              {c.rookie ? "루키 부문" : "입문 환영"}
            </span>
            <span className="pick-arrow">{Icons.arrow}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
