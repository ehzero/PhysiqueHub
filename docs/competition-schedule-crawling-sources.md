# 피트니스·보디빌딩 대회 일정 공식 소스 크롤링 조사

조사일: 2026-05-22  
목적: PhysiqueHub에서 단체별 공식 홈페이지 또는 공식 접수 웹앱을 기준으로 대회 일정, 접수 마감, 장소, 상세 URL을 수집하기 위한 1차 소스 목록화

> 주의: 아래 평가는 기술적 수집 가능성 기준이다. 실제 운영 전에는 각 사이트의 이용약관, robots.txt, 저작권/상표권, 과도한 요청 방지 정책을 다시 확인해야 한다. 특히 접수 웹앱은 상품/결제/회원 영역을 포함하므로 공개 일정 페이지와 상세 페이지만 최소 범위로 수집한다.

## 요약

| 우선순위 | 단체/루트 | 공식 일정 소스 | 기술적 크롤링 가능성 | 메모 |
| --- | --- | --- | --- | --- |
| 1 | NPC / IFBB Pro League Korea, AGP | `https://ifbbprokorea.com/schedule/` | 높음 | WordPress/Elementor HTML에 일정 텍스트가 포함됨. robots 허용. |
| 1 | 대한보디빌딩협회(KBBF) | `https://bodybuilding.or.kr/contest_kr` | 높음 | 국내/국제/시도대회 게시판 구조가 명확함. robots 허용. |
| 1 | NABBA Korea | `https://www.nabba.kr/board/com_schedule.html` | 높음 | Cafe24 HTML에 대회명, 날짜, 장소, 신청 링크가 노출됨. |
| 1 | MUSA / WNGP / BOB / ANBC | `https://unmo.kr/shop/tournament.php` | 중간 | 목록과 상세 HTML이 정적에 가까움. 다만 사이트 하단에 무단 스크래핑 금지 문구가 있어 운영 전 허가 검토 필요. |
| 2 | PCA / NPCA Korea | `https://www.pca-korea.com/mall/m_mall_list.php?ps_ctid=09000000` | 중간 | 구형 쇼핑몰 HTML. EUC-KR/인코딩 처리와 카테고리 매핑 필요. |
| 2 | WNBF Korea | `https://www.wnbfkorea1.com/26` | 중간~낮음 | Imweb 기반. 메뉴/상품형 페이지는 노출되지만 일정 정보가 이미지/상품 상세에 섞일 가능성이 큼. |
| 2 | Musclemania | `https://musclemania.com/musclemania-events-schedule/` | 중간 | 공식 글로벌 일정 페이지 있음. 한국 일정 포함 여부는 시즌별 변동. |
| 2 | ONE CLASSIC | `https://oneclassic.co.kr/` | 높음 | 공식 사이트 HTML에 2026 대회명, 일정, 장소, 종목, 상금 정보가 노출됨. |
| 3 | K-Classic / J-Classic / SSA Korea / WFF Korea | `https://kismos.co.kr/product/list.html?cate_no=822` | 중간~낮음 | K-Classic 2026 KCL 신청 상품은 KISMOS에서 수집 가능. J-Classic/SSA/WFF Korea는 단체별 source-only preview를 생성해 공개 일정 노출 여부를 감시함. |
| 3 | INBA / PNBA | `https://naturalbodybuilding.com/events-schedule/` | 중간 | 공식 글로벌 Events Schedule 테이블 수집 가능. 일부 UA는 Cloudflare challenge를 받아 crawler UA 기준으로 검증 필요. |
| 3 | NAC Korea | `https://www.nackorea.com/product/list.html?cate_no=28` | 중간 | 한국 공식 접수 카테고리에 12개 접수 상품이 노출됨. 날짜/장소는 공식 HTML에 직접 노출되지 않아 FitSchedule 보조값 검수 필요. |
| 4 | ICN Korea | 공식 일정 URL 추가 확인 필요 | 낮음 | 국내 활동과 내추럴 대회 개최 이력은 확인되지만, 2026 공식 일정 페이지는 안정적으로 확인하지 못함. `icn-korea.json`은 0건 감시 파일로 생성됨. |
| 4 | 아고나스 | `https://www.fitschedule.co.kr/` | 낮음 | FitSchedule에 잠백이카페-아고나스 대회 3건이 노출됨. 공식 원본 확인 전까지 후보 데이터로만 유지함. |
| 보류/preview | Monsterzym | `https://event.monsterzym.com/` | 기술적 가능, 운영 보류 | 이벤트 카드 HTML에서 10건 수집 가능. 다만 robots `User-agent: * Disallow: /` 확인으로 운영 자동 수집 전 허가 필요. |
| 보조 | FitSchedule | `https://www.fitschedule.co.kr/` | 높음 | Next.js payload에서 집계 일정 수집 가능. 공식 단체는 아니므로 원본 확인/누락 탐지용 보조 소스로만 사용. |

## 상세 소스

### 1. NPC / IFBB Pro League Korea, AGP

- 공식 소스:
  - 전체 일정: `https://ifbbprokorea.com/schedule/`
  - NPC 오픈 리저널: `https://ifbbprokorea.com/schedule/open-regional/`
  - NPC 내추럴 리저널: `https://ifbbprokorea.com/schedule/natural-regional/`
  - 프로 퀄리파이어: `https://ifbbprokorea.com/schedule/proqualifier/`
  - IFBB 프로쇼: `https://ifbbprokorea.com/schedule/ifbb-pro/`
- 크롤링 가능성: 높음
- 확인 근거:
  - `robots.txt`에서 대부분 공개 페이지 접근 허용.
  - `sitemap_index.xml` 및 `page-sitemap.xml`에 일정 페이지가 포함됨.
  - HTML 메타 설명과 본문에 대회명, 날짜, 신청 마감, 장소, 종목, 상세 링크가 노출됨.
- 수집 필드:
  - `name`, `federation`, `date`, `registration_deadline`, `region`, `venue`, `division`, `pro_card_info`, `source_url`, `updated_at`
- 구현 메모:
  - WordPress REST API 또는 HTML 파싱 모두 가능하다.
  - Elementor 구조라 CSS class는 변경 가능성이 있으므로, 우선 본문 텍스트 블록과 제목 계층을 기준으로 파싱한다.
  - AGP/Monsterzym 관련 일정은 IFBB Pro Korea 일정과 Monsterzym 이벤트 페이지를 교차 비교한다.

### 2. 대한보디빌딩협회(KBBF)

- 공식 소스:
  - 국내대회: `https://bodybuilding.or.kr/contest_kr`
  - 국제대회: `https://bodybuilding.or.kr/contest_inti`
  - 시도대회: `https://bodybuilding.or.kr/contest_city`
- 크롤링 가능성: 높음
- 확인 근거:
  - `robots.txt`가 공개 페이지를 허용하고, `sitemap.xml`에 `contest_kr`, `contest_inti`, `contest_city`가 포함됨.
  - 게시판 목록 HTML에 연도 카테고리, 제목, 작성일, 조회수, 상세 링크가 노출됨.
- 수집 필드:
  - `name`, `federation`, `category`, `posted_at`, `event_date`, `venue`, `attachments`, `source_url`
- 구현 메모:
  - 목록은 게시글 제목/연도 기준으로 수집하고, 실제 대회일/장소는 상세 본문과 첨부파일에서 보강해야 한다.
  - 상세 페이지와 첨부파일 PDF/HWP에 일정 정보가 들어가는 경우가 있어 문서 파서 또는 OCR 보조가 필요할 수 있다.
  - `bmode=view&idx=...` 형태 상세 URL은 안정적으로 저장한다.

### 3. NABBA Korea

- 공식 소스:
  - 대회일정: `https://www.nabba.kr/board/com_schedule.html`
  - 홈에서도 동일 일정 영역 노출: `https://www.nabba.kr/`
- 크롤링 가능성: 높음
- 확인 근거:
  - 공식 사이트 메뉴에 `대회안내 > 대회일정` 링크가 존재.
  - HTML에 `2026 NABBA KOREA 대회 일정 안내`, 대회명, 날짜, 장소, 상세/신청 링크가 텍스트로 노출됨.
  - `robots.txt`는 관리자, 회원, 주문, 검색/정렬/필터 쿼리 등 민감 영역을 제한하지만 공개 일정 페이지 자체는 제한 대상이 아님.
- 수집 필드:
  - `name`, `date_range`, `venue`, `detail_url`, `registration_status`, `source_url`
- 구현 메모:
  - Cafe24 기반이라 상품/주문/회원 영역은 제외한다.
  - 상세/신청 링크가 `nabba1950.cafe24.com` 도메인으로 이어질 수 있으므로, 공식 도메인과 Cafe24 쇼핑몰 도메인을 같은 소스 그룹으로 묶는다.

### 4. MUSA / WNGP / BOB / ANBC

- 공식 소스:
  - 대회접수 목록: `https://unmo.kr/shop/tournament.php`
  - 상세 예시: `https://unmo.kr/shop/tournament_view.php?index_no=547`
  - 공지: `https://unmo.kr/bbs/list.php?boardid=13`
- 크롤링 가능성: 중간
- 확인 근거:
  - `robots.txt`는 `Allow:/`로 확인됨.
  - 목록 HTML에 대회명, 가격, 상세 URL, 페이지네이션이 노출됨.
  - 상세 HTML에 대회 주최, 대회 일자, 대회 장소, 접수/구매 옵션이 노출됨.
- 주의:
  - 사이트 하단에 사전 서면 동의 없는 정보/콘텐츠/UI 상업적 전재, 전송, 스크래핑 금지 문구가 있음.
  - PhysiqueHub 운영 수집은 공개 일정 링크 인덱싱 수준으로 제한하거나, 운영 주체와 제휴/허가를 받는 것이 안전하다.
- 수집 필드:
  - `name`, `organization`, `date`, `venue`, `entry_fee`, `registration_deadline`, `status`, `detail_url`
- 구현 메모:
  - 목록의 남은 시간 카운트다운은 JS에서 `targetDate = new Date(...)`로 생성되므로 접수 마감 추출 후보로 활용 가능하다.
  - 상세 페이지의 `dt/dd` 라벨 구조를 기준으로 수집한다.
  - 페이지네이션의 `page` 파라미터를 순회하되 요청 간격을 길게 둔다.

### 5. PCA / NPCA Korea

- 공식 소스:
  - 메인/몰: `https://www.pca-korea.com/mall/index.php`
  - 대회접수 카테고리: `https://www.pca-korea.com/mall/m_mall_list.php?ps_ctid=09000000`
  - PCA/NPCA 공식 인스타그램: `https://www.instagram.com/pca_southkorea/`
- 크롤링 가능성: 중간
- 확인 근거:
  - `robots.txt`는 `/mall/admin/`만 제한.
  - 쇼핑몰 HTML 메뉴에 대회접수 카테고리와 PCA/NPCA 지역별 카테고리가 노출됨.
- 수집 필드:
  - `name`, `series`, `region`, `date`, `venue`, `entry_fee`, `detail_url`
- 구현 메모:
  - 페이지 인코딩이 EUC-KR/구형 HTML일 수 있어 `iconv-lite` 또는 fetch 후 Buffer 디코딩 처리가 필요하다.
  - 지역별 카테고리 코드가 많으므로, 우선 `ps_ctid=09000000` 전체 대회접수에서 상세 URL을 수집하고 상세에서 대회명/날짜/장소를 정규화한다.
  - 인스타그램은 공식 보조 소스지만 자동 크롤링 안정성이 낮아 수동 검수 또는 운영자 제보 채널로 두는 편이 좋다.

### 6. WNBF Korea

- 공식 소스:
  - 홈페이지: `https://www.wnbfkorea1.com/`
  - 대회참가 신청: `https://www.wnbfkorea1.com/26`
  - 멤버십/안내: `https://www.wnbfkorea1.com/25`
- 크롤링 가능성: 중간~낮음
- 확인 근거:
  - `robots.txt`는 공개 페이지 접근을 허용하고 `sitemap.xml`에 주요 페이지와 `shop_view` URL이 포함됨.
  - Imweb 기반 페이지의 메뉴에는 대회참가 신청, 대회사진, 대회관련 문의가 노출됨.
- 수집 필드:
  - `name`, `date`, `venue`, `registration_status`, `drug_test_note`, `source_url`
- 구현 메모:
  - 일정 데이터가 이미지, 상품 카드, 버튼 액션에 섞여 있을 가능성이 높다.
  - HTML 파싱으로 부족하면 Playwright 렌더링 후 DOM 텍스트 추출, 이미지 OCR, `shop_view` 상세 페이지 탐색을 조합한다.
  - 일정 정확도는 공식 인스타그램/공지와 교차 확인하는 검수 루프가 필요하다.

### 7. Musclemania

- 공식 소스:
  - 이벤트 일정: `https://musclemania.com/musclemania-events-schedule/`
  - 등록 페이지: `https://musclemania.com/registration/`
- 크롤링 가능성: 중간
- 확인 근거:
  - 공식 메뉴에 `Event Schedule`가 있고, 메타 설명에 Universe, India, Mexico, Vietnam, Paris, Korea 등 일정 포함이 명시됨.
  - WordPress/Elementor 기반 HTML이 수집 가능함.
- 수집 필드:
  - `name`, `country`, `date`, `venue`, `registration_url`, `source_url`
- 구현 메모:
  - 한국 일정이 항상 별도 페이지로 존재하는 것은 아니므로 `Korea` 포함 여부를 시즌별로 검사한다.
  - 글로벌 일정 중 국내 사용자에게 노출할 범위는 `country === Korea` 또는 주요 국제대회로 제한한다.

### 8. K-Classic / J-Classic / SSA Korea / WFF Korea

- 공식 소스:
  - 공식 홈페이지: `https://www.kclassicasia.com/`
  - 참가신청 페이지: `https://www.kclassicasia.com/blank-2`
  - KISMOS 2026 KCL 신청 카테고리: `https://kismos.co.kr/product/list.html?cate_no=822`
- 크롤링 가능성: 중간~낮음
- 확인 근거:
  - K-Classic 공식 홈페이지 메뉴에서 `PARTICIPATION` 참가신청과 KISMOS `OPEN` 링크가 연결됨.
  - K-Classic 공식 `COMPETITION` 페이지에 K-Classic/J-Classic, SSA Korea, WFF Korea 섹션과 대회 안내/규정 메뉴가 노출됨.
  - K-Classic 공식 홈페이지의 참가신청 페이지는 검색/렌더링 텍스트로 대구/서울 일정이 보이지만, 일반 서버 fetch에서는 Wix 404를 반환함.
  - KISMOS 2026 KCL 카테고리는 공개 HTML로 상품명과 상세 URL이 노출되고, 상품 상세의 옵션 select에서 종목을 수집할 수 있음.
  - KISMOS 상세 HTML에는 대회일/장소 텍스트가 충분히 노출되지 않아 날짜/장소는 낮은 신뢰도로 검수해야 함.
- 수집 필드:
  - `name`, `series`, `date`, `venue`, `notice_url`, `registration_url`
- 구현 메모:
  - K-Classic은 KISMOS 카테고리 목록과 상품 상세를 1차 소스로 둔다.
  - 날짜는 K-Classic 공식 참가 페이지의 렌더링 텍스트 또는 포스터 검수로 보강한다.
  - J-Classic/SSA Korea/WFF Korea는 현재 2026 공개 신청 상품을 안정적으로 확인하지 못했으므로 source-only preview로 추적한다.
  - `j-classic.json`, `ssa-korea.json`, `wff-korea.json`은 0건 파일로 생성하며, KISMOS HTML에서 키워드가 감지되는지 warning에 기록한다.
  - 실제 이벤트가 확인되면 `j-classic`, `ssa-korea`, `wff-korea` 단체 ID로 정규화한다.
  - 이미지 포스터 OCR 또는 Playwright 렌더링 기반 보강을 다음 단계 후보로 둔다.

### 9. INBA / PNBA

- 공식 소스:
  - 글로벌 공식 일정: `https://naturalbodybuilding.com/events-schedule/`
  - 2026 이벤트 카테고리: `https://naturalbodybuilding.com/project_category/2026-event/`
- 크롤링 가능성: 중간
- 확인 근거:
  - 공식 Events Schedule 테이블에 `Date`, `Location`, `Event` 컬럼과 상세 링크가 HTML로 노출됨.
  - 2026년 기준 워크숍을 제외한 대회 일정 40건을 수집함.
  - 일부 브라우저형 User-Agent는 Cloudflare 관리형 챌린지를 반환했으나, preview crawler UA로는 공식 HTML 수집이 가능했음.
  - 한국 로컬 공식 일정 페이지는 이번 조사에서 안정적인 공식 URL을 확인하지 못함.
- 구현 메모:
  - 목록 테이블만으로 날짜, 지역, 대회명, 상세 URL을 정규화한다.
  - 상세 페이지 순회는 접수 마감, 종목, 포스터 이미지 보강 단계에서 추가한다.
  - 국내 사용자 화면에는 전체 글로벌 일정 또는 아시아권/메이저 대회 필터를 별도로 둘지 검토한다.

### 10. Monsterzym

- 공식 소스:
  - 이벤트 페이지: `https://event.monsterzym.com/`
  - 메인 사이트: `https://www.monsterzym.com/`
- 크롤링 가능성: 기술적 가능, 운영 보류
- 확인 근거:
  - `robots.txt`에서 `User-agent: *`에 대해 `Disallow: /` 확인.
  - `https://event.monsterzym.com/`의 공개 이벤트 카드 HTML에 대회명, 날짜, 지역, 대회 유형, 신청/상세 링크가 노출됨.
  - 2026-05-22 기준 preview 수집으로 10건을 정규화함.
- 구현 메모:
  - 사용자 요청에 따라 preview crawler는 구현하되, 모든 이벤트를 `reviewStatus: "needs-review"`로 둔다.
  - 상세 페이지는 순회하지 않고 이벤트 메인 페이지의 공개 카드만 파싱한다.
  - 운영 자동 수집 또는 DB 저장 전에는 robots/약관 확인과 주최 측 허가가 필요하다.
  - Monsterzym Korea Pro, AGP 계열 IFBB 일정은 `ifbbprokorea.com` 공식 일정과 중복 여부를 교차 검수한다.

## 추가 후보 소스

아래 항목은 최근 추가했거나, 국내 사용자 관점에서 누락 감지 또는 신규 파서 후보로 추적할 가치가 있는 단체/대회 브랜드다.

### ONE CLASSIC

- 공식 소스:
  - 홈페이지: `https://oneclassic.co.kr/`
  - 참가신청: `https://oneclassic.co.kr/register`
- 크롤링 가능성: 높음
- 확인 근거:
  - 공식 사이트 HTML에 `ONE CLASSIC FITNESS CHAMPIONSHIP`, `2026. 05. 16 — 17`, `Daejeon, Korea`가 텍스트로 노출됨.
  - 보디빌딩, 클래식 피지크, 피지크, 스포츠모델, 비키니, 핏모델 종목과 상금 정보가 공개 텍스트로 노출됨.
- 구현 메모:
  - `oneClassicParser`로 공식 대회일정 페이지 preview 수집을 구현함.
  - 단일 대회 랜딩 페이지 성격이 강하므로, 우선 홈페이지의 hero/카테고리 텍스트를 정규화한다.
  - 시즌이 바뀌면 같은 URL의 날짜가 교체될 가능성이 있어 `fetched_at`, 원문 스냅샷, 이전 값 비교가 중요하다.

### NAC Korea

- 공식/보조 소스:
  - NAC Korea 공식 접수: `https://www.nackorea.com/product/list.html?cate_no=28`
  - NAC Korea 대회 안내: `https://www.nackorea.com/page/contest.html`
  - NAC International: `https://www.nac-international.com/`
  - FitSchedule NAC코리아 항목: `https://www.fitschedule.co.kr/competitions`
- 크롤링 가능성: 중간
- 확인 근거:
  - FitSchedule에 `NAC코리아 챔피언쉽 및 NAC국제대회 선발전`이 노출됨.
  - NAC Korea 공식 사이트의 `대회접수` 카테고리에서 12개 접수 상품이 공개 HTML로 노출됨.
  - NAC International 공식 사이트는 `Event Calendar` 메뉴와 2026 World Championship 정보를 공개함.
- 구현 메모:
  - `nacKoreaParser`로 공식 접수 상품 목록 preview 수집을 구현함.
  - 한국 로컬 공식 접수 HTML에는 대회일/장소가 직접 노출되지 않아 FitSchedule 후보값으로 보강하고 `confidence: "low"`로 둔다.
  - 글로벌 NAC 일정과 한국 선발전은 별도 source type으로 구분한다.

### ICN Korea

- 공식 소스:
  - 2026 공식 일정 URL 추가 확인 필요
- 크롤링 가능성: 낮음
- 확인 근거:
  - 국내 언론 기사에서 ICN Korea의 내추럴 대회 개최, 운영진, 국내 활동 이력이 확인됨.
  - 안정적인 공식 일정 페이지 또는 공개 접수 페이지는 이번 조사에서 확정하지 못함.
- 구현 메모:
  - 공식 사이트, 공식 SNS, 접수 플랫폼을 먼저 확정한 뒤 robots/약관을 확인한다.
  - `icnKoreaSourceMonitor`로 FitSchedule 공개 payload를 감시하지만, 2026-05-22 기준 ICN 후보 일정은 0건이다.
  - `crawl-preview/icn-korea.json`은 source-only preview로 생성되어 추후 공식 URL을 연결할 위치를 남긴다.
  - 내추럴 단체 특성상 도핑검사 방식, 금지 기간, 제재 공개 여부를 일정 데이터와 별도 메타데이터로 추적한다.

### 아고나스

- 보조 소스:
  - FitSchedule: `https://www.fitschedule.co.kr/competitions`
- 크롤링 가능성: 낮음
- 확인 근거:
  - FitSchedule에 `잠백이카페 - 아고나스 대회`로 2026년 수원, 광명, 서울 일정이 노출됨.
- 구현 메모:
  - `agonasParser`로 FitSchedule 후보 일정 3건을 `crawl-preview/agonas.json`에 생성함.
  - 수집 이벤트는 `아고나스 수원`, `아고나스 광명`, `아고나스 서울`이며 Naver Cafe 링크를 상세/접수 URL로 보존한다.
  - 공식 홈페이지가 아닌 보조 집계 데이터이므로 `confidence: "low"`, `reviewStatus: "needs-review"`로 유지한다.
  - 연맹이라기보다 대회 브랜드/커뮤니티 주최 성격으로 보이므로 `organization`보다 `event_brand`로 모델링할지 검토한다.
  - 공식 원본 URL을 확인하기 전까지는 FitSchedule 누락 감지 후보로만 유지한다.

### WBPF / WBFF / OCB

- 공식/보조 소스:
  - WBPF: `https://www.wbpsf.org/`
  - WBFF: `https://wbffshows.com/`
  - OCB: `https://ocbonline.com/`
- 크롤링 가능성: 낮음~중간
- 확인 근거:
  - 모두 글로벌 단체 또는 대회 브랜드로 확인되지만, 한국 내 최신 공식 일정/지부 활성도는 별도 확인이 필요함.
- 구현 메모:
  - 국내 대회가 확인되기 전에는 글로벌 캘린더 전체 수집보다 한국/아시아 관련 이벤트 감시 후보로 둔다.

## 보조 소스

### FitSchedule

- URL: `https://www.fitschedule.co.kr/`
- 성격: 공식 단체 사이트가 아니라 일정 집계 서비스.
- 크롤링 가능성: 높음
- 확인 근거:
  - `robots.txt`에서 `Allow: /` 확인.
  - Next.js 정적 HTML 안에 `competitions` payload가 포함되어 있고 대회명, 날짜, 접수 마감, 장소, 원본 URL, 포스터 URL이 노출됨.
  - 2026년 기준 171건의 집계 데이터를 수집함.
- 활용:
  - 공식 소스 누락 탐지
  - 날짜/장소 변경 감지 보조
  - 사용자 제보 검수용 비교 데이터
- 주의:
  - PhysiqueHub의 원본 출처 필드는 반드시 각 단체 공식 URL을 우선 저장한다.
  - FitSchedule 데이터는 `sourceType: "aggregator"`로만 저장하고, 공식 원본과 교차 검수 전에는 승인 데이터로 승격하지 않는다.

## 권장 수집 전략

1. 공식 소스 우선순위는 `IFBB/KBBF/NABBA/UNMO`부터 시작한다.
2. 각 사이트별 `robots.txt`와 요청 제한을 매 수집 전에 캐시 확인한다.
3. 목록 페이지에서 상세 URL을 수집하고, 상세 페이지에서 날짜/장소/접수 마감/종목을 보강한다.
4. 일정 데이터는 `source_url`, `source_label`, `fetched_at`, `source_updated_at`, `confidence`를 함께 저장한다.
5. WordPress/Cafe24/Imweb/Wix처럼 플랫폼이 다른 사이트는 파서 모듈을 분리한다.
6. 이미지 포스터에만 일정이 있는 경우 OCR 결과는 `confidence: low`로 저장하고 관리자 검수 큐에 보낸다.
7. 약관 또는 robots가 불명확한 소스는 “링크 수집 + 수동 검수”까지만 하고, 본문/이미지 대량 복제는 피한다.

## 1차 구현 후보

| 파서 | 대상 | 방식 |
| --- | --- | --- |
| `ifbbProKoreaParser` | IFBB/NPC/AGP | WordPress HTML 또는 REST API, 일정 카드/본문 텍스트 파싱 |
| `kbbfParser` | 대한보디빌딩협회 | Imweb 게시판 목록 + 상세 + 첨부파일 |
| `nabbaParser` | NABBA Korea | Cafe24 공개 일정 HTML + 상세 신청 링크 |
| `unmoTournamentParser` | MUSA/WNGP/BOB/ANBC | 목록 페이지네이션 + 상세 `dt/dd` 라벨 파싱 |
| `pcaKoreaParser` | PCA/NPCA | EUC-KR 쇼핑몰 목록 + 상세 페이지 |
| `imwebFallbackParser` | WNBF 등 | sitemap + Playwright DOM 텍스트 + 이미지 OCR 후보 |
| `wixFallbackParser` | K-Classic | Playwright 렌더링 + 링크 변화 추적 |
| `monsterzymEventParser` | Monsterzym | 이벤트 메인 페이지 카드 파싱, 운영 자동 수집은 허가 전 보류 |
| `oneClassicParser` | ONE CLASSIC | 공식 랜딩 페이지 텍스트 파싱, 시즌 변경 감지 |
| `nacKoreaParser` | NAC Korea | 공식 접수 상품 목록 + FitSchedule 후보 일정 교차 보강 |
| `candidateSourceMonitor` | ICN Korea, J-Classic, SSA Korea, WFF Korea | 공개 HTML/보조 집계 소스에서 0건 후보도 단체별 JSON으로 남겨 후속 검수 상태 추적 |
| `agonasParser` | 아고나스 | FitSchedule 후보 일정 필터링, Naver Cafe 상세/접수 링크 보존 |

## 단체별 수집 완료 체크 리스트

상태 기준:

- `미시작`: 공식 소스만 확인했고 수집기는 아직 없음.
- `소스 확인`: 공식 URL, robots, 수집 범위를 확인함.
- `파서 구현`: 목록/상세 파서가 코드로 구현됨.
- `샘플 수집`: 실제 데이터를 1회 이상 저장 또는 출력함.
- `검수 완료`: 날짜, 장소, 접수 마감, 상세 링크를 사람이 확인함.

| 단체/루트 | 상태 | 소스 확인 | 파서 구현 | 샘플 수집 | 검수 완료 | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| NPC / IFBB Pro League Korea | 소스 확인 | [x] | [ ] | [ ] | [ ] | WordPress/Elementor 일정 페이지 우선 |
| AGP | 소스 확인 | [x] | [ ] | [ ] | [ ] | IFBB Pro Korea 일정 내 AGP 항목 기준 |
| 대한보디빌딩협회(KBBF) | 소스 확인 | [x] | [ ] | [ ] | [ ] | 국내/국제/시도대회 게시판 분리 |
| NABBA Korea | 소스 확인 | [x] | [ ] | [ ] | [ ] | `com_schedule.html` 우선 |
| MUSA | 소스 확인 | [x] | [ ] | [ ] | [ ] | UNMO 대회접수 상세에서 분리 |
| WNGP | 소스 확인 | [x] | [ ] | [ ] | [ ] | UNMO 대회접수 상세에서 분리 |
| BOB | 소스 확인 | [x] | [ ] | [ ] | [ ] | UNMO 공지/대회접수에서 확인 필요 |
| ANBC | 소스 확인 | [x] | [ ] | [ ] | [ ] | UNMO 대회접수 상세에서 분리 |
| PCA Korea | 소스 확인 | [x] | [ ] | [ ] | [ ] | 인코딩 처리 필요 |
| NPCA Korea | 소스 확인 | [x] | [ ] | [ ] | [ ] | PCA 몰 내 카테고리 분리 필요 |
| WNBF Korea | 샘플 수집 | [x] | [x] | [x] | [ ] | Imweb 대회참가 신청 텍스트 위젯 3건 수집 |
| Musclemania | 샘플 수집 | [x] | [x] | [x] | [ ] | 공식 Event Schedule 표 44건 수집, Korea 항목 포함 |
| K-Classic | 샘플 수집 | [x] | [x] | [x] | [ ] | KISMOS 2026 KCL 신청 상품 4건 수집, 날짜는 low confidence 검수 필요 |
| J-Classic | 0건 감시 | [x] | [x] | [ ] | [ ] | `j-classic.json` 생성, KISMOS 공개 HTML에서 일정 상품 미확인 |
| SSA Korea | 0건 감시 | [x] | [x] | [ ] | [ ] | `ssa-korea.json` 생성, KISMOS 공개 HTML에서 일정 상품 미확인 |
| WFF Korea | 0건 감시 | [x] | [x] | [ ] | [ ] | `wff-korea.json` 생성, KISMOS 공개 HTML에서 일정 상품 미확인 |
| INBA / PNBA | 샘플 수집 | [x] | [x] | [x] | [ ] | 공식 Events Schedule 40건 수집, Workshop 2건 제외 |
| ONE CLASSIC | 샘플 수집 | [x] | [x] | [x] | [ ] | 공식 대회일정 페이지에서 2026.05.16-17 대전 한밭대학교 1건 수집 |
| NAC Korea | 샘플 수집 | [x] | [x] | [x] | [ ] | 공식 접수 상품 12개 수집, 날짜/장소는 FitSchedule 보조값으로 low confidence |
| ICN Korea | 0건 감시 | [ ] | [x] | [ ] | [ ] | `icn-korea.json` 생성, 2026 공식 일정 URL 추가 확인 필요 |
| 아고나스 | 후보 수집 | [ ] | [x] | [x] | [ ] | FitSchedule 후보 3건 수집, 공식 원본 URL 검수 필요 |
| WBPF / WBFF / OCB | 후보 추적 | [ ] | [ ] | [ ] | [ ] | 글로벌 단체 존재, 한국 내 최신 일정은 추가 확인 필요 |
| Monsterzym | 샘플 수집(운영 보류) | [x] | [x] | [x] | [ ] | event.monsterzym.com 카드 10건 수집, robots 차단으로 운영 전 허가 필요 |
| FitSchedule | 샘플 수집 | [x] | [x] | [x] | [ ] | Next.js competitions payload 171건 수집, 공식 원본 검증용 보조 데이터 |
