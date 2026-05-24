export const DETAIL_REQUEST_DELAY_MS = {
  min: 1_000,
  max: 5_000,
} as const;

export const FETCH_TIMEOUT_MS = 30_000;

export const CRAWL_ORGANIZATION_IDS = [
  "npc-ifbb-pro-korea",
  "agp",
  "kbbf",
  "nabba-korea",
  "nac-korea",
  "agonas",
  "icn-korea",
  "musa",
  "wngp",
  "bob",
  "anbc",
  "pca-korea",
  "npca-korea",
  "musclemania",
  "wnbf-korea",
  "k-classic",
  "j-classic",
  "ssa-korea",
  "wff-korea",
  "inba-pnba",
  "ifbb-pro-league",
  "fitschedule",
  "monsterzym",
  "one-classic",
] as const;

export type CrawlOrganizationId = (typeof CRAWL_ORGANIZATION_IDS)[number];
