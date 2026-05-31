CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'competition-result',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "language" TEXT NOT NULL DEFAULT 'ko',
    "authorName" TEXT NOT NULL DEFAULT 'PhysiqueHub 편집부',
    "heroImageUrl" TEXT,
    "bodyMarkdown" TEXT NOT NULL,
    "sourceUrlsJson" TEXT NOT NULL DEFAULT '[]',
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX "Article_category_idx" ON "Article"("category");
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

INSERT INTO "Article" (
    "id",
    "slug",
    "title",
    "subtitle",
    "excerpt",
    "category",
    "status",
    "language",
    "authorName",
    "bodyMarkdown",
    "sourceUrlsJson",
    "tagsJson",
    "publishedAt",
    "updatedAt"
) VALUES (
    'article_2026_world_of_monsterzym_korea_pro_results',
    '2026-world-of-monsterzym-korea-pro-results',
    '2026 월드 오브 몬스터짐 코리아 프로 결과: 한국 선수들이 만든 포디움 흐름',
    '서울에서 열린 IFBB Pro League 프로 대회의 주요 종목별 우승자와 한국 선수 상위권 기록을 공식 결과 기준으로 정리했습니다.',
    '2026 World of Monsterzym Korea Pro는 5월 9일부터 10일까지 서울에서 열렸고, Men''s 212, Classic Physique, Men''s Physique, Bikini, Wellness, Fit Model까지 여섯 개 프로 디비전 결과가 발표됐습니다.',
    'competition-result',
    'published',
    'ko',
    'PhysiqueHub 편집부',
    '# 2026 월드 오브 몬스터짐 코리아 프로 결과: 한국 선수들이 만든 포디움 흐름

2026 World of Monsterzym Korea Pro는 IFBB Pro League 공식 일정 기준 2026년 5월 9일부터 10일까지 서울에서 열린 프로 대회입니다. 공식 결과 페이지에는 Men''s 212 Bodybuilding, Men''s Classic Physique, Men''s Physique, Women''s Bikini, Women''s Wellness, Women''s Fit Model까지 여섯 개 디비전 결과가 올라왔습니다.

## 종목별 우승자

- Men''s 212 Bodybuilding: Wei Li(중국)
- Men''s Classic Physique: Kai Liu(중국)
- Men''s Physique: Juxian He(중국)
- Women''s Bikini: Jiaqi Wei(중국)
- Women''s Wellness: Valeria Bodanese(브라질)
- Women''s Fit Model: Hui Wu(중국)

## 한국 선수 상위권 기록

Men''s 212 Bodybuilding에서는 Sung Yeop Jang이 2위, Geonwoo Kim이 3위에 올랐고 Won Jongyun도 4위로 상위권에 들었습니다. Classic Physique에서는 Tae Min Jung이 2위, Hyowon Lee가 3위를 기록해 한국 선수 두 명이 포디움에 들어갔습니다.

Women''s Fit Model 역시 한국 선수의 상위권 진입이 두드러졌습니다. Hyejin Choi가 2위, Hyeran Sun이 3위를 기록했고 Eon Gyu Ju, Eunhae Ko, Eunjung Kim, Min Jeong Myeong, Seojin Han, Dabin Park 등 여러 한국 선수가 결선 순위표에 이름을 올렸습니다.

## 결과를 볼 때 체크할 점

이 대회는 IFBB Pro League PRO로 분류된 프로 대회입니다. 다만 결과표만으로 올림피아 출전권, 내추럴 여부, 도핑 테스트 적용 여부를 추가로 단정하지 않는 것이 안전합니다. 출전권이나 테스트 정책은 시즌별 규정과 대회별 공지가 따로 적용될 수 있으므로, 선수의 다음 일정이나 자격을 확인할 때는 공식 룰과 후속 공지를 함께 확인해야 합니다.

## 출처

- IFBB Pro League 공식 대회/결과 페이지: https://www.ifbbpro.com/competition/2026-world-of-monsterzym-korea-pro/
',
    '[{"label":"IFBB Pro League 공식 대회/결과 페이지","url":"https://www.ifbbpro.com/competition/2026-world-of-monsterzym-korea-pro/","sourceType":"official","checkedAt":"2026-05-31"}]',
    '["대회결과","IFBB Pro League","Monsterzym","Korea Pro","프로대회","서울"]',
    '2026-05-31T00:00:00.000Z',
    CURRENT_TIMESTAMP
);
