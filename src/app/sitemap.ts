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
import { getArticlePath } from "@/lib/articles-data";
import { getArticleSitemapEntries } from "@/lib/article-server";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [{ competitionPage }, landingTaxons, articleEntries] = await Promise.all([
    getUpcomingCompetitionContext(),
    getIndexableCompetitionLandingTaxons(),
    getArticleSitemapEntries(),
  ]);
  const latestCompetitionUpdate = getLatestUpdate(competitionPage.items);
  const latestArticleUpdate = getLatestArticleUpdate(articleEntries);

  const staticRoutes = [
    toSitemapEntry(siteUrl, "", latestCompetitionUpdate),
    toSitemapEntry(siteUrl, "/competitions", latestCompetitionUpdate),
    toSitemapEntry(siteUrl, "/guide"),
    toSitemapEntry(siteUrl, "/articles", latestArticleUpdate),
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
  const articleRoutes = articleEntries.map(({ article, lastModified }) =>
    toSitemapEntry(siteUrl, getArticlePath(article), lastModified),
  );

  return [...staticRoutes, ...landingRoutes, ...competitionRoutes, ...articleRoutes];
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

function getLatestArticleUpdate(
  entries: Awaited<ReturnType<typeof getArticleSitemapEntries>>,
): Date | undefined {
  return entries.reduce<Date | undefined>((latest, entry) => {
    if (!entry.lastModified) {
      return latest;
    }

    return !latest || entry.lastModified > latest ? entry.lastModified : latest;
  }, undefined);
}
