-- 식별 정보 비식별 보관 잡(src/lib/analytics-retention.ts)이 수집일(createdAt)
-- 기준으로 오래된 행을 찾는 쿼리를 지원하기 위한 인덱스.
-- 큰 테이블이라면 운영 중 잠금을 피하기 위해 별도로 CREATE INDEX CONCURRENTLY로
-- 먼저 생성한 뒤 이 마이그레이션을 적용하는 것을 권장한다.
CREATE INDEX "AnalyticsSession_createdAt_idx" ON "AnalyticsSession"("createdAt");

CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
