"use client";

import { useState, useEffect } from "react";
import { COMPETITIONS, Filters, Competition, regStatus, parseDate } from "@/lib/data";
import { Nav } from "@/components/Nav";
import { HomeView } from "@/components/HomeView";
import { ListView } from "@/components/ListView";
import { GuideView } from "@/components/GuideView";
import { SavedView } from "@/components/SavedView";
import { CompDrawer } from "@/components/CompDrawer";
import { ContactDrawer } from "@/components/ContactDrawer";
import { Foot } from "@/components/Foot";

export default function PhysiqueHubApp() {
  const [route, setRoute] = useState("home");
  const [openedComp, setOpenedComp] = useState<Competition | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState("");
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

  function openComp(c: Competition) {
    setOpenedComp(c);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setOpenedComp(null), 320);
  }

  const filtered = COMPETITIONS.filter((c) => {
    if (filters.regions?.length && !filters.regions.includes(c.region)) return false;
    if (filters.orgs?.length && !filters.orgs.includes(c.org)) return false;
    if (filters.cats?.length && !c.categories.some((cat) => filters.cats!.includes(cat))) return false;
    if (filters.status?.length && !filters.status.includes(regStatus(c).kind)) return false;
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
        setRoute={setRoute}
        savedCount={saved.length}
        onOpenContact={() => setContactOpen(true)}
      />

      {route === "home" && (
        <HomeView
          saved={saved}
          toggleSave={toggleSave}
          openComp={openComp}
          setRoute={setRoute}
        />
      )}

      {route === "list" && (
        <ListView
          comps={filtered}
          allComps={COMPETITIONS}
          saved={saved}
          toggleSave={toggleSave}
          openComp={openComp}
          filters={filters}
          setFilters={setFilters}
          search={search}
          setSearch={setSearch}
        />
      )}

      {route === "guide" && <GuideView setRoute={setRoute} />}

      {route === "saved" && (
        <SavedView
          comps={COMPETITIONS.filter((c) => saved.includes(c.id))}
          saved={saved}
          toggleSave={toggleSave}
          openComp={openComp}
          setRoute={setRoute}
        />
      )}

      <Foot />

      <CompDrawer
        comp={openedComp}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        isSaved={openedComp ? saved.includes(openedComp.id) : false}
        onToggleSave={toggleSave}
      />

      <ContactDrawer
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
