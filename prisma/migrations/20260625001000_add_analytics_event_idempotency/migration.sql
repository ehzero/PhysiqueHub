-- 재시도/응답 유실 시 같은 배치가 재전송되어 이벤트가 중복 삽입되는 것을 막기
-- 위한 클라이언트 생성 멱등 키. 기존 행은 NULL로 남고(Postgres는 NULL을 유니크
-- 중복으로 보지 않음), 신규 행만 채운다. 수집 API는
-- createMany({ skipDuplicates: true })로 같은 eventId 재삽입을 건너뛴다.
ALTER TABLE "AnalyticsEvent" ADD COLUMN "eventId" TEXT;

CREATE UNIQUE INDEX "AnalyticsEvent_eventId_key" ON "AnalyticsEvent"("eventId");
