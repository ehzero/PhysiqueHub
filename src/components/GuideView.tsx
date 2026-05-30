"use client";

import { useState, useEffect, useRef } from "react";
import { CATEGORY_GUIDE } from "@/lib/data";
import { Icons } from "./Icons";
import { Intro, SegmentLink, StickyControlBar } from "./UIPrimitives";

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
    name: "NPC Worldwide / IFBB Pro",
    scope: "프로카드·글로벌 프로 리그 루트",
    desc: "NPC Worldwide와 IFBB Pro 축은 리저널, 프로 퀄리파이어, 프로카드 흐름을 중심으로 대회를 비교합니다.",
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

const CAUTION_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
);

function AccordionItem({
  title,
  scope,
  body,
  open,
  onToggle,
}: {
  title: string;
  scope: string;
  body: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`acc-item${open ? " is-open" : ""}`}>
      <button
        className="acc-head"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="acc-head-main">
          <div className="acc-title">{title}</div>
          <div className="acc-scope">{scope}</div>
        </span>
        <span className="acc-chev">{Icons.chevronDown}</span>
      </button>
      <div className={`acc-body${open ? "" : " is-collapsed"}`} aria-hidden={!open}>
        {body}
      </div>
    </div>
  );
}

function DivisionBody({ guide }: { guide: typeof CATEGORY_GUIDE[0] }) {
  return (
    <>
      <p className="g-lead">{guide.desc}</p>
      <div className="g-meta">
        <span className="g-meta-chip"><b>구분</b> · {guide.scope}</span>
        <span className="g-meta-chip"><b>주요 단체</b> · {guide.organizations}</span>
      </div>
      <div className="g-cols">
        <div>
          <div className="g-block-head">심사 포인트</div>
          <ul className="g-list">
            {guide.judgingPoints.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
        <div>
          <div className="g-block-head">준비 체크리스트</div>
          <ul className="g-list is-check">
            {guide.checkpoints.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
      <div className="g-caution">
        {CAUTION_SVG}
        <span><b>주의</b> · {guide.caution}</span>
      </div>
    </>
  );
}

function OrgBody({ org }: { org: typeof ORGANIZATION_GUIDE[0] }) {
  return (
    <>
      <p className="g-lead">{org.desc}</p>
      <div className="g-cols-1">
        <div>
          <div className="g-block-head">출전 전 확인 포인트</div>
          <ul className="g-list">
            {org.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </>
  );
}

export function GuideView() {
  const allAccordionKeys = [
    ...CATEGORY_GUIDE.map((_, i) => `division:${i}`),
    ...ORGANIZATION_GUIDE.map((_, i) => `organization:${i}`),
  ];
  const initialOpenKeys = ["division:0", "organization:0"];
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    () => new Set(initialOpenKeys),
  );
  const allOpen = openKeys.size === allAccordionKeys.length;
  const divRef = useRef<HTMLElement>(null);
  const orgRef = useRef<HTMLElement>(null);
  const tabDivRef = useRef<HTMLAnchorElement>(null);
  const tabOrgRef = useRef<HTMLAnchorElement>(null);

  // Sync active tab on scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 150;
      const orgTop = orgRef.current?.offsetTop ?? 0;
      const isOrg = orgTop <= y;
      tabDivRef.current?.classList.toggle("is-active", !isOrg);
      tabOrgRef.current?.classList.toggle("is-active", isOrg);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleAccordion(key: string) {
    setOpenKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function toggleAll() {
    setOpenKeys(() =>
      allOpen ? new Set() : new Set(allAccordionKeys),
    );
  }

  return (
    <main className="ph-page-surface">
      {/* Page head */}
      <div className="g-page-container g-head">
        <Intro
          eyebrow="가이드 · Guide"
          title="대회를 준비하기 전에."
          description={
            <>
              종목과 단체에 따라 복장·포징·심사 기준과 출전 자격이 다릅니다.
              종목별·단체별 핵심 차이를 먼저 확인하고, 세부 규정과 일정은 각 단체·주최측 공식 공지를 함께 확인하세요.
            </>
          }
          level={1}
          variant="page"
          classNames={{
            eyebrow: "g-eyebrow",
            title: "g-title",
            description: "g-sub",
          }}
        />
      </div>

      {/* Sticky tabs */}
      <StickyControlBar className="g-tabs" containerClassName="g-tabs-row">
          <SegmentLink
            ref={tabDivRef}
            className="g-tab"
            href="#division"
            variant="neutral"
            active
          >
            종목별 가이드
          </SegmentLink>
          <SegmentLink
            ref={tabOrgRef}
            className="g-tab"
            href="#organization"
            variant="neutral"
          >
            단체별 가이드
          </SegmentLink>
          <button
            className="g-expand-btn"
            onClick={toggleAll}
          >
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
      </StickyControlBar>

      {/* Content */}
      <div className="g-page-container g-foot-pad">
        {/* Division section */}
        <span id="divisions" className="guide-hub-legacy-anchor" aria-hidden="true" />
        <span id="categories" className="guide-hub-legacy-anchor" aria-hidden="true" />
        <section
          ref={divRef}
          id="division"
          className="g-section"
        >
          <div className="g-section-eyebrow">By Division</div>
          <h2 className="g-section-title">종목별 가이드</h2>
          <p className="g-section-desc">
            맨즈 피지크·클래식 피지크·비키니·웰니스 등 주요 종목의 심사 포인트와 준비 체크리스트를 정리했습니다.
          </p>
          <div>
            {CATEGORY_GUIDE.map((guide, i) => (
              <AccordionItem
                key={guide.key}
                title={guide.key}
                scope={guide.scope}
                open={openKeys.has(`division:${i}`)}
                onToggle={() => toggleAccordion(`division:${i}`)}
                body={<DivisionBody guide={guide} />}
              />
            ))}
          </div>
        </section>

        {/* Organization section */}
        <span id="federations" className="guide-hub-legacy-anchor" aria-hidden="true" />
        <span id="organizations" className="guide-hub-legacy-anchor" aria-hidden="true" />
        <section
          ref={orgRef}
          id="organization"
          className="g-section"
        >
          <div className="g-section-eyebrow">By Organization</div>
          <h2 className="g-section-title">단체별 가이드</h2>
          <p className="g-section-desc">
            KBBF·IFBB Pro·NABBA·내추럴 단체 등 단체별 출전 루트와 규정 차이를 비교해보세요. 같은 종목명이라도 단체별로 기준이 다를 수 있습니다.
          </p>
          <div>
            {ORGANIZATION_GUIDE.map((org, i) => (
              <AccordionItem
                key={org.name}
                title={org.name}
                scope={org.scope}
                open={openKeys.has(`organization:${i}`)}
                onToggle={() => toggleAccordion(`organization:${i}`)}
                body={<OrgBody org={org} />}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
