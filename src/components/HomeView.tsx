"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Competition,
  fmtDate,
} from "@/lib/data";
import { FeatCard } from "./FeatCard";
import { CompRow } from "./CompRow";
import { Icons } from "./Icons";
import {
  fetchCompetitionPage,
  type CompetitionFilterOptions,
  type CompetitionPageOptions,
} from "@/lib/competition-client";

const DOWS = ["일", "월", "화", "수", "목", "금", "토"];

const SORT_OPTIONS = [
  { value: "date", label: "대회일 빠른 순" },
  { value: "deadline", label: "접수 마감 임박 순" },
  { value: "updated", label: "최근 업데이트 순" },
];

interface HomeViewProps {
  seasonYear: number;
  startsFrom: string;
  beginnerComps: Competition[];
  saved: string[];
  toggleSave: (id: string) => void;
  openComp: (c: Competition) => void;
  setRoute: (r: string) => void;
  filterOptions?: CompetitionFilterOptions;
  today: Date;
}

export function HomeView({
  seasonYear,
  startsFrom,
  beginnerComps,
  saved,
  toggleSave,
  openComp,
  setRoute,
  filterOptions,
  today,
}: HomeViewProps) {
  const [activePreset, setActivePreset] = useState("all");
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(
    null,
  );
  const [sortBy, setSortBy] = useState("date");
  const [sortOpen, setSortOpen] = useState(false);

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

  const queryOptions = getHomeQueryOptions({
    activeOrganizationId,
    activePreset,
    sortBy,
    startsFrom,
  });
  const {
    data: homeCompetitionPages,
    fetchNextPage,
    hasNextPage,
    isLoading: isLoadingPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["home-competitions", seasonYear, queryOptions],
    queryFn: ({ pageParam }) =>
      fetchCompetitionPage(seasonYear, {
        ...queryOptions,
        page: pageParam,
        pageSize: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });

  const feed = homeCompetitionPages?.pages.flatMap((page) => page.items) ?? [];
  const featured = feed.slice(0, 3);
  const restList = feed.slice(3);

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

  const dateLine = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")} (${DOWS[today.getDay()]})`;

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
  const activeOrganizationName = organizationFilters.find(
    (organization) => organization.id === activeOrganizationId,
  )?.title ?? activeOrganizationId ?? "전체 단체";
  const feedTitle = isAllOrganization
    ? isAllCategory
      ? "전체 대회"
      : feedLabel
    : isAllCategory
      ? activeOrganizationName
      : `${activeOrganizationName} · ${feedLabel}`;
  const sortLabel = SORT_OPTIONS.find(
    (option) => option.value === sortBy,
  )?.label;
  const feedCount = homeCompetitionPages?.pages[0]?.total ?? 0;

  return (
    <main className="home-main">
      {/* Dashboard top bar */}
      <section className="dash-bar">
        <div className="container">
          <div className="dash-row">
            <div className="dash-meta">
              <span className="eyebrow" style={{ color: "var(--ink)" }}>
                SEASON {today.getFullYear()}
              </span>
              <span className="mono dash-date">{dateLine}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Preset chip tabs */}
      <section className="preset-bar">
        <div className="container">
          <div className="preset-row">
            <div className="preset-chips" role="tablist">
              {organizationFilters.map((organization) => (
                <button
                  key={organization.id ?? "all-organizations"}
                  className={`preset-chip ${activeOrganizationId === organization.id ? "on" : ""}`}
                  title={organization.title}
                  onClick={() =>
                    setActiveOrganizationId(
                      activeOrganizationId === organization.id
                        ? null
                        : organization.id,
                    )
                  }
                >
                  <span>{organization.label}</span>
                  <span className="preset-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="preset-cnt mono">{organization.n}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="organization-chips">
            {presets.map((p) => (
              <button
                key={p.id}
                className={`organization-chip ${activePreset === p.id ? "on" : ""}`}
                onClick={() => setActivePreset(p.id)}
              >
                {p.label} <span className="mono">{p.n}</span>
              </button>
            ))}
            <button
              type="button"
              className="organization-chip"
              onClick={() => setRoute("list")}
            >
              더보기
            </button>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="section home-feed">
        <div className="container">
          <div className="feed-head">
            <div>
              <h2 className="page-title feed-h">{feedTitle}</h2>
              <p className="page-subtitle feed-sub mono">
                {feedCount} EVENTS
              </p>
            </div>
            <div
              className="sort-actions"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setSortOpen(false);
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
                  <span className="sort-icon" aria-hidden="true">
                    {Icons.sort}
                  </span>
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
                        onClick={() => {
                          setSortBy(option.value);
                          setSortOpen(false);
                        }}
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
            <div
              style={{
                padding: "80px 20px",
                textAlign: "center",
                border: "1px dashed var(--line-soft)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                NO RESULTS
              </div>
              <p style={{ fontSize: 18, marginBottom: 16 }}>
                {isLoadingPage
                  ? "대회 목록을 불러오는 중입니다."
                  : "조건에 맞는 대회가 없습니다."}
              </p>
              {!isLoadingPage && (
                <button
                  className="cta-btn"
                  onClick={() => {
                    setActivePreset("all");
                    setActiveOrganizationId(null);
                  }}
                >
                  필터 초기화
                </button>
              )}
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <div className="feat-grid" style={{ marginBottom: 12 }}>
                  {featured.map((c) => (
                    <FeatCard
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
              {restList.length > 0 && (
                <div className="comp-list" style={{ marginTop: 40 }}>
                  {restList.map((c) => (
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
            </>
          )}

          <div className="home-feed-actions">
            <button
              className="cta-btn"
              disabled={!hasNextPage || isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage
                ? "불러오는 중"
                : hasNextPage
                  ? "10개 더보기"
                  : "더 불러올 대회 없음"}
            </button>
            <button className="cta-btn" onClick={() => setRoute("list")}>
              전체 목록 보기 {Icons.arrow}
            </button>
          </div>
        </div>
      </section>

      {/* Beginner picks */}
      {activePreset !== "beginner" && (
        <section
          className="section"
          style={{ paddingTop: 64, background: "var(--bg-sub)" }}
        >
          <div className="container">
            <BeginnerPicks comps={beginnerComps} onOpen={openComp} today={today} />
          </div>
        </section>
      )}
    </main>
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

function getHomeQueryOptions({
  activeOrganizationId,
  activePreset,
  sortBy,
  startsFrom,
}: {
  activeOrganizationId: string | null;
  activePreset: string;
  sortBy: string;
  startsFrom: string;
}): CompetitionPageOptions {
  const options: CompetitionPageOptions = {
    startsFrom,
    sort:
      sortBy === "deadline"
        ? "deadline-asc"
        : sortBy === "updated"
          ? "updated-desc"
          : "date-asc",
  };

  if (activeOrganizationId) {
    options.organizationId = activeOrganizationId;
  }

  if (activePreset === "open") {
    options.registrationStatus = ["open", "urgent"];
  } else if (activePreset === "beginner") {
    options.beginnerAny = true;
  } else if (activePreset === "natural") {
    options.natural = true;
  } else if (activePreset === "regional") {
    options.regional = true;
  } else if (activePreset === "proPath") {
    options.proPath = true;
  } else if (activePreset === "internationalRoute") {
    options.internationalRoute = true;
  }

  return options;
}

function BeginnerPicks({
  comps,
  onOpen,
}: {
  comps: Competition[];
  onOpen: (c: Competition) => void;
  today: Date;
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
