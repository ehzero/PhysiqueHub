"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSavedCompetitions } from "@/hooks/use-saved-competitions";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { Nav } from "@/components/Nav";
import { Foot } from "@/components/Foot";
import { ContactDrawer } from "@/components/ContactDrawer";
import { PwaBootstrap } from "@/components/PwaBootstrap";

interface SiteShellContextValue {
  saved: string[];
  toggleSave: (id: string) => void;
}

const SiteShellContext = createContext<SiteShellContextValue | null>(null);

interface SiteShellProps {
  seasonYear: number;
  children: React.ReactNode;
}

export function SiteShell({ seasonYear, children }: SiteShellProps) {
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
  const { saved, toggleSave } = useSavedCompetitions();
  const openContact = () => {
    trackAnalyticsEvent("contact_open", {
      properties: {
        source: "site_shell",
      },
    });
    setContactOpen(true);
  };

  const value = useMemo<SiteShellContextValue>(
    () => ({
      saved,
      toggleSave,
    }),
    [saved, toggleSave],
  );

  return (
    <SiteShellContext.Provider value={value}>
      <div className="shell">
        <AnalyticsTracker pathname={pathname} />
        <Nav
          route={getActiveRoute(pathname)}
          savedCount={saved.length}
          onOpenContact={openContact}
        />

        {children}

        <Foot
          seasonYear={seasonYear}
          onOpenContact={openContact}
        />

        <ContactDrawer
          isOpen={contactOpen}
          onClose={() => setContactOpen(false)}
        />

        <PwaBootstrap />
      </div>
    </SiteShellContext.Provider>
  );
}

export function useSiteShell() {
  const value = useContext(SiteShellContext);

  if (!value) {
    throw new Error("useSiteShell must be used inside SiteShell.");
  }

  return value;
}

function getActiveRoute(pathname: string | null) {
  if (pathname === "/") return "home";
  if (pathname?.startsWith("/competitions/categories")) return "categories";
  if (pathname?.startsWith("/competitions/types")) return "types";
  if (pathname?.startsWith("/competitions/regions")) return "regions";
  if (pathname?.startsWith("/competitions/organizations")) return "organizations";
  if (pathname?.startsWith("/competitions")) return "list";
  if (pathname === "/guide" || pathname?.startsWith("/guides")) return "guide";
  if (pathname?.startsWith("/articles")) return "articles";
  if (pathname === "/saved") return "saved";

  return "";
}
