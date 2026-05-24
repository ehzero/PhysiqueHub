"use client";

import Link from "next/link";
import { Competition } from "@/lib/data";
import { Icons } from "./Icons";
import { CompRow } from "./CompRow";
import { EmptyState, PageHeader, PageMain, PageSection } from "./PageLayout";

interface SavedViewProps {
  comps: Competition[];
  toggleSave: (id: string) => void;
  openComp: (c: Competition) => void;
  today: Date | null;
}

export function SavedView({
  comps,
  toggleSave,
  openComp,
  today,
}: SavedViewProps) {
  return (
    <PageMain>
      <PageHeader
        title="내 대회"
        subtitle="관심 대회를 모아 시즌 일정을 관리하세요."
      />
      <PageSection>
        {comps.length === 0 ? (
          <EmptyState
            eyebrow="EMPTY"
            title="저장한 대회가 아직 없습니다."
            description="대회 카드의 북마크 아이콘을 눌러 저장하세요."
            spacious
            action={
              <Link className="cta-btn" href="/competitions" prefetch>
                대회 찾아보기 {Icons.arrow}
              </Link>
            }
          />
        ) : (
          <div className="comp-list">
            {comps.map((c) => (
              <CompRow
                key={c.id}
                comp={c}
                onOpen={openComp}
                isSaved={true}
                onToggleSave={toggleSave}
                today={today}
              />
            ))}
          </div>
        )}
      </PageSection>
    </PageMain>
  );
}
