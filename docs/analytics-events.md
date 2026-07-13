# Analytics Events

PhysiqueHub는 `@vercel/analytics`를 사용하지 않고 자체 이용 행동 로그를
수집한다. 이 문서는 이벤트 의미, 저장 필드, 지표 해석 기준, 개인정보 취급
주의사항의 기준 문서다.

## 기준 파일

| 대상 | 기준 파일 |
| --- | --- |
| 이벤트명, 입력 타입, 허용 속성 | `src/lib/analytics.ts` |
| 클라이언트 세션/큐/전송 로직 | `src/lib/analytics-client.ts` |
| axios API 인스턴스 | `src/lib/http-client.ts` |
| analytics API 호출 래퍼 | `src/lib/analytics-api.ts` |
| 수집 API route | `src/app/api/analytics/events/route.ts` |
| DB 모델 | `prisma/schema.prisma` |
| 식별 정보 비식별 보관 잡 | `src/lib/analytics-retention.ts` |
| 개인정보 고지 | `src/app/(site)/privacy/page.tsx` |

## 수집 단위

### 세션

`AnalyticsSession`은 한 브라우저 세션의 진입 맥락을 저장한다.

| 필드 | 의미 |
| --- | --- |
| `id` | 세션 식별자. 브라우저 `sessionStorage`의 `ph-analytics-session-id`에서 생성된다. |
| `visitorId` | 익명 방문자 식별자. 브라우저 `localStorage`의 `ph-analytics-visitor-id`에서 생성된다. |
| `landingPath` | 세션 최초 진입 경로. |
| `referrer`, `referrerHost` | 브라우저가 제공한 이전 페이지 URL과 host. |
| `channel` | UTM/referrer 기반 유입 채널 추정값. |
| `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm` | UTM query parameter. |
| `ipAddress` | 요청 헤더에서 추출한 원문 IP. |
| `userAgent` | 요청의 전체 User-Agent. |
| `deviceCategory`, `browserName`, `osName` | 요청 User-Agent에서 서버가 파싱한 기기/브라우저/OS 요약. |
| `displayMode` | 진입 시 화면 표시 모드(`standalone`/`fullscreen`/`minimal-ui`/`browser`). 접근 모드 집계 기준. 진입 시 1회만 기록. |
| `trafficType` | `human`, `bot`, `suspected_bot`, `unknown` 중 하나인 트래픽 분류. |
| `botName`, `botReason`, `botVerified` | 봇으로 분류된 경우의 봇 이름, 판정 근거, 검증 여부. |
| `reverseDnsHost` | IP reverse DNS 조회 결과. 조회하지 않았거나 실패하면 `null`. |
| `classifiedAt`, `classificationVersion` | 트래픽 분류 시각과 분류 로직 버전. |
| `startedAt`, `lastSeenAt` | 세션 시작/마지막 수신 시각. |

### 봇 판정 규칙

`BotDetectionRule`은 봇 판정 규칙을 저장한다. 초기 규칙은 User-Agent 정규식,
IP prefix, reverse DNS suffix 기반으로 Googlebot, Bingbot, Applebot, Naver
Yeti, Naver Web Crawler, Headless Chrome 등을 분류한다.
`*.bc.googleusercontent.com`에서 들어오는 Linux Chrome UA는 검증된 Googlebot이
아니므로 `Google Cloud Chrome` 이름의 `suspected_bot`으로 분류한다.

`AnalyticsDnsCache`는 IP reverse DNS 결과를 24시간 캐시한다. DNS 조회 실패는
로그 저장 실패로 이어지지 않는다.

### 이벤트

`AnalyticsEvent`는 사용자의 개별 행동을 저장한다.

| 필드 | 의미 |
| --- | --- |
| `eventId` | 클라이언트가 enqueue 시 생성하는 멱등 키(고유). 재시도로 같은 배치가 재전송돼도 `createMany({ skipDuplicates: true })`가 중복 삽입을 건너뛴다. 구버전/누락 시 `null`. |
| `sessionId`, `visitorId` | 세션/방문자 연결 키. |
| `name` | 이벤트명. `src/lib/analytics.ts`의 `ANALYTICS_EVENT_NAMES`만 허용한다. |
| `path` | 이벤트가 발생한 경로. |
| `occurredAt` | 클라이언트 기준 발생 시각. 잘못된 값이거나 서버 시각 대비 과도한 미래(5분 초과)·과거(2일 초과)면 서버 수신 시각으로 대체된다. |
| `competitionId` | 대회 관련 이벤트의 대회 ID. |
| `searchQuery` | 검색어. 이메일/전화번호 패턴은 `[redacted]`로 치환한다. |
| `resultCount` | 검색/필터/목록 조작 시점의 결과 수. |
| `propertiesJson` | 허용된 보조 속성만 JSON 문자열로 저장한다. |
| `ipAddress` | 요청 헤더에서 추출한 원문 IP. |
| `userAgent` | 요청의 전체 User-Agent. |
| `createdAt` | 서버 저장 시각. |

## 이벤트 정의

| 이벤트 | 의미 | 주요 사용처 |
| --- | --- | --- |
| `session_start` | 세션 최초 시작. | 세션 진입 맥락, 유입 채널 분석 |
| `page_view` | URL 단위 페이지 조회. | 전체 페이지뷰, URL별 트래픽 |
| `engagement_ping` | 30초 단위 활성 상태 ping. | 체류/스크롤 깊이 추정 |
| `search_performed` | 검색어 변경으로 검색 수행. | 검색어, 검색 결과 수 분석 |
| `empty_search_result` | 검색 또는 필터 결과가 0건. | 검색/필터 실패 지점 분석 |
| `filter_applied` | 필터 또는 scope 적용. | 필터 사용 분석 |
| `filter_reset` | 필터 또는 scope 초기화. | 필터 해제 분석 |
| `sort_changed` | 정렬 변경. | 정렬 선호 분석 |
| `view_mode_changed` | 리스트/그리드 보기 변경. | 목록 UI 사용 분석 |
| `competition_open` | 목록에서 대회 드로어를 열기. | 목록 관심 대회 분석 |
| `competition_detail_click` | 드로어에서 상세 페이지 이동 클릭. | 드로어에서 상세 진입 의도 분석 |
| `competition_view` | 대회 상세 페이지 조회. | 대회별 상세 조회수 분석 |
| `related_competition_click` | 상세 페이지 관련 대회 클릭. | 관련 대회 탐색 분석 |
| `registration_link_click` | 접수 링크 클릭. | 접수 전환 의도 분석 |
| `source_link_click` | 공식 출처 링크 클릭. | 원문 확인 행동 분석 |
| `share_click` | 공유 버튼 클릭. | 공유 의도 분석 |
| `save_competition` | 관심 대회 저장. | 저장 전환 분석 |
| `unsave_competition` | 관심 대회 저장 해제. | 저장 해제 분석 |
| `contact_open` | 문의 drawer 열기. | 문의 의도 분석 |
| `contact_submit_success` | 문의 제출 성공. | 문의 전환 분석 |
| `owned_promo_impression` | 피지크허브 자사 서비스 프로모션이 화면에 50% 이상 노출됨. 같은 URL·슬롯에서는 클라이언트 실행 중 한 번만 수집한다. | 자사 프로모션 실노출 분석 |
| `owned_promo_click` | 자사 서비스 프로모션의 외부 이동 링크 클릭. | 자사 프로모션 클릭·CTR 분석 |

## 지표 해석 기준

- 전체 페이지뷰와 URL 트래픽은 `page_view`만 사용한다.
- 대회별 상세 조회수는 `competition_view`만 사용한다.
- `page_view`와 `competition_view`는 같은 상세 페이지 진입에서 함께 발생할 수
  있지만 서로 합산하지 않는다.
- 목록에서 대회 드로어를 연 횟수는 `competition_open`으로 본다.
- 드로어에서 실제 상세 페이지로 이동하려는 의도는 `competition_detail_click`으로
  본다.
- 상세 페이지가 실제 렌더링된 조회는 `competition_view`로 본다.
- 광고 문의 배너 클릭은 별도 이벤트를 추가하지 않고 `contact_open`의
  `propertiesJson.source`가 `*_ad` 또는 `*_ad_rail`인 값으로 구분한다.
- 자사 서비스 프로모션은 광고 문의와 분리해 `owned_promo_impression`과
  `owned_promo_click`으로 수집한다. 슬롯별 CTR은 같은 `source`·`promotionId`·
  `variant` 조합의 클릭 수를 실노출 수로 나누어 계산한다. 노출은
  `IntersectionObserver`에서 프로모션 영역이 50% 이상 보인 경우에만 기록한다.
- 광고 리드 어트리뷰션: `contact_open`과 `contact_submit_success`는 열린 시점의
  컨텍스트를 동일하게 싣는다 — `propertiesJson.source`(슬롯), 그리고 상세·드로어
  배너처럼 대회 맥락이 있는 경우 `competitionId`와 `propertiesJson.tier`/
  `organizationId`. 목록/그리드 슬롯과 헤더·푸터 문의는 대회 맥락이 없어
  `competitionId`가 비어 있다. submit이 open과 같은 컨텍스트를 실으므로 슬롯별·
  대회별 완료율을 집계할 수 있다.
- 대회별 공유와 저장은 각각 `share_click`, `save_competition`의
  `competitionId`를 기준으로 본다. 과거 공유 이벤트처럼 `competitionId`가 없는
  이벤트는 전체 공유 클릭 수에는 포함되지만 대회별 공유 순위에는 포함되지 않는다.
- 실시간 활성 사용자는 `AnalyticsSession.lastSeenAt`이 최근 2분 이내인 고유
  `visitorId` 수로 추정한다. 활성 세션은 같은 기준의 세션 수로 본다.
- 신규/재방문자는 기간 내 `AnalyticsSession.visitorId`가 기간 시작 전에도 세션을
  가진 적이 있는지로 구분한다.
- 접근 모드(브라우저/PWA)는 `AnalyticsSession.displayMode` 컬럼을 기준으로 본다.
  `standalone`, `fullscreen`, `minimal-ui`는 PWA, `browser`는 브라우저, 그 외나
  값이 없는 기존 세션은 `알 수 없음`이다.
- 기기 환경, 브라우저, OS 분포는 요청의 원문 User-Agent를 서버에서 파싱한
  `AnalyticsSession.deviceCategory`, `browserName`, `osName`을 기준으로 본다.
  User-Agent가 없거나 파싱이 어려운 경우 클라이언트가 보낸 요약값을 보조로 쓴다.
- 봇/크롤러 판정은 `AnalyticsSession.trafficType`, `botName`, `botReason`,
  `botVerified`, `reverseDnsHost`를 기준으로 본다. `deviceCategory`는 기기 유형만
  나타내며 신규 데이터에서는 `bot` 값을 쓰지 않는다.
- `/admin/analytics`의 기본 이용 분석 지표는 `trafficType = human` 세션과 해당
  세션의 이벤트만 포함한다. `bot`, `suspected_bot`은 같은 화면의 별도 섹션에서
  본다. `unknown`(재분류로만 생길 수 있음)은 어느 쪽에도 포함되지 않으므로 합계가
  전체와 다를 수 있다.
- 공개 헤더 방문자 카운터는 운영 노출용 신호로, 요청에 따라 `trafficType`을
  필터링하지 않고 `AnalyticsSession.visitorId`의 고유 수를 표시한다. 오늘
  방문자는 Asia/Seoul 날짜 경계의 `startedAt` 기준이며, 전체 방문자는 전체 기간의
  고유 방문자 수다.
- 기존 로그 재분류는 `npm run analytics:classify`로 수행한다. 기본은 최근 30일,
  `--all`, `--since=YYYY-MM-DD`, `--dry-run` 옵션을 지원한다.
- 검색어 기준 검색 수행은 `search_performed`로 본다. 필터 변경은
  `filter_applied` 또는 `filter_reset`으로 본다.
- `empty_search_result`는 검색과 필터 양쪽에서 발생할 수 있으므로 원인 구분이
  필요하면 `propertiesJson.source` 같은 허용 속성을 추가한 뒤 분석한다.

### 어드민 분석 대시보드 지표

`/admin/analytics`는 기존 로그만 사용해 선택 기간의 사람 트래픽을 분석한다.
스키마, 이벤트명, 클라이언트 수집 속성을 추가하지 않는 범위에서 다음 지표를
계산한다.

- 재방문율은 기간 내 고유 방문자 중 기간 시작 전에도 세션이 있었던 방문자의
  비율로 본다. 재분류 안정성을 위해 과거 세션의 `trafficType`은 따지지 않는다.
- per-세션 비율(페이지뷰/세션, 참여 세션율, 문의 전환율)의 분모는 "활동 세션"
  = 기간 내 이벤트가 1건 이상인 `human` 세션 수다. 세션 시작 시각(`startedAt`)이
  아니라 활동(`occurredAt`) 기준이라 이벤트 분자와 모집단이 일치한다.
- 페이지뷰/세션은 `page_view` 수를 활동 세션 수로 나눈다.
- 참여 세션율은 `engagement_ping`이 1회 이상 있는 세션 / 활동 세션으로 본다.
- 평균 활성 시간은 세션별 `engagement_ping.propertiesJson.activeSeconds`의
  최대값을 구한 뒤 그 평균으로 계산한다. `activeSeconds`는 페이지 전환 시
  리셋하지 않고 세션 내내 누적하므로, 세션별 최대값이 곧 세션 총 활성 시간이다.
- 대회 목록 조회는 `page_view.path`가 `/competitions` 또는 `/competitions?`로
  시작하는 이벤트만 포함한다. 상세 페이지(`/competitions/{slug}`) 조회는 제외한다.
- 대회 탐색 퍼널은 목록 조회 → `competition_open` → `competition_detail_click`
  → `competition_view` → `registration_link_click` 순서로 표시한다.
  `competition_view`에는 검색 유입 등 직접 상세 진입이 포함될 수 있으므로 이전
  단계 대비 전환율이 100%를 넘을 수 있다.
- 접수 의도율은 `registration_link_click / competition_view`로 본다.
- 저장률과 공유율은 각각 `save_competition / competition_view`,
  `share_click / competition_view`로 본다.
- 문의 전환율은 `contact_submit_success / 활동 세션`으로 본다.
- 광고 리드 블록(대시보드 최상단 hero)은 매출 경로를 본다.
  - 문의 완료율은 `contact_submit_success / contact_open`으로, 폼 이탈률은 그 여집합으로 본다.
  - 유입 위치(슬롯)별 문의는 `contact_open`/`contact_submit_success`의
    `propertiesJson.source`로 묶어 슬롯별 열기·제출·완료율을 본다(`*_ad`/`*_ad_rail`이
    광고 슬롯).
  - 대회별 광고 문의는 contact 이벤트의 `competitionId`로 묶는다. 대회 맥락이 있는
    상세·드로어 배너에서만 채워지므로, 적용 전 과거 데이터에는 비어 있을 수 있다.
- 관련 대회 CTR은 `related_competition_click / competition_view`로, 출처 링크 클릭은
  `source_link_click` 수(접수 URL이 없을 때 공식 공지 클릭)로 전환 지표에 노출한다.
- 0건 결과율은 `empty_search_result / (search_performed + filter_applied)`로
  본다. 검색·필터 두 경로를 합산한 상호작용 기준 비율이다.
- 평균 검색 결과는 `search_performed.resultCount` 평균으로 본다.
- 대회 수요 표의 관련 행동 수는 화면에 노출된 상위 대회 ID에 대해 같은 기간의
  `competition_view`, `registration_link_click`, `save_competition`,
  `share_click`을 다시 집계해 표시한다.

현재 대시보드는 기존 로그만 사용하므로 필터별 0건 원인, 검색과 필터의 상세
조합, 상세 페이지 직접 진입의 정확한 유입 단계 분해는 하지 않는다. 이런 분석이
필요하면 새 허용 속성 또는 이벤트를 추가한 뒤 이 문서와 개인정보 고지를 함께
검토한다.

자사 서비스 프로모션 이벤트는 현재 이벤트 믹스 원시 집계에 포함되지만 전용
관리자 KPI나 슬롯별 CTR 표는 제공하지 않는다. 운영 데이터가 쌓인 뒤
`source`·`promotionId`·`variant` 기준의 노출, 클릭, CTR 지표를 추가한다.

다음 이벤트는 수집하되 전용 지표 없이 진단/원시 로그 용도로만 둔다(이벤트 믹스
표에만 나타날 수 있음): `filter_reset`, `sort_changed`, `view_mode_changed`.
허용 속성 중 `maxScrollDepth`는 수집하지만 아직 지표로 쓰지 않는다(향후 스크롤
깊이 분석용). 광고 노출(impression) 기반 슬롯 CTR은 아직 측정하지 않으므로 슬롯
지표는 클릭(`contact_open`) 기준이다.

## 허용 속성

`propertiesJson`에는 `ANALYTICS_ALLOWED_PROPERTY_KEYS`에 등록된 key만 저장한다.
새 속성을 추가할 때는 다음 기준을 따른다.

- 개인을 직접 식별할 수 있는 값을 넣지 않는다.
- 대회 분석에 필요한 속성은 가능한 기존 대회 ID나 분류값을 사용한다.
- 자유 입력값은 `searchQuery`처럼 별도 redaction 정책이 있는 필드에만 둔다.
- 새 속성이 지표 정의를 바꾸면 이 문서도 함께 업데이트한다.

현재 허용 속성:

- `activeSeconds`
- `activeFilterCount`
- `browserName`
- `category`
- `channel`
- `dateStartsOn`
- `deviceCategory`
- `displayMode`
- `filterCount`
- `filterKey`
- `filterValue`
- `hadRegistrationUrl`
- `isPwa`
- `landingPath`
- `maxScrollDepth`
- `organizationId`
- `osName`
- `promotionId`
- `referrerHost`
- `registrationStatus`
- `routeType`
- `savedCount`
- `scope`
- `sortKey`
- `source`
- `tier`
- `utmCampaign`
- `utmContent`
- `utmMedium`
- `utmSource`
- `utmTerm`
- `variant`
- `viewMode`

## 개인정보 및 운영 주의사항

- 원문 IP와 전체 User-Agent를 저장하므로 analytics 변경 시
  `src/app/(site)/privacy/page.tsx`의 고지 내용과 보관 기간을 함께 확인한다.
- 식별 정보 보관 정책(B안): 원문 IP와 전체 User-Agent는 수집일(`createdAt`)
  기준 90일이 지나면 `AnalyticsSession`과 `AnalyticsEvent` 양쪽에서 `null`로
  비운다(`src/lib/analytics-retention.ts`의 `ANALYTICS_IDENTIFIER_RETENTION_DAYS`).
  비식별 이벤트·세션 행 자체는 추세 분석을 위해 계속 보관하고, 이미 파생된
  `deviceCategory`/`browserName`/`osName`/`trafficType`/`channel`/`referrerHost`
  같은 요약값은 그대로 둔다. 만료된 `AnalyticsDnsCache` 행도 함께 삭제한다.
- 비식별 보관 잡은 `/api/analytics/retention`(Vercel Cron, `CRON_SECRET`
  Bearer 토큰으로 보호)이 매일 1회 실행한다. 수동 실행과 최초 백필은
  `npm run analytics:anonymize`로 하며 `--dry-run`, `--days=`, `--batch=`를
  지원한다. 테이블이 이미 큰 경우 초기 백필은 함수 타임아웃을 피하기 위해
  크론이 아닌 스크립트로 먼저 돌린다.
- 어드민 분석 대시보드는 원문 IP와 전체 User-Agent를 기본 노출하지 않는다.
  집계에는 사용할 수 있지만 화면에는 채널, 기기, 브라우저, OS 같은 요약값만
  표시한다.
- 어드민 유입 채널 표는 전체 `referrer` URL 대신 `referrerHost`를 표시한다.
- 검색어는 이메일과 전화번호 패턴을 redaction하지만, 민감정보가 들어올 가능성이
  있으므로 검색어를 노출하는 관리자 UI나 export를 만들 때 별도 검토한다.
- 브라우저 저장소 키는 `ph-analytics-visitor-id`,
  `ph-analytics-session-id`, `ph-analytics-session-started`,
  `ph-analytics-landing-path`, `ph-analytics-acquisition`다.
- 유입 속성(referrer/channel/utm*)은 세션 진입 시점에 `ph-analytics-acquisition`
  으로 한 번만 스냅샷해 고정한다. 서버 세션 upsert도 이 속성들을 `create`에서만
  기록하고 `update`에서는 덮어쓰지 않는다. flush마다 현재 URL로 다시 계산하면
  UTM 랜딩을 벗어난 뒤 세션 어트리뷰션이 유실되기 때문이다.
- 특정 브라우저를 수집에서 제외하려면 개발자 콘솔에서
  `localStorage.setItem("ph-analytics-opt-out", "1")`을 실행한다. 해제하려면
  `localStorage.removeItem("ph-analytics-opt-out")`을 실행한다.
- 클라이언트 analytics 수집은 `NEXT_PUBLIC_ANALYTICS_ENABLED="true"`일 때만
  활성화한다. 로컬 개발 환경은 기본값을 `"false"`로 둔다.
- analytics DB 모델이 바뀌면 Prisma migration을 추가하고 배포 전에 적용해야 한다.
- `sendBeacon`은 페이지 종료 직전 전송용으로 유지한다. 일반 전송은 axios
  인스턴스를 사용한다.
- 이벤트를 추가하거나 제거하면 `ANALYTICS_EVENT_NAMES`, API 정규화 로직,
  개인정보 처리방침, 이 문서를 함께 확인한다.
