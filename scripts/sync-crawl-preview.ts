import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { syncCrawlPreviewResult } from "../src/crawlers/db";
import type { CrawlPreviewError, CrawlPreviewResult, CrawlSourceSummary } from "../src/crawlers/types";
import type { CompetitionScheduleDraft } from "../src/types/competitionSchedule";
import { parseOrganizationArgs, parseSeasonYearArg } from "./crawl-cli";

interface OrganizationPreviewFile {
  generatedAt: string;
  seasonYear?: number;
  organizationId: string;
  organizationName: string;
  sources: CrawlSourceSummary[];
  events: CompetitionScheduleDraft[];
  errors: CrawlPreviewError[];
}

async function main() {
  const argv = process.argv.slice(2);
  const organizationIds = parseOrganizationArgs(argv);
  const seasonYear = parseSeasonYearArg(argv);
  const selectedIds = new Set(organizationIds ?? []);
  const dryRun = argv.includes("--dry-run");
  const requireStartsOn = argv.includes("--require-starts-on");
  const skipSourceProgress = argv.includes("--skip-source-progress");
  const previewDir = path.resolve(process.cwd(), "crawl-preview");
  const result = await readPreviewDirectory(previewDir, selectedIds, seasonYear);
  const summary = await syncCrawlPreviewResult(result, {
    dryRun,
    requireStartsOn,
    syncSourceProgress: !skipSourceProgress,
  });

  console.log(
    JSON.stringify(
      {
        previewDir,
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
}

async function readPreviewDirectory(
  previewDir: string,
  selectedIds: Set<string>,
  seasonYear: number | undefined,
): Promise<CrawlPreviewResult> {
  const files = (await readdir(previewDir))
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .sort();
  const payloads: OrganizationPreviewFile[] = [];

  for (const file of files) {
    const payload = JSON.parse(
      await readFile(path.join(previewDir, file), "utf8"),
    ) as OrganizationPreviewFile;

    if (selectedIds.size > 0 && !selectedIds.has(payload.organizationId)) {
      continue;
    }

    payloads.push(payload);
  }

  const generatedAt =
    payloads
      .map((payload) => payload.generatedAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? new Date().toISOString();

  return {
    generatedAt,
    seasonYear,
    sources: payloads.flatMap((payload) => payload.sources),
    events: payloads
      .flatMap((payload) => payload.events)
      .filter((event) => !seasonYear || isEventInSeason(event, seasonYear)),
    errors: payloads.flatMap((payload) => payload.errors),
  };
}

function isEventInSeason(event: CompetitionScheduleDraft, seasonYear: number): boolean {
  if (event.seasonYear === seasonYear) {
    return true;
  }

  const startsOnYear = event.date.startsOn ? Number(event.date.startsOn.slice(0, 4)) : undefined;
  const endsOnYear = event.date.endsOn ? Number(event.date.endsOn.slice(0, 4)) : undefined;

  return startsOnYear === seasonYear || endsOnYear === seasonYear;
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
