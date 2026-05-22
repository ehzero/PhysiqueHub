"use client";

import { Competition } from "@/lib/data";
import { Icons } from "./Icons";
import { CompRow } from "./CompRow";

interface SavedViewProps {
  comps: Competition[];
  saved: string[];
  toggleSave: (id: string) => void;
  openComp: (c: Competition) => void;
  setRoute: (r: string) => void;
}

export function SavedView({ comps, saved, toggleSave, openComp, setRoute }: SavedViewProps) {
  return (
    <main>
      <section className="page-head">
        <div className="container">
          <h1 className="page-title">
            내 대회
          </h1>
          <p className="page-subtitle">관심 대회를 모아 시즌 일정을 관리하세요.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {comps.length === 0 ? (
            <div
              style={{
                padding: "120px 20px",
                textAlign: "center",
                border: "1px dashed var(--line-soft)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 12 }}>EMPTY</div>
              <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                저장한 대회가 아직 없습니다.
              </p>
              <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 24 }}>
                대회 카드의 북마크 아이콘을 눌러 저장하세요.
              </p>
              <button className="cta-btn" onClick={() => setRoute("list")}>
                대회 찾아보기 {Icons.arrow}
              </button>
            </div>
          ) : (
            <div className="comp-list">
              {comps.map((c) => (
                <CompRow
                  key={c.id}
                  comp={c}
                  onOpen={openComp}
                  isSaved={true}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
