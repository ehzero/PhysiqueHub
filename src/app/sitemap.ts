import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return ["", "/about", "/terms", "/privacy"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
  }));
}
