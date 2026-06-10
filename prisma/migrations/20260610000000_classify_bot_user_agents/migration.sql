UPDATE "AnalyticsSession"
SET
    "deviceCategory" = 'bot',
    "browserName" = 'Bot',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "userAgent" ~* '(bot|crawler|spider|crawling|facebookexternalhit|slurp|yeti|daumoa|bingpreview)';
