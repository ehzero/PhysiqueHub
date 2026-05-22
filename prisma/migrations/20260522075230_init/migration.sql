-- CreateTable
CREATE TABLE "CompetitionSchedule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "organizationShortName" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "aliasesJson" TEXT NOT NULL DEFAULT '[]',
    "seasonYear" INTEGER,
    "dateStartsOn" TIMESTAMP(3),
    "dateEndsOn" TIMESTAMP(3),
    "dateTimezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "dateRawText" TEXT,
    "dateConfidence" TEXT NOT NULL DEFAULT 'low',
    "registrationOpensAt" TIMESTAMP(3),
    "registrationClosesAt" TIMESTAMP(3),
    "registrationStatus" TEXT NOT NULL DEFAULT 'unknown',
    "registrationUrl" TEXT,
    "registrationRawText" TEXT,
    "registrationConfidence" TEXT NOT NULL DEFAULT 'low',
    "feeCurrency" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "feeMinAmount" INTEGER,
    "feeMaxAmount" INTEGER,
    "feeRawText" TEXT,
    "country" TEXT NOT NULL DEFAULT 'KR',
    "region" TEXT,
    "city" TEXT,
    "venue" TEXT,
    "address" TEXT,
    "locationRawText" TEXT,
    "locationConfidence" TEXT NOT NULL DEFAULT 'low',
    "divisionsJson" TEXT NOT NULL DEFAULT '[]',
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "flagsJson" TEXT NOT NULL DEFAULT '{}',
    "posterImageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "imageSourceUrl" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "detailUrl" TEXT,
    "sourceEventId" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "parserName" TEXT,
    "parserVersion" TEXT,
    "rawHash" TEXT,
    "rawTitle" TEXT,
    "rawDateText" TEXT,
    "rawLocationText" TEXT,
    "rawRegistrationText" TEXT,
    "crawlStatus" TEXT NOT NULL DEFAULT 'not-started',
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "confidence" TEXT NOT NULL DEFAULT 'low',
    "qualityIssuesJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "normalizedAt" TIMESTAMP(3),

    CONSTRAINT "CompetitionSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionSourceProgress" (
    "organizationId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "sourceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "parserImplemented" BOOLEAN NOT NULL DEFAULT false,
    "sampleCollected" BOOLEAN NOT NULL DEFAULT false,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrlsJson" TEXT NOT NULL DEFAULT '[]',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionSourceProgress_pkey" PRIMARY KEY ("organizationId")
);

-- CreateIndex
CREATE INDEX "CompetitionSchedule_organizationId_idx" ON "CompetitionSchedule"("organizationId");

-- CreateIndex
CREATE INDEX "CompetitionSchedule_seasonYear_idx" ON "CompetitionSchedule"("seasonYear");

-- CreateIndex
CREATE INDEX "CompetitionSchedule_dateStartsOn_idx" ON "CompetitionSchedule"("dateStartsOn");

-- CreateIndex
CREATE INDEX "CompetitionSchedule_registrationStatus_idx" ON "CompetitionSchedule"("registrationStatus");

-- CreateIndex
CREATE INDEX "CompetitionSchedule_reviewStatus_idx" ON "CompetitionSchedule"("reviewStatus");

-- CreateIndex
CREATE INDEX "CompetitionSchedule_crawlStatus_idx" ON "CompetitionSchedule"("crawlStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionSchedule_organizationId_sourceEventId_key" ON "CompetitionSchedule"("organizationId", "sourceEventId");
