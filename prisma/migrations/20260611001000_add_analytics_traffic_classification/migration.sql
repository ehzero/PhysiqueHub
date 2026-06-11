ALTER TABLE "AnalyticsSession"
ADD COLUMN "trafficType" TEXT NOT NULL DEFAULT 'human',
ADD COLUMN "botName" TEXT,
ADD COLUMN "botReason" TEXT,
ADD COLUMN "botVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reverseDnsHost" TEXT,
ADD COLUMN "classifiedAt" TIMESTAMP(3),
ADD COLUMN "classificationVersion" TEXT;

CREATE INDEX "AnalyticsSession_trafficType_idx" ON "AnalyticsSession"("trafficType");
CREATE INDEX "AnalyticsSession_botName_idx" ON "AnalyticsSession"("botName");
CREATE INDEX "AnalyticsSession_classifiedAt_idx" ON "AnalyticsSession"("classifiedAt");

CREATE TABLE "BotDetectionRule" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "matchType" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "trafficType" TEXT NOT NULL,
    "botName" TEXT,
    "botReason" TEXT,
    "verifyReverseDns" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotDetectionRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BotDetectionRule_enabled_priority_idx" ON "BotDetectionRule"("enabled", "priority");

CREATE TABLE "AnalyticsDnsCache" (
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT,
    "lookedUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsDnsCache_pkey" PRIMARY KEY ("ipAddress")
);

CREATE INDEX "AnalyticsDnsCache_expiresAt_idx" ON "AnalyticsDnsCache"("expiresAt");

INSERT INTO "BotDetectionRule" (
    "id",
    "priority",
    "matchType",
    "pattern",
    "trafficType",
    "botName",
    "botReason",
    "verifyReverseDns"
) VALUES
    ('ua_googlebot', 10, 'user_agent_regex', 'googlebot', 'bot', 'Googlebot', 'user_agent', false),
    ('ua_bingbot', 20, 'user_agent_regex', 'bingbot|bingpreview', 'bot', 'Microsoft Bingbot', 'user_agent', false),
    ('ua_applebot', 30, 'user_agent_regex', 'applebot', 'bot', 'Applebot', 'user_agent', false),
    ('ua_yeti', 40, 'user_agent_regex', 'yeti', 'bot', 'Naver Yeti', 'user_agent', false),
    ('ua_headless_chrome', 50, 'user_agent_regex', 'headlesschrome', 'bot', 'Headless Chrome', 'headless', false),
    ('ua_facebook_external_hit', 60, 'user_agent_regex', 'facebookexternalhit', 'bot', 'Facebook Crawler', 'user_agent', false),
    ('ip_naver_web_crawler_125_209_235', 70, 'ip_prefix', '125.209.235.', 'bot', 'Naver Web Crawler', 'ip_rule', true),
    ('rdns_googlebot', 100, 'reverse_dns_suffix', '.googlebot.com', 'bot', 'Googlebot', 'reverse_dns', true),
    ('rdns_google', 110, 'reverse_dns_suffix', '.google.com', 'bot', 'Googlebot', 'reverse_dns', true),
    ('rdns_naver_web', 120, 'reverse_dns_suffix', '.web.naver.com', 'bot', 'Naver Web Crawler', 'reverse_dns', true),
    ('rdns_bing', 130, 'reverse_dns_suffix', '.search.msn.com', 'bot', 'Microsoft Bingbot', 'reverse_dns', true);

UPDATE "AnalyticsSession"
SET
    "trafficType" = 'bot',
    "botName" = CASE
        WHEN "userAgent" ~* 'googlebot' THEN 'Googlebot'
        WHEN "userAgent" ~* 'bingbot|bingpreview' THEN 'Microsoft Bingbot'
        WHEN "userAgent" ~* 'applebot' THEN 'Applebot'
        WHEN "userAgent" ~* 'yeti' THEN 'Naver Yeti'
        WHEN "userAgent" ~* 'headlesschrome' THEN 'Headless Chrome'
        WHEN "userAgent" ~* 'facebookexternalhit' THEN 'Facebook Crawler'
        ELSE 'Bot'
    END,
    "botReason" = CASE
        WHEN "userAgent" ~* 'headlesschrome' THEN 'headless'
        ELSE 'user_agent'
    END,
    "botVerified" = true,
    "classifiedAt" = CURRENT_TIMESTAMP,
    "classificationVersion" = '2026-06-11.1'
WHERE "deviceCategory" = 'bot';
