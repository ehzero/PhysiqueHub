# Public Cache Policy

PhysiqueHub의 공개 페이지는 대회 일정과 아티클처럼 모든 사용자에게 동일하게
보여도 되는 데이터를 중심으로 캐싱한다. 개인별 저장 상태나 필터 UI 상태는
브라우저에서 처리하고, 서버 캐시는 공용 데이터와 공용 HTML에만 사용한다.

## 기본 정책

| 대상 | 정책 | 기준 파일 |
| --- | --- | --- |
| 홈, 대회 일정, 내 대회 페이지 HTML | ISR 1일 | `src/app/(site)/page.tsx`, `src/app/(site)/competitions/page.tsx`, `src/app/(site)/saved/page.tsx` |
| 대회 시즌 데이터 | `unstable_cache` 30일 | `src/lib/competition-server.ts`, `src/lib/public-cache.ts` |
| 아티클 데이터 | `unstable_cache` 30일 | `src/lib/article-server.ts`, `src/lib/public-cache.ts` |
| 아티클 목록/상세 HTML | 아티클 데이터 캐시 기준 30일 | `src/app/(site)/articles/page.tsx`, `src/app/(site)/articles/[slug]/page.tsx` |
| 대회 taxonomy 랜딩 HTML | ISR 1일 | `src/app/(site)/competitions/*/[slug]/page.tsx` |

## 대회 데이터 흐름

- Prisma에서 대회 데이터를 읽는 공유 경로는 `server-only` 모듈에 둔다.
- 시즌 단위 대회 데이터는 `COMPETITIONS_CACHE_TAG`와 30일 TTL로 캐싱한다.
- 홈, 대회 일정, 내 대회 페이지는 날짜 기반 DB 쿼리를 직접 캐싱하지 않는다.
- 대신 캐시된 시즌 전체 데이터에서 서버 렌더링 시점의 한국 날짜(`today`)로
  예정 대회를 필터링한다.
- `/competitions`의 query parameter는 서버 데이터 조회 조건이 아니라 클라이언트
  필터 상태 복원과 공유 URL 용도다.

## 무효화

- 대회 데이터 수정 경로는 `updateTag(COMPETITIONS_CACHE_TAG)`로 시즌 데이터 캐시를
  무효화해야 한다.
- 아티클 데이터 수정 경로가 추가되면 `updateTag(ARTICLES_CACHE_TAG)`를 함께 호출해야
  한다.
- Next.js Data Cache는 재배포만으로 자동 무효화된다고 가정하지 않는다. 코드 배포와
  데이터 갱신은 별개의 이벤트로 취급한다.

## 주의

- `dynamic = "force-dynamic"`은 ISR이 아니라 요청 시점 렌더링을 강제한다. 홈, 대회
  일정, 내 대회처럼 1일 ISR을 유지해야 하는 공개 페이지에는 사용하지 않는다.
- 날짜 기준이 사용자에게 보이는 페이지에서는 날짜 기반 결과 자체를 장기 캐싱하지
  말고, 장기 캐시는 원본 시즌 데이터에만 적용한다.
- 예약 발행처럼 시간 기준 공개 여부가 있는 아티클도 공개 여부 결과를 장기 캐싱하지
  말고, `status: "published"` 원본 데이터 캐시 위에서 서버 렌더링 시점의 현재
  시각으로 필터링한다.
