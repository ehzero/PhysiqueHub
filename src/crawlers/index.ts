import type { CompetitionScheduleDraft } from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";
import {
  crawlAgonas,
  crawlIcnKorea,
  crawlKclassicRelatedCandidates,
} from "./candidates";
import { crawlFitSchedule } from "./fitschedule";
import { crawlIfbbNpcAgp } from "./ifbb";
import { crawlInbaPnba } from "./inba";
import { crawlKclassic } from "./kclassic";
import { crawlKbbf } from "./kbbf";
import { crawlMusclemania } from "./musclemania";
import { crawlMonsterzym } from "./monsterzym";
import { crawlNabba } from "./nabba";
import { crawlNacKorea } from "./nac";
import { crawlOneClassic } from "./oneclassic";
import { crawlPcaNpca } from "./pca";
import { crawlUnmo } from "./unmo";
import { crawlWnbfKorea } from "./wnbf";
import type { CrawlPreviewOptions, CrawlPreviewResult, CrawlerResult } from "./types";

const CRAWLER_GROUPS: Array<{
  organizationIds: CrawlOrganizationId[];
  crawler: (selectedOrganizationIds?: CrawlOrganizationId[]) => Promise<CrawlerResult>;
}> = [
  {
    organizationIds: ["npc-ifbb-pro-korea", "agp"],
    crawler: crawlIfbbNpcAgp,
  },
  {
    organizationIds: ["kbbf"],
    crawler: crawlKbbf,
  },
  {
    organizationIds: ["nabba-korea"],
    crawler: crawlNabba,
  },
  {
    organizationIds: ["nac-korea"],
    crawler: crawlNacKorea,
  },
  {
    organizationIds: ["agonas"],
    crawler: crawlAgonas,
  },
  {
    organizationIds: ["icn-korea"],
    crawler: crawlIcnKorea,
  },
  {
    organizationIds: ["musa", "wngp", "bob", "anbc"],
    crawler: crawlUnmo,
  },
  {
    organizationIds: ["pca-korea", "npca-korea"],
    crawler: crawlPcaNpca,
  },
  {
    organizationIds: ["musclemania"],
    crawler: crawlMusclemania,
  },
  {
    organizationIds: ["wnbf-korea"],
    crawler: crawlWnbfKorea,
  },
  {
    organizationIds: ["k-classic"],
    crawler: crawlKclassic,
  },
  {
    organizationIds: ["j-classic", "ssa-korea", "wff-korea"],
    crawler: crawlKclassicRelatedCandidates,
  },
  {
    organizationIds: ["inba-pnba"],
    crawler: crawlInbaPnba,
  },
  {
    organizationIds: ["fitschedule"],
    crawler: crawlFitSchedule,
  },
  {
    organizationIds: ["monsterzym"],
    crawler: crawlMonsterzym,
  },
  {
    organizationIds: ["one-classic"],
    crawler: crawlOneClassic,
  },
];

export async function runCrawlPreview(
  options: CrawlPreviewOptions = {},
): Promise<CrawlPreviewResult> {
  const generatedAt = new Date().toISOString();
  const selectedIds = new Set(options.organizationIds ?? []);
  const crawlers =
    selectedIds.size > 0
      ? CRAWLER_GROUPS.filter((group) =>
          group.organizationIds.some((organizationId) => selectedIds.has(organizationId)),
        )
      : CRAWLER_GROUPS;
  const results = await runSequentially(
    crawlers.map((group) => () =>
      group.crawler(
        selectedIds.size > 0
          ? group.organizationIds.filter((organizationId) => selectedIds.has(organizationId))
          : undefined,
      ),
    ),
  );
  const allSources = results.flatMap((result) => result.sources);
  const errors = results.flatMap((result) => result.errors);
  const allEvents = dedupeEvents(results.flatMap((result) => result.events)).sort(compareEvents);
  const events =
    selectedIds.size > 0
      ? allEvents.filter((event) => selectedIds.has(event.organizationId as CrawlOrganizationId))
      : allEvents;
  const sources =
    selectedIds.size > 0
      ? getSourcesForSelection(allSources, events, selectedIds)
      : allSources;

  return {
    generatedAt,
    sources,
    events,
    errors,
  };
}

async function runSequentially(
  crawlers: Array<() => Promise<CrawlerResult>>,
): Promise<CrawlerResult[]> {
  const results: CrawlerResult[] = [];

  for (const crawler of crawlers) {
    results.push(await crawler());
  }

  return results;
}

function dedupeEvents(events: CompetitionScheduleDraft[]): CompetitionScheduleDraft[] {
  const seen = new Set<string>();

  return events.filter((event) => {
    const key = event.id ?? `${event.organizationId}:${event.title}:${event.source.sourceUrl}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function compareEvents(a: CompetitionScheduleDraft, b: CompetitionScheduleDraft): number {
  const aDate = a.date.startsOn ?? "9999-12-31";
  const bDate = b.date.startsOn ?? "9999-12-31";

  return (
    aDate.localeCompare(bDate) ||
    a.organizationId.localeCompare(b.organizationId) ||
    a.title.localeCompare(b.title)
  );
}

function getSourcesForEvents(
  sources: CrawlerResult["sources"],
  events: CompetitionScheduleDraft[],
): CrawlerResult["sources"] {
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

function getSourcesForSelection(
  sources: CrawlerResult["sources"],
  events: CompetitionScheduleDraft[],
  selectedIds: Set<CrawlOrganizationId>,
): CrawlerResult["sources"] {
  const eventSources = getSourcesForEvents(sources, events);
  const eventSourceKeys = new Set(
    eventSources.map((source) => `${source.organizationId}:${source.url}`),
  );
  const sourceOnlyMatches = sources.filter(
    (source) =>
      selectedIds.has(source.organizationId as CrawlOrganizationId) &&
      !eventSourceKeys.has(`${source.organizationId}:${source.url}`),
  );

  return [...eventSources, ...sourceOnlyMatches];
}
