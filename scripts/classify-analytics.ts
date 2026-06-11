import { prisma } from "../src/lib/prisma";
import {
  classifyAnalyticsTraffic,
  getBrowserNameFromUserAgent,
  getDeviceCategoryFromUserAgent,
  loadBotDetectionRules,
} from "../src/lib/analytics-traffic-classifier";

type ScriptOptions = {
  all: boolean;
  dryRun: boolean;
  since: Date;
};

const DEFAULT_LOOKBACK_DAYS = 30;

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const where = options.all
    ? {}
    : {
        startedAt: {
          gte: options.since,
        },
      };
  const sessions = await prisma.analyticsSession.findMany({
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      deviceCategory: true,
      browserName: true,
      trafficType: true,
      botName: true,
      botReason: true,
      botVerified: true,
      reverseDnsHost: true,
      classificationVersion: true,
    },
    where,
  });
  const rules = await loadBotDetectionRules(prisma);

  const summary = {
    checked: sessions.length,
    changed: 0,
    human: 0,
    bot: 0,
    suspectedBot: 0,
    unknown: 0,
  };

  for (const session of sessions) {
    const classification = await classifyAnalyticsTraffic({
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      prismaClient: prisma,
      rules,
    });
    const nextDeviceCategory =
      session.deviceCategory === "bot"
        ? getDeviceCategoryFromUserAgent(session.userAgent)
        : session.deviceCategory;
    const nextBrowserName =
      session.browserName === "Bot"
        ? getBrowserNameFromUserAgent(session.userAgent)
        : session.browserName;

    if (classification.trafficType === "bot") summary.bot += 1;
    else if (classification.trafficType === "suspected_bot") summary.suspectedBot += 1;
    else if (classification.trafficType === "human") summary.human += 1;
    else summary.unknown += 1;

    const changed =
      session.trafficType !== classification.trafficType ||
      session.botName !== classification.botName ||
      session.botReason !== classification.botReason ||
      session.botVerified !== classification.botVerified ||
      session.reverseDnsHost !== classification.reverseDnsHost ||
      session.classificationVersion !== classification.classificationVersion ||
      session.deviceCategory !== nextDeviceCategory ||
      session.browserName !== nextBrowserName;

    if (!changed) continue;
    summary.changed += 1;

    if (options.dryRun) continue;

    await prisma.analyticsSession.update({
      data: {
        trafficType: classification.trafficType,
        botName: classification.botName,
        botReason: classification.botReason,
        botVerified: classification.botVerified,
        reverseDnsHost: classification.reverseDnsHost,
        classifiedAt: classification.classifiedAt,
        classificationVersion: classification.classificationVersion,
        deviceCategory: nextDeviceCategory,
        browserName: nextBrowserName,
      },
      where: { id: session.id },
    });
  }

  console.log(
    JSON.stringify(
      {
        dryRun: options.dryRun,
        range: options.all ? "all" : { since: options.since.toISOString() },
        ...summary,
      },
      null,
      2,
    ),
  );
}

function parseOptions(args: string[]): ScriptOptions {
  const all = args.includes("--all");
  const dryRun = args.includes("--dry-run");
  const sinceArg = args.find((arg) => arg.startsWith("--since="));
  const since = sinceArg
    ? parseDateArg(sinceArg.slice("--since=".length))
    : new Date(Date.now() - DEFAULT_LOOKBACK_DAYS * 86_400_000);

  return { all, dryRun, since };
}

function parseDateArg(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid --since value: ${value}`);
  }
  return date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
