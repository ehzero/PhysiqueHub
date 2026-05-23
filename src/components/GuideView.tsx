import Link from "next/link";
import { CATEGORY_GUIDE } from "@/lib/data";
import { Icons } from "./Icons";
import { PageHeader, PageMain, PageSection } from "./PageLayout";

export function GuideView() {
  return (
    <PageMain>
      <PageHeader
        title="종목 가이드"
        subtitle="종목별 평가 기준과 준비 포인트를 확인하세요."
        titleClassName="page-title-narrow"
      />
      <PageSection>
        <ol className="guide-list">
          {CATEGORY_GUIDE.map((g, i) => (
            <li key={g.key} className="guide-item">
              <span className="mono guide-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="guide-title">{g.key}</h3>
                <p className="guide-desc">{g.desc}</p>
              </div>
              <span className="pick-tag guide-level">
                {g.level}
              </span>
            </li>
          ))}
        </ol>
        <div className="guide-actions">
          <Link className="cta-btn accent" href="/competitions">
            내 종목 대회 찾아보기 {Icons.arrow}
          </Link>
        </div>
      </PageSection>
    </PageMain>
  );
}
