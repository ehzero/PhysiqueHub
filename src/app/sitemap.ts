import type { MetadataRoute } from "next";
import {
  getIndexableCompetitionLandingTaxons,
  getUpcomingCompetitionContext,
} from "@/lib/competition-server";
import { getCompetitionLandingPath } from "@/lib/competition-taxonomy";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [{ competitionPage }, landingTaxons] = await Promise.all([
    getUpcomingCompetitionContext(),
    getIndexableCompetitionLandingTaxons(),
  ]);

  const staticRoutes = [
    "",
    "/competitions",
    "/guide",
    "/about",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
  }));
  const competitionRoutes = competitionPage.items.map((competition) => ({
    url: `${siteUrl}/competitions/${encodeURIComponent(competition.id)}`,
    ...(competition.updatedAt
      ? { lastModified: new Date(competition.updatedAt) }
      : {}),
  }));
  const landingRoutes = landingTaxons.map((taxon) => ({
    url: `${siteUrl}${getCompetitionLandingPath(taxon)}`,
  }));

  return [...staticRoutes, ...landingRoutes, ...competitionRoutes];
}
