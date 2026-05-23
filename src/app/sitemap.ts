import type { MetadataRoute } from "next";
import { getUpcomingCompetitionContext } from "@/lib/competition-server";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const { competitionPage } = await getUpcomingCompetitionContext();

  const staticRoutes = ["", "/competitions", "/guide", "/about", "/terms", "/privacy"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
    }),
  );
  const competitionRoutes = competitionPage.items.map((competition) => ({
    url: `${siteUrl}/competitions/${encodeURIComponent(competition.id)}`,
    lastModified: competition.updatedAt ? new Date(competition.updatedAt) : now,
  }));

  return [...staticRoutes, ...competitionRoutes];
}
