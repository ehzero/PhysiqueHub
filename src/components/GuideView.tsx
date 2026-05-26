import Link from "next/link";
import { CATEGORY_GUIDE } from "@/lib/data";
import { Icons } from "./Icons";

const A = "#B85C3C";
const MUTE = "#86827C";
const FAINT = "#E8E5DE";
const PAPER = "#F7F5F0";

const ORGANIZATION_GUIDE = [
  {
    name: "KBBF / IFBB International",
    scope: "국내 협회·아마추어 국제 루트",
    desc: "대한보디빌딩협회와 IFBB International 축은 전국체전, 국가대표, 아마추어 국제대회 흐름을 이해하는 것이 중요합니다.",
    points: [
      "협회 등록, 지역·전국 단위 대회 구조 확인",
      "체급, 계측, 선수 자격, 국가대표 선발 기준 확인",
      "국내 민간 대회와 종목명·심사 기준이 다를 수 있음",
    ],
  },
  {
    name: "NPC Worldwide / IFBB Pro League",
    scope: "프로카드·글로벌 프로 리그 루트",
    desc: "NPC Worldwide와 IFBB Pro League 축은 리저널, 프로 퀄리파이어, 프로카드 흐름을 중심으로 대회를 비교합니다.",
    points: [
      "리저널 출전 필요 여부와 프로 퀄리파이어 자격 확인",
      "212, 클래식 피지크, 맨즈 피지크 등 디비전별 운영 여부 확인",
      "해외 출전 시 등록, 비자, 일정, 계측 기준을 조기 확인",
    ],
  },
  {
    name: "NABBA / PCA / WFF 계열",
    scope: "민간 피트니스 대회·모델형 종목",
    desc: "국내 민간 대회에서는 스포츠모델, 피트니스모델, 클래식 계열처럼 단체별 색이 강한 종목이 자주 운영됩니다.",
    points: [
      "종목명이 같아도 복장·포징·평가 비중이 다를 수 있음",
      "그랑프리, 오버롤, 프로전 연결 구조 확인",
      "라운드 구성과 무대 연출 기준 확인",
    ],
  },
  {
    name: "WNBF / ICN / OCB 등 내추럴 단체",
    scope: "내추럴·도핑 테스트 중심",
    desc: "내추럴 단체는 출전 자격, 금지 약물 기간, 검사 방식, 이의 제기 절차를 먼저 확인해야 합니다.",
    points: [
      "폴리그래프, 소변 검사 등 테스트 방식 확인",
      "금지 약물 기간과 치료 목적 예외 정책 확인",
      "내추럴 인증이 필요한 사진·문서 제출 여부 확인",
    ],
  },
  {
    name: "Musclemania / WBFF 등 민간 피트니스·모델형",
    scope: "내추럴·쇼케이스 성격은 단체별 확인",
    desc: "피트니스 모델, 무대 표현, 브랜드별 심사 색이 강한 대회입니다. Musclemania처럼 내추럴 검사를 안내하는 브랜드와 WBFF처럼 패션·런웨이 성격을 강조하는 브랜드가 섞여 있어 공식 룰을 따로 확인하세요.",
    points: [
      "라운드별 의상과 콘셉트 준비",
      "검사·내추럴 여부와 모델성 평가 비중 확인",
      "사진·영상 활용 목적과 참가자 권리 고지 확인",
    ],
  },
];

export function GuideView() {
  return (
    <main className="hub-page guide-hub-page">
      <CategoriesSection />
      <OrganizationsSection />
    </main>
  );
}

function CategoriesSection() {
  return (
    <section
      id="divisions"
      className="hub-section guide-hub-anchor"
      style={{ background: "#fff" }}
    >
      <span id="categories" className="guide-hub-legacy-anchor" aria-hidden="true" />
      <div className="container">
        <SectionHead
          eyebrow="Guide 01 · By Division"
          title="종목은 이름보다 기준으로 비교하세요."
          body="같은 종목명이라도 단체별로 체급, 복장, 포즈, 평가 비중이 달라질 수 있습니다. 각 항목을 열어 평가 핵심과 확인 포인트를 비교하세요."
          titleTag="h1"
        />
        <div className="guide-hub-accordion">
          {CATEGORY_GUIDE.map((guide, index) => (
            <details className="guide-hub-item" key={guide.key}>
              <summary>
                <span className="guide-hub-item-num mono">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="guide-hub-item-copy">
                  <h2>{guide.key}</h2>
                  <span>{guide.desc}</span>
                </span>
                <span className="guide-hub-item-icon">{Icons.chevronDown}</span>
              </summary>
              <div className="guide-hub-item-panel">
                <div className="guide-hub-meta">
                  <div>
                    <span>분류</span>
                    <strong>{guide.scope}</strong>
                  </div>
                  <div>
                    <span>주요 운영 단체</span>
                    <strong>{guide.organizations}</strong>
                  </div>
                </div>
                <div className="guide-hub-detail-grid">
                  <GuidePointList title="평가 핵심" items={guide.judgingPoints} />
                  <GuidePointList title="출전 전 확인" items={guide.checkpoints} />
                </div>
                <p className="guide-hub-caution">{guide.caution}</p>
              </div>
            </details>
          ))}
        </div>
        <GuideCta href="/competitions/categories/mens-physique" label="내 종목 대회 찾아보기" />
      </div>
    </section>
  );
}

function OrganizationsSection() {
  return (
    <section
      id="federations"
      className="hub-section hub-section-last guide-hub-anchor"
      style={{ background: PAPER, borderTop: `1px solid ${FAINT}` }}
    >
      <span id="organizations" className="guide-hub-legacy-anchor" aria-hidden="true" />
      <div className="container">
        <SectionHead
          eyebrow="Guide 02 · By Federation"
          title="단체를 고르면 출전 루트가 보입니다."
          body="단체마다 종목명, 심사 기준, 도핑 정책, 프로카드 또는 국가대표 루트가 다릅니다. 같은 대회처럼 보여도 준비 전략은 달라질 수 있습니다."
        />
        <div className="guide-hub-org-grid">
          {ORGANIZATION_GUIDE.map((org) => (
            <article className="guide-hub-org-card hub-lift-card" key={org.name}>
              <div className="guide-hub-org-scope">{org.scope}</div>
              <h3>{org.name}</h3>
              <p>{org.desc}</p>
              <ul>
                {org.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="guide-hub-band">
          <div>
            <div className="hub-eyebrow" style={{ color: A }}>
              Practical Rule
            </div>
            <h3 className="hub-h2">단체 선택은 목표 역산입니다.</h3>
          </div>
          <p>
            프로카드가 목표인지, 내추럴 인증이 중요한지, 전국체전·국가대표
            루트가 필요한지에 따라 같은 종목도 적합한 단체가 달라집니다.
            접수 전에는 공식 룰북, 출전 자격, 도핑 정책, 종목 운영 여부를
            반드시 함께 확인하세요.
          </p>
        </div>
        <GuideCta href="/competitions/organizations/ifbb" label="단체별 대회 찾아보기" />
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  body,
  titleTag = "h2",
}: {
  eyebrow: string;
  title: string;
  body: string;
  titleTag?: "h1" | "h2";
}) {
  const TitleTag = titleTag;

  return (
    <div className="hub-section-head">
      <div>
        <div className="hub-eyebrow" style={{ color: A }}>
          {eyebrow}
        </div>
        <TitleTag className="hub-h2">{title}</TitleTag>
        <p className="hub-section-body" style={{ color: MUTE }}>
          {body}
        </p>
      </div>
    </div>
  );
}

function GuidePointList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function GuideCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="guide-hub-actions">
      <Link href={href} className="hub-btn-dark" prefetch={false}>
        {label} {Icons.arrow}
      </Link>
    </div>
  );
}
