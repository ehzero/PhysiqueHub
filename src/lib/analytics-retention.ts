import { prisma } from "@/lib/prisma";

// B안: 식별 가능 정보(원문 IP·전체 User-Agent)는 수집일로부터 이 기간이 지나면
// null로 비운다. 비식별 이벤트/세션 행 자체는 추세 분석을 위해 계속 보관한다.
export const ANALYTICS_IDENTIFIER_RETENTION_DAYS = 90;

const DAY_MS = 86_400_000;
const DEFAULT_BATCH_SIZE = 5_000;

export type AnalyticsRetentionResult = {
  cutoff: Date;
  retentionDays: number;
  dryRun: boolean;
  sessionsAnonymized: number;
  eventsAnonymized: number;
  dnsCacheDeleted: number;
};

type AnonymizeOptions = {
  now?: Date;
  retentionDays?: number;
  batchSize?: number;
  dryRun?: boolean;
};

/**
 * 수집일(createdAt) 기준으로 보관 기간이 지난 행의 식별 필드를 비식별 처리한다.
 *
 * - 기준은 클라이언트가 보낸 occurredAt이 아니라 서버 저장 시각 createdAt이다.
 *   occurredAt은 클라이언트 시계라 조작/오차 시 과보관 위험이 있다.
 * - ipAddress/userAgent만 비운다. 이미 파생·저장된 deviceCategory/browserName/
 *   osName/trafficType/channel/referrerHost 등 비식별 요약값은 그대로 둔다.
 * - DNS 캐시는 만료된 행(IP→host 매핑)을 함께 삭제한다.
 * - 큰 1회성 백필도 안전하도록 배치로 끊어 갱신한다.
 */
export async function anonymizeStaleAnalytics({
  now = new Date(),
  retentionDays = ANALYTICS_IDENTIFIER_RETENTION_DAYS,
  batchSize = DEFAULT_BATCH_SIZE,
  dryRun = false,
}: AnonymizeOptions = {}): Promise<AnalyticsRetentionResult> {
  const cutoff = new Date(now.getTime() - retentionDays * DAY_MS);

  if (dryRun) {
    const staleFilter = {
      createdAt: { lt: cutoff },
      OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
    };
    const [sessionsAnonymized, eventsAnonymized, dnsCacheDeleted] = await Promise.all([
      prisma.analyticsSession.count({ where: staleFilter }),
      prisma.analyticsEvent.count({ where: staleFilter }),
      prisma.analyticsDnsCache.count({ where: { expiresAt: { lt: now } } }),
    ]);

    return { cutoff, retentionDays, dryRun, sessionsAnonymized, eventsAnonymized, dnsCacheDeleted };
  }

  const sessionsAnonymized = await anonymizeSessions(cutoff, batchSize);
  const eventsAnonymized = await anonymizeEvents(cutoff, batchSize);
  const dnsCacheDeleted = await prisma.analyticsDnsCache
    .deleteMany({ where: { expiresAt: { lt: now } } })
    .then((result) => result.count);

  return { cutoff, retentionDays, dryRun, sessionsAnonymized, eventsAnonymized, dnsCacheDeleted };
}

async function anonymizeSessions(cutoff: Date, batchSize: number) {
  let total = 0;

  for (;;) {
    const affected = await prisma.$executeRaw`
      UPDATE "AnalyticsSession"
      SET "ipAddress" = NULL, "userAgent" = NULL
      WHERE "id" IN (
        SELECT "id"
        FROM "AnalyticsSession"
        WHERE "createdAt" < ${cutoff}
          AND ("ipAddress" IS NOT NULL OR "userAgent" IS NOT NULL)
        LIMIT ${batchSize}
      )
    `;

    total += affected;
    if (affected < batchSize) break;
  }

  return total;
}

async function anonymizeEvents(cutoff: Date, batchSize: number) {
  let total = 0;

  for (;;) {
    const affected = await prisma.$executeRaw`
      UPDATE "AnalyticsEvent"
      SET "ipAddress" = NULL, "userAgent" = NULL
      WHERE "id" IN (
        SELECT "id"
        FROM "AnalyticsEvent"
        WHERE "createdAt" < ${cutoff}
          AND ("ipAddress" IS NOT NULL OR "userAgent" IS NOT NULL)
        LIMIT ${batchSize}
      )
    `;

    total += affected;
    if (affected < batchSize) break;
  }

  return total;
}
