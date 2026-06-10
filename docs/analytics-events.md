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
| `deviceCategory`, `browserName`, `osName` | 클라이언트에서 추정한 기기/브라우저/OS 요약. |
| `startedAt`, `lastSeenAt` | 세션 시작/마지막 수신 시각. |

### 이벤트

`AnalyticsEvent`는 사용자의 개별 행동을 저장한다.

| 필드 | 의미 |
| --- | --- |
| `sessionId`, `visitorId` | 세션/방문자 연결 키. |
| `name` | 이벤트명. `src/lib/analytics.ts`의 `ANALYTICS_EVENT_NAMES`만 허용한다. |
| `path` | 이벤트가 발생한 경로. |
| `occurredAt` | 클라이언트 기준 발생 시각. 잘못된 값이면 서버 수신 시각으로 대체된다. |
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

## 지표 해석 기준

- 전체 페이지뷰와 URL 트래픽은 `page_view`만 사용한다.
- 대회별 상세 조회수는 `competition_view`만 사용한다.
- `page_view`와 `competition_view`는 같은 상세 페이지 진입에서 함께 발생할 수
  있지만 서로 합산하지 않는다.
- 목록에서 대회 드로어를 연 횟수는 `competition_open`으로 본다.
- 드로어에서 실제 상세 페이지로 이동하려는 의도는 `competition_detail_click`으로
  본다.
- 상세 페이지가 실제 렌더링된 조회는 `competition_view`로 본다.
- 대회별 공유와 저장은 각각 `share_click`, `save_competition`의
  `competitionId`를 기준으로 본다. 과거 공유 이벤트처럼 `competitionId`가 없는
  이벤트는 전체 공유 클릭 수에는 포함되지만 대회별 공유 순위에는 포함되지 않는다.
- 실시간 활성 사용자는 `AnalyticsSession.lastSeenAt`이 최근 2분 이내인 고유
  `visitorId` 수로 추정한다. 활성 세션은 같은 기준의 세션 수로 본다.
- 신규/재방문자는 기간 내 `AnalyticsSession.visitorId`가 기간 시작 전에도 세션을
  가진 적이 있는지로 구분한다.
- PWA 접근은 `session_start.propertiesJson.isPwa` 또는 `displayMode`가
  `standalone`, `fullscreen`, `minimal-ui`인지로 본다. 해당 속성이 없는 기존
  세션은 접근 모드를 `알 수 없음`으로 본다.
- 기기 환경, 브라우저, OS 분포는 요청의 원문 User-Agent를 서버에서 파싱한
  `AnalyticsSession.deviceCategory`, `browserName`, `osName`을 기준으로 본다.
  User-Agent가 없거나 파싱이 어려운 경우 클라이언트가 보낸 요약값을 보조로 쓴다.
- 검색 엔진 봇처럼 User-Agent가 봇 패턴에 해당하면 `deviceCategory`는 `bot`,
  `browserName`은 `Bot`으로 분류한다. 예: Googlebot, Bingbot, Naver Yeti,
  Applebot.
- 검색어 기준 검색 수행은 `search_performed`로 본다. 필터 변경은
  `filter_applied` 또는 `filter_reset`으로 본다.
- `empty_search_result`는 검색과 필터 양쪽에서 발생할 수 있으므로 원인 구분이
  필요하면 `propertiesJson.source` 같은 허용 속성을 추가한 뒤 분석한다.

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
- `viewMode`

## 개인정보 및 운영 주의사항

- 원문 IP와 전체 User-Agent를 저장하므로 analytics 변경 시
  `src/app/(site)/privacy/page.tsx`의 고지 내용과 보관 기간을 함께 확인한다.
- 어드민 분석 대시보드는 원문 IP와 전체 User-Agent를 기본 노출하지 않는다.
  집계에는 사용할 수 있지만 화면에는 채널, 기기, 브라우저, OS 같은 요약값만
  표시한다.
- 어드민 유입 채널 표는 전체 `referrer` URL 대신 `referrerHost`를 표시한다.
- 검색어는 이메일과 전화번호 패턴을 redaction하지만, 민감정보가 들어올 가능성이
  있으므로 검색어를 노출하는 관리자 UI나 export를 만들 때 별도 검토한다.
- 브라우저 저장소 키는 `ph-analytics-visitor-id`,
  `ph-analytics-session-id`, `ph-analytics-session-started`,
  `ph-analytics-landing-path`다.
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
