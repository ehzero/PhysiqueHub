UPDATE "AnalyticsSession"
SET
    "deviceCategory" = 'bot',
    "browserName" = 'Bot',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "userAgent" ~* 'headlesschrome';
