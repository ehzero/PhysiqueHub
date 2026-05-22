"use client";

import { CATEGORY_GUIDE } from "@/lib/data";
import { Icons } from "./Icons";

interface GuideViewProps {
  setRoute: (r: string) => void;
}

export function GuideView({ setRoute }: GuideViewProps) {
  return (
    <main>
      <section className="page-head">
        <div className="container">
          <h1 className="page-title" style={{ maxWidth: 560 }}>
            종목 가이드
          </h1>
          <p className="page-subtitle">종목별 평가 기준과 준비 포인트를 확인하세요.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ol style={{ display: "grid", gap: 0 }}>
            {CATEGORY_GUIDE.map((g, i) => (
              <li
                key={g.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 160px",
                  gap: 24,
                  padding: "32px 0",
                  borderBottom: "1px solid var(--line-soft)",
                  alignItems: "start",
                }}
              >
                <span className="mono" style={{ fontSize: 14, color: "var(--ink-3)", paddingTop: 8 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
                    {g.key}
                  </h3>
                  <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 640 }}>
                    {g.desc}
                  </p>
                </div>
                <span className="pick-tag" style={{ justifySelf: "end", whiteSpace: "nowrap" }}>
                  {g.level}
                </span>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 48, textAlign: "center" }}>
            <button className="cta-btn accent" onClick={() => setRoute("list")}>
              내 종목 대회 찾아보기 {Icons.arrow}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
