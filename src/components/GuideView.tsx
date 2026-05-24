import Link from "next/link";
import { CATEGORY_GUIDE } from "@/lib/data";
import { Icons } from "./Icons";

const A = "#B85C3C";
const MUTE = "#86827C";
const FAINT = "#E8E5DE";
const PAPER = "#F7F5F0";

const FIRST_COMPETITION_STEPS = [
  {
    title: "종목부터 좁히기",
    body: "현재 체형, 준비 기간, 포징 경험, 선호 무대 이미지를 기준으로 1순위 종목과 후보 종목을 분리합니다.",
    checks: [
      "근육량보다 라인이 강점이면 피지크·비키니·모델형 종목부터 검토",
      "컨디셔닝과 필수 포즈가 준비되어 있으면 보디빌딩 계열 검토",
      "신장·체중 제한이 있는 종목은 계측 기준을 먼저 확인",
    ],
  },
  {
    title: "첫 대회 난도 정하기",
    body: "입문자는 규모가 큰 메인 대회보다 루키, 노비스, 지역 대회, 내추럴 대회처럼 진입 장벽이 낮은 루트를 우선 비교합니다.",
    checks: [
      "루키·노비스 기준이 출전 경력인지 입상 경력인지 확인",
      "동일 시즌 중복 출전 제한이 있는지 확인",
      "도핑 테스트 정책과 출전 자격을 접수 전에 확인",
    ],
  },
  {
    title: "접수와 준비물 관리",
    body: "접수 마감, 계측 시간, 복장 규정, 음악 제출, 탄·오일 정책은 대회마다 다릅니다. 공식 참가요강을 기준으로 체크리스트를 만듭니다.",
    checks: [
      "접수비, 환불 기준, 종목 추가 비용 확인",
      "신분증, 선수 등록, 음악 파일, 복장·슈즈 규정 확인",
      "계측·리허설·무대 시간표를 하루 전 다시 확인",
    ],
  },
  {
    title: "무대 당일 동선 잡기",
    body: "첫 출전에서는 컨디션보다 동선 실수가 더 크게 흔들릴 수 있습니다. 이동, 탄 작업, 펌핑, 대기 구역 시간을 보수적으로 잡습니다.",
    checks: [
      "도착 시간은 계측·탄·주차 변수를 포함해 여유 있게 설정",
      "펌핑 도구, 수분·나트륨, 간식, 여벌 복장 준비",
      "호명 순서와 백스테이지 안내를 계속 확인",
    ],
  },
];

const FIRST_COMPETITION_DECISIONS = [
  ["준비 기간", "12~20주 안에 무리 없이 컨디션을 만들 수 있는지 확인"],
  ["대회 성격", "입문 친화, 내추럴, 지역 대회, 프로 퀄리파이어 여부 확인"],
  ["비용", "접수비, 탄, 의상, 포징, 이동·숙박 비용까지 합산"],
  ["룰북", "복장, 계측, 포즈, 중복 출전, 도핑 정책을 공식 문서로 확인"],
];

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
    name: "NPC / IFBB Pro League",
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
    name: "Musclemania / WBFF 등 쇼케이스형 대회",
    scope: "피트니스 모델·무대 표현 중심",
    desc: "근육 완성도만큼 이미지, 워킹, 스타일링, 무대 장악력을 강하게 보는 대회가 많습니다.",
    points: [
      "라운드별 의상과 콘셉트 준비",
      "피지크 평가와 모델성 평가의 비중 확인",
      "사진·영상 활용 목적과 참가자 권리 고지 확인",
    ],
  },
];

export function GuideView() {
  return (
    <main className="hub-page guide-hub-page">
      <FirstCompetitionSection />
      <CategoriesSection />
      <OrganizationsSection />
    </main>
  );
}

function FirstCompetitionSection() {
  return (
    <section
      id="first-competition"
      className="hub-section guide-hub-anchor"
      style={{ background: PAPER, borderBottom: `1px solid ${FAINT}` }}
    >
      <div className="container">
        <SectionHead
          eyebrow="Guide 01 · First Stage"
          title="첫 출전은 대회 선택이 절반입니다."
          body="처음 출전할 때는 몸을 만드는 일만큼, 내 종목과 단체, 접수 조건을 정확히 고르는 일이 중요합니다."
          titleTag="h1"
        />
        <div className="guide-hub-step-list">
          {FIRST_COMPETITION_STEPS.map((step, index) => (
            <article className="guide-hub-step" key={step.title}>
              <div className="guide-hub-step-num mono">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </div>
              <ul>
                {step.checks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="guide-hub-subblock">
          <SectionHead
            eyebrow="Decision Points"
            title="접수 전 마지막 네 가지."
            body="대회 상세 페이지를 볼 때 이 네 줄만 먼저 확인해도 ‘나에게 맞는 대회인지’ 빠르게 걸러낼 수 있습니다."
          />
          <div className="guide-hub-tiles">
            {FIRST_COMPETITION_DECISIONS.map(([title, body]) => (
              <article className="guide-hub-tile" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <GuideCta href="/competitions/types/rookie" label="첫 대회 후보 찾아보기" />
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section
      id="categories"
      className="hub-section guide-hub-anchor"
      style={{ background: "#fff" }}
    >
      <div className="container">
        <SectionHead
          eyebrow="Guide 02 · By Division"
          title="종목은 이름보다 기준으로 비교하세요."
          body="같은 종목명이라도 단체별로 체급, 복장, 포즈, 평가 비중이 달라질 수 있습니다. 각 항목을 열어 평가 핵심과 확인 포인트를 비교하세요."
        />
        <div className="guide-hub-accordion">
          {CATEGORY_GUIDE.map((guide, index) => (
            <details className="guide-hub-item" key={guide.key}>
              <summary>
                <span className="guide-hub-item-num mono">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="guide-hub-item-copy">
                  <strong>{guide.key}</strong>
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
      id="organizations"
      className="hub-section hub-section-last guide-hub-anchor"
      style={{ background: PAPER }}
    >
      <div className="container">
        <SectionHead
          eyebrow="Guide 03 · By Federation"
          title="단체를 고르면 출전 루트가 보입니다."
          body="단체마다 종목명, 심사 기준, 도핑 정책, 프로카드 또는 국가대표 루트가 다릅니다. 같은 대회처럼 보여도 준비 전략은 달라질 수 있습니다."
        />
        <div className="guide-hub-org-grid">
          {ORGANIZATION_GUIDE.map((org) => (
            <article className="guide-hub-org-card hub-lift-card" key={org.name}>
              <div className="guide-hub-org-scope">{org.scope}</div>
              <h2>{org.name}</h2>
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
            <h2 className="hub-h2">단체 선택은 목표 역산입니다.</h2>
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
