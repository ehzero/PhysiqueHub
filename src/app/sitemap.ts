import type { MetadataRoute } from "next";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const { competitionPage } = await getUpcomingCompetitionContext();

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

  return [...staticRoutes, ...competitionRoutes];
}
