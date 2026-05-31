import type { ArticleTheme } from "@/lib/articles-data";

export type ArticleData2SourceType = "official" | "local" | "internal";

export type ArticleData2BodyBlock =
  | { t: "p"; x: string; sourceIds?: string[] }
  | { t: "h"; x: string }
  | { t: "summary"; items: string[] }
  | { t: "list"; items: string[]; sourceIds?: string[] }
  | { t: "checklist"; items: string[]; sourceIds?: string[] }
  | { t: "quote"; x: string }
  | { t: "table"; columns: string[]; rows: string[][]; sourceIds?: string[] };

export interface ArticleData2Source {
  id: string;
  label: string;
  url?: string;
  path?: string;
  sourceType: ArticleData2SourceType;
  checkedAt: string;
}

export interface ArticleData2Faq {
  q: string;
  a: string;
}

export interface ArticleData2InternalLink {
  anchor: string;
  href: string;
  placement: string;
}

export interface ArticleData2Draft {
  id: string;
  slug: string;
  recommendedTitles: string[];
  title: string;
  metaDescription: string;
  excerpt: string;
  category: "가이드" | "대회 결과";
  categorySlug: "guide" | "competition-result";
  tag: string;
  authorName: string;
  readMinutes: number;
  posterTheme: ArticleTheme;
  posterFigure: number;
  targetReaders: string[];
  mainKeyword: string;
  relatedKeywords: string[];
  writingStandardDate: string;
  body: ArticleData2BodyBlock[];
  faq: ArticleData2Faq[];
  sources: ArticleData2Source[];
  internalLinks: ArticleData2InternalLink[];
  additionalChecks: string[];
}

export const ARTICLES_DATA2_GENERATED_AT = "2026-05-31";

export const articlesData2: ArticleData2Draft[] = [
  {
    id: "article2_first-bodybuilding-competition-prep",
    slug: "first-bodybuilding-competition-prep",
    recommendedTitles: [
      "보디빌딩 대회 처음 나간다면? 참가 전 꼭 알아야 할 준비 과정",
      "첫 보디빌딩 대회 준비 순서: 종목 선택부터 계측까지",
      "피트니스 대회 첫 출전 가이드, 신청 전 확인할 것들",
    ],
    title: "보디빌딩 대회 처음 나간다면? 참가 전 꼭 알아야 할 준비 과정",
    metaDescription:
      "첫 보디빌딩 대회 출전을 고민하는 사람을 위해 종목 선택, 일정 확인, 참가 신청, 선수 등록, 계측, 대회 당일 준비를 공식 규정 기준으로 정리했습니다.",
    excerpt:
      "첫 대회는 몸만 준비한다고 끝나지 않습니다. 종목, 체급, 참가 자격, 접수 마감, 계측 시간까지 공식 모집요강 기준으로 확인해야 합니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "첫 출전",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 8,
    posterTheme: "navy",
    posterFigure: 0,
    targetReaders: [
      "보디빌딩·피지크 대회에 처음 관심을 가진 사람",
      "첫 대회 출전을 고민하는 헬스 입문자·중급자",
      "대회 참가 신청 절차와 준비 흐름이 궁금한 사람",
    ],
    mainKeyword: "보디빌딩 대회 준비",
    relatedKeywords: [
      "보디빌딩 대회",
      "피트니스 대회 준비",
      "대회 참가 신청",
      "대회 모집요강",
      "선수 등록",
      "계측",
      "포징",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "보디빌딩 대회에 처음 나가려 하면 무엇부터 해야 하는지 막막할 수 있습니다. 몸 상태를 만드는 일도 중요하지만, 실제 출전에서는 종목 선택, 체급 확인, 참가 자격, 접수 마감일, 계측 시간, 복장과 탄 규정까지 함께 확인해야 합니다. 이 글은 첫 대회 출전자가 준비 순서를 놓치지 않도록 기본 흐름을 정리합니다.",
      },
      {
        t: "summary",
        items: [
          "첫 출전자는 먼저 대회 일정, 주최 단체, 종목, 체급, 접수 마감일을 확인해야 합니다.",
          "NPC Worldwide, KBBF, NABBA, WNBF 등 단체마다 선수 등록과 참가 조건이 다를 수 있습니다.",
          "계측, 번호표 수령, 복장 확인, 탄 규정은 대회 당일 문제가 생기기 쉬운 항목입니다.",
          "정확한 기준은 반드시 해당 대회의 공식 모집요강과 규정을 기준으로 확인해야 합니다.",
        ],
      },
      { t: "h", x: "1. 먼저 대회 성격을 확인한다" },
      {
        t: "p",
        x: "대회 이름만 보고 출전 여부를 판단하면 실수하기 쉽습니다. 같은 보디빌딩 대회라도 리저널, 루키·노비스, 프로 퀄리파이어, 내추럴 대회, 협회 공인 대회처럼 성격이 다를 수 있습니다. 예를 들어 NPC Worldwide 규정은 리저널과 프로 퀄리파이어를 구분하고, 한국을 포함한 일부 국가는 프로 퀄리파이어 출전 전 리저널 요건이 적용될 수 있다고 안내합니다.",
        sourceIds: ["npc-worldwide-rules", "ifbbpro-korea-rules"],
      },
      {
        t: "table",
        columns: ["확인 항목", "왜 중요한가", "확인 위치"],
        rows: [
          ["대회 날짜", "준비 기간과 접수 마감 계산에 필요", "피지크허브 대회 목록, 공식 일정"],
          ["주최 단체", "종목명, 체급, 등록 조건이 달라짐", "공식 홈페이지, 모집요강"],
          ["대회 유형", "루키, 리저널, 내추럴, 프로 퀄리파이어 여부 확인", "대회 상세 공지"],
          ["참가 자격", "선수 등록, 리저널 출전 이력, 연령 조건 등이 걸릴 수 있음", "공식 규정"],
          ["계측 시간", "미참석 시 출전 불가 또는 실격 위험", "대회별 공지"],
        ],
      },
      { t: "h", x: "2. 종목을 먼저 고르고 체급은 나중에 확정한다" },
      {
        t: "p",
        x: "첫 출전자는 보디빌딩, 클래식 피지크, 맨즈 피지크, 비키니, 웰니스, 스포츠모델 같은 종목 중 본인 체형과 준비 방향에 맞는 종목을 먼저 골라야 합니다. 체급은 대회마다 고정 체급을 쓰기도 하고, 계측 후 참가 인원에 따라 나뉘기도 합니다. IFBB PRO KOREA 규정도 일부 종목은 계측 완료 후 참가 인원에 따라 체급이 구분된다고 설명합니다.",
        sourceIds: ["ifbbpro-korea-rules"],
      },
      { t: "h", x: "3. 참가 신청 전에는 접수 조건을 체크한다" },
      {
        t: "checklist",
        items: [
          "참가 신청 페이지가 공식 주최사 또는 공식 접수처인지 확인한다.",
          "접수 마감일, 환불 규정, 양도 가능 여부를 확인한다.",
          "선수 등록 또는 멤버십이 필요한 대회인지 확인한다.",
          "중복 출전이 가능한 종목과 불가능한 종목을 구분한다.",
          "계측 장소, 계측 시간, 신분증 지참 여부를 확인한다.",
          "복장, 포징 음악, 탄·오일 규정을 확인한다.",
        ],
        sourceIds: ["ifbbpro-korea-rules", "kbbf-registration"],
      },
      { t: "h", x: "4. 대회 당일은 몸보다 운영 흐름이 중요할 수 있다" },
      {
        t: "p",
        x: "첫 대회 당일에는 긴장 때문에 가장 기본적인 것을 놓치기 쉽습니다. 신분증, 번호표, 종목별 복장, 보정용 탄, 식사, 물, 펌핑 밴드, 슬리퍼, 수건, 보조 배터리처럼 당일 필요한 물건을 미리 묶어두는 편이 좋습니다. 대회 운영 순서는 현장 상황에 따라 변동될 수 있으므로, 무대 시간만 보고 늦게 도착하지 않는 것이 안전합니다.",
      },
      {
        t: "quote",
        x: "첫 대회 목표는 완벽한 결과보다, 공식 요강을 놓치지 않고 무대까지 안정적으로 도착하는 것입니다.",
      },
    ],
    faq: [
      {
        q: "보디빌딩 대회 첫 출전자는 루키 대회만 나가야 하나요?",
        a: "반드시 그렇지는 않습니다. 다만 루키, 트루 노비스, 노비스 같은 클래스는 초보자에게 진입 장벽이 낮을 수 있습니다. 경력 기준과 입상 이력 제한은 대회마다 다르므로 모집요강을 확인해야 합니다.",
      },
      {
        q: "대회 참가 신청은 어디서 하나요?",
        a: "주최 단체 공식 홈페이지, 공식 접수 페이지, 공식 SNS 공지에 연결된 접수 링크를 우선 확인하는 것이 안전합니다. 피지크허브에서는 대회 목록에서 공식 출처 링크를 함께 확인하는 흐름으로 활용할 수 있습니다.",
      },
      {
        q: "첫 대회 준비 기간은 얼마나 잡아야 하나요?",
        a: "개인의 체지방률, 근육량, 포징 경험에 따라 다릅니다. 일반적으로는 일정, 체급, 포징, 탄 규정, 신청 절차를 여유 있게 확인할 수 있도록 대회 날짜보다 몇 달 앞서 준비하는 편이 안전합니다.",
      },
    ],
    sources: [
      {
        id: "npc-worldwide-rules",
        label: "NPC Worldwide Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "ifbbpro-korea-rules",
        label: "NPC/IFBB PRO KOREA 대회 기본 규정",
        url: "https://ifbbprokorea.com/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kbbf-registration",
        label: "대한보디빌딩협회 선수등록안내",
        url: "https://www.bodybuilding.or.kr/proreg",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "domain-context",
        label: "피트니스·보디빌딩 대회와 단체 컨텍스트",
        path: "docs/fitness-bodybuilding-competition-context.md",
        sourceType: "local",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "보디빌딩 대회 일정",
        href: "/competitions",
        placement: "대회 성격을 확인하는 문단 뒤",
      },
      {
        anchor: "초보자 출전 가이드",
        href: "/guide",
        placement: "종목 선택 설명 뒤",
      },
      {
        anchor: "루키·입문 대회 일정",
        href: "/competitions/types/rookie",
        placement: "FAQ의 루키 대회 설명 뒤",
      },
    ],
    additionalChecks: [
      "게시 전 실제 연결할 대회 목록 URL과 필터 동작을 확인한다.",
      "특정 대회 참가비나 접수 마감일을 추가할 경우 해당 시즌 모집요강으로 재확인한다.",
      "감량·수분 조절 관련 구체 처방은 넣지 않는다.",
    ],
  },
  {
    id: "article2-physique-vs-bodybuilding",
    slug: "physique-vs-bodybuilding",
    recommendedTitles: [
      "피지크 대회와 보디빌딩 대회의 차이, 초보자도 이해하기 쉽게 정리",
      "맨즈 피지크와 보디빌딩은 무엇이 다를까?",
      "피지크 대회 선택 전 알아야 할 보디빌딩과의 차이",
    ],
    title: "피지크 대회와 보디빌딩 대회의 차이, 초보자도 이해하기 쉽게 정리",
    metaDescription:
      "피지크 대회와 보디빌딩 대회의 차이를 종목 성격, 복장, 포징, 심사 포인트, 체급 기준 중심으로 정리했습니다. 첫 출전 종목 선택 전에 확인하세요.",
    excerpt:
      "피지크와 보디빌딩은 모두 몸을 평가하지만, 보는 기준과 무대 표현이 다릅니다. 단체별 규정 차이도 함께 확인해야 합니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "종목 비교",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 7,
    posterTheme: "deep",
    posterFigure: 1,
    targetReaders: [
      "맨즈 피지크와 보디빌딩 중 어느 종목을 선택할지 고민하는 사람",
      "피트니스 대회 종목명을 처음 접한 사람",
      "대회 심사 기준과 복장 차이가 궁금한 사람",
    ],
    mainKeyword: "피지크 대회 보디빌딩 차이",
    relatedKeywords: [
      "피지크 대회",
      "보디빌딩 대회",
      "맨즈 피지크",
      "보디빌딩 종목",
      "포징",
      "심사 기준",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "헬스장에서 몸을 만들다 보면 피지크 대회와 보디빌딩 대회가 같은 것처럼 보일 수 있습니다. 하지만 실제 무대에서는 종목 성격, 복장, 포징, 심사 포인트가 다릅니다. 이 차이를 알아야 본인에게 맞는 출전 종목을 고를 수 있습니다.",
      },
      {
        t: "summary",
        items: [
          "보디빌딩은 근육량, 컨디셔닝, 대칭성, 포징 완성도가 강하게 평가됩니다.",
          "맨즈 피지크는 어깨-허리 비율, 상체 라인, 무대 표현과 전체 균형이 중요합니다.",
          "복장도 다릅니다. 맨즈 피지크는 보드쇼츠 계열, 보디빌딩은 포징 트렁크 계열을 사용하는 경우가 많습니다.",
          "세부 기준은 IFBB Pro League/NPC Worldwide, KBBF, NABBA, PCA 등 단체마다 달라질 수 있습니다.",
        ],
      },
      { t: "h", x: "피지크와 보디빌딩의 가장 큰 차이" },
      {
        t: "table",
        columns: ["구분", "맨즈 피지크", "보디빌딩"],
        rows: [
          ["주요 인상", "상체 라인, V 테이퍼, 무대 표현", "전신 근육량, 선명도, 대칭성"],
          ["하체 노출", "보드쇼츠 착용으로 하체 노출이 제한적", "하체 포함 전신을 평가"],
          ["포징", "전면·후면 중심의 프레젠테이션과 전환", "규정 포즈와 비교 심사 비중이 큼"],
          ["체급", "신장 또는 참가 인원 기준으로 나뉠 수 있음", "체중 또는 신장·체중 기준이 적용될 수 있음"],
        ],
        sourceIds: ["npc-worldwide-rules", "kbbf-center"],
      },
      { t: "h", x: "맨즈 피지크는 쉬운 종목일까?" },
      {
        t: "p",
        x: "맨즈 피지크가 하체를 덜 보여준다고 해서 쉬운 종목이라고 보기는 어렵습니다. 상체의 균형, 허리 라인, 어깨 너비, 복부 컨디션, 무대 위 자연스러운 표현이 모두 필요합니다. 특히 같은 체급 안에서는 작은 포징 차이와 컨디션 차이가 순위에 영향을 줄 수 있습니다.",
      },
      { t: "h", x: "보디빌딩은 어떤 사람에게 맞을까?" },
      {
        t: "p",
        x: "보디빌딩은 전신 근육량과 컨디셔닝을 강하게 보여주고 싶은 사람에게 적합합니다. 등, 가슴, 어깨, 팔, 하체, 복부를 모두 준비해야 하며, 규정 포즈 연습도 중요합니다. 단체별로 체급과 포즈가 다를 수 있으므로 출전할 대회의 룰북을 먼저 확인해야 합니다.",
        sourceIds: ["npc-worldwide-rules", "domain-context"],
      },
      { t: "h", x: "첫 출전자는 어떻게 고르면 좋을까?" },
      {
        t: "checklist",
        items: [
          "하체까지 강하게 보여줄 준비가 되어 있다면 보디빌딩을 검토한다.",
          "상체 비율과 무대 표현을 중심으로 경쟁하고 싶다면 맨즈 피지크를 검토한다.",
          "클래식한 비율과 포징을 선호한다면 클래식 피지크도 함께 비교한다.",
          "같은 날 중복 출전이 가능한지는 공식 모집요강에서 확인한다.",
        ],
      },
    ],
    faq: [
      {
        q: "맨즈 피지크는 하체를 안 봐도 되나요?",
        a: "보드쇼츠로 하체 노출이 제한되는 경우가 많지만, 전체 체형과 균형은 여전히 중요합니다. 단체별 복장과 심사 기준은 공식 규정을 확인해야 합니다.",
      },
      {
        q: "피지크 대회와 보디빌딩 대회 중 초보자는 무엇이 좋나요?",
        a: "초보자에게 무조건 좋은 종목은 없습니다. 현재 체형, 포징 준비도, 목표 이미지, 출전하려는 대회의 클래스 구성을 보고 선택하는 것이 현실적입니다.",
      },
      {
        q: "피지크와 보디빌딩을 같은 날 같이 나갈 수 있나요?",
        a: "대회에 따라 중복 출전이 가능할 수 있지만, 종목별 조건과 계측 기준이 다릅니다. 반드시 대회 모집요강에서 크로스오버 규정을 확인해야 합니다.",
      },
    ],
    sources: [
      {
        id: "npc-worldwide-rules",
        label: "NPC Worldwide Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kbbf-center",
        label: "대한보디빌딩협회 종목소개 메뉴",
        url: "https://www.bodybuilding.or.kr/center",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "domain-context",
        label: "피트니스·보디빌딩 대회와 단체 컨텍스트",
        path: "docs/fitness-bodybuilding-competition-context.md",
        sourceType: "local",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "맨즈 피지크 대회 일정",
        href: "/competitions/categories/mens-physique",
        placement: "맨즈 피지크 설명 문단 뒤",
      },
      {
        anchor: "보디빌딩 대회 일정",
        href: "/competitions/categories/bodybuilding",
        placement: "보디빌딩 설명 문단 뒤",
      },
      {
        anchor: "종목별 출전 가이드",
        href: "/guide#division",
        placement: "첫 출전자 선택 체크리스트 뒤",
      },
    ],
    additionalChecks: [
      "단체별 보드쇼츠, 포징 트렁크, 신발 착용 규정은 게시 전 최신 룰북으로 재확인한다.",
      "KBBF와 NPC/IFBB Pro League 계열 종목명을 혼용하지 않도록 편집 단계에서 확인한다.",
    ],
  },
  {
    id: "article2-classic-physique-mens-physique-bodybuilding",
    slug: "classic-physique-mens-physique-bodybuilding",
    recommendedTitles: [
      "클래식 피지크, 맨즈 피지크, 보디빌딩 종목 차이 정리",
      "보디빌딩 3대 남성 종목 비교: 클래식 피지크·맨즈 피지크·보디빌딩",
      "첫 대회 종목 선택 전 보는 남성 피지크 종목 차이",
    ],
    title: "클래식 피지크, 맨즈 피지크, 보디빌딩 종목 차이 정리",
    metaDescription:
      "클래식 피지크, 맨즈 피지크, 보디빌딩의 심사 포인트와 체형 요구, 복장, 체급 차이를 초보자도 이해하기 쉽게 정리했습니다.",
    excerpt:
      "세 종목은 모두 근육과 라인을 보지만, 요구되는 체형과 무대 표현이 다릅니다. 이름이 비슷해도 같은 기준으로 준비하면 안 됩니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "남성 종목",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 8,
    posterTheme: "sage",
    posterFigure: 2,
    targetReaders: [
      "남성 피지크 종목 차이를 알고 싶은 사람",
      "클래식 피지크와 맨즈 피지크 사이에서 고민하는 첫 출전자",
      "보디빌딩 체형과 클래식 피지크 체형을 비교하고 싶은 사람",
    ],
    mainKeyword: "클래식 피지크 맨즈 피지크 보디빌딩 차이",
    relatedKeywords: [
      "클래식 피지크",
      "맨즈 피지크",
      "보디빌딩",
      "보디빌딩 체급",
      "포징",
      "피트니스 대회 종목",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "클래식 피지크, 맨즈 피지크, 보디빌딩은 대회장에서 자주 함께 보이지만 같은 종목이 아닙니다. 이름이 비슷해도 복장, 체급, 포징, 심사 포인트가 다릅니다. 이 글에서는 첫 출전자가 종목을 잘못 선택하지 않도록 세 종목의 차이를 정리합니다.",
      },
      {
        t: "summary",
        items: [
          "보디빌딩은 전신 근육량과 컨디셔닝을 강하게 평가하는 전통 종목입니다.",
          "클래식 피지크는 고전적 비율, 허리 라인, 포징 미학을 강조하는 경우가 많습니다.",
          "맨즈 피지크는 보드쇼츠 기반으로 상체 라인과 무대 표현을 중점적으로 봅니다.",
          "체급과 신장·체중 제한은 단체와 대회별 규정을 확인해야 합니다.",
        ],
      },
      {
        t: "table",
        columns: ["종목", "핵심 이미지", "준비 포인트", "주의할 점"],
        rows: [
          ["보디빌딩", "전신 근육량과 선명도", "규정 포즈, 하체, 등 두께, 컨디셔닝", "체중 체급과 포즈 규정 확인"],
          ["클래식 피지크", "고전적 비율과 미적 라인", "허리 라인, 상하체 균형, 클래식 포징", "신장·체중 제한이 있을 수 있음"],
          ["맨즈 피지크", "V 테이퍼와 상체 표현", "어깨-허리 비율, 복부, 무대 매너", "보드쇼츠와 포즈 기준 확인"],
        ],
        sourceIds: ["npc-worldwide-rules", "ifbbpro-korea-rules"],
      },
      { t: "h", x: "클래식 피지크는 보디빌딩의 하위 종목일까?" },
      {
        t: "p",
        x: "클래식 피지크는 보디빌딩과 겹치는 부분이 있지만, 단순히 작은 보디빌딩이라고 보기 어렵습니다. 많은 단체에서 클래식 피지크는 고전적 라인, 균형, 포징 표현을 별도로 평가합니다. 특히 신장 대비 체중 제한이나 별도 체급 기준이 있는 경우가 있으므로, 체중만 보고 출전 가능 여부를 판단하면 안 됩니다.",
        sourceIds: ["npc-worldwide-rules"],
      },
      { t: "h", x: "맨즈 피지크는 체형 선택이 중요하다" },
      {
        t: "p",
        x: "맨즈 피지크는 상체 라인과 무대 표현이 강조되는 종목입니다. 넓은 어깨, 좁은 허리, 정돈된 복부, 자연스러운 전환 동작이 중요합니다. 다만 단체별로 요구하는 근육량과 컨디셔닝의 강도는 다를 수 있어, 출전하려는 대회의 최근 무대 사진과 공식 기준을 함께 보는 것이 좋습니다.",
      },
      { t: "h", x: "종목 선택 예시" },
      {
        t: "list",
        items: [
          "하체와 등까지 전신을 강하게 보여주고 싶다면 보디빌딩을 우선 검토합니다.",
          "허리 라인과 비율, 클래식한 포징에 강점이 있다면 클래식 피지크를 검토합니다.",
          "상체 비율과 무대 표현에 강점이 있다면 맨즈 피지크를 검토합니다.",
          "어느 종목이든 입상 가능성보다 공식 규정에 맞춰 준비할 수 있는지를 먼저 봅니다.",
        ],
      },
    ],
    faq: [
      {
        q: "클래식 피지크와 클래식 보디빌딩은 같은 종목인가요?",
        a: "항상 같은 의미는 아닙니다. IFBB International/KBBF 계열에서는 클래식 보디빌딩과 클래식 피지크가 별도로 다뤄질 수 있고, 단체별 명칭과 기준이 다릅니다.",
      },
      {
        q: "클래식 피지크는 체중 제한이 있나요?",
        a: "대회에 따라 신장 대비 체중 제한이 있을 수 있습니다. 정확한 기준은 해당 대회 공식 모집요강이나 룰북의 체급표를 확인해야 합니다.",
      },
      {
        q: "맨즈 피지크에서 하체 운동은 덜 해도 되나요?",
        a: "무대에서 하체 노출이 제한되더라도 전체 체형과 컨디션은 중요합니다. 종목을 이유로 특정 부위를 완전히 배제하기보다는 균형 있게 준비하는 편이 안전합니다.",
      },
    ],
    sources: [
      {
        id: "npc-worldwide-rules",
        label: "NPC Worldwide Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "ifbbpro-korea-rules",
        label: "NPC/IFBB PRO KOREA 대회 기본 규정",
        url: "https://ifbbprokorea.com/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "domain-context",
        label: "피트니스·보디빌딩 대회와 단체 컨텍스트",
        path: "docs/fitness-bodybuilding-competition-context.md",
        sourceType: "local",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "클래식 피지크 대회 일정",
        href: "/competitions/categories/classic-physique",
        placement: "클래식 피지크 설명 뒤",
      },
      {
        anchor: "맨즈 피지크 대회 일정",
        href: "/competitions/categories/mens-physique",
        placement: "맨즈 피지크 설명 뒤",
      },
      {
        anchor: "보디빌딩 대회 일정",
        href: "/competitions/categories/bodybuilding",
        placement: "비교표 아래",
      },
    ],
    additionalChecks: [
      "클래식 피지크 신장·체중표는 대회별로 바뀔 수 있어 본문에 고정 수치를 넣지 않는다.",
      "KBBF 종목명과 NPC Worldwide 종목명을 한 문단에서 혼동하지 않도록 교정한다.",
    ],
  },
  {
    id: "article2-natural-vs-open-bodybuilding",
    slug: "natural-vs-open-bodybuilding",
    recommendedTitles: [
      "내추럴 보디빌딩 대회란? 일반 대회와 차이점 정리",
      "내추럴 대회와 오픈 보디빌딩 대회, 무엇이 다를까?",
      "도핑 검사 있는 피트니스 대회 선택 전 확인할 기준",
    ],
    title: "내추럴 보디빌딩 대회란? 일반 대회와 차이점 정리",
    metaDescription:
      "내추럴 보디빌딩 대회와 일반 오픈 대회의 차이를 도핑 검사, 금지 기간, 참가 자격, 검사 방식, 공식 요강 확인 포인트 중심으로 정리했습니다.",
    excerpt:
      "내추럴이라는 이름이 붙어도 검사 방식과 금지 기간은 단체마다 다릅니다. 출전 전에는 공식 규정과 모집요강을 따로 확인해야 합니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "내추럴",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 9,
    posterTheme: "lime",
    posterFigure: 3,
    targetReaders: [
      "내추럴 대회 출전을 고민하는 사람",
      "도핑 검사 여부가 궁금한 첫 출전자",
      "오픈 대회와 테스트 대회의 차이를 알고 싶은 사람",
    ],
    mainKeyword: "내추럴 보디빌딩 대회",
    relatedKeywords: [
      "내추럴 대회",
      "도핑 검사",
      "오픈 대회",
      "NPC Natural",
      "WNBF",
      "KADA",
      "WADA",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "내추럴 보디빌딩 대회는 약물 미사용 기준과 검사 절차를 전면에 내세우는 대회입니다. 하지만 모든 내추럴 대회가 같은 방식으로 운영되는 것은 아닙니다. 어떤 대회는 소변검사와 폴리그래프를 조합하고, 어떤 대회는 입상자 중심 검사만 운영할 수 있습니다.",
      },
      {
        t: "summary",
        items: [
          "내추럴 대회는 금지 약물 기준, 검사 방식, 금지 기간이 단체마다 다릅니다.",
          "오픈 대회는 내추럴 검증을 핵심 정체성으로 삼지 않는 경우가 많습니다.",
          "NPC Worldwide Natural 규정은 테스트 범주, 검사 방식, 최소 검사 대상, 금지 기간을 별도로 안내합니다.",
          "의약품을 복용 중이라면 KADA 금지약물 검색서비스와 해당 대회 TUE·처방약 규정을 구분해 확인해야 합니다.",
        ],
      },
      {
        t: "table",
        columns: ["구분", "내추럴 대회", "오픈 대회"],
        rows: [
          ["핵심 기준", "약물 미사용 기준과 검사 절차를 둠", "내추럴 검증이 핵심이 아닐 수 있음"],
          ["검사 방식", "소변, 혈액, 폴리그래프 등 단체별 상이", "같은 단체 안에서도 검사 조합과 대상 확인 필요"],
          ["출전 조건", "금지 기간, 내추럴 리저널 요건 등이 있을 수 있음", "일반 참가 자격, 멤버십, 체급 중심"],
          ["주의점", "내추럴이라는 이름만으로 검사 강도를 판단하면 안 됨", "오픈이 약물 사용 허용이라는 뜻은 아님"],
        ],
        sourceIds: ["npc-natural-rules", "wnbf-official"],
      },
      { t: "h", x: "NPC Natural과 WNBF는 같은 내추럴인가?" },
      {
        t: "p",
        x: "같은 내추럴 계열로 묶어 말할 수는 있지만 운영 방식은 다릅니다. NPC Worldwide Natural Contest Rules는 2026년 2월 12일 업데이트 기준으로 특정 테스트 범주, 최소 검사 대상, 검사 방식, 금지 기간을 안내합니다. WNBF는 공식 홈페이지에서 소변검사, 혈액검사, 폴리그래프와 10년 이상 drug-free 자격을 강조합니다.",
        sourceIds: ["npc-natural-rules", "wnbf-official"],
      },
      { t: "h", x: "도핑 검사가 있는 대회를 고를 때 볼 것" },
      {
        t: "checklist",
        items: [
          "검사 대상이 전체 선수인지, 오버롤 또는 상위 입상자 중심인지 확인한다.",
          "검사 방식이 소변, 혈액, 폴리그래프 중 무엇인지, 그리고 조합 제한이 있는지 확인한다.",
          "금지 기간이 물질별로 어떻게 나뉘는지 확인한다.",
          "처방약 관련 예외가 인정되는지 확인한다. NPC Worldwide Natural처럼 TUE를 허용하지 않는 대회도 있다.",
          "양성 또는 검사 거부 시 제재가 어떻게 적용되는지 확인한다.",
        ],
        sourceIds: ["npc-natural-rules", "kada-drug-info", "kada-tue"],
      },
      { t: "h", x: "안전하게 표현해야 하는 이유" },
      {
        t: "p",
        x: "도핑과 약물 문제는 건강, 법, 대회 자격에 직접 연결됩니다. 따라서 특정 약물 사용법, 검사 회피 방법, 극단적인 감량법은 다루지 않는 것이 원칙입니다. 이 글에서도 출전자가 확인해야 할 공식 절차와 주의사항만 설명합니다.",
      },
    ],
    faq: [
      {
        q: "내추럴 대회는 모든 선수가 도핑 검사를 받나요?",
        a: "단체와 대회에 따라 다릅니다. 일부는 전체 선수 검사를 강조하고, 일부는 오버롤 우승자나 상위 입상자를 중심으로 검사할 수 있습니다. 공식 규정과 모집요강을 확인해야 합니다.",
      },
      {
        q: "오픈 대회는 약물 사용이 허용된다는 뜻인가요?",
        a: "그렇게 단정하면 안 됩니다. 오픈 대회는 보통 내추럴 검증을 핵심 정체성으로 삼지 않는다는 의미에 가깝습니다. 법적·건강상 문제와 별개로 대회별 규정은 반드시 확인해야 합니다.",
      },
      {
        q: "처방약을 먹고 있으면 내추럴 대회에 못 나가나요?",
        a: "약물 종류와 대회 규정에 따라 다릅니다. KADA 금지약물 검색서비스는 국내 도핑관리 기준을 확인하는 데 유용하지만, NPC Worldwide Natural처럼 TUE를 허용하지 않는 대회도 있으므로 해당 대회 공식 규정을 따로 확인해야 합니다.",
      },
    ],
    sources: [
      {
        id: "npc-natural-rules",
        label: "NPC Worldwide Natural Contest Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/natural-contest-rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "wnbf-official",
        label: "WNBF Drug Testing Policies",
        url: "https://worldnaturalbb.com/competitor-info/anti-doping-policies/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kada-drug-info",
        label: "KADA 금지목록·금지약물 정보",
        url: "https://kada.or.kr/kada?where=drug%2Fdrug_info_method",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kada-tue",
        label: "KADA 치료목적사용면책(TUE) 신청 전 확인",
        url: "https://www.kada.or.kr/kada?where=tue%2Ftue_application",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "내추럴 대회 일정",
        href: "/competitions/types/natural",
        placement: "내추럴 대회 정의 뒤",
      },
      {
        anchor: "WNBF 대회 일정",
        href: "/competitions/organizations/wnbf",
        placement: "WNBF 설명 뒤",
      },
      {
        anchor: "전체 보디빌딩 대회 일정",
        href: "/competitions",
        placement: "FAQ 끝",
      },
    ],
    additionalChecks: [
      "NPC Natural, WNBF, ICN, Musclemania 등 단체별 검사 정책을 섞어 단정하지 않는다.",
      "게시 전 최신 WADA 금지목록 연도와 KADA 페이지 접근 가능성을 재확인한다.",
      "약물명 예시는 금지목록 설명 범위를 넘지 않도록 최소화한다.",
    ],
  },
  {
    id: "article2-before-registration-checklist",
    slug: "before-registration-checklist",
    recommendedTitles: [
      "보디빌딩 대회 참가 신청 전 확인해야 할 것들",
      "대회 모집요강 읽는 법: 접수 전 체크리스트",
      "피트니스 대회 신청하기 전에 꼭 봐야 할 참가 조건",
    ],
    title: "보디빌딩 대회 참가 신청 전 확인해야 할 것들",
    metaDescription:
      "보디빌딩 대회 참가 신청 전 확인해야 할 공식 모집요강, 참가 자격, 선수 등록, 체급, 참가비, 접수 마감, 환불 규정, 계측 일정을 체크리스트로 정리했습니다.",
    excerpt:
      "대회 신청 버튼을 누르기 전에는 일정뿐 아니라 자격, 체급, 비용, 환불, 계측, 복장 규정까지 봐야 합니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "참가 신청",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 7,
    posterTheme: "amber",
    posterFigure: 4,
    targetReaders: [
      "대회 참가 신청을 앞둔 첫 출전자",
      "모집요강을 어떻게 읽어야 하는지 모르는 사람",
      "참가비, 접수 마감, 계측 조건을 비교하려는 사람",
    ],
    mainKeyword: "보디빌딩 대회 참가 신청",
    relatedKeywords: [
      "대회 참가 신청",
      "대회 모집요강",
      "참가비",
      "선수 등록",
      "접수 마감",
      "계측",
      "환불 규정",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "보디빌딩 대회 참가 신청은 단순히 결제만 하면 끝나는 절차가 아닙니다. 대회별로 참가 자격, 선수 등록, 멤버십, 체급, 환불 규정, 양도 규정, 계측 참석 조건이 다를 수 있습니다. 신청 전에는 공식 모집요강을 기준으로 확인해야 합니다.",
      },
      {
        t: "summary",
        items: [
          "대회명, 주최 단체, 날짜, 장소, 접수 마감일을 먼저 확인합니다.",
          "선수 등록 또는 멤버십이 필요한지 확인합니다.",
          "체급, 중복 출전, 참가비, 환불·양도 규정을 확인합니다.",
          "계측 시간과 신분증 지참 여부를 놓치면 출전 자체가 어려워질 수 있습니다.",
        ],
      },
      { t: "h", x: "참가 신청 전 체크리스트" },
      {
        t: "checklist",
        items: [
          "공식 접수 페이지인지 확인했다.",
          "대회 날짜와 장소가 실제로 이동 가능한지 확인했다.",
          "접수 마감일과 결제 마감 시간을 확인했다.",
          "참가비, 추가 종목 비용, 현장 수수료를 확인했다.",
          "선수 등록 또는 멤버십이 필요한지 확인했다.",
          "체급 기준과 계측 방식을 확인했다.",
          "환불, 양도, 종목 변경 가능 여부를 확인했다.",
          "탄, 오일, 복장, 포징 음악 제출 규정을 확인했다.",
        ],
        sourceIds: ["ifbbpro-korea-rules", "kbbf-registration"],
      },
      { t: "h", x: "선수 등록이 필요한 대회가 있다" },
      {
        t: "p",
        x: "KBBF 계열 대회는 대한체육회 스포츠지원포털을 통한 선수 등록 흐름과 연결될 수 있습니다. 대한보디빌딩협회 선수등록안내는 스포츠지원포털 로그인, 보디빌딩 종목 선택, 전문체육선수 또는 생활체육선수 선택, 시도협회와 협회 승인 절차를 안내합니다. NPC Worldwide 계열은 해당 연도 유효한 NPC Worldwide 멤버십이 필요한 구조를 안내합니다.",
        sourceIds: ["kbbf-registration", "ifbbpro-korea-rules"],
      },
      { t: "h", x: "모집요강에서 특히 조심할 표현" },
      {
        t: "list",
        items: [
          "선착순 마감: 접수 기간이 남아도 조기 마감될 수 있습니다.",
          "계측 필수: 대회 전날 또는 당일 지정 시간에 참석해야 할 수 있습니다.",
          "오픈 체급과 오버롤 조건: 프로카드 수여 여부와 별개로 대회별 오버롤 참가 기준을 확인해야 합니다.",
          "프로카드 조건: 프로 퀄리파이어 유형, 디비전 참가자 수, 내추럴·오픈 구분에 따라 달라질 수 있습니다.",
          "종목별 운영 순서 변동 가능: 무대 시간이 현장에서 바뀔 수 있습니다.",
          "도핑 테스트 적용: 검사 대상과 방식이 대회별로 다를 수 있습니다.",
        ],
      },
      {
        t: "quote",
        x: "신청 전 10분의 모집요강 확인이 대회 당일의 큰 실수를 줄입니다.",
      },
    ],
    faq: [
      {
        q: "대회 참가비는 보통 얼마인가요?",
        a: "대회와 종목 수, 접수 시기, 현장 수수료에 따라 다릅니다. 가격은 바뀔 수 있으므로 피지크허브에는 고정 금액보다 공식 접수 링크와 확인 기준을 함께 두는 편이 안전합니다.",
      },
      {
        q: "선수 등록 없이 대회에 나갈 수 있나요?",
        a: "대회마다 다릅니다. KBBF 계열은 대한체육회 선수등록과 연결될 수 있고, NPC Worldwide 계열은 멤버십을 요구할 수 있습니다. 민간 대회도 자체 접수 조건이 있을 수 있습니다.",
      },
      {
        q: "대회 접수 후 종목 변경이 가능한가요?",
        a: "주최사 규정에 따라 다릅니다. 접수 페이지의 변경·환불·양도 규정을 확인하고, 불명확하면 공식 문의처에 확인하는 것이 좋습니다.",
      },
    ],
    sources: [
      {
        id: "ifbbpro-korea-rules",
        label: "NPC/IFBB PRO KOREA 대회 기본 규정",
        url: "https://ifbbprokorea.com/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kbbf-registration",
        label: "대한보디빌딩협회 선수등록안내",
        url: "https://www.bodybuilding.or.kr/proreg",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "source-baseline",
        label: "피트니스·보디빌딩 대회 일정 공식 소스 크롤링 조사",
        path: "docs/competition-schedule-crawling-sources.md",
        sourceType: "local",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "대회 목록에서 공식 출처 확인",
        href: "/competitions",
        placement: "도입부 뒤",
      },
      {
        anchor: "KBBF 대회 일정",
        href: "/competitions/organizations/kbbf",
        placement: "선수 등록 설명 뒤",
      },
      {
        anchor: "IFBB Pro · NPC 대회 일정",
        href: "/competitions/organizations/ifbb",
        placement: "NPC 멤버십 설명 뒤",
      },
    ],
    additionalChecks: [
      "참가비, 환불, 양도 조건은 시즌별로 바뀌므로 본문에 특정 금액을 넣을 경우 공식 접수 페이지 확인이 필요하다.",
      "피지크허브 대회 상세 페이지에 sourceUrl이 노출되는지 확인한다.",
    ],
  },
  {
    id: "article2-bodybuilding-weight-classes",
    slug: "bodybuilding-weight-classes",
    recommendedTitles: [
      "보디빌딩 대회 체급은 어떻게 나뉠까? 종목별 기준 정리",
      "보디빌딩 체급 기준 읽는 법: 체중·신장·오픈 클래스 차이",
      "피트니스 대회 체급 확인법, 계측 전 알아야 할 것",
    ],
    title: "보디빌딩 대회 체급은 어떻게 나뉠까? 종목별 기준 정리",
    metaDescription:
      "보디빌딩 대회 체급이 체중, 신장, 신장 대비 체중, 참가 인원 기준으로 어떻게 나뉘는지 설명하고 계측 전 확인해야 할 공식 요강 체크포인트를 정리했습니다.",
    excerpt:
      "보디빌딩 체급은 모든 대회가 같은 방식으로 나누지 않습니다. 종목과 단체에 따라 체중, 신장, 참가 인원 기준이 달라질 수 있습니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "체급",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 8,
    posterTheme: "rose",
    posterFigure: 5,
    targetReaders: [
      "보디빌딩 체급 기준이 궁금한 사람",
      "클래식 피지크 체중 제한을 확인하려는 사람",
      "계측 전 체급 변경 가능성을 알고 싶은 첫 출전자",
    ],
    mainKeyword: "보디빌딩 체급",
    relatedKeywords: [
      "보디빌딩 체급",
      "피지크 체급",
      "클래식 피지크 체중",
      "계측",
      "체급 기준",
      "대회 모집요강",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "보디빌딩 대회 체급은 생각보다 단순하지 않습니다. 어떤 대회는 체중으로 나누고, 어떤 대회는 신장으로 나누며, 클래식 계열 종목은 신장 대비 체중 제한이 붙을 수 있습니다. 또 일부 종목은 계측 후 참가 인원에 따라 체급이 확정될 수 있습니다.",
      },
      {
        t: "summary",
        items: [
          "전통 보디빌딩은 체중 체급을 사용하는 경우가 많습니다.",
          "맨즈 피지크, 비키니, 피규어 등은 신장 기준 또는 참가 인원 기준으로 나뉠 수 있습니다.",
          "클래식 피지크와 클래식 보디빌딩은 신장 대비 체중 제한이 적용될 수 있습니다.",
          "정확한 체급은 대회 공식 모집요강과 계측 결과를 기준으로 확인해야 합니다.",
        ],
      },
      {
        t: "table",
        columns: ["기준", "주로 쓰이는 경우", "확인할 점"],
        rows: [
          ["체중", "보디빌딩 체급", "계체 시간, 허용 오차, 체급 변경 가능 여부"],
          ["신장", "맨즈 피지크, 비키니, 피규어 일부", "신장 측정 방식과 클래스 수"],
          ["신장 대비 체중", "클래식 피지크, 클래식 보디빌딩 일부", "신장별 최대 체중표"],
          ["참가 인원", "핏모델, 비키니, 웰니스, 피겨 등 일부 대회", "계측 후 체급 확정 여부"],
        ],
        sourceIds: ["ifbbpro-korea-rules", "npc-worldwide-rules"],
      },
      { t: "h", x: "계측 전날 체중만 보면 위험하다" },
      {
        t: "p",
        x: "체급을 맞추기 위해 무리한 수분 제한이나 급격한 감량을 하는 것은 건강상 위험할 수 있습니다. 또한 대회별 계측 시간이 다르고, 신분증 지참이나 지정 시간 참석이 필요할 수 있습니다. IFBB PRO KOREA 규정은 정해진 계측 시간 참석과 신분증 지참을 안내하고, 계측 시간 미참석 시 실격 처리될 수 있다고 공지합니다.",
        sourceIds: ["ifbbpro-korea-rules"],
      },
      { t: "h", x: "체급 확인 체크리스트" },
      {
        t: "checklist",
        items: [
          "내 종목이 체중 기준인지, 신장 기준인지 확인한다.",
          "클래식 계열이면 신장별 허용 체중표를 확인한다.",
          "계측 장소와 시간을 캘린더에 따로 저장한다.",
          "신분증, 멤버십, 접수 확인 메일을 준비한다.",
          "계측 후 체급 재편성이 가능한지 확인한다.",
          "무리한 감량이 필요하다면 출전 체급이나 대회 선택을 다시 검토한다.",
        ],
      },
      {
        t: "quote",
        x: "체급은 마지막 날 억지로 맞추는 숫자가 아니라, 준비 초기부터 확인해야 하는 출전 조건입니다.",
      },
    ],
    faq: [
      {
        q: "보디빌딩 체급은 모두 체중으로 나뉘나요?",
        a: "아닙니다. 보디빌딩은 체중 체급을 쓰는 경우가 많지만, 피지크·비키니·피규어 계열은 신장 또는 참가 인원 기준이 적용될 수 있습니다.",
      },
      {
        q: "계측에서 체급을 못 맞추면 어떻게 되나요?",
        a: "대회 규정에 따라 체급 변경, 감점, 출전 제한 등이 달라질 수 있습니다. 정확한 처리는 해당 대회 공식 요강과 현장 운영 규정에 따릅니다.",
      },
      {
        q: "클래식 피지크는 왜 신장과 체중을 같이 보나요?",
        a: "클래식 피지크는 고전적 비율과 균형을 강조하기 때문에, 단체에 따라 신장 대비 최대 체중 기준을 둘 수 있습니다. 구체 수치는 대회별 체급표를 확인해야 합니다.",
      },
    ],
    sources: [
      {
        id: "ifbbpro-korea-rules",
        label: "NPC/IFBB PRO KOREA 대회 기본 규정",
        url: "https://ifbbprokorea.com/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "npc-worldwide-rules",
        label: "NPC Worldwide Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "보디빌딩 대회 일정",
        href: "/competitions/categories/bodybuilding",
        placement: "체중 체급 설명 뒤",
      },
      {
        anchor: "클래식 피지크 대회 일정",
        href: "/competitions/categories/classic-physique",
        placement: "신장 대비 체중 설명 뒤",
      },
      {
        anchor: "대회 목록",
        href: "/competitions",
        placement: "체급 확인 체크리스트 뒤",
      },
    ],
    additionalChecks: [
      "체급별 구체 수치는 대회별 공지로 자주 달라질 수 있어 본문에는 구조 설명 중심으로 유지한다.",
      "계측 시간 미참석 관련 표현은 특정 단체 규정으로 한정해 출처와 함께 유지한다.",
    ],
  },
  {
    id: "article2-doping-test-process",
    slug: "doping-test-process",
    recommendedTitles: [
      "보디빌딩 대회 도핑 검사는 어떻게 진행될까?",
      "내추럴 대회 도핑 검사 절차와 출전자가 확인할 것",
      "피트니스 대회 도핑 검사, 공식 규정 기준으로 정리",
    ],
    title: "보디빌딩 대회 도핑 검사는 어떻게 진행될까?",
    metaDescription:
      "보디빌딩·피지크 대회 도핑 검사가 어떤 방식으로 운영될 수 있는지, 소변검사·혈액검사·폴리그래프·TUE·금지목록 확인 기준을 정리했습니다.",
    excerpt:
      "도핑 검사는 단체와 대회에 따라 방식과 대상이 다릅니다. 내추럴 대회라고 해도 검사 범위와 제재 기준을 공식 규정으로 확인해야 합니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "도핑 검사",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 9,
    posterTheme: "navy",
    posterFigure: 3,
    targetReaders: [
      "도핑 검사 있는 대회 출전을 고민하는 사람",
      "내추럴 대회 검사 방식이 궁금한 사람",
      "처방약이나 보충제 사용 전 주의사항을 알고 싶은 선수",
    ],
    mainKeyword: "보디빌딩 대회 도핑 검사",
    relatedKeywords: [
      "도핑 검사",
      "내추럴 대회",
      "KADA",
      "WADA",
      "금지약물 검색",
      "TUE",
      "폴리그래프",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "보디빌딩 대회 도핑 검사는 모든 대회에서 같은 방식으로 진행되지 않습니다. 내추럴 대회, 공인 스포츠 계열 대회, 특정 프로 퀄리파이어 등 대회 성격에 따라 검사 대상과 방식이 달라질 수 있습니다. 따라서 출전자는 대회명보다 공식 규정을 먼저 확인해야 합니다.",
      },
      {
        t: "summary",
        items: [
          "검사 방식은 소변검사, 혈액검사, 폴리그래프 등으로 나뉠 수 있습니다.",
          "NPC Worldwide Natural 규정은 최소 검사 대상과 테스트 범주, 금지 기간을 안내합니다.",
          "KADA는 국내 스포츠 도핑관리 기준과 금지약물 검색서비스, TUE 정보를 제공합니다. 다만 민간·해외 단체의 TUE 인정 여부는 해당 단체 규정이 우선입니다.",
          "검사 회피 방법이나 약물 사용법은 다루지 말아야 하며, 공식 절차 확인이 우선입니다.",
        ],
      },
      { t: "h", x: "도핑 검사의 기본 흐름" },
      {
        t: "list",
        items: [
          "출전자가 대회 규정과 금지목록을 확인합니다.",
          "대회 또는 단체가 검사 대상과 검사 방식을 정합니다.",
          "지정된 절차에 따라 시료 채취 또는 폴리그래프가 진행될 수 있습니다.",
          "결과에 따라 순위 확정, 실격, 제재, 프로카드 등록 보류 등이 적용될 수 있습니다.",
        ],
        sourceIds: ["npc-natural-rules", "kada-drug-info"],
      },
      { t: "h", x: "내추럴 대회의 검사 방식은 단체마다 다르다" },
      {
        t: "p",
        x: "NPC Worldwide Natural Contest Rules는 테스트 범주에 Anabolic Agents(S1)와 Diuretics & Masking Agents(S5)를 포함해야 한다고 안내합니다. 검사 방식은 소변 또는 혈액 분석이며 폴리그래프와 병행될 수 있지만, 같은 대회에서 소변과 혈액 검사를 함께 진행할 수 없고 폴리그래프만으로 검사를 구성할 수도 없습니다. 또 Natural Regional과 Natural Pro Qualifier에서 최소 검사 대상을 구분합니다. WNBF는 공식 anti-doping 정책에서 WADA Code와 Prohibited List 준수, 소변검사, 랜덤 검사, 10년 이상 drug-free 자격을 강조합니다.",
        sourceIds: ["npc-natural-rules", "wnbf-official"],
      },
      { t: "h", x: "처방약이 있다면 TUE를 확인한다" },
      {
        t: "p",
        x: "의학적 이유로 약물을 사용하는 선수는 금지약물 여부를 임의로 판단하면 안 됩니다. KADA는 의약품 사용 전 금지약물 검색서비스 확인을 권장하고, 금지약물 또는 금지방법을 치료 목적으로 사용해야 하는 경우 치료목적사용면책(TUE) 제도를 안내합니다. 다만 KADA TUE가 모든 민간·해외 내추럴 대회에서 자동으로 인정되는 것은 아닙니다. NPC Worldwide Natural Contest Rules는 TUE를 허용하지 않는다고 명시하므로, 출전하려는 단체의 처방약·예외 규정을 별도로 확인해야 합니다.",
        sourceIds: ["kada-drug-info", "kada-tue", "npc-natural-rules", "wada-2026-list"],
      },
      {
        t: "checklist",
        items: [
          "내가 출전하는 대회가 tested, natural, open 중 어디에 해당하는지 확인한다.",
          "검사 대상이 전체 선수인지, 상위 입상자인지 확인한다.",
          "금지 기간과 금지 물질 범주를 확인한다.",
          "처방약은 국내 도핑관리 기준과 주최 단체의 처방약·TUE 규정으로 나누어 확인한다.",
          "검사 결과가 나오기 전 순위나 프로 자격이 확정되는지 여부를 확인한다.",
        ],
      },
    ],
    faq: [
      {
        q: "보디빌딩 대회는 모두 도핑 검사를 하나요?",
        a: "아닙니다. 도핑 검사 여부는 대회 성격과 단체 규정에 따라 다릅니다. 내추럴 또는 tested라고 표시된 대회라도 검사 대상과 방식은 따로 확인해야 합니다.",
      },
      {
        q: "폴리그래프만 통과하면 내추럴이라고 볼 수 있나요?",
        a: "그렇게 단정하기 어렵습니다. 폴리그래프, 소변검사, 혈액검사 등은 단체별 정책의 일부이며, 검사 강도와 제재 방식은 공식 규정에 따라 다릅니다.",
      },
      {
        q: "보충제도 도핑 문제가 될 수 있나요?",
        a: "가능성을 배제할 수 없습니다. 성분이 불명확한 보충제나 해외 제품은 특히 주의해야 하며, 의약품은 KADA 금지약물 검색서비스와 전문가 상담을 활용하는 것이 좋습니다.",
      },
    ],
    sources: [
      {
        id: "npc-natural-rules",
        label: "NPC Worldwide Natural Contest Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/natural-contest-rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "wnbf-official",
        label: "WNBF Drug Testing Policies",
        url: "https://worldnaturalbb.com/competitor-info/anti-doping-policies/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kada-drug-info",
        label: "KADA 금지목록·금지약물 정보",
        url: "https://kada.or.kr/kada?where=drug%2Fdrug_info_method",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kada-tue",
        label: "KADA 치료목적사용면책(TUE) 신청 전 확인",
        url: "https://www.kada.or.kr/kada?where=tue%2Ftue_application",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "wada-2026-list",
        label: "WADA 2026 Prohibited List",
        url: "https://www.wada-ama.org/sites/default/files/2025-09/2026list_en_final_clean_september_2025.pdf",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "내추럴 대회 일정",
        href: "/competitions/types/natural",
        placement: "내추럴 대회 검사 방식 문단 뒤",
      },
      {
        anchor: "대회 목록에서 공식 출처 확인",
        href: "/competitions",
        placement: "검사 체크리스트 뒤",
      },
    ],
    additionalChecks: [
      "약물명과 금지 기간을 구체적으로 추가할 경우 WADA/KADA 최신 목록과 대회 규정을 동시에 확인한다.",
      "검사 회피, 약물 사용법, 극단적 감량법으로 해석될 수 있는 문장은 삭제한다.",
    ],
  },
  {
    id: "article2-show-day-checklist",
    slug: "show-day-checklist",
    recommendedTitles: [
      "피트니스 대회 당일 준비물 체크리스트",
      "보디빌딩 대회 당일 무엇을 챙겨야 할까?",
      "첫 대회 당일 체크리스트: 계측부터 무대 전까지",
    ],
    title: "피트니스 대회 당일 준비물 체크리스트",
    metaDescription:
      "피트니스·보디빌딩 대회 당일 필요한 준비물을 계측, 복장, 탄, 식사, 포징, 대기 시간 기준으로 정리했습니다. 첫 출전자용 체크리스트를 확인하세요.",
    excerpt:
      "대회 당일은 작은 물건 하나가 생각보다 크게 느껴집니다. 계측과 무대 대기까지 고려해 실전형 준비물을 챙기세요.",
    category: "가이드",
    categorySlug: "guide",
    tag: "당일 준비",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 6,
    posterTheme: "sage",
    posterFigure: 0,
    targetReaders: [
      "첫 피트니스 대회 당일 준비물이 궁금한 사람",
      "계측과 무대 대기 과정이 낯선 출전자",
      "대회 전날 가방을 싸야 하는 선수",
    ],
    mainKeyword: "대회 당일 준비물",
    relatedKeywords: [
      "대회 당일 준비물",
      "보디빌딩 대회 준비",
      "계측",
      "탄 작업",
      "포징",
      "펌핑",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "피트니스 대회 당일에는 무대보다 먼저 계측, 번호표 수령, 대기, 복장 확인, 탄 보정 같은 과정을 지나야 합니다. 처음 출전하는 사람은 이 흐름 자체가 낯설기 때문에 준비물을 체크리스트로 정리해두는 것이 좋습니다.",
      },
      {
        t: "summary",
        items: [
          "신분증, 접수 확인, 멤버십 확인 자료는 가장 먼저 챙깁니다.",
          "종목별 복장, 여분 복장, 슬리퍼, 수건, 보정용 탄을 준비합니다.",
          "대기 시간이 길어질 수 있으므로 식사, 물, 보조 배터리, 겉옷을 챙깁니다.",
          "대회별 탄·오일·촬영·백스테이지 규정을 확인해야 합니다.",
        ],
      },
      { t: "h", x: "필수 준비물" },
      {
        t: "checklist",
        items: [
          "신분증",
          "접수 확인 이메일 또는 캡처",
          "선수 등록 또는 멤버십 확인 자료",
          "종목별 경기복과 여분 복장",
          "번호표 고정용 핀 또는 주최 측 안내 물품",
          "슬리퍼, 수건, 겉옷",
          "식사, 간식, 물",
          "펌핑 밴드 또는 가벼운 펌핑 도구",
          "보조 배터리와 충전 케이블",
          "탄 보정용 도구와 물티슈",
        ],
      },
      { t: "h", x: "계측과 대기 시간을 고려한다" },
      {
        t: "p",
        x: "대회는 정해진 순서대로만 흘러가지 않을 수 있습니다. IFBB PRO KOREA 공지는 운영 상황에 따라 시간 변동이 생길 수 있다고 안내합니다. 따라서 자신의 예상 무대 시간만 보고 움직이기보다 계측, 선수 대기, 종목 순서 변경 가능성을 고려해야 합니다.",
        sourceIds: ["ifbbpro-korea-rules"],
      },
      { t: "h", x: "챙기면 좋은 보조 물품" },
      {
        t: "list",
        items: [
          "작은 거울: 탄 번짐과 복장 상태 확인",
          "휴지와 물티슈: 손, 발, 주변 정리",
          "여분 비닐봉투: 탄 묻은 물품 분리",
          "가벼운 겉옷: 대기 중 체온 유지",
          "포징 영상 저장본: 현장에서 루틴 확인",
        ],
      },
      {
        t: "quote",
        x: "대회 당일 가방은 많이 챙기는 것보다, 바로 꺼낼 수 있게 정리하는 것이 더 중요합니다.",
      },
    ],
    faq: [
      {
        q: "대회 당일 음식은 무엇을 챙겨야 하나요?",
        a: "개인 식단과 소화 상태에 따라 다릅니다. 새 음식을 시도하기보다 평소 준비 과정에서 문제가 없던 음식을 소량씩 챙기는 편이 안전합니다.",
      },
      {
        q: "펌핑 도구는 꼭 필요한가요?",
        a: "필수는 아니지만 밴드처럼 가벼운 도구는 무대 전 펌핑에 도움이 될 수 있습니다. 단, 백스테이지 공간과 주최 측 규정을 확인해야 합니다.",
      },
      {
        q: "가족이나 코치가 백스테이지에 들어갈 수 있나요?",
        a: "대회별로 다릅니다. 서포터권, 코치 패스, 백스테이지 출입 규정이 따로 있을 수 있으므로 공식 안내를 확인해야 합니다.",
      },
    ],
    sources: [
      {
        id: "ifbbpro-korea-rules",
        label: "NPC/IFBB PRO KOREA 대회 기본 규정",
        url: "https://ifbbprokorea.com/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "다가오는 대회 일정",
        href: "/competitions",
        placement: "도입부 뒤",
      },
      {
        anchor: "첫 출전 가이드",
        href: "/guide",
        placement: "필수 준비물 체크리스트 뒤",
      },
    ],
    additionalChecks: [
      "음식과 수분 관련 문장은 개인별 차이를 전제로 유지한다.",
      "백스테이지 출입권, 촬영 장비 반입 등은 대회별 공지에 따라 바뀔 수 있음을 유지한다.",
    ],
  },
  {
    id: "article2-tanning-coloring-guide",
    slug: "tanning-coloring-guide",
    recommendedTitles: [
      "보디빌딩 대회 탄 작업, 컬러링, 태닝은 왜 필요할까?",
      "피트니스 대회 태닝과 탄 규정, 처음 준비하는 사람을 위한 정리",
      "대회 무대에서 탄을 바르는 이유와 주의사항",
    ],
    title: "보디빌딩 대회 탄 작업, 컬러링, 태닝은 왜 필요할까?",
    metaDescription:
      "보디빌딩 대회에서 태닝과 탄 작업이 필요한 이유, 무대 조명과 근육 선명도, 대회별 탄·오일 규정, 컬러 크림 주의사항을 정리했습니다.",
    excerpt:
      "탄 작업은 단순히 피부를 어둡게 만드는 절차가 아닙니다. 무대 조명에서 근육 라인을 보여주기 위한 준비이며, 대회별 규정을 반드시 따라야 합니다.",
    category: "가이드",
    categorySlug: "guide",
    tag: "태닝",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 7,
    posterTheme: "deep",
    posterFigure: 2,
    targetReaders: [
      "대회 태닝과 탄 작업이 처음인 출전자",
      "컬러링, 탄, 오일 규정이 궁금한 사람",
      "무대 조명에서 몸이 어떻게 보이는지 알고 싶은 사람",
    ],
    mainKeyword: "보디빌딩 대회 탄 작업",
    relatedKeywords: [
      "탄 작업",
      "태닝",
      "컬러링",
      "보디빌딩 대회",
      "피트니스 대회 준비",
      "대회 규정",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "보디빌딩 대회에서 태닝과 탄 작업은 무대 조명 아래에서 근육의 선명도와 라인을 잘 보이게 하기 위한 준비입니다. 평소 피부 톤 그대로 무대에 서면 강한 조명 때문에 몸의 굴곡이 흐려 보일 수 있습니다. 다만 탄 제품과 오일 사용은 대회별 규정이 있으므로 아무 제품이나 사용할 수 있는 것은 아닙니다.",
      },
      {
        t: "summary",
        items: [
          "태닝과 탄 작업은 무대 조명에서 근육 라인과 컨디션을 잘 보이게 하기 위한 준비입니다.",
          "탄, 오일, 컬러 크림 허용 여부는 대회마다 다를 수 있습니다.",
          "IFBB PRO KOREA 규정은 일반 스프레이 탄이 아닌 컬러 크림 사용 시 감점이나 실격 대상이 될 수 있다고 안내합니다.",
          "대회장 오염, 색 번짐, 과도한 오일 사용은 현장 문제로 이어질 수 있습니다.",
        ],
      },
      { t: "h", x: "왜 피부 톤을 어둡게 만들까?" },
      {
        t: "p",
        x: "대회장 조명은 강하고 밝습니다. 피부가 밝으면 근육의 굴곡, 분리도, 혈관, 복부 라인이 사진보다 덜 보일 수 있습니다. 탄 작업은 피부 톤을 균일하게 만들고, 포징 중 근육의 입체감을 살리는 데 도움을 줍니다.",
      },
      { t: "h", x: "탄과 컬러 크림은 다르게 봐야 한다" },
      {
        t: "p",
        x: "일부 대회는 특정 형태의 탄 또는 컬러 제품을 제한합니다. IFBB PRO KOREA 규정은 일반적인 스프레이 방식의 탄이 아닌 컬러 크림 등을 사용한 경우 감점이나 실격 대상이 된다고 안내합니다. 색상이 무대 조명에 반사되거나 대회장을 오염시킬 수 있다는 이유도 함께 설명합니다.",
        sourceIds: ["ifbbpro-korea-rules"],
      },
      { t: "h", x: "처음 준비할 때 체크할 것" },
      {
        t: "checklist",
        items: [
          "대회 공식 탄 업체가 있는지 확인한다.",
          "외부 탄 업체 또는 셀프 탄이 허용되는지 확인한다.",
          "컬러 크림, 오일, 광택 제품 제한 여부를 확인한다.",
          "복장에 탄이 묻을 수 있으므로 여분 옷과 비닐을 준비한다.",
          "피부 트러블이 있다면 미리 테스트하고 무리한 제품 사용을 피한다.",
        ],
        sourceIds: ["ifbbpro-korea-rules"],
      },
      {
        t: "quote",
        x: "탄 작업의 목표는 더 진하게 보이는 것이 아니라, 무대에서 몸이 정확히 보이게 만드는 것입니다.",
      },
    ],
    faq: [
      {
        q: "보디빌딩 대회에 태닝은 꼭 해야 하나요?",
        a: "대회 규정상 필수인지 여부는 대회마다 다릅니다. 다만 무대 조명에서 근육 라인을 잘 보이게 하려는 이유로 많은 선수가 태닝이나 탄 작업을 준비합니다.",
      },
      {
        q: "셀프 탄을 해도 되나요?",
        a: "대회마다 다릅니다. 공식 업체 이용만 허용하는 경우, 외부 제품 제한이 있는 경우, 셀프 탄이 가능한 경우가 다를 수 있어 모집요강을 확인해야 합니다.",
      },
      {
        q: "오일을 많이 바르면 더 좋아 보이나요?",
        a: "과도한 오일은 조명 반사와 미끄러짐, 대회장 오염 문제를 만들 수 있습니다. 대회 규정과 현장 안내를 따르는 것이 우선입니다.",
      },
    ],
    sources: [
      {
        id: "ifbbpro-korea-rules",
        label: "NPC/IFBB PRO KOREA 대회 기본 규정",
        url: "https://ifbbprokorea.com/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "npc-worldwide-rules",
        label: "NPC Worldwide Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "대회 당일 준비물 체크",
        href: "/articles/show-day-checklist",
        placement: "처음 준비할 때 체크할 것 뒤",
      },
      {
        anchor: "피트니스 대회 일정",
        href: "/competitions",
        placement: "대회별 규정 확인 문단 뒤",
      },
    ],
    additionalChecks: [
      "특정 탄 브랜드 허용 여부는 주최 측이 공식적으로 밝히지 않는 경우가 있어 브랜드명을 넣지 않는다.",
      "피부 건강 관련 내용은 일반 주의 수준으로만 유지한다.",
    ],
  },
  {
    id: "article2-first-competition-choice",
    slug: "first-competition-choice",
    recommendedTitles: [
      "첫 대회 출전자는 어떤 대회를 선택하는 게 좋을까?",
      "보디빌딩 첫 대회 고르는 법: 루키·리저널·내추럴 비교",
      "첫 피지크 대회 선택 기준, 일정표 보기 전에 확인할 것",
    ],
    title: "첫 대회 출전자는 어떤 대회를 선택하는 게 좋을까?",
    metaDescription:
      "첫 보디빌딩·피지크 대회 출전자가 루키, 노비스, 리저널, 내추럴, 협회 대회 중 어떤 기준으로 대회를 선택하면 좋은지 정리했습니다.",
    excerpt:
      "첫 대회는 유명한 대회보다 나에게 맞는 대회가 중요합니다. 종목, 거리, 접수 조건, 루키 클래스, 공식 규정, 일정 여유를 기준으로 비교하세요.",
    category: "가이드",
    categorySlug: "guide",
    tag: "대회 선택",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 8,
    posterTheme: "lime",
    posterFigure: 1,
    targetReaders: [
      "첫 대회 선택이 어려운 헬스인",
      "루키·노비스·리저널 차이가 궁금한 사람",
      "대회 목록을 보고 실제로 비교하고 싶은 사람",
    ],
    mainKeyword: "첫 보디빌딩 대회 선택",
    relatedKeywords: [
      "첫 대회",
      "루키 대회",
      "노비스 대회",
      "리저널 대회",
      "내추럴 대회",
      "대회 일정",
      "대회 참가 신청",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "첫 대회는 가장 큰 대회나 가장 유명한 대회를 고르는 것이 정답은 아닙니다. 오히려 준비 기간, 이동 거리, 종목 운영, 루키 클래스, 접수 조건, 계측 시간, 공식 규정이 나에게 맞는지가 더 중요합니다.",
      },
      {
        t: "summary",
        items: [
          "첫 출전자는 일정 여유, 이동 거리, 루키·노비스 클래스 운영 여부를 먼저 봅니다.",
          "프로카드나 상위 자격보다 무대 경험을 목표로 잡는 것이 현실적일 수 있습니다.",
          "내추럴 대회는 검사 방식과 금지 기간을 공식 규정으로 확인해야 합니다.",
          "피지크허브에서는 대회 목록, 종목별 페이지, 유형별 페이지를 함께 비교하는 흐름이 좋습니다.",
        ],
      },
      {
        t: "table",
        columns: ["대회 유형", "장점", "주의할 점"],
        rows: [
          ["루키·노비스", "첫 출전자와 경력 제한 클래스가 있을 수 있음", "루키 기준이 대회마다 다름"],
          ["리저널", "NPC 계열 등에서 첫 진입 대회로 활용 가능", "프로 퀄리파이어와 자격 관계 확인 필요"],
          ["내추럴", "약물검사 기준을 중시하는 선수에게 적합", "검사 방식과 금지 기간이 단체마다 다름"],
          ["협회 공인 대회", "선수등록, 시도 대표, 전국체전 흐름과 연결 가능", "등록·자격 조건 확인 필요"],
        ],
        sourceIds: ["npc-worldwide-rules", "npc-natural-rules", "kbbf-registration"],
      },
      { t: "h", x: "첫 대회 선택 기준 5가지" },
      {
        t: "checklist",
        items: [
          "준비 기간이 충분한 날짜인지 확인한다.",
          "집에서 이동 가능한 지역인지 확인한다.",
          "내 종목과 체급이 운영되는지 확인한다.",
          "루키, 트루 노비스, 노비스 클래스 기준이 나에게 맞는지 확인한다.",
          "선수 등록, 멤버십, 리저널 요건이 필요한지 확인한다.",
        ],
      },
      { t: "h", x: "무대 경험을 목표로 잡아도 괜찮다" },
      {
        t: "p",
        x: "첫 대회에서는 입상보다 대회 흐름을 경험하는 것이 더 큰 수확일 수 있습니다. 계측, 대기, 콜아웃, 포징, 조명, 사진, 심사 피드백까지 한 번 경험하면 다음 시즌 준비가 훨씬 구체적이 됩니다. IFBB PRO KOREA 규정도 대회 종료 후 심사위원 피드백을 받을 수 있는 절차를 안내합니다.",
        sourceIds: ["ifbbpro-korea-rules"],
      },
      {
        t: "quote",
        x: "첫 대회는 커리어의 결론이 아니라, 다음 준비를 더 정확하게 만드는 기준점입니다.",
      },
    ],
    faq: [
      {
        q: "첫 대회는 무조건 루키 대회가 좋나요?",
        a: "꼭 그렇지는 않습니다. 루키 기준, 종목 운영, 지역, 일정, 참가비, 계측 조건을 함께 봐야 합니다. 루키 클래스가 있어도 내 종목이 없으면 맞지 않을 수 있습니다.",
      },
      {
        q: "첫 출전자가 프로 퀄리파이어에 나가도 되나요?",
        a: "대회 규정상 가능할 수도 있지만, 프로 퀄리파이어는 자격 요건이 있을 수 있고 경쟁 수준이 높을 수 있습니다. NPC Worldwide 계열은 리저널 요건 등 공식 규정을 확인해야 합니다.",
      },
      {
        q: "내추럴 대회가 첫 대회로 더 안전한가요?",
        a: "내추럴 대회가 본인의 가치관과 맞을 수는 있지만, 검사 방식과 금지 기간, 출전 조건이 단체마다 다릅니다. 안전성이나 적합성은 공식 규정과 본인 상황을 함께 봐야 합니다.",
      },
    ],
    sources: [
      {
        id: "npc-worldwide-rules",
        label: "NPC Worldwide Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "npc-natural-rules",
        label: "NPC Worldwide Natural Contest Rules",
        url: "https://www.ifbbpro.com/npc-worldwide/natural-contest-rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "kbbf-registration",
        label: "대한보디빌딩협회 선수등록안내",
        url: "https://www.bodybuilding.or.kr/proreg",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "ifbbpro-korea-rules",
        label: "NPC/IFBB PRO KOREA 대회 기본 규정",
        url: "https://ifbbprokorea.com/rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "루키·입문 대회 일정",
        href: "/competitions/types/rookie",
        placement: "첫 대회 선택 기준 문단 뒤",
      },
      {
        anchor: "리저널 대회 일정",
        href: "/competitions/types/regional",
        placement: "대회 유형 비교표 뒤",
      },
      {
        anchor: "내추럴 대회 일정",
        href: "/competitions/types/natural",
        placement: "내추럴 설명 뒤",
      },
      {
        anchor: "전체 대회 목록",
        href: "/competitions",
        placement: "FAQ 끝",
      },
    ],
    additionalChecks: [
      "루키·노비스 기준은 단체별로 다르므로 구체 기준을 넣을 경우 해당 대회 요강으로 확인한다.",
      "프로 퀄리파이어 자격 문장은 NPC Worldwide와 IFBB PRO KOREA 규정을 기준으로 한정한다.",
    ],
  },
  {
    id: "article2_2026-new-york-pro-results",
    slug: "2026-new-york-pro-results",
    recommendedTitles: [
      "2026 New York Pro 결과 정리: Tonio Burton, Niall Darwen, Maria Acosta 우승",
      "2026 New York Pro 결과와 올림피아 퀄리파이 포인트 해석",
      "IFBB Pro League 2026 New York Pro 주요 부문 TOP 3 정리",
    ],
    title: "2026 New York Pro 결과 정리: 공식 페이지 기준 주요 부문 TOP 3",
    metaDescription:
      "2026 New York Pro 결과를 IFBB Pro League 공식 페이지 기준으로 정리했습니다. Tonio Burton 우승, Jaehun Park 3위, 주요 부문 TOP 3와 올림피아 퀄리파이 해석 주의를 확인하세요.",
    excerpt:
      "2026 New York Pro는 5월 8일부터 9일까지 뉴저지 티넥에서 열린 IFBB Pro League PRO 대회입니다. 공식 결과 기준 주요 부문 TOP 3와 한국 선수 순위를 정리했습니다.",
    category: "대회 결과",
    categorySlug: "competition-result",
    tag: "IFBB Pro League",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 7,
    posterTheme: "navy",
    posterFigure: 4,
    targetReaders: [
      "2026 New York Pro 결과를 빠르게 확인하려는 독자",
      "IFBB Pro League 시즌 흐름과 보디빌딩 대회 결과를 비교하는 팬",
      "올림피아 퀄리파이 기준과 포인트 해석이 궁금한 독자",
    ],
    mainKeyword: "2026 New York Pro 결과",
    relatedKeywords: [
      "IFBB Pro League",
      "보디빌딩 대회 결과",
      "피지크 대회 결과",
      "올림피아 퀄리파이",
      "New York Pro",
      "2026 보디빌딩 결과",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "2026 New York Pro 결과는 IFBB Pro League 공식 대회 페이지 기준으로 정리했습니다. 대회는 2026년 5월 8일부터 5월 9일까지 미국 뉴저지주 티넥에서 열렸고, Competition Level은 IFBB Pro League PRO로 안내되었습니다.",
        sourceIds: ["ifbbpro-new-york-2026"],
      },
      {
        t: "summary",
        items: [
          "Men’s Bodybuilding Open은 Tonio Burton이 1위, Michal Krizanek이 2위, Rafael Brandao가 3위를 기록했습니다.",
          "Men’s Classic Physique는 Niall Darwen이 우승했고, 한국의 Jaehun Park은 3위에 올랐습니다.",
          "Women’s Physique에서는 Paula Ranta가 1위였고, Ji Hye Lee는 7위, Yuna Kim은 10위로 기록되었습니다.",
          "Women’s Fit Model에서는 Gabriela Queiroz가 1위였고, Yeseul Lee는 16위로 확인됩니다.",
          "Olympia qualification은 OQS 규정 기준으로 조심스럽게 해석해야 하며, 공식 qualified athletes 목록은 대회 후 업데이트될 수 있어 최종 확인이 필요합니다.",
        ],
      },
      { t: "h", x: "대회 기본 정보" },
      {
        t: "table",
        columns: ["항목", "내용"],
        rows: [
          ["대회명", "2026 New York Pro"],
          ["일정", "2026년 5월 8일-5월 9일"],
          ["장소", "Teaneck, New Jersey"],
          ["Competition Level", "IFBB Pro League PRO"],
          ["결과 기준", "IFBB Pro League 공식 대회 페이지, 확인일 2026-05-31"],
        ],
        sourceIds: ["ifbbpro-new-york-2026"],
      },
      { t: "h", x: "2026 New York Pro 결과표" },
      {
        t: "table",
        columns: ["Division", "1위", "2위", "3위", "한국 선수 순위"],
        rows: [
          ["Men’s Bodybuilding Open", "Tonio Burton (USA)", "Michal Krizanek (Slovakia)", "Rafael Brandao (Brazil)", "-"],
          ["Men’s 212", "Michael Condell (USA)", "Noel Adame (USA)", "Jury Kruber (Germany)", "-"],
          ["Men’s Classic Physique", "Niall Darwen (UK)", "Diego Alejandro Galindo Garavito (Colombia)", "Jaehun Park (South Korea)", "Jaehun Park 3위"],
          ["Men’s Physique", "Ali Bilal (Afghanistan)", "Edvan Palmeira (Brazil)", "Isai Kesek (Indonesia)", "-"],
          ["Women’s Figure", "Jeanne Kassel (Germany)", "Vanessa Happle (Germany)", "Mariela Merced (Puerto Rico)", "-"],
          ["Women’s Bikini", "Maria Acosta (USA)", "Phoebe Hagan (UK)", "Kate Carroll (New Zealand)", "-"],
          ["Women’s Physique", "Paula Ranta (Finland)", "Julia Glazycheva (Russia)", "Susan Mathison (USA)", "Ji Hye Lee 7위, Yuna Kim 10위"],
          ["Women’s Wellness", "Daniele Mendonca (Brazil)", "Giselle Machado (Brazil)", "Tatiane Farkas (Brazil)", "-"],
          ["Women’s Fit Model", "Gabriela Queiroz (USA)", "Carla Andrea Reyes Vargas (Bolivia)", "Aisha Mian (Canada)", "Yeseul Lee 16위"],
        ],
        sourceIds: ["ifbbpro-new-york-2026"],
      },
      { t: "h", x: "한국 선수 순위" },
      {
        t: "list",
        items: [
          "Men’s Classic Physique에서는 Jaehun Park이 3위에 올라, 2026 New York Pro 결과에서 가장 눈에 띄는 한국 선수 성과로 볼 수 있습니다.",
          "Women’s Physique에서는 Ji Hye Lee가 7위, Yuna Kim이 10위로 공식 결과에 기록되었습니다.",
          "Women’s Fit Model에서는 Yeseul Lee가 16위로 확인됩니다.",
          "순위와 표기는 IFBB Pro League 공식 페이지 기준이며, 동명이인이나 표기 변형 가능성이 있는 경우 공식 페이지 원문을 함께 확인하는 편이 안전합니다.",
        ],
        sourceIds: ["ifbbpro-new-york-2026"],
      },
      { t: "h", x: "Olympia qualification 해석 주의" },
      {
        t: "p",
        x: "공식 Olympia Qualification System 안내에 따르면 2026 OQS 기간은 2025년 9월 15일부터 2026년 8월 30일까지입니다. Classic Physique, Men’s Physique, Bikini, Wellness의 경우 New York Pro는 1위 자동 자격, 2위 14점, 3위 11점 등으로 안내됩니다. Men’s Open Bodybuilding, Men’s 212, Figure, Women’s Physique, Fit Model 등은 qualification period 중 open contest winner가 자격을 얻는 방식으로 안내됩니다.",
        sourceIds: ["ifbbpro-oqs-2026"],
      },
      {
        t: "p",
        x: "다만 이 글은 2026 New York Pro 결과와 OQS 규정의 연결을 설명하는 정리입니다. 공식 qualified athletes 목록은 대회 후 업데이트될 수 있으므로, 올림피아 출전 확정 여부는 IFBB Pro League와 Olympia의 공식 qualified athletes 목록에서 최종 확인해야 합니다.",
        sourceIds: ["ifbbpro-oqs-2026"],
      },
    ],
    faq: [
      {
        q: "2026 New York Pro 결과는 어떤 출처 기준인가요?",
        a: "IFBB Pro League 공식 2026 New York Pro 대회 페이지를 기준으로 정리했습니다. 확인일은 2026년 5월 31일입니다.",
      },
      {
        q: "2026 New York Pro에서 한국 선수는 어떤 결과를 냈나요?",
        a: "공식 결과 기준 Men’s Classic Physique에서 Jaehun Park이 3위, Women’s Physique에서 Ji Hye Lee가 7위와 Yuna Kim이 10위, Women’s Fit Model에서 Yeseul Lee가 16위로 확인됩니다.",
      },
      {
        q: "New York Pro 우승자는 바로 올림피아에 진출하나요?",
        a: "OQS 규정상 여러 부문에서 우승 또는 포인트가 올림피아 자격과 연결됩니다. 다만 공식 qualified athletes 목록은 대회 후 업데이트될 수 있으므로 최종 확정 여부는 공식 목록으로 확인해야 합니다.",
      },
    ],
    sources: [
      {
        id: "ifbbpro-new-york-2026",
        label: "IFBB Pro League 2026 New York Pro",
        url: "https://www.ifbbpro.com/competition/2026-new-york-pro/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "ifbbpro-oqs-2026",
        label: "IFBB Pro League Olympia Qualification Rules",
        url: "https://www.ifbbpro.com/olympia-qualification-rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "domain-context",
        label: "피트니스·보디빌딩 대회와 단체 컨텍스트",
        path: "docs/fitness-bodybuilding-competition-context.md",
        sourceType: "local",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "IFBB Pro · NPC 대회 일정",
        href: "/competitions/organizations/ifbb",
        placement: "대회 기본 정보 표 아래",
      },
      {
        anchor: "전체 아티클",
        href: "/articles",
        placement: "결과표 아래",
      },
      {
        anchor: "2026 Pittsburgh Pro 결과",
        href: "/articles/2026-pittsburgh-pro-results",
        placement: "Olympia qualification 설명 뒤",
      },
      {
        anchor: "클래식 피지크 대회 일정",
        href: "/competitions/categories/classic-physique",
        placement: "한국 선수 순위 문단 뒤",
      },
      {
        anchor: "맨즈 피지크 대회 일정",
        href: "/competitions/categories/mens-physique",
        placement: "Olympia qualification 설명 뒤",
      },
    ],
    additionalChecks: [
      "게시 직전 IFBB Pro League 공식 대회 페이지의 순위 표기와 선수 국적 표기를 다시 확인한다.",
      "Olympia qualified athletes 공식 목록이 업데이트되면 자동 자격 또는 포인트 관련 문장을 최신 상태로 재검토한다.",
      "Men’s 212 등 Pittsburgh Pro와 division 구성이 다른 부문을 혼동하지 않았는지 편집 단계에서 확인한다.",
    ],
  },
  {
    id: "article2_2026-pittsburgh-pro-results",
    slug: "2026-pittsburgh-pro-results",
    recommendedTitles: [
      "2026 Pittsburgh Pro 결과 정리: Michal Krizanek, Niall Darwen, Lauralie Chapados 우승",
      "2026 Pittsburgh Pro 결과와 올림피아 퀄리파이 포인트 해석",
      "Pittsburgh Power & Fitness Festival 2026 IFBB Pro League 결과 정리",
    ],
    title: "2026 Pittsburgh Pro 결과 정리: 공식 페이지 기준 주요 부문 TOP 3",
    metaDescription:
      "2026 Pittsburgh Pro 결과를 공식 페이지 기준으로 정리했습니다. Michal Krizanek 우승, Jaehun Park 4위, Yuna Kim 6위와 주요 부문 TOP 3를 확인하세요.",
    excerpt:
      "2026 Pittsburgh Power & Fitness Festival은 5월 16일부터 17일까지 펜실베이니아 피츠버그에서 열린 IFBB Pro League PRO 대회입니다. 공식 결과 기준 주요 부문 TOP 3와 한국 선수 순위를 정리했습니다.",
    category: "대회 결과",
    categorySlug: "competition-result",
    tag: "IFBB Pro League",
    authorName: "PhysiqueHub 편집부",
    readMinutes: 7,
    posterTheme: "deep",
    posterFigure: 5,
    targetReaders: [
      "2026 Pittsburgh Pro 결과를 확인하려는 독자",
      "New York Pro 이후 IFBB Pro League 시즌 흐름을 비교하는 팬",
      "올림피아 퀄리파이와 주요 피지크 대회 결과를 함께 보는 독자",
    ],
    mainKeyword: "2026 Pittsburgh Pro 결과",
    relatedKeywords: [
      "IFBB Pro League",
      "보디빌딩 대회 결과",
      "피지크 대회 결과",
      "올림피아 퀄리파이",
      "Pittsburgh Pro",
      "2026 보디빌딩 결과",
    ],
    writingStandardDate: "2026-05-31",
    body: [
      {
        t: "p",
        x: "2026 Pittsburgh Pro 결과는 IFBB Pro League 공식 2026 Pittsburgh Power & Fitness Festival 페이지 기준으로 정리했습니다. 대회는 2026년 5월 16일부터 5월 17일까지 미국 펜실베이니아주 피츠버그에서 열렸고, Competition Level은 IFBB Pro League PRO로 안내되었습니다.",
        sourceIds: ["ifbbpro-pittsburgh-2026"],
      },
      {
        t: "summary",
        items: [
          "Men’s Bodybuilding Open에서는 Michal Krizanek이 1위, Tonio Burton이 2위, Brandon Curry가 3위를 기록했습니다.",
          "Men’s Classic Physique에서는 Niall Darwen이 우승했고, Jaehun Park은 4위로 확인됩니다.",
          "Women’s Physique에서는 Paula Ranta가 1위, Yuna Kim이 6위를 기록했습니다.",
          "Women’s Fit Model에서는 Shealynn Burnett이 1위였고, Yeseul Lee는 16위로 확인됩니다.",
          "Pittsburgh 2026 공식 division 목록에는 Men’s 212가 없으므로, New York Pro 결과표와 비교할 때 부문 구성을 구분해야 합니다.",
        ],
      },
      { t: "h", x: "대회 기본 정보" },
      {
        t: "table",
        columns: ["항목", "내용"],
        rows: [
          ["대회명", "2026 Pittsburgh Power & Fitness Festival"],
          ["프로 대회명", "Jim Manion’s Pittsburgh Power & Fitness Pro"],
          ["일정", "2026년 5월 16일-5월 17일"],
          ["장소", "Pittsburgh, Pennsylvania"],
          ["Competition Level", "IFBB Pro League PRO"],
          ["결과 기준", "IFBB Pro League 공식 대회 페이지, 확인일 2026-05-31"],
        ],
        sourceIds: ["ifbbpro-pittsburgh-2026"],
      },
      { t: "h", x: "2026 Pittsburgh Pro 결과표" },
      {
        t: "table",
        columns: ["Division", "1위", "2위", "3위", "한국 선수 순위"],
        rows: [
          ["Men’s Bodybuilding Open", "Michal Krizanek (Slovakia)", "Tonio Burton (USA)", "Brandon Curry (USA)", "-"],
          ["Men’s Classic Physique", "Niall Darwen (UK)", "Diego Alejandro Galindo Garavito (Colombia)", "Chen Kang (China)", "Jaehun Park 4위"],
          ["Men’s Physique", "Kyron Holden (USA)", "Ali Bilal (Afghanistan)", "Edvan Palmeira (Brazil)", "-"],
          ["Women’s Figure", "Natalia Soltero (Mexico)", "Jeanne Kassel (Germany)", "Vanessa Happle (Germany)", "-"],
          ["Women’s Bikini", "Lauralie Chapados (USA)", "Aimee Delgado (USA)", "Maria Acosta (USA)", "-"],
          ["Women’s Physique", "Paula Ranta (Finland)", "Marika Jones (USA)", "Julia Glazycheva (Russia)", "Yuna Kim 6위"],
          ["Women’s Wellness", "Daniele Mendonca (Brazil)", "Giselle Machado (Brazil)", "Bruna Seredich (USA)", "-"],
          ["Women’s Fit Model", "Shealynn Burnett (USA)", "Elizabeth Hunter (USA)", "Carla Andrea Reyes Vargas (Bolivia)", "Yeseul Lee 16위"],
        ],
        sourceIds: ["ifbbpro-pittsburgh-2026"],
      },
      { t: "h", x: "New York Pro와 비교할 때 볼 점" },
      {
        t: "list",
        items: [
          "Men’s Bodybuilding Open에서는 New York Pro 2위였던 Michal Krizanek이 Pittsburgh Pro에서 1위로 올라섰고, New York Pro 우승자 Tonio Burton은 2위를 기록했습니다.",
          "Men’s Classic Physique에서는 Niall Darwen이 New York Pro에 이어 Pittsburgh Pro에서도 1위를 기록했습니다.",
          "Men’s Physique에서는 New York Pro 우승자 Ali Bilal이 Pittsburgh Pro에서는 2위였고, Kyron Holden이 1위를 차지했습니다.",
          "Pittsburgh 2026 공식 division 목록에는 Men’s 212가 없으므로, 2026 New York Pro 결과와 부문 수를 단순 비교하지 않는 것이 좋습니다.",
        ],
        sourceIds: ["ifbbpro-pittsburgh-2026", "ifbbpro-new-york-2026"],
      },
      { t: "h", x: "한국 선수 순위" },
      {
        t: "list",
        items: [
          "Men’s Classic Physique에서는 Jaehun Park이 4위로 기록되었습니다. New York Pro 3위에 이어 같은 시즌 주요 IFBB Pro League 무대에서 다시 상위권에 이름을 올린 결과입니다.",
          "Women’s Physique에서는 Yuna Kim이 6위로 확인됩니다.",
          "Women’s Fit Model에서는 Yeseul Lee가 16위로 기록되었습니다.",
          "이 순위는 공식 Pittsburgh Power & Fitness Festival 페이지 기준이며, 선수명 표기와 국적은 공식 페이지 원문을 우선합니다.",
        ],
        sourceIds: ["ifbbpro-pittsburgh-2026"],
      },
      { t: "h", x: "Olympia qualification 해석 주의" },
      {
        t: "p",
        x: "공식 Olympia Qualification System 안내에 따르면 2026 OQS 기간은 2025년 9월 15일부터 2026년 8월 30일까지입니다. Classic Physique, Men’s Physique, Bikini, Wellness의 경우 Pittsburgh Pro는 1위 자동 자격, 2위 14점, 3위 11점 등으로 안내됩니다. Men’s Open Bodybuilding, Figure, Women’s Physique, Fit Model 등은 qualification period 중 open contest winner가 자격을 얻는 방식으로 안내됩니다.",
        sourceIds: ["ifbbpro-oqs-2026"],
      },
      {
        t: "p",
        x: "다만 자격과 포인트는 OQS 기준을 결과에 대입해 읽는 영역입니다. 공식 qualified athletes 목록은 대회 후 업데이트될 수 있으므로, 올림피아 출전 확정 여부는 IFBB Pro League와 Olympia의 공식 qualified athletes 목록에서 최종 확인해야 합니다.",
        sourceIds: ["ifbbpro-oqs-2026"],
      },
    ],
    faq: [
      {
        q: "2026 Pittsburgh Pro 결과는 어떤 출처 기준인가요?",
        a: "IFBB Pro League 공식 2026 Pittsburgh Power & Fitness Festival 대회 페이지를 기준으로 정리했습니다. 확인일은 2026년 5월 31일입니다.",
      },
      {
        q: "2026 Pittsburgh Pro에 Men’s 212 결과가 있나요?",
        a: "사용한 공식 Pittsburgh 2026 division 목록에는 Men’s 212가 없습니다. 따라서 이 글의 결과표에도 Men’s 212를 별도 부문으로 넣지 않았습니다.",
      },
      {
        q: "2026 Pittsburgh Pro에서 한국 선수는 어떤 결과를 냈나요?",
        a: "공식 결과 기준 Jaehun Park이 Men’s Classic Physique 4위, Yuna Kim이 Women’s Physique 6위, Yeseul Lee가 Women’s Fit Model 16위로 확인됩니다.",
      },
      {
        q: "Pittsburgh Pro 우승자는 바로 올림피아에 진출하나요?",
        a: "OQS 규정상 여러 부문에서 우승 또는 포인트가 올림피아 자격과 연결됩니다. 다만 공식 qualified athletes 목록은 대회 후 업데이트될 수 있어 최종 확정 여부는 공식 목록으로 확인해야 합니다.",
      },
    ],
    sources: [
      {
        id: "ifbbpro-pittsburgh-2026",
        label: "IFBB Pro League 2026 Pittsburgh Power & Fitness Festival",
        url: "https://www.ifbbpro.com/competition/2026-pittsburgh-power-fitness-festival/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "ifbbpro-new-york-2026",
        label: "IFBB Pro League 2026 New York Pro",
        url: "https://www.ifbbpro.com/competition/2026-new-york-pro/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "ifbbpro-oqs-2026",
        label: "IFBB Pro League Olympia Qualification Rules",
        url: "https://www.ifbbpro.com/olympia-qualification-rules/",
        sourceType: "official",
        checkedAt: "2026-05-31",
      },
      {
        id: "domain-context",
        label: "피트니스·보디빌딩 대회와 단체 컨텍스트",
        path: "docs/fitness-bodybuilding-competition-context.md",
        sourceType: "local",
        checkedAt: "2026-05-31",
      },
    ],
    internalLinks: [
      {
        anchor: "IFBB Pro · NPC 대회 일정",
        href: "/competitions/organizations/ifbb",
        placement: "대회 기본 정보 표 아래",
      },
      {
        anchor: "2026 New York Pro 결과",
        href: "/articles/2026-new-york-pro-results",
        placement: "New York Pro 비교 문단 뒤",
      },
      {
        anchor: "전체 아티클",
        href: "/articles",
        placement: "결과표 아래",
      },
      {
        anchor: "비키니 대회 일정",
        href: "/competitions/categories/bikini",
        placement: "Olympia qualification 설명 뒤",
      },
    ],
    additionalChecks: [
      "게시 직전 IFBB Pro League 공식 대회 페이지의 순위 표기와 division 목록을 다시 확인한다.",
      "공식 qualified athletes 목록이 업데이트되면 OQS 관련 문장을 최신 상태로 재검토한다.",
      "Pittsburgh Pro에는 Men’s 212를 추가하지 않는다는 편집 메모를 유지한다.",
    ],
  },
];
