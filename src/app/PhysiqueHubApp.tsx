"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Competition,
  Filters,
  parseDate,
  regStatusAt,
} from "@/lib/data";
import {
  fetchCompetitionFilters,
  fetchCompetitionList,
  fetchCompetitionPage,
} from "@/lib/competition-client";
import { Nav } from "@/components/Nav";
import { HomeView } from "@/components/HomeView";
import { ListView } from "@/components/ListView";
import { GuideView } from "@/components/GuideView";
import { SavedView } from "@/components/SavedView";
import { CompDrawer } from "@/components/CompDrawer";
import { ContactDrawer } from "@/components/ContactDrawer";
import { Foot } from "@/components/Foot";

interface PhysiqueHubAppProps {
  initialToday: string;
  initialRoute: AppRoute;
}

const APP_ROUTES = ["home", "list", "guide", "saved"] as const;
export type AppRoute = (typeof APP_ROUTES)[number];

const ROUTE_PATHS: Record<AppRoute, string> = {
  home: "/",
  list: "/competitions",
  guide: "/guide",
  saved: "/saved",
};

export default function PhysiqueHubApp({
  initialToday,
  initialRoute,
}: PhysiqueHubAppProps) {
  const router = useRouter();
  const [route, setRoute] = useState<AppRoute>(initialRoute);
  const [openedComp, setOpenedComp] = useState<Competition | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState("");
  const today = parseDate(initialToday);
  const seasonYear = today.getFullYear();
  const upcomingStartsFrom = toDateParam(new Date(today.getTime() - 86_400_000));
  const showPast = !!filters.showPast;
  const queryStartsFrom = showPast ? undefined : upcomingStartsFrom;
  const {
    data: competitions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["competitions", seasonYear, queryStartsFrom ?? "all"],
    queryFn: () => fetchCompetitionList(seasonYear, { startsFrom: queryStartsFrom }),
  });
  const { data: beginnerCompetitions = [] } = useQuery({
    queryKey: ["beginner-competitions", seasonYear, upcomingStartsFrom],
    queryFn: () =>
      fetchCompetitionPage(seasonYear, {
        startsFrom: upcomingStartsFrom,
        beginnerAny: true,
        page: 1,
        pageSize: 5,
      }).then((page) => page.items),
  });
  const { data: filterOptions } = useQuery({
    queryKey: ["competition-filters", seasonYear, queryStartsFrom ?? "all"],
    queryFn: () => fetchCompetitionFilters(seasonYear, { startsFrom: queryStartsFrom }),
  });
  const {
    data: homeCompetitionPages,
    fetchNextPage: fetchNextHomeCompetitionPage,
    hasNextPage: hasNextHomeCompetitionPage,
    isLoading: isLoadingHomeCompetitions,
    isFetchingNextPage: isFetchingNextHomeCompetitionPage,
  } = useInfiniteQuery({
    queryKey: ["home-competitions", seasonYear, upcomingStartsFrom],
    queryFn: ({ pageParam }) =>
      fetchCompetitionPage(seasonYear, {
        startsFrom: upcomingStartsFrom,
        page: pageParam,
        pageSize: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    enabled: route === "home",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const s = JSON.parse(localStorage.getItem("ph-saved") || "[]");
        if (Array.isArray(s)) setSaved(s);
      } catch { /* ignore */ }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("ph-saved", JSON.stringify(saved));
  }, [saved]);

  function toggleSave(id: string) {
    setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  function navigateToRoute(nextRoute: string) {
    const safeRoute = isAppRoute(nextRoute) ? nextRoute : "home";
    setRoute(safeRoute);
    router.push(ROUTE_PATHS[safeRoute]);
  }

  function openComp(c: Competition) {
    setOpenedComp(c);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setOpenedComp(null), 320);
  }

  const filtered = competitions.filter((c) => {
    if (filters.regions?.length && !filters.regions.includes(c.region)) return false;
    if (filters.orgs?.length && !filters.orgs.includes(c.org)) return false;
    if (filters.cats?.length && !c.categories.some((cat) => filters.cats!.includes(cat))) return false;
    if (filters.status?.length && !filters.status.includes(regStatusAt(c, today).kind)) return false;
    if (filters.beginner && !c.beginner) return false;
    if (filters.natural && !c.natural) return false;
    if (filters.savedOnly && !saved.includes(c.id)) return false;
    if (search && !c.title.includes(search) && !c.org.includes(search) && !c.region.includes(search)) return false;
    return true;
  }).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  return (
    <div className="shell">
      <Nav
        route={route}
        setRoute={navigateToRoute}
        savedCount={saved.length}
        onOpenContact={() => setContactOpen(true)}
      />

      {(isLoading || isError) && (
        <div className="container" style={{ paddingTop: 12 }}>
          <div
            className="mono"
            style={{
              border: "1px solid var(--line-soft)",
              color: isError ? "var(--danger)" : "var(--ink-3)",
              fontSize: 12,
              padding: "10px 12px",
            }}
          >
            {isError
              ? `대회 데이터를 불러오지 못했습니다: ${error instanceof Error ? error.message : "unknown error"}`
              : "대회 데이터를 불러오는 중입니다."}
          </div>
        </div>
      )}

      {route === "home" && (
        <HomeView
          comps={homeCompetitionPages?.pages.flatMap((page) => page.items) ?? []}
          beginnerComps={beginnerCompetitions}
          totalCount={homeCompetitionPages?.pages[0]?.total}
          saved={saved}
          toggleSave={toggleSave}
          openComp={openComp}
          setRoute={navigateToRoute}
          filterOptions={showPast ? undefined : filterOptions}
          today={today}
          hasNextPage={hasNextHomeCompetitionPage}
          isLoadingPage={isLoadingHomeCompetitions}
          isFetchingNextPage={isFetchingNextHomeCompetitionPage}
          fetchNextPage={fetchNextHomeCompetitionPage}
        />
      )}

      {route === "list" && (
        <ListView
          comps={filtered}
          allComps={competitions}
          saved={saved}
          toggleSave={toggleSave}
          openComp={openComp}
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          search={search}
          setSearch={setSearch}
          today={today}
        />
      )}

      {route === "guide" && <GuideView setRoute={navigateToRoute} />}

      {route === "saved" && (
        <SavedView
          comps={competitions.filter((c) => saved.includes(c.id))}
          saved={saved}
          toggleSave={toggleSave}
          openComp={openComp}
          setRoute={navigateToRoute}
          today={today}
        />
      )}

      <Foot seasonYear={seasonYear} />

      <CompDrawer
        comp={openedComp}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        isSaved={openedComp ? saved.includes(openedComp.id) : false}
        onToggleSave={toggleSave}
        today={today}
      />

      <ContactDrawer
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}

function toDateParam(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function isAppRoute(value: string): value is AppRoute {
  return APP_ROUTES.includes(value as AppRoute);
}
