INSERT INTO "BotDetectionRule" (
    "id",
    "priority",
    "matchType",
    "pattern",
    "trafficType",
    "botName",
    "botReason",
    "verifyReverseDns"
) VALUES (
    'rdns_google_cloud_chrome',
    140,
    'reverse_dns_suffix',
    '.bc.googleusercontent.com',
    'suspected_bot',
    'Google Cloud Chrome',
    'reverse_dns',
    true
)
ON CONFLICT ("id") DO UPDATE
SET
    "enabled" = true,
    "priority" = EXCLUDED."priority",
    "matchType" = EXCLUDED."matchType",
    "pattern" = EXCLUDED."pattern",
    "trafficType" = EXCLUDED."trafficType",
    "botName" = EXCLUDED."botName",
    "botReason" = EXCLUDED."botReason",
    "verifyReverseDns" = EXCLUDED."verifyReverseDns",
    "updatedAt" = CURRENT_TIMESTAMP;
