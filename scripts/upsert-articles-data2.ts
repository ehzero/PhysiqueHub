import { getArticlesData2DbRows } from "./articles-data2-db";
import { prisma } from "../src/lib/prisma";
import type { Prisma } from "@prisma/client";

function main() {
  return upsertArticles();
}

async function upsertArticles() {
  const rows = getArticlesData2DbRows();
  const requestedSlugs = process.argv.slice(2).filter((arg) => arg !== "--all");
  const syncAll = process.argv.includes("--all");

  if (!syncAll && requestedSlugs.length === 0) {
    throw new Error("Pass article slugs to upsert, or use --all intentionally.");
  }

  const requestedSlugSet = new Set(requestedSlugs);
  const data = syncAll
    ? rows
    : rows.filter((article) => requestedSlugSet.has(article.slug));

  const foundSlugSet = new Set(data.map((article) => article.slug));
  const missingSlugs = requestedSlugs.filter((slug) => !foundSlugSet.has(slug));

  if (missingSlugs.length > 0) {
    throw new Error(`Unknown article slug(s): ${missingSlugs.join(", ")}`);
  }

  const slugs = data.map((article) => article.slug);
  const existing = await prisma.article.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((article) => article.slug));

  await prisma.$transaction(
    data.map((article) => {
      const update = Object.fromEntries(
        Object.entries(article).filter(([key]) => key !== "id" && key !== "slug"),
      ) as Prisma.ArticleUpdateInput;

      return prisma.article.upsert({
        where: { slug: article.slug },
        create: article,
        update,
      });
    }),
  );

  console.log(JSON.stringify({
    upserted: data.length,
    created: slugs.filter((slug) => !existingSlugs.has(slug)).length,
    updated: slugs.filter((slug) => existingSlugs.has(slug)).length,
    mode: syncAll ? "all" : "selected",
    slugs,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
