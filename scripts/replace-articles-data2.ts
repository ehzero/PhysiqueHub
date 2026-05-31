import { getArticlesData2DbRows } from "./articles-data2-db";
import { prisma } from "../src/lib/prisma";

function main() {
  return replaceArticles();
}

async function replaceArticles() {
  const data = getArticlesData2DbRows();

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.article.deleteMany({});
    const created = await tx.article.createMany({ data });

    return {
      deleted: deleted.count,
      created: created.count,
    };
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
