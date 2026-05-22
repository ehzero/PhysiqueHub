import { syncCrawlPreviewResult } from "../src/crawlers/db";
import { runCrawlPreview } from "../src/crawlers";
import { parseOrganizationArgs, parseSeasonYearArg } from "./crawl-cli";

async function main() {
  const argv = process.argv.slice(2);
  const organizationIds = parseOrganizationArgs(argv);
  const seasonYear = parseSeasonYearArg(argv);
  const dryRun = argv.includes("--dry-run");
  const requireStartsOn = argv.includes("--require-starts-on");
  const skipSourceProgress = argv.includes("--skip-source-progress");
  const result = await runCrawlPreview({ organizationIds, seasonYear });
  const summary = await syncCrawlPreviewResult(result, {
    dryRun,
    requireStartsOn,
    syncSourceProgress: !skipSourceProgress,
  });

  console.log(
    JSON.stringify(
      {
        generatedAt: result.generatedAt,
        seasonYear: result.seasonYear,
        sources: result.sources.length,
        errors: result.errors,
        ...summary,
      },
      null,
      2,
    ),
  );

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
