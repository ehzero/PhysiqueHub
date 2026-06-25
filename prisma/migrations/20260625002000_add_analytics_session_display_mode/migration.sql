-- 접근 모드(브라우저/PWA) 분포를 세션 단위로 일관되게 집계하기 위해 displayMode를
-- 세션 행에 저장한다. 기존 행은 NULL(접근 모드 '알 수 없음')로 남는다.
ALTER TABLE "AnalyticsSession" ADD COLUMN "displayMode" TEXT;
