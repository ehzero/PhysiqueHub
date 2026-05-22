import { runCrawlPreview } from "../src/crawlers";
import { parseOrganizationArgs, parseSeasonYearArg } from "./crawl-cli";

async function main() {
  const argv = process.argv.slice(2);
  const organizationIds = parseOrganizationArgs(argv);
  const seasonYear = parseSeasonYearArg(argv);
  const result = await runCrawlPreview({ organizationIds, seasonYear });

  console.log(JSON.stringify(result, null, 2));

  if (result.events.length === 0 && result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sources: [],
        events: [],
        errors: [{ url: "crawl-preview", message }],
      },
      null,
      2,
    ),
  );

  process.exitCode = 1;
});
