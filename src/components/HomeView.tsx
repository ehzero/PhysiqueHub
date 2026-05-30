"use client";

import Link from "next/link";
import {
  Children,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getCompetitionPath } from "@/lib/competition-slug";
import type { Competition } from "@/lib/data";
import { regStatusAt, CATEGORY_GUIDE } from "@/lib/data";
import type { HomeHubData, HomeExploreType } from "@/lib/home-hub";
import { getOrganizationDisplayName } from "@/lib/organization-display";
import {
  ActionButton,
  Intro,
  SectionBlock,
  StatusPill,
} from "./UIPrimitives";

const EXPLORE_AXIS_VISIBLE_COUNT = 8;
const COUNT_UP_DURATION_MS = 900;

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

function cssVars(vars: Record<`--${string}`, string | number>): CSSVars {
  return vars;
}

const DOWS = ["일", "월", "화", "수", "목", "금", "토"];

function parseDateStr(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    year: y,
    month: m,
    day: d,
    monthKo: `${m}월`,
    dow: DOWS[date.getDay()] ?? "",
  };
}

function daysUntil(dateStr: string, today: Date): number {
  if (!dateStr) return 0;
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}

function CountUpNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (shouldReduceMotion || value <= 1) {
      return;
    }

    let frameId = 0;
    const startValue = 1;

    function tick(startsAt: number, now: number) {
      const progress = Math.min((now - startsAt) / COUNT_UP_DURATION_MS, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextValue = Math.round(startValue + (value - startValue) * eased);

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame((nextNow) => tick(startsAt, nextNow));
      }
    }

    frameId = requestAnimationFrame((startsAt) => {
      setDisplayValue(startValue);
      frameId = requestAnimationFrame((now) => tick(startsAt, now));
    });

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{displayValue.toLocaleString("ko-KR")}</>;
}

function getCategoryLabel(name: string): string {
  if (name === "피지크") return "맨즈 피지크";
  return name;
}

function getOrganizationLabel(organization: {
  id: string;
  name: string;
  shortName?: string | null;
}): string {
  const displayName = getOrganizationDisplayName(organization);

  if (
    organization.id === "kbbf" ||
    organization.name === "대한보디빌딩협회" ||
    organization.shortName === "KBBF"
  ) {
    return "대한보디빌딩협회(KBBF)";
  }

  return displayName;
}

function EmptyMessage({
  children,
  fillColumn = false,
}: {
  children: ReactNode;
  fillColumn?: boolean;
}) {
  return (
    <div className={`hub-empty-message${fillColumn ? " is-grid-wide" : ""}`}>
      {children}
    </div>
  );
}

// ── Entry point ────────────────────────────────────────────────────
interface HomeViewProps {
  data: HomeHubData;
  today: Date | null;
}

export function HomeView({ data, today }: HomeViewProps) {
  const effectiveToday = today ?? new Date(data.today);

  return (
    <main className="hub-page">
      <HeroSection stats={data.stats} today={effectiveToday} />
      <ExploreSection
        categories={data.exploreCategories}
        types={data.exploreTypes}
        regions={data.exploreRegions}
        organizations={data.exploreOrganizations}
      />
      <MajorsSection majors={data.globalMajors} today={effectiveToday} />
      <UpcomingSection items={data.upcoming} today={effectiveToday} />
      <RookieSection items={data.rookieFriendly} today={effectiveToday} />
      <GuideSection />
    </main>
  );
}

// ── Hero ───────────────────────────────────────────────────────────
function HeroSection({
  stats,
  today,
}: {
  stats: HomeHubData["stats"];
  today: Date;
}) {
  const year = today.getFullYear();
  const nd = stats.nextShow ? parseDateStr(stats.nextShow.date) : null;
  const days = stats.nextShow ? daysUntil(stats.nextShow.date, today) : null;

  return (
    <SectionBlock tone="paper" bordered>
      <div className="container">
        <div className="hub-hero-grid">
          {/* Copy */}
          <div>
            <div className="hub-eyebrow hub-hero-eyebrow">
              ● {year} 시즌 · Asia/Seoul
            </div>
            <h1 className="hub-h1">
              국내 보디빌딩·피트니스
              <br />
              대회 일정을 <span className="ph-accent-text">한눈에.</span>
            </h1>
            <p className="hub-body hub-hero-body">
              국내 대회를 중심으로, 주요 단체의 보디빌딩·피트니스 대회 일정을
              한곳에 모았습니다. 종목·유형·지역·단체별로 빠르게 탐색하고, Mr.
              Olympia와 Arnold Classic 등 주요 해외 무대 일정도 함께 확인할 수
              있습니다.
            </p>
            <div className="hub-hero-actions">
              <ActionButton
                href="/competitions"
                variant="primary"
                prefetch={false}
              >
                전체 보디빌딩·피트니스 대회 일정 →
              </ActionButton>
              <ActionButton
                href="/guide#division"
                variant="outline"
                prefetch={false}
              >
                종목별 가이드 보기
              </ActionButton>
            </div>
          </div>

          {/* Stat card */}
          <div className="hub-stat-card">
            <div className="hub-stat-label">
              This Season · 한눈에
            </div>
            <div className="hub-stat-grid">
              {[
                {
                  label: "전체 대회",
                  value: stats.totalShows,
                },
                {
                  label: "예정 대회",
                  value: stats.upcomingShows,
                },
                {
                  label: "국내 대회(예정)",
                  value: stats.domesticShows,
                },
                {
                  label: "주요 국제 대회(예정)",
                  value: stats.majorShows,
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="hub-stat-cell-label">{label}</div>
                  <div className="hub-stat-num">
                    <CountUpNumber value={value} />
                  </div>
                </div>
              ))}
            </div>
            {nd && days !== null && (
              <div className="hub-stat-next">
                <div className="hub-stat-cell-label">
                  다음 대회
                </div>
                <div className="hub-stat-next-stack">
                  <div className="hub-stat-next-title">
                    {stats.nextShow?.title} · {nd.monthKo} {nd.day}일
                  </div>
                  <div className="hub-stat-countdown mono">
                    D−{days}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionBlock>
  );
}

// ── Explore ────────────────────────────────────────────────────────
interface ExploreSectionProps {
  categories: Array<{ name: string; href: string; count: number }>;
  types: HomeExploreType[];
  regions: Array<{ name: string; count: number; href: string }>;
  organizations: Array<{
    id: string;
    name: string;
    shortName?: string | null;
    count: number;
    href: string;
  }>;
}

function ExploreSection({
  categories,
  types,
  regions,
  organizations,
}: ExploreSectionProps) {
  return (
    <SectionBlock tone="elev">
      <div className="container">
        <Intro
          eyebrow="02 · 빠른 탐색"
          title="원하는 기준으로 찾아보세요."
          description="종목, 유형, 지역, 단체별로 대회 일정을 빠르게 탐색할 수 있습니다."
          action={{
            href: "/competitions",
            label: "전체 보디빌딩·피트니스 대회 일정 →",
          }}
        />

        <div className="hub-explore-grid">
          {/* 종목별 */}
          <ExploreAxis title="종목별 대회" subtitle="By Division">
            {categories.map((c) => (
              <ExploreRow
                key={c.name}
                href={c.href}
                label={getCategoryLabel(c.name)}
                count={c.count}
              />
            ))}
          </ExploreAxis>

          {/* 유형별 */}
          <ExploreAxis title="유형별 대회" subtitle="By Type">
            {types.map((t) => (
              <ExploreRow
                key={t.key}
                href={t.href}
                label={t.kr}
                hint={t.hint}
                count={t.count}
              />
            ))}
          </ExploreAxis>

          {/* 지역별 */}
          <ExploreAxis title="지역별 대회" subtitle="By Region">
            {regions.map((r) => (
              <ExploreRow
                key={r.name}
                href={r.href}
                label={r.name}
                count={r.count}
              />
            ))}
          </ExploreAxis>

          {/* 단체별 */}
          <ExploreAxis title="단체별 대회" subtitle="By Organization">
            {organizations.map((o) => (
              <ExploreRow
                key={o.id}
                href={o.href}
                label={getOrganizationLabel(o)}
                count={o.count}
                truncate
              />
            ))}
          </ExploreAxis>
        </div>
      </div>
    </SectionBlock>
  );
}

function ExploreRow({
  href,
  label,
  count,
  hint,
  truncate = false,
}: {
  href: string;
  label: string;
  count: number;
  hint?: string;
  truncate?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`hub-explore-row${truncate ? " hub-explore-row-org" : ""}`}
      prefetch={false}
    >
      <div className="hub-explore-copy">
        <div className={`hub-explore-name${truncate ? " is-truncated" : ""}`}>
          {label}
        </div>
        {hint && <div className="hub-explore-hint">{hint}</div>}
      </div>
      <span className="hub-explore-count mono">{count}</span>
    </Link>
  );
}

function ExploreAxis({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  const hasMore = items.length > EXPLORE_AXIS_VISIBLE_COUNT;
  const visibleItems = expanded
    ? items
    : items.slice(0, EXPLORE_AXIS_VISIBLE_COUNT);

  return (
    <div>
      <div className="hub-axis-head">
        <div className="hub-axis-sub">
          {subtitle}
        </div>
        <h3 className="hub-axis-title">
          {title}
        </h3>
      </div>
      <div className="hub-axis-list">
        {visibleItems}
        {hasMore && !expanded && (
          <button
            className="hub-explore-row hub-explore-more"
            type="button"
            onClick={() => setExpanded(true)}
          >
            <span>더보기</span>
            <span className="hub-explore-count mono">
              +{items.length - EXPLORE_AXIS_VISIBLE_COUNT}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Global Majors ──────────────────────────────────────────────────
function MajorsSection({
  majors,
  today,
}: {
  majors: Competition[];
  today: Date;
}) {
  const [hero, ...rest] = majors;
  return (
    <SectionBlock tone="paper">
      <div className="container">
        <Intro
          eyebrow="03 · 주요 해외 무대"
          title="글로벌 주요 대회 일정."
          description={
            <>
              Mr. Olympia, Arnold Classic 등 세계적으로 주목받는
              보디빌딩·피트니스 주요 대회 일정을 정리했습니다. 국내 대회와 함께
              주요 해외 무대를 한곳에서 확인해보세요.
            </>
          }
          action={{
            href: "/competitions/types/global",
            label: "올림피아·아놀드 클래식 등 주요 해외 대회 일정 →",
          }}
        />

        {hero ? (
          <MajorHeroCard comp={hero} today={today} />
        ) : (
          <div className="hub-major-empty">
            주요 해외 무대 일정을 준비 중입니다.
          </div>
        )}

        {rest.length > 0 && (
          <div className="hub-2col hub-major-grid">
            {rest.map((m) => (
              <MajorCard key={m.id} comp={m} today={today} />
            ))}
          </div>
        )}
      </div>
    </SectionBlock>
  );
}

function MajorHeroCard({ comp, today }: { comp: Competition; today: Date }) {
  const d = parseDateStr(comp.date);
  const dEnd = comp.dateEnd ? parseDateStr(comp.dateEnd) : null;
  const days = daysUntil(comp.date, today);
  return (
    <Link
      href={getCompetitionPath(comp)}
      className="ph-lift-card hub-major-hero-card"
      prefetch={false}
    >
      <div className="hub-major-hero-wash" />
      <div className="hub-major-hero-inner">
        <div className="hub-major-hero-copy">
          <div className="hub-major-kicker">
            ● {comp.org} · {comp.date.slice(0, 4)}
          </div>
          <div className="hub-major-hero-name">{comp.title}</div>
          <div className="hub-major-hero-meta">
            <MajorMeta label="일정">
              {d.monthKo} {d.day}일
              {dEnd ? `–${dEnd.day}일` : ""}
            </MajorMeta>
            <MajorMeta label="장소">
              {comp.venue !== "장소 확인 필요" ? comp.venue : comp.region}
            </MajorMeta>
          </div>
        </div>
        <div className="hub-major-count-panel">
          <div className="hub-major-meta-label">
            Countdown
          </div>
          <div className="hub-major-countdown mono">D−{days}</div>
        </div>
      </div>
    </Link>
  );
}

function MajorMeta({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="hub-major-meta-label">{label}</div>
      <div className="hub-major-meta-value">{children}</div>
    </div>
  );
}

function MajorCard({ comp, today }: { comp: Competition; today: Date }) {
  const d = parseDateStr(comp.date);
  const dEnd = comp.dateEnd ? parseDateStr(comp.dateEnd) : null;
  const days = daysUntil(comp.date, today);
  return (
    <Link
      href={getCompetitionPath(comp)}
      className="ph-surface-card ph-lift-card hub-major-card"
      prefetch={false}
    >
      <div className="hub-major-card-top">
        <span className="hub-major-card-org">
          {comp.org}
        </span>
        <span className="hub-major-card-dday mono">
          D−{days}
        </span>
      </div>
      <h3 className="hub-major-card-name">{comp.title}</h3>
      <div className="hub-major-card-meta">
        {d.monthKo} {d.day}일
        {dEnd ? `–${dEnd.day}` : ""} · {comp.region}
      </div>
    </Link>
  );
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  open:    { label: "접수 중",    color: "var(--ph-success)", bg: "var(--ph-success-bg)" },
  urgent:  { label: "마감 임박", color: "var(--ph-accent)", bg: "var(--ph-accent-soft)" },
  soon:    { label: "접수 예정", color: "var(--ph-ink-3)", bg: "var(--ph-sub)" },
  closed:  { label: "마감",      color: "var(--ph-ink-5)", bg: "var(--ph-sub)" },
  unknown: { label: "확인 필요", color: "var(--ph-warn)", bg: "var(--ph-warn-bg)" },
};

function statusVars(info: { color: string; bg: string }) {
  return cssVars({
    "--status-color": info.color,
    "--status-bg": info.bg,
  });
}

function DdayText({
  days,
  urgent = false,
  className,
}: {
  days: number;
  urgent?: boolean;
  className: string;
}) {
  return (
    <div className={`${className}${urgent ? " is-urgent" : ""}`}>
      D−{days}
    </div>
  );
}

function StatusBadge({
  info,
  className,
  dotClassName,
  labelClassName,
}: {
  info: { label: string; color: string; bg: string };
  className: string;
  dotClassName: string;
  labelClassName: string;
}) {
  return (
    <StatusPill
      className={className}
      dotClassName={dotClassName}
      label={info.label}
      labelClassName={labelClassName}
      style={statusVars(info)}
    />
  );
}

// ── Upcoming ────────────────────────────────────────────────────────
function UpcomingSection({
  items,
  today,
}: {
  items: Competition[];
  today: Date;
}) {
  return (
    <SectionBlock tone="elev">
      <div className="container">
        <Intro
          eyebrow="04 · 곧 열리는 대회"
          title="다가오는 국내 대회 일정."
          description="가까운 날짜순으로 예정된 대회를 확인해보세요."
          action={{
            href: "/competitions",
            label: "전체 보디빌딩·피트니스 대회 일정 →",
          }}
        />

        <div className="hub-upcoming-list">
          {items.length === 0 ? (
            <EmptyMessage>예정된 대회가 없습니다.</EmptyMessage>
          ) : (
            items.map((item) => (
              <UpcomingRow key={item.id} item={item} today={today} />
            ))
          )}
        </div>
      </div>
    </SectionBlock>
  );
}

function UpcomingRow({ item, today }: { item: Competition; today: Date }) {
  const d = parseDateStr(item.date);
  const days = daysUntil(item.date, today);
  const status = regStatusAt(item, today);
  const info = STATUS_INFO[status.kind] ?? STATUS_INFO.unknown;
  const isUrgent = status.kind === "urgent";
  const dd = String(d.day).padStart(2, "0");

  return (
    <Link
      href={getCompetitionPath(item)}
      className="ph-upcoming-row"
      prefetch={false}
    >
      <div>
        <div className="ph-upcoming-day">{dd}</div>
        <div className="ph-upcoming-month mono">{d.monthKo}</div>
      </div>
      <div className="ph-upcoming-main">
        <div className="ph-upcoming-name">{item.title}</div>
        <div className="ph-upcoming-org-region">
          {item.orgShort} · {item.region}
        </div>
      </div>
      <div className="ph-upcoming-cats">
        {item.categories.slice(0, 3).map((c) => (
          <span key={c} className="comp-card-cat">{c}</span>
        ))}
      </div>
      <DdayText
        days={days}
        urgent={isUrgent}
        className="ph-upcoming-dday"
      />
      <StatusBadge
        info={info}
        className="ph-upcoming-status"
        dotClassName="ph-upcoming-status-dot"
        labelClassName="ph-upcoming-status-label"
      />
    </Link>
  );
}

// ── Rookie / Novice ─────────────────────────────────────────────────
function RookieSection({
  items,
  today,
}: {
  items: Competition[];
  today: Date;
}) {
  return (
    <SectionBlock tone="paper">
      <div className="container">
        <Intro
          eyebrow="05 · 루키·노비스 부문"
          title="첫 출전을 준비한다면."
          description={
            <>
              루키, 노비스, 비기너 등 입문 성격의 부문이 포함된 대회를
              모았습니다. 각 대회별 참가 기준은 공식 공지를 함께 확인해보세요.
            </>
          }
          action={{
            href: "/competitions/types/rookie",
            label: "루키·노비스 보디빌딩·피트니스 대회 일정 →",
          }}
        />

        <div className="hub-3col">
          {items.length === 0 ? (
            <EmptyMessage fillColumn>
              현재 접수 예정인 루키·노비스 대회가 없습니다.
            </EmptyMessage>
          ) : (
            items.map((item) => (
              <RookieCard key={item.id} item={item} today={today} />
            ))
          )}
        </div>
      </div>
    </SectionBlock>
  );
}

function RookieCard({ item, today }: { item: Competition; today: Date }) {
  const d = parseDateStr(item.date);
  const days = daysUntil(item.date, today);
  return (
    <Link
      href={getCompetitionPath(item)}
      className="ph-surface-card ph-lift-card hub-rookie-card"
      prefetch={false}
    >
      <div className="hub-rookie-tags">
        <span className="hub-tag hub-tag-accent">
          루키·노비스
        </span>
        <span className="hub-tag hub-tag-muted">
          {item.orgShort}
        </span>
      </div>
      <h3 className="hub-rookie-name">{item.title}</h3>
      <div className="hub-rookie-meta">
        <span className="hub-rookie-date">
          {d.monthKo} {d.day}일 · {item.region}
        </span>
        <span className="hub-rookie-dday mono">
          D−{days}
        </span>
      </div>
      <div className="hub-rookie-note">
        루키·노비스 부문 포함. 세부 참가 기준은 공식 공지를 확인하세요.
      </div>
    </Link>
  );
}

const ORGANIZATION_GUIDE_ROWS = [
  { name: "KBBF / IFBB International", scope: "국내 협회·아마추어 국제 루트" },
  { name: "NPC Worldwide / IFBB Pro",  scope: "프로카드·글로벌 프로 리그 루트" },
  { name: "NABBA / PCA / WFF 계열",    scope: "민간 피트니스·모델형 종목" },
  { name: "WNBF / ICN / OCB 등 내추럴", scope: "내추럴·도핑 테스트 중심" },
];

// ── Guide CTA ───────────────────────────────────────────────────────
function GuideSection() {
  const divisionRows = CATEGORY_GUIDE.slice(0, 4).map((g) => ({
    name: g.key,
    scope: g.scope,
  }));

  return (
    <SectionBlock tone="elev" last>
      <div className="container">
        <Intro
          eyebrow="06 · 가이드"
          title="대회를 준비하기 전에."
          description={
            <>
              종목과 단체에 따라 복장·포징·심사 기준과 출전 자격이 다릅니다.
              종목별·단체별 핵심 차이를 먼저 확인하고, 세부 규정은 공식 공지를 함께 확인하세요.
            </>
          }
          action={{ href: "/guide", label: "전체 가이드 보기 →" }}
          spacious
        />
        <div className="ph-guide-grid">
          {/* Division card */}
          <Link href="/guide#division" className="ph-surface-card ph-lift-card ph-guide-card" prefetch={false}>
            <div className="ph-kicker-text ph-guide-card-sub">By Division</div>
            <h3 className="ph-card-title ph-guide-card-title">종목별 가이드</h3>
            <p className="ph-card-body ph-guide-card-body">
              맨즈 피지크·클래식 피지크·비키니·웰니스 등 종목별 심사 포인트와 체크리스트를 정리했습니다.
            </p>
            <div className="ph-guide-rows">
              {divisionRows.map((r) => (
                <div key={r.name} className="ph-row-divider ph-guide-row">
                  <span className="ph-card-title ph-guide-row-name">{r.name}</span>
                  <span className="ph-meta-text ph-guide-row-scope">{r.scope}</span>
                </div>
              ))}
            </div>
            <span className="ph-action-pill ph-action-pill-primary ph-guide-cta">종목별 가이드 보기 →</span>
          </Link>

          {/* Organization card */}
          <Link href="/guide#organization" className="ph-surface-card ph-lift-card ph-guide-card" prefetch={false}>
            <div className="ph-kicker-text ph-guide-card-sub">By Organization</div>
            <h3 className="ph-card-title ph-guide-card-title">단체별 가이드</h3>
            <p className="ph-card-body ph-guide-card-body">
              KBBF·IFBB Pro·NABBA·내추럴 단체 등 단체별 출전 루트와 규정 차이를 비교해보세요.
            </p>
            <div className="ph-guide-rows">
              {ORGANIZATION_GUIDE_ROWS.map((r) => (
                <div key={r.name} className="ph-row-divider ph-guide-row">
                  <span className="ph-card-title ph-guide-row-name">{r.name}</span>
                  <span className="ph-meta-text ph-guide-row-scope">{r.scope}</span>
                </div>
              ))}
            </div>
            <span className="ph-action-pill ph-action-pill-outline ph-guide-cta">단체별 가이드 보기 →</span>
          </Link>
        </div>
      </div>
    </SectionBlock>
  );
}
