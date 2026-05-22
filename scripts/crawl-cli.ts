import {
  CRAWL_ORGANIZATION_IDS,
  type CrawlOrganizationId,
} from "../src/crawlers/config";

export function parseOrganizationArgs(argv: string[]): CrawlOrganizationId[] | undefined {
  const values: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--org" || arg === "--organization" || arg === "--organizations") {
      const value = argv[index + 1];
      if (value) {
        values.push(...value.split(","));
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--org=")) {
      values.push(...arg.slice("--org=".length).split(","));
    }
  }

  if (values.length === 0) {
    return undefined;
  }

  const normalized = values.map((value) => value.trim()).filter(Boolean);
  const invalid = normalized.filter((value) => !isCrawlOrganizationId(value));

  if (invalid.length > 0) {
    throw new Error(
      `Unknown organization id: ${invalid.join(", ")}. Available: ${CRAWL_ORGANIZATION_IDS.join(", ")}`,
    );
  }

  return Array.from(new Set(normalized)) as CrawlOrganizationId[];
}

function isCrawlOrganizationId(value: string): value is CrawlOrganizationId {
  return CRAWL_ORGANIZATION_IDS.includes(value as CrawlOrganizationId);
}
