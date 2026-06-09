# PhysiqueHub

PhysiqueHub는 피트니스·보디빌딩 대회 일정을 수집하고 탐색하기 위한 프로젝트입니다.

이 `README.md`를 프로젝트의 대표 문서로 사용합니다. 세부 조사 자료나 보조 문서는 `docs/` 아래에 두되, 전체 구조와 어떤 문서를 먼저 봐야 하는지는 이 파일에서 안내합니다.

## 문서 구조

| 문서 | 용도 |
| --- | --- |
| [`docs/fitness-bodybuilding-competition-context.md`](docs/fitness-bodybuilding-competition-context.md) | 피트니스·보디빌딩 대회와 단체에 대한 핵심 도메인 맥락. IFBB Pro League, NPC Worldwide, KBBF, NABBA, PCA, 내추럴 단체, 한국 로컬 대회 축을 구분하는 기준 문서입니다. |
| [`docs/competition-schedule-crawling-sources.md`](docs/competition-schedule-crawling-sources.md) | 대회 일정 수집 대상 공식 소스와 크롤링 가능성 조사 메모입니다. |
| [`docs/public-cache-policy.md`](docs/public-cache-policy.md) | 공개 페이지 ISR, 대회 시즌 데이터 캐시, 아티클 데이터 캐시의 역할과 무효화 기준입니다. |
| [`docs/analytics-events.md`](docs/analytics-events.md) | 자체 이용 행동 로그의 이벤트 정의, 저장 필드, 지표 해석 기준, 중복 집계 방지 원칙입니다. |

## 문서 운영 원칙

- README는 프로젝트의 대표 문서이자 문서 인덱스로 유지합니다.
- 실행 방법, 프레임워크 기본 설명, DB 명령처럼 코드나 설정에서 바로 확인할 수 있는 내용은 README에 반복하지 않습니다.
- 데이터 구조를 설명해야 할 때는 문서보다 타입 정의 파일을 우선 기준으로 삼습니다.
- 피트니스·보디빌딩 대회와 단체에 관한 도메인 맥락은 `docs/fitness-bodybuilding-competition-context.md`를 기준으로 유지합니다.

## 로컬 설정

환경변수 예시는 [`.env.example`](.env.example)에 둡니다.
