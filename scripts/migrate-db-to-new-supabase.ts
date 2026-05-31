import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

type EnvMap = Record<string, string>;

type MigrationEnv = EnvMap & {
  sourceDatabaseUrl: string;
  targetDatabaseUrl: string;
  targetDirectUrl: string;
};

type CopyResult = {
  model: string;
  sourceCount: number;
  targetBefore: number;
  targetAfter: number;
};

const REQUIRED_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "DATABASE_URL2",
  "DIRECT_URL2",
] as const;

const BATCH_SIZE = 100;

function parseDotEnv(path: string): EnvMap {
  const text = readFileSync(path, "utf8");
  const env: EnvMap = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function loadMigrationEnv(): MigrationEnv {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    throw new Error(".env file not found");
  }

  const parsed = parseDotEnv(envPath);
  const shellEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const merged = { ...shellEnv, ...parsed };
  const missing = REQUIRED_ENV_KEYS.filter((key) => !merged[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env keys: ${missing.join(", ")}`);
  }

  const sourceDatabaseUrl = merged.DATABASE_URL_OLD ?? merged.DATABASE_URL;
  const targetDatabaseUrl = merged.DATABASE_URL2;
  const targetDirectUrl = merged.DIRECT_URL2;

  if (sourceDatabaseUrl === targetDatabaseUrl) {
    throw new Error(
      "Source and target database URLs point to the same value. Set DATABASE_URL_OLD or DATABASE_URL to the old DB and DATABASE_URL2 to the new DB.",
    );
  }

  return {
    ...merged,
    sourceDatabaseUrl,
    targetDatabaseUrl,
    targetDirectUrl,
  };
}

function runPrismaMigrateDeploy(env: MigrationEnv): boolean {
  const prismaBin = join(process.cwd(), "node_modules", ".bin", "prisma");
  const result = spawnSync(prismaBin, ["migrate", "deploy"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: env.targetDirectUrl,
      DIRECT_URL: env.targetDirectUrl,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.warn(
      `prisma migrate deploy failed with status ${result.status}; falling back to direct SQL migrations.`,
    );
    return false;
  }

  return true;
}

function statementHasSql(statement: string) {
  return statement
    .split(/\r?\n/)
    .some((line) => line.trim() && !line.trim().startsWith("--"));
}

function splitSqlStatements(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(statementHasSql);
}

async function ensurePrismaMigrationsTable(client: PrismaClient) {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    )
  `);
}

async function getAppliedMigrationNames(client: PrismaClient) {
  await ensurePrismaMigrationsTable(client);

  const rows = await client.$queryRaw<Array<{ migration_name: string }>>`
    SELECT "migration_name"
    FROM "_prisma_migrations"
    WHERE "finished_at" IS NOT NULL
      AND "rolled_back_at" IS NULL
  `;

  return new Set(rows.map((row) => row.migration_name));
}

async function applyMigrationsWithPrismaClient(client: PrismaClient) {
  const migrationsPath = join(process.cwd(), "prisma", "migrations");
  const appliedMigrations = await getAppliedMigrationNames(client);
  const migrationNames = readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migrationName of migrationNames) {
    if (appliedMigrations.has(migrationName)) {
      continue;
    }

    const sqlPath = join(migrationsPath, migrationName, "migration.sql");
    const sql = readFileSync(sqlPath, "utf8");
    const statements = splitSqlStatements(sql);
    const checksum = createHash("sha256").update(sql).digest("hex");
    const migrationId = randomUUID();

    console.log(`Applying ${migrationName} with direct SQL...`);

    await client.$transaction(async (tx) => {
      for (const statement of statements) {
        await tx.$executeRawUnsafe(statement);
      }

      await tx.$executeRaw`
        INSERT INTO "_prisma_migrations" (
          "id",
          "checksum",
          "finished_at",
          "migration_name",
          "logs",
          "rolled_back_at",
          "started_at",
          "applied_steps_count"
        )
        VALUES (
          ${migrationId},
          ${checksum},
          now(),
          ${migrationName},
          NULL,
          NULL,
          now(),
          ${statements.length}
        )
      `;
    });
  }
}

async function copyCompetitionSourceProgress(
  source: PrismaClient,
  target: PrismaClient,
): Promise<CopyResult> {
  const sourceCount = await source.competitionSourceProgress.count();
  const targetBefore = await target.competitionSourceProgress.count();
  let skip = 0;

  while (skip < sourceCount) {
    const rows = await source.competitionSourceProgress.findMany({
      orderBy: { organizationId: "asc" },
      skip,
      take: BATCH_SIZE,
    });

    for (const row of rows) {
      await target.competitionSourceProgress.upsert({
        where: { organizationId: row.organizationId },
        create: row,
        update: row,
      });
    }

    skip += rows.length;
  }

  return {
    model: "CompetitionSourceProgress",
    sourceCount,
    targetBefore,
    targetAfter: await target.competitionSourceProgress.count(),
  };
}

async function copyCompetitionSchedules(
  source: PrismaClient,
  target: PrismaClient,
): Promise<CopyResult> {
  const sourceCount = await source.competitionSchedule.count();
  const targetBefore = await target.competitionSchedule.count();
  let skip = 0;

  while (skip < sourceCount) {
    const rows = await source.competitionSchedule.findMany({
      orderBy: { id: "asc" },
      skip,
      take: BATCH_SIZE,
    });

    for (const row of rows) {
      await target.competitionSchedule.upsert({
        where: { id: row.id },
        create: row,
        update: row,
      });
    }

    skip += rows.length;
  }

  return {
    model: "CompetitionSchedule",
    sourceCount,
    targetBefore,
    targetAfter: await target.competitionSchedule.count(),
  };
}

async function copyContactInquiries(
  source: PrismaClient,
  target: PrismaClient,
): Promise<CopyResult> {
  const sourceCount = await source.contactInquiry.count();
  const targetBefore = await target.contactInquiry.count();
  let skip = 0;

  while (skip < sourceCount) {
    const rows = await source.contactInquiry.findMany({
      orderBy: { id: "asc" },
      skip,
      take: BATCH_SIZE,
    });

    for (const row of rows) {
      await target.contactInquiry.upsert({
        where: { id: row.id },
        create: row,
        update: row,
      });
    }

    skip += rows.length;
  }

  return {
    model: "ContactInquiry",
    sourceCount,
    targetBefore,
    targetAfter: await target.contactInquiry.count(),
  };
}

async function copyContactAttachments(
  source: PrismaClient,
  target: PrismaClient,
): Promise<CopyResult> {
  const sourceCount = await source.contactAttachment.count();
  const targetBefore = await target.contactAttachment.count();
  let skip = 0;

  while (skip < sourceCount) {
    const rows = await source.contactAttachment.findMany({
      orderBy: { id: "asc" },
      skip,
      take: BATCH_SIZE,
    });

    for (const row of rows) {
      await target.contactAttachment.upsert({
        where: { id: row.id },
        create: row,
        update: row,
      });
    }

    skip += rows.length;
  }

  return {
    model: "ContactAttachment",
    sourceCount,
    targetBefore,
    targetAfter: await target.contactAttachment.count(),
  };
}

function printResults(results: CopyResult[]) {
  console.table(
    results.map((result) => ({
      model: result.model,
      source: result.sourceCount,
      targetBefore: result.targetBefore,
      targetAfter: result.targetAfter,
      matched: result.sourceCount === result.targetAfter,
    })),
  );
}

async function main() {
  const env = loadMigrationEnv();

  console.log("Applying Prisma migrations to DATABASE_URL2...");
  const migrateDeploySucceeded = runPrismaMigrateDeploy(env);

  const source = new PrismaClient({
    datasources: { db: { url: env.sourceDatabaseUrl } },
  });
  const target = new PrismaClient({
    datasources: { db: { url: env.targetDatabaseUrl } },
  });

  try {
    if (!migrateDeploySucceeded) {
      await applyMigrationsWithPrismaClient(target);
    }

    const results = [
      await copyCompetitionSourceProgress(source, target),
      await copyCompetitionSchedules(source, target),
      await copyContactInquiries(source, target),
      await copyContactAttachments(source, target),
    ];

    printResults(results);

    const mismatches = results.filter(
      (result) => result.sourceCount !== result.targetAfter,
    );

    if (mismatches.length > 0) {
      throw new Error(
        `Copy verification failed for: ${mismatches
          .map((result) => result.model)
          .join(", ")}`,
      );
    }
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
