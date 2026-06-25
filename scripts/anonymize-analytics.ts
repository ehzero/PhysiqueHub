import {
  ANALYTICS_IDENTIFIER_RETENTION_DAYS,
  anonymizeStaleAnalytics,
} from "../src/lib/analytics-retention";
import { prisma } from "../src/lib/prisma";

type ScriptOptions = {
  dryRun: boolean;
  retentionDays: number;
  batchSize: number;
};

const DEFAULT_BATCH_SIZE = 5_000;

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const result = await anonymizeStaleAnalytics({
    retentionDays: options.retentionDays,
    batchSize: options.batchSize,
    dryRun: options.dryRun,
  });

  console.log(
    JSON.stringify({ ...result, cutoff: result.cutoff.toISOString() }, null, 2),
  );
}

function parseOptions(args: string[]): ScriptOptions {
  const dryRun = args.includes("--dry-run");
  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const batchArg = args.find((arg) => arg.startsWith("--batch="));

  return {
    dryRun,
    retentionDays: daysArg
      ? parsePositiveInt(daysArg.slice("--days=".length), "--days")
      : ANALYTICS_IDENTIFIER_RETENTION_DAYS,
    batchSize: batchArg
      ? parsePositiveInt(batchArg.slice("--batch=".length), "--batch")
      : DEFAULT_BATCH_SIZE,
  };
}

function parsePositiveInt(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} value: ${value}`);
  }
  return parsed;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
