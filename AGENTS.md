# PhysiqueHub Agent Guide

PhysiqueHub is a Korean-language Next.js service for discovering fitness and
bodybuilding competition schedules. Agents working in this repository should
optimize for accurate competition data, useful search landing pages, and a
stable browsing experience for athletes comparing events.

## Project Context

- Stack: Next.js, React, TypeScript, Prisma, Tailwind CSS.
- Product shape: competition schedule hub for Korean users, with selected major
  international events shown for season context.
- Source policy: prefer official federation, organizer, registration, or board
  pages. Aggregators can be used only as supplemental discovery or review input.
- Domain baseline: use
  [`docs/fitness-bodybuilding-competition-context.md`](docs/fitness-bodybuilding-competition-context.md)
  for competition, federation, division, natural, doping, and pro-card context.
- Crawling/source baseline: use
  [`docs/competition-schedule-crawling-sources.md`](docs/competition-schedule-crawling-sources.md)
  before adding or changing crawler behavior.
- SEO baseline: review metadata and landing-page behavior against
  [`src/lib/metadata.ts`](src/lib/metadata.ts) and
  [`src/lib/competition-taxonomy.ts`](src/lib/competition-taxonomy.ts).
- UI baseline: before adding page-specific CSS or components, inspect existing
  shared page/layout primitives in `src/components` and global utility classes
  in [`src/app/globals.css`](src/app/globals.css). Prefer reusing existing
  components such as page shells, cards, empty states, sticky controls, action
  buttons, segment controls, icons, and share behavior.
- Data/cache baseline: public pages should follow the existing server-first
  data flow. Fetch Prisma data in `server-only` modules, serialize it before
  passing to client components, and cache public DB reads with
  `unstable_cache`, [`src/lib/public-cache.ts`](src/lib/public-cache.ts), and
  route-level revalidation/static generation patterns used by competition and
  article pages. Use [`docs/public-cache-policy.md`](docs/public-cache-policy.md)
  for the current public page ISR, season data cache, article data cache, and
  invalidation policy.
- Analytics baseline: use
  [`docs/analytics-events.md`](docs/analytics-events.md) before adding or
  changing analytics events, session fields, event properties, retention
  behavior, or privacy-facing tracking copy.

## Sub-Agent Roster

Use exactly these three sub-agent roles for this project:

| Agent | Role | Rule document |
| --- | --- | --- |
| `implementation` | Writes code, updates content, and runs verification. | [`agent-rules/implementation-agent.md`](agent-rules/implementation-agent.md) |
| `seo-review` | Reviews search intent, metadata, internal links, and landing-page structure. | [`agent-rules/seo-review-agent.md`](agent-rules/seo-review-agent.md) |
| `domain-review` | Reviews factual correctness for fitness and bodybuilding competition content. | [`agent-rules/domain-review-agent.md`](agent-rules/domain-review-agent.md) |

## Routing Rules

- Use `implementation` for actual changes to code, data normalization, UI,
  crawlers, tests, and documentation.
- Use `seo-review` for any change that affects public pages, metadata,
  canonical URLs, sitemap/robots behavior, internal linking, taxonomy pages, or
  search-facing Korean copy.
- Use `implementation` to confirm public page changes reuse existing CSS,
  component, server-data, and cache patterns before introducing new local
  equivalents.
- Use `implementation` for analytics instrumentation, event schemas, API routes,
  Prisma analytics models, and client tracking behavior.
- Use `seo-review` for analytics changes that affect public-page behavior,
  search-facing copy, privacy policy, or terms pages.
- Use `domain-review` for any change that mentions competitions, federations,
  divisions, natural status, doping/testing policy, pro cards, qualification
  routes, venues, dates, or official source claims.
- If a task changes both code and public content, complete implementation first,
  then run the review gates.
- If a task is documentation-only but includes search-facing or domain-facing
  claims, run the relevant review gate before treating it as complete.

## Required Workflow

1. `implementation` makes the change and reports changed files, implementation
   summary, verification, review needs, and remaining risks.
2. Run project-appropriate checks. Prefer focused checks for small changes and
   broader checks when shared behavior is touched.
3. `seo-review` must approve changes with SEO or public landing-page impact.
4. `domain-review` must approve changes with domain factual impact.
5. Integrate fixes from review findings before final delivery.

SEO and domain reviews are required gates for content, SEO, competition data,
landing-page, guide, and taxonomy changes. A task is not complete until required
review findings are resolved or explicitly recorded as accepted risk.

## Shared Reporting Format

Each sub-agent must end with a concise checklist report:

```md
## Agent Report

- [ ] Changed files / reviewed files:
- [ ] Summary:
- [ ] Verification:
- [ ] Findings or follow-ups:
- [ ] Remaining risks:
```

Use Korean for user-facing content and review findings unless a task explicitly
requires English. Keep claims traceable to code, local docs, or official sources.

## Non-Negotiables

- Do not revert user changes unless the user explicitly asks.
- Do not invent competition facts or SEO claims without source support.
- Do not treat aggregator-only data as official truth.
- Do not mark SEO/domain-impacting work complete before the required review gate.
- Do not add broad refactors while handling a narrow task.
- Do not duplicate domain definitions in multiple places when the existing docs
  or typed constants can be referenced.
