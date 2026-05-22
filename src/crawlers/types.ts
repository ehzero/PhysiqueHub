import type { CompetitionScheduleDraft } from "../types/competitionSchedule";
import type { CrawlOrganizationId } from "./config";

export interface CrawlSourceSummary {
  organizationId: string;
  organizationName: string;
  url: string;
  ok: boolean;
  count: number;
  warnings: string[];
  fetchedAt?: string;
}

export interface CrawlPreviewError {
  url: string;
  message: string;
}

export interface CrawlerResult {
  sources: CrawlSourceSummary[];
  events: CompetitionScheduleDraft[];
  errors: CrawlPreviewError[];
}

export interface CrawlPreviewResult extends CrawlerResult {
  generatedAt: string;
}

export interface CrawlPreviewOptions {
  organizationIds?: CrawlOrganizationId[];
}
