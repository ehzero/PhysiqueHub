import Link from "next/link";
import { CATEGORY_GUIDE } from "@/lib/data";

const ACCENT = "#B85C3C";
const INK = "#0E0E0C";
const MUTE = "#86827C";
const OK = "#2D7A3E";
const ROYAL = "#2D5A8F";
const PURPLE = "#7A4F8F";
const GOLD = "#C8A961";

// ── Data ────────────────────────────────────────────────────────────

interface FederationRoute {
  routeShort: string;
  routeBadge: string;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  body: string;
  divisionTerms: string;
  judging: string;
  doping: string;
  route: string;
  orgs: string[];
  count: number;
  ctaLabel: string;
  ctaHref: string;
}

const FEDERATION_ROUTES: FederationRoute[] = [
  {
    routeShort: "국가대표 · 협회",
    routeBadge: "시도선발 → 전국체전 → 국가대표",
    color: ROYAL,
    bg: "rgba(45,90,143,.10)",
    title: "KBBF · IFBB International",
    subtitle: "대한보디빌딩협회 / 국제보디빌딩연맹 (아마추어)",
    body: "국내 협회 공식 루트. 시·도대회 → 전국체전 → 국가대표 선발의 정형화된 경로. 협회 등록, 지역·전국 단위 대회 구조 이해가 중요합니다.",
    divisionTerms: "클래식보디빌딩 / 피지크 / 비키니피트니스",
    judging: "대칭·균형 중시, 클래식 라인",
    doping: "WADA 기준 도핑 검사",
    route: "국가대표 · 아마추어 무드",
    orgs: ["KBBF", "IFBB International"],
    count: 38,
    ctaLabel: "KBBF 대회 보기",
    ctaHref: "/competitions?org=대한보디빌딩협회",
  },
  {
    routeShort: "프로카드 · 프로리그",
    routeBadge: "Amateur → 프로카드 → IFBB Pro League",
    color: ACCENT,
    bg: "rgba(184,92,60,.10)",
    title: "NPC · IFBB Pro League",
    subtitle: "NPC Worldwide / IFBB Pro League (프로 리그)",
    body: "아마추어 → 프로 퀄리파이어 → IFBB Pro 프로카드 → 프로쇼·올림피아 진출. 리저널 출전 필요 여부와 프로 퀄리파이어 자격을 먼저 확인하세요.",
    divisionTerms: "Men's Open / Classic / Physique / Bikini",
    judging: "근육·라인·컨디션 종합",
    doping: "비검사 (대부분)",
    route: "프로카드 · 글로벌 프로",
    orgs: ["NPC", "NPC Worldwide", "IFBB Pro League", "AGP"],
    count: 199,
    ctaLabel: "NPC/IFBB Pro 대회 보기",
    ctaHref: "/competitions?org=NPC+Worldwide+Korea",
  },
  {
    routeShort: "내추럴",
    routeBadge: "도핑 검사 단체",
    color: OK,
    bg: "rgba(45,122,62,.10)",
    title: "WNBF · INBA · OCB",
    subtitle: "내추럴 보디빌딩 (Drug-Tested)",
    body: "폴리그래프·소변 검사로 무약물 출전을 보장. 금지 약물 기간과 치료 목적 예외 정책, 검사 방식을 출전 전에 반드시 확인하세요.",
    divisionTerms: "내추럴 보디빌딩 / 피지크 / 피겨 / 비키니",
    judging: "클린·라인 중심",
    doping: "의무 도핑 검사",
    route: "Natural Pro · 무약물",
    orgs: ["WNBF Korea", "INBA", "OCB", "PNBA"],
    count: 129,
    ctaLabel: "내추럴 대회 보기",
    ctaHref: "/competitions?natural=1",
  },
  {
    routeShort: "클래식 · 컴플라이언스",
    routeBadge: "클래식·내추럴 혼합 단체",
    color: "#7A6328",
    bg: "rgba(192,160,74,.16)",
    title: "NABBA · PCA · WFF",
    subtitle: "영국·유럽 클래식 계열",
    body: "클래식 보디빌딩 정통성을 강조하는 영국·유럽 단체. 일부는 도핑 검사 병행. 종목명이 같아도 복장·포징·평가 비중이 다를 수 있습니다.",
    divisionTerms: "Athletic / Toned Figure / Classic",
    judging: "클래식 라인 + 모델 라인",
    doping: "단체별 상이",
    route: "단체별 챔피언십",
    orgs: ["NABBA Korea", "PCA Korea", "WFF"],
    count: 29,
    ctaLabel: "NABBA·PCA 대회 보기",
    ctaHref: "/competitions?org=NABBA+Korea",
  },
  {
    routeShort: "쇼케이스 · 모델형",
    routeBadge: "모델·엔터테인먼트 무대",
    color: PURPLE,
    bg: "rgba(122,79,143,.10)",
    title: "Musclemania · WBFF",
    subtitle: "모델·엔터테인먼트형 대회",
    body: "근육량보다 라인·표현력·무대 매력에 가중치. 라운드별 의상·콘셉트 준비와 무대 장악력이 핵심. 모델·인플루언서 친화적 무대.",
    divisionTerms: "Musclemania / Model / Fitness",
    judging: "라인 · 표현력 · 카메라 적합도",
    doping: "비검사",
    route: "쇼케이스 · 미디어 노출",
    orgs: ["Musclemania", "WBFF"],
    count: 22,
    ctaLabel: "쇼케이스 대회 보기",
    ctaHref: "/competitions?org=Musclemania",
  },
];

// ── Section eyebrow ──────────────────────────────────────────────────
function SectionEyebrow({
  index,
  en,
  kr,
  dark,
}: {
  index: number;
  en: string;
  kr: string;
  dark?: boolean;
}) {
  return (
    <div className="guide-eyebrow-row">
      <span
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: dark ? GOLD : ACCENT,
          letterSpacing: "0.12em",
        }}
      >
        § {String(index).padStart(2, "0")}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: dark ? "#fff" : INK,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {en}
      </span>
      <span
        className="mono"
        style={{ fontSize: 11, color: dark ? "rgba(255,255,255,.5)" : MUTE }}
      >
        · {kr}
      </span>
    </div>
  );
}

// ── 1. Division cards ────────────────────────────────────────────────
function GuideDivisionSection() {
  return (
    <section id="divisions" className="guide-division-section">
      <div className="container">
        <div className="guide-division-head">
          <div>
            <SectionEyebrow
              index={1}
              en="Guide 01 · By Division"
              kr="종목별 비교"
            />
            <h2 className="guide-section-h2">
              종목은 이름보다{" "}
              <em style={{ color: ACCENT, fontStyle: "italic" }}>기준</em>으로
              비교하세요.
            </h2>
          </div>
        </div>
        <div className="guide-division-grid">
          {CATEGORY_GUIDE.map((d) => (
            <div key={d.key} className="guide-division-card">
              <div className="guide-division-card-top">
                <span className="guide-division-scope">{d.scope}</span>
              </div>
              <div className="guide-division-name">{d.key}</div>
              <div className="guide-division-orgs">
                {d.organizations.split(/[,、]/).slice(0, 4).map((o) => (
                  <span key={o} className="guide-division-org">
                    {o.trim()}
                  </span>
                ))}
              </div>
              <div className="guide-division-rows">
                <div className="guide-division-row">
                  <div className="guide-division-row-label">평가 핵심</div>
                  <div className="guide-division-row-val">
                    {d.judgingPoints[0]}
                  </div>
                </div>
                <div className="guide-division-row">
                  <div className="guide-division-row-label">출전 전 확인</div>
                  <div className="guide-division-row-val">
                    {d.checkpoints[0]}
                  </div>
                </div>
              </div>
              <div className="guide-division-caution">{d.caution}</div>
              <Link
                href={`/competitions?cat=${encodeURIComponent(d.key)}`}
                className="guide-division-cta"
                prefetch={false}
                style={{ color: ACCENT }}
              >
                {d.key} 대회 보기 →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 2. Federation route cards ────────────────────────────────────────
function GuideFederationSection() {
  return (
    <section id="federations" className="guide-federation-section">
      <div className="container">
        <div className="guide-federation-head">
          <div>
            <SectionEyebrow
              index={2}
              en="Guide 02 · By Federation"
              kr="단체별 출전 루트"
            />
            <h2 className="guide-section-h2">
              단체를 고르면{" "}
              <em style={{ color: ACCENT, fontStyle: "italic" }}>출전 루트</em>가
              보입니다.
            </h2>
            <p className="guide-federation-sub">
              같은 종목이라도 단체별로 평가 기준·도핑 정책·프로 진출 경로가
              다릅니다.
            </p>
          </div>
          <Link
            href="/competitions"
            className="guide-cta-btn guide-cta-btn--outline"
            prefetch={false}
          >
            전체 단체 보기 →
          </Link>
        </div>
        <div className="guide-federation-list">
          {FEDERATION_ROUTES.map((f) => (
            <div key={f.title} className="guide-fed-card">
              {/* Route badge */}
              <div
                className="guide-fed-badge"
                style={{ background: f.bg }}
              >
                <div
                  className="guide-fed-badge-text mono"
                  style={{ color: f.color }}
                >
                  {f.routeBadge}
                </div>
                <div
                  className="guide-fed-route-label mono"
                  style={{ color: f.color }}
                >
                  {f.routeShort}
                </div>
              </div>
              {/* Main */}
              <div className="guide-fed-main">
                <div className="guide-fed-title">{f.title}</div>
                <div className="guide-fed-subtitle">{f.subtitle}</div>
                <div className="guide-fed-body">{f.body}</div>
                <div className="guide-fed-detail-grid">
                  {[
                    ["종목 명칭", f.divisionTerms],
                    ["심사 기준", f.judging],
                    ["도핑 정책", f.doping],
                    ["프로/대표 루트", f.route],
                  ].map(([k, v]) => (
                    <div key={k} className="guide-fed-detail">
                      <div className="guide-fed-detail-label">{k}</div>
                      <div className="guide-fed-detail-val">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right */}
              <div className="guide-fed-right">
                <div>
                  <div className="guide-fed-orgs-label">주요 단체</div>
                  <div className="guide-fed-orgs">
                    {f.orgs.map((o) => (
                      <span key={o} className="guide-fed-org">{o}</span>
                    ))}
                  </div>
                </div>
                <div className="guide-fed-count-row">
                  <div className="guide-fed-count">
                    {f.count}
                    <span className="guide-fed-count-unit"> 개 대회</span>
                  </div>
                  <Link
                    href={f.ctaHref}
                    className="guide-cta-btn guide-cta-btn--sm"
                    prefetch={false}
                  >
                    {f.ctaLabel} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main export ──────────────────────────────────────────────────────
export function GuideView() {
  return (
    <main className="guide-page">
      <GuideDivisionSection />
      <GuideFederationSection />
    </main>
  );
}
