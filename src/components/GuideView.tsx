import Link from "next/link";
import { CATEGORY_GUIDE } from "@/lib/data";
import { Icons } from "./Icons";
import { PageHeader, PageMain, PageSection } from "./PageLayout";

export function GuideView() {
  return (
    <PageMain>
      <PageHeader
        title="종목 가이드"
        subtitle="단체별 종목명과 심사 기준의 차이를 열어보고 비교하세요."
        titleClassName="page-title-narrow"
      />
      <PageSection>
        <div className="guide-context">
          <p className="eyebrow">Division Context</p>
          <p>
            같은 종목명이라도 IFBB Pro/NPC, IFBB International/KBBF, NABBA,
            PCA, WBFF, 국내 민간 대회가 적용하는 체급, 복장, 포즈, 도핑 정책은
            다를 수 있습니다. 최종 출전 판단은 반드시 대회별 공식 룰북과
            참가요강을 기준으로 확인하세요.
          </p>
        </div>

        <div className="guide-list">
          {CATEGORY_GUIDE.map((g, i) => (
            <details key={g.key} className="guide-item">
              <summary className="guide-summary">
                <span className="mono guide-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="guide-heading">
                  <span className="guide-title">{g.key}</span>
                  <span className="guide-desc">{g.desc}</span>
                </span>
                <span className="guide-toggle" aria-hidden="true">
                  <span className="guide-toggle-closed">{Icons.chevronDown}</span>
                  <span className="guide-toggle-open">{Icons.chevronUp}</span>
                </span>
              </summary>

              <div className="guide-panel">
                <dl className="guide-meta">
                  <div>
                    <dt>분류</dt>
                    <dd>{g.scope}</dd>
                  </div>
                  <div>
                    <dt>주요 운영 단체</dt>
                    <dd>{g.organizations}</dd>
                  </div>
                </dl>

                <div className="guide-detail-grid">
                  <section>
                    <h4>평가 핵심</h4>
                    <ul>
                      {g.judgingPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4>출전 전 확인</h4>
                    <ul>
                      {g.checkpoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <p className="guide-caution">
                  {g.caution}
                </p>
              </div>
            </details>
          ))}
        </div>
        <div className="guide-actions">
          <Link className="cta-btn accent" href="/competitions">
            내 종목 대회 찾아보기 {Icons.arrow}
          </Link>
        </div>
      </PageSection>
    </PageMain>
  );
}
