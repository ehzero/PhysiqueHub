import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runCrawlPreview } from "../src/crawlers";
import type { CrawlPreviewError, CrawlSourceSummary } from "../src/crawlers/types";
import type { CompetitionScheduleDraft } from "../src/types/competitionSchedule";
import { parseOrganizationArgs } from "./crawl-cli";

interface OrganizationPreviewFile {
  generatedAt: string;
  organizationId: string;
  organizationName: string;
  sources: CrawlSourceSummary[];
  events: CompetitionScheduleDraft[];
  errors: CrawlPreviewError[];
}

interface PreviewIndexEntry {
  organizationId: string;
  organizationName: string;
  file: string;
  sourceCount: number;
  eventCount: number;
  errorCount: number;
  warningCount: number;
}

interface PreviewIndexFile {
  generatedAt: string;
  outputDir: string;
  totalSources: number;
  totalEvents: number;
  totalErrors: number;
  organizations: PreviewIndexEntry[];
}

async function main() {
  const outputDir = path.resolve(process.cwd(), "crawl-preview");
  const organizationIds = parseOrganizationArgs(process.argv.slice(2));
  const result = await runCrawlPreview({ organizationIds });
  const organizations = groupEventsByOrganization(result.events);
  const writtenFileNames: string[] = [];

  await mkdir(outputDir, { recursive: true });

  for (const [organizationId, events] of organizations) {
    const organizationName = events[0]?.organizationName ?? organizationId;
    const fileName = `${organizationId}.json`;
    const filePath = path.join(outputDir, fileName);
    const sources = getSourcesForOrganization(result.sources, events);
    const errors = getErrorsForOrganization(result.errors, sources, events);
    const payload: OrganizationPreviewFile = {
      generatedAt: result.generatedAt,
      organizationId,
      organizationName,
      sources,
      events,
      errors,
    };

    await writeJson(filePath, payload);
    writtenFileNames.push(fileName);
  }

  const sourceOnlyGroups = groupSourceOnlyOrganizations(result.sources, organizations);
  for (const [organizationId, sources] of sourceOnlyGroups) {
    const organizationName = sources[0]?.organizationName ?? organizationId;
    const fileName = `${organizationId}.json`;
    const filePath = path.join(outputDir, fileName);
    const errors = result.errors.filter((error) =>
      sources.some((source) => error.url.startsWith(source.url)),
    );
    const payload: OrganizationPreviewFile = {
      generatedAt: result.generatedAt,
      organizationId,
      organizationName,
      sources,
      events: [],
      errors,
    };

    await writeJson(filePath, payload);
    writtenFileNames.push(fileName);
  }

  const indexPayload = await buildIndexFromOrganizationFiles(outputDir, result.generatedAt);

  await writeJson(path.join(outputDir, "index.json"), indexPayload);

  console.log(
    JSON.stringify(
      {
        outputDir,
        files: ["index.json", ...writtenFileNames],
        writtenEvents: result.events.length,
        writtenErrors: result.errors.length,
        totalEvents: indexPayload.totalEvents,
        totalErrors: indexPayload.totalErrors,
      },
      null,
      2,
    ),
  );
}

function groupSourceOnlyOrganizations(
  sources: CrawlSourceSummary[],
  eventGroups: Map<string, CompetitionScheduleDraft[]>,
): Map<string, CrawlSourceSummary[]> {
  const groups = new Map<string, CrawlSourceSummary[]>();

  for (const source of sources) {
    if (eventGroups.has(source.organizationId)) {
      continue;
    }

    const list = groups.get(source.organizationId) ?? [];
    list.push(source);
    groups.set(source.organizationId, list);
  }

  return groups;
}

async function buildIndexFromOrganizationFiles(
  outputDir: string,
  generatedAt: string,
): Promise<PreviewIndexFile> {
  const files = (await readdir(outputDir))
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .sort();
  const entries: PreviewIndexEntry[] = [];
  const uniqueSourceUrls = new Set<string>();
  let totalEvents = 0;
  let totalErrors = 0;

  for (const file of files) {
    const payload = JSON.parse(
      await readFile(path.join(outputDir, file), "utf8"),
    ) as OrganizationPreviewFile;

    entries.push({
      organizationId: payload.organizationId,
      organizationName: payload.organizationName,
      file: `crawl-preview/${file}`,
      sourceCount: payload.sources.length,
      eventCount: payload.events.length,
      errorCount: payload.errors.length,
      warningCount: payload.sources.reduce(
        (total, source) => total + source.warnings.length,
        0,
      ),
    });

    for (const source of payload.sources) {
      uniqueSourceUrls.add(source.url);
    }
    totalEvents += payload.events.length;
    totalErrors += payload.errors.length;
  }

  return {
    generatedAt,
    outputDir: "crawl-preview",
    totalSources: uniqueSourceUrls.size,
    totalEvents,
    totalErrors,
    organizations: entries.sort((a, b) =>
      a.organizationId.localeCompare(b.organizationId),
    ),
  };
}

function groupEventsByOrganization(
  events: CompetitionScheduleDraft[],
): Map<string, CompetitionScheduleDraft[]> {
  const groups = new Map<string, CompetitionScheduleDraft[]>();

  for (const event of events) {
    const list = groups.get(event.organizationId) ?? [];
    list.push(event);
    groups.set(event.organizationId, list);
  }

  return groups;
}

function getSourcesForOrganization(
  sources: CrawlSourceSummary[],
  events: CompetitionScheduleDraft[],
): CrawlSourceSummary[] {
  const eventSourceKeys = new Set(
    events.map((event) => `${event.organizationId}:${event.source.sourceUrl}`),
  );

  return sources
    .filter((source) => eventSourceKeys.has(`${source.organizationId}:${source.url}`))
    .map((source) => ({
      ...source,
      count: events.filter(
        (event) =>
          event.organizationId === source.organizationId && event.source.sourceUrl === source.url,
      ).length,
    }));
}

function getErrorsForOrganization(
  errors: CrawlPreviewError[],
  sources: CrawlSourceSummary[],
  events: CompetitionScheduleDraft[],
): CrawlPreviewError[] {
  const relevantUrls = new Set([
    ...sources.map((source) => source.url),
    ...events.map((event) => event.source.sourceUrl),
    ...events.map((event) => event.source.detailUrl).filter(Boolean),
  ]);

  return errors.filter((error) =>
    Array.from(relevantUrls).some((url) => url && error.url.startsWith(url)),
  );
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
