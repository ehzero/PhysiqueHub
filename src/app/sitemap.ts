import type { MetadataRoute } from "next";
import {
  getIndexableCompetitionLandingTaxons,
  getUpcomingCompetitionContext,
} from "@/lib/competition-server";
import {
  competitionMatchesTaxon,
  getCompetitionLandingPath,
} from "@/lib/competition-taxonomy";
import { getCompetitionPath } from "@/lib/competition-slug";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [{ competitionPage }, landingTaxons] = await Promise.all([
    getUpcomingCompetitionContext(),
    getIndexableCompetitionLandingTaxons(),
  ]);
  const latestCompetitionUpdate = getLatestUpdate(competitionPage.items);

  const staticRoutes = [
    toSitemapEntry(siteUrl, "", latestCompetitionUpdate),
    toSitemapEntry(siteUrl, "/competitions", latestCompetitionUpdate),
    toSitemapEntry(siteUrl, "/guide"),
    toSitemapEntry(siteUrl, "/about"),
    toSitemapEntry(siteUrl, "/terms"),
    toSitemapEntry(siteUrl, "/privacy"),
  ];
  const competitionRoutes = competitionPage.items.map((competition) => ({
    url: `${siteUrl}${getCompetitionPath(competition)}`,
    ...(competition.updatedAt
      ? { lastModified: new Date(competition.updatedAt) }
      : {}),
  }));
  const landingRoutes = landingTaxons.map((taxon) =>
    toSitemapEntry(
      siteUrl,
      getCompetitionLandingPath(taxon),
      getLatestUpdate(
        competitionPage.items.filter((competition) =>
          competitionMatchesTaxon(competition, taxon),
        ),
      ) ?? latestCompetitionUpdate,
    ),
  );

  return [...staticRoutes, ...landingRoutes, ...competitionRoutes];
}

function toSitemapEntry(
  siteUrl: string,
  path: string,
  lastModified?: Date,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    ...(lastModified ? { lastModified } : {}),
  };
}

function getLatestUpdate(
  items: Array<{ updatedAt?: string }>,
): Date | undefined {
  return items.reduce<Date | undefined>((latest, item) => {
    if (!item.updatedAt) {
      return latest;
    }

    const updatedAt = new Date(item.updatedAt);

    if (Number.isNaN(updatedAt.getTime())) {
      return latest;
    }

    return !latest || updatedAt > latest ? updatedAt : latest;
  }, undefined);
}
