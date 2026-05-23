import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { CompetitionScheduleDraft } from "../types/competitionSchedule";
import type { CrawlPreviewResult, CrawlSourceSummary } from "./types";

const NON_SYNCABLE_ORGANIZATION_IDS = new Set(["fitschedule"]);

interface CrawlSyncOptions {
  dryRun?: boolean;
  requireStartsOn?: boolean;
  syncSourceProgress?: boolean;
}

interface CrawlSyncSummary {
  dryRun: boolean;
  receivedEvents: number;
  skippedEvents: number;
  upsertedEvents: number;
  sourceProgressUpserted: number;
  skipped: Array<{
    id?: string;
    organizationId?: string;
    title?: string;
    reason: string;
  }>;
}

export async function syncCrawlPreviewResult(
  result: CrawlPreviewResult,
  options: CrawlSyncOptions = {},
): Promise<CrawlSyncSummary> {
  const syncSourceProgress = options.syncSourceProgress ?? true;
  const skipped: CrawlSyncSummary["skipped"] = [];
  const syncableEvents = result.events.filter((event) => {
    const reason = getSkipReason(event, options);
    if (reason) {
      skipped.push({
        id: event.id,
        organizationId: event.organizationId,
        title: event.title,
        reason,
      });
      return false;
    }

    return true;
  });

  if (options.dryRun) {
    return {
      dryRun: true,
      receivedEvents: result.events.length,
      skippedEvents: skipped.length,
      upsertedEvents: syncableEvents.length,
      sourceProgressUpserted: syncSourceProgress ? countSourceProgressRows(result) : 0,
      skipped,
    };
  }

  let upsertedEvents = 0;
  for (const event of syncableEvents) {
    await prisma.competitionSchedule.upsert({
      where: getCompetitionScheduleWhere(event),
      create: toCompetitionScheduleCreateInput(event),
      update: toCompetitionScheduleUpdateInput(event),
    });
    upsertedEvents += 1;
  }

  const sourceProgressUpserted = syncSourceProgress
    ? await upsertSourceProgressRows(result)
    : 0;

  return {
    dryRun: false,
    receivedEvents: result.events.length,
    skippedEvents: skipped.length,
    upsertedEvents,
    sourceProgressUpserted,
    skipped,
  };
}

function getSkipReason(
  event: CompetitionScheduleDraft,
  options: CrawlSyncOptions,
): string | undefined {
  if (!event.id) {
    return "id가 없어 upsert 기준을 만들 수 없습니다.";
  }

  if (!event.organizationId) {
    return "organizationId가 없습니다.";
  }

  if (!event.title) {
    return "title이 없습니다.";
  }

  if (!event.source?.sourceUrl || !event.source?.sourceType || !event.source?.fetchedAt) {
    return "source.sourceUrl/sourceType/fetchedAt 중 누락된 값이 있습니다.";
  }

  if (NON_SYNCABLE_ORGANIZATION_IDS.has(event.organizationId)) {
    return "공식 단체가 아닌 보조 수집 소스 이벤트는 DB에 저장하지 않습니다.";
  }

  if (event.source.sourceType === "aggregator") {
    return "집계/보조 소스 기반 후보 이벤트는 공식 원본 검수 전 DB에 저장하지 않습니다.";
  }

  if (options.requireStartsOn && !event.date?.startsOn) {
    return "requireStartsOn 옵션으로 date.startsOn 없는 이벤트를 제외했습니다.";
  }

  return undefined;
}

function getCompetitionScheduleWhere(
  event: CompetitionScheduleDraft,
): Prisma.CompetitionScheduleWhereUniqueInput {
  if (event.source.sourceEventId) {
    return {
      competition_schedule_org_source_event_unique: {
        organizationId: event.organizationId,
        sourceEventId: event.source.sourceEventId,
      },
    };
  }

  return { id: event.id };
}

function toCompetitionScheduleCreateInput(
  event: CompetitionScheduleDraft,
): Prisma.CompetitionScheduleUncheckedCreateInput {
  return {
    id: getRequiredEventId(event),
    ...toCompetitionScheduleWritableInput(event),
  };
}

function toCompetitionScheduleUpdateInput(
  event: CompetitionScheduleDraft,
): Prisma.CompetitionScheduleUncheckedUpdateInput {
  return {
    id: getRequiredEventId(event),
    ...toCompetitionScheduleWritableInput(event),
  };
}

function getRequiredEventId(event: CompetitionScheduleDraft): string {
  if (!event.id) {
    throw new Error(`id가 없는 이벤트는 DB에 저장할 수 없습니다: ${event.title}`);
  }

  return event.id;
}

function toCompetitionScheduleWritableInput(
  event: CompetitionScheduleDraft,
): Omit<Prisma.CompetitionScheduleUncheckedCreateInput, "id" | "createdAt" | "updatedAt"> {
  return {
    organizationId: event.organizationId,
    organizationName: event.organizationName,
    organizationShortName: event.organizationShortName ?? null,
    title: event.title,
    subtitle: event.subtitle ?? null,
    aliasesJson: stringifyJson(event.aliases ?? []),
    seasonYear: event.seasonYear ?? null,

    dateStartsOn: parseDateOnly(event.date.startsOn),
    dateEndsOn: parseDateOnly(event.date.endsOn),
    dateTimezone: event.date.timezone,
    dateRawText: event.date.rawText ?? null,
    dateConfidence: event.date.confidence,

    registrationOpensAt: parseDateTime(event.registration.opensAt),
    registrationClosesAt: parseDateTime(event.registration.closesAt),
    registrationStatus: event.registration.status,
    registrationUrl: event.registration.registrationUrl ?? null,
    registrationRawText: event.registration.rawText ?? null,
    registrationConfidence: event.registration.confidence,
    feeCurrency: event.registration.fee?.currency ?? "UNKNOWN",
    feeMinAmount: event.registration.fee?.minAmount ?? null,
    feeMaxAmount: event.registration.fee?.maxAmount ?? null,
    feeRawText: event.registration.fee?.rawText ?? null,

    country: event.location.country,
    region: event.location.region ?? null,
    city: event.location.city ?? null,
    venue: event.location.venue ?? null,
    address: event.location.address ?? null,
    locationRawText: event.location.rawText ?? null,
    locationConfidence: event.location.confidence,

    divisionsJson: stringifyJson(event.divisions),
    tagsJson: stringifyJson(event.tags),
    flagsJson: stringifyJson(event.flags),

    posterImageUrl: event.media?.posterImageUrl ?? null,
    thumbnailUrl: event.media?.thumbnailUrl ?? null,
    imageSourceUrl: event.media?.imageSourceUrl ?? null,

    sourceType: event.source.sourceType,
    sourceUrl: event.source.sourceUrl,
    canonicalUrl: event.source.canonicalUrl ?? null,
    detailUrl: event.source.detailUrl ?? null,
    sourceEventId: event.source.sourceEventId ?? null,
    sourceUpdatedAt: parseDateTime(event.source.sourceUpdatedAt),
    fetchedAt: parseRequiredDateTime(event.source.fetchedAt, "source.fetchedAt"),
    parserName: event.source.parserName ?? null,
    parserVersion: event.source.parserVersion ?? null,
    rawHash: event.source.rawHash ?? null,
    rawTitle: event.source.rawTitle ?? null,
    rawDateText: event.source.rawDateText ?? null,
    rawLocationText: event.source.rawLocationText ?? null,
    rawRegistrationText: event.source.rawRegistrationText ?? null,

    crawlStatus: event.crawlStatus,
    reviewStatus: event.reviewStatus,
    confidence: event.confidence,
    qualityIssuesJson: stringifyJson(event.qualityIssues),
    notes: event.notes ?? null,
    normalizedAt: parseDateTime(event.normalizedAt),
  };
}

async function upsertSourceProgressRows(result: CrawlPreviewResult): Promise<number> {
  const progressRows = getSourceProgressRows(result);

  for (const row of progressRows) {
    await prisma.competitionSourceProgress.upsert({
      where: { organizationId: row.organizationId },
      create: row,
      update: {
        organizationName: row.organizationName,
        status: row.status,
        sourceConfirmed: row.sourceConfirmed,
        parserImplemented: row.parserImplemented,
        sampleCollected: row.sampleCollected,
        reviewed: row.reviewed,
        sourceUrlsJson: row.sourceUrlsJson,
        note: row.note,
      },
    });
  }

  return progressRows.length;
}

function countSourceProgressRows(result: CrawlPreviewResult): number {
  return getSourceProgressRows(result).length;
}

function getSourceProgressRows(
  result: CrawlPreviewResult,
): Prisma.CompetitionSourceProgressUncheckedCreateInput[] {
  const sourcesByOrganization = new Map<string, CrawlSourceSummary[]>();

  for (const source of result.sources) {
    if (
      NON_SYNCABLE_ORGANIZATION_IDS.has(source.organizationId) ||
      source.url.includes("fitschedule.co.kr")
    ) {
      continue;
    }

    const sources = sourcesByOrganization.get(source.organizationId) ?? [];
    sources.push(source);
    sourcesByOrganization.set(source.organizationId, sources);
  }

  return Array.from(sourcesByOrganization.entries()).map(([organizationId, sources]) => {
    const events = result.events.filter((event) => event.organizationId === organizationId);
    const hasSample = events.length > 0;
    const hasOkSource = sources.some((source) => source.ok);
    const status = hasSample ? "sample-collected" : hasOkSource ? "source-confirmed" : "not-started";

    return {
      organizationId,
      organizationName: sources[0]?.organizationName ?? organizationId,
      status,
      sourceConfirmed: hasOkSource,
      parserImplemented: true,
      sampleCollected: hasSample,
      reviewed: events.length > 0 && events.every((event) => event.reviewStatus === "approved"),
      sourceUrlsJson: stringifyJson(Array.from(new Set(sources.map((source) => source.url)))),
      note: sources.flatMap((source) => source.warnings).join(" / ") || undefined,
    };
  });
}

function parseDateOnly(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  return parseRequiredDateTime(`${value}T00:00:00+09:00`, "date");
}

function parseDateTime(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/.test(value)
    ? `${value.replace(" ", "T")}+09:00`
    : value;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseRequiredDateTime(value: string, fieldName: string): Date {
  const parsed = parseDateTime(value);

  if (!parsed) {
    throw new Error(`${fieldName} 값이 유효한 DateTime이 아닙니다: ${value}`);
  }

  return parsed;
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
