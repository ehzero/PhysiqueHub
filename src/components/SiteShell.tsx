"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSavedCompetitions } from "@/hooks/use-saved-competitions";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { Nav } from "@/components/Nav";
import { Foot } from "@/components/Foot";
import { ContactDrawer } from "@/components/ContactDrawer";
import { PwaBootstrap } from "@/components/PwaBootstrap";
import type { ContactCategory } from "@/components/ContactDrawer";

interface SiteShellContextValue {
  openContact: (options?: OpenContactOptions) => void;
  saved: string[];
  toggleSave: (id: string) => void;
}

interface OpenContactOptions {
  category?: ContactCategory;
  source?: string;
  competitionId?: string;
  tier?: string;
  organizationId?: string;
}

interface ContactContext {
  source: string;
  competitionId?: string;
  tier?: string;
  organizationId?: string;
}

const SiteShellContext = createContext<SiteShellContextValue | null>(null);

interface SiteShellProps {
  seasonYear: number;
  children: React.ReactNode;
}

export function SiteShell({ seasonYear, children }: SiteShellProps) {
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactInitialCategory, setContactInitialCategory] =
    useState<ContactCategory>("기타 문의");
  const [contactSeed, setContactSeed] = useState(0);
  const [contactContext, setContactContext] = useState<ContactContext>({
    source: "site_shell",
  });
  const { saved, toggleSave } = useSavedCompetitions();
  const openContact = useCallback((options: OpenContactOptions = {}) => {
    const context: ContactContext = {
      source: options.source ?? "site_shell",
      competitionId: options.competitionId,
      tier: options.tier,
      organizationId: options.organizationId,
    };
    // 리드 어트리뷰션: source(슬롯)와 대회 컨텍스트를 open 이벤트에 싣고,
    // 같은 컨텍스트를 드로어로 넘겨 submit에도 동일하게 기록한다.
    trackAnalyticsEvent("contact_open", {
      competitionId: context.competitionId,
      properties: {
        source: context.source,
        tier: context.tier,
        organizationId: context.organizationId,
      },
    });
    setContactContext(context);
    setContactInitialCategory(options.category ?? "기타 문의");
    setContactSeed((value) => value + 1);
    setContactOpen(true);
  }, []);

  const value = useMemo<SiteShellContextValue>(
    () => ({
      openContact,
      saved,
      toggleSave,
    }),
    [openContact, saved, toggleSave],
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
          key={contactSeed}
          isOpen={contactOpen}
          onClose={() => setContactOpen(false)}
          initialCategory={contactInitialCategory}
          source={contactContext.source}
          competitionId={contactContext.competitionId}
          tier={contactContext.tier}
          organizationId={contactContext.organizationId}
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
