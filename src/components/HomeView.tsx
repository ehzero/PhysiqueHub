"use client";

import Link from "next/link";
import {
  Children,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Competition } from "@/lib/data";
import type { HomeHubData, HomeExploreType } from "@/lib/home-hub";
import { CompetitionListItem } from "./CompetitionListItem";

// ── Design tokens ─────────────────────────────────────────────────
const A = "#B85C3C"; // warm terracotta accent
const INK = "#0E0E0C";
const MUTE = "#86827C";
const FAINT = "#E8E5DE";
const PAPER = "#F7F5F0";
const EXPLORE_AXIS_VISIBLE_COUNT = 8;
const COUNT_UP_DURATION_MS = 900;

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
  if (
    organization.id === "kbbf" ||
    organization.name === "대한보디빌딩협회" ||
    organization.shortName === "KBBF"
  ) {
    return "대한보디빌딩협회(KBBF)";
  }

  return organization.name;
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
    <section
      className="hub-section"
      style={{ background: PAPER, borderBottom: `1px solid ${FAINT}` }}
    >
      <div className="container">
        <div className="hub-hero-grid">
          {/* Copy */}
          <div>
            <div className="hub-eyebrow" style={{ color: A, marginBottom: 18 }}>
              ● {year} 시즌 · Asia/Seoul
            </div>
            <h1
              className="hub-h1"
              style={{
                marginBottom: 24,
                wordBreak: "keep-all",
                overflowWrap: "break-word",
              }}
            >
              국내 보디빌딩·피트니스
              <br />
              대회 일정을 <span style={{ color: A }}>한눈에.</span>
            </h1>
            <p
              className="hub-body"
              style={{ maxWidth: 580, marginBottom: 28, color: "#3A3833" }}
            >
              국내 대회를 중심으로, 주요 단체의 보디빌딩·피트니스 대회 일정을
              한곳에 모았습니다. 종목·유형·지역·단체별로 빠르게 탐색하고, Mr.
              Olympia와 Arnold Classic 등 주요 해외 무대 일정도 함께 확인할 수
              있습니다.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href="/competitions"
                className="hub-btn-dark"
                prefetch={false}
              >
                전체 일정 보기 →
              </Link>
              <Link
                href="/guide#first-competition"
                className="hub-btn-outline"
                prefetch={false}
              >
                출전 가이드
              </Link>
            </div>
          </div>

          {/* Stat card */}
          <div className="hub-stat-card" style={{ background: "#fff" }}>
            <div className="hub-stat-label" style={{ marginBottom: 18 }}>
              This Season · 한눈에
            </div>
            <div className="hub-stat-grid">
              {[
                {
                  label: "전체 대회",
                  value: stats.totalShows,
                  sub: "등록된 일정",
                },
                {
                  label: "예정 대회",
                  value: stats.upcomingShows,
                  sub: "다가오는 일정",
                },
                {
                  label: "국내 대회",
                  value: stats.domesticShows,
                  sub: "국내 개최 일정",
                },
                {
                  label: "주요 해외 무대",
                  value: stats.majorShows,
                  sub: "글로벌 주요 일정",
                },
              ].map(({ label, value, sub }) => (
                <div key={label}>
                  <div className="hub-stat-cell-label">{label}</div>
                  <div className="hub-stat-num">
                    <CountUpNumber value={value} />
                  </div>
                  <div className="hub-stat-cell-sub">{sub}</div>
                </div>
              ))}
            </div>
            {nd && days !== null && (
              <div
                className="hub-stat-next"
                style={{ borderTop: `1px solid ${FAINT}` }}
              >
                <div>
                  <div
                    className="hub-stat-cell-label"
                    style={{ marginBottom: 4 }}
                  >
                    다음 대회
                  </div>
                  <div className="hub-stat-next-title" style={{ color: INK }}>
                    {stats.nextShow?.title} · {nd.monthKo} {nd.day}일
                  </div>
                </div>
                <div className="hub-stat-countdown mono" style={{ color: A }}>
                  D−{days}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
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
    <section className="hub-section" style={{ background: "#fff" }}>
      <div className="container">
        <div className="hub-section-head">
          <div>
            <div className="hub-eyebrow" style={{ color: A }}>
              02 · 빠른 탐색
            </div>
            <h2 className="hub-h2">원하는 기준으로 찾아보세요.</h2>
            <p className="hub-section-body" style={{ color: MUTE }}>
              종목, 유형, 지역, 단체별로 대회 일정을 빠르게 탐색할 수 있습니다.
            </p>
          </div>
          <Link
            href="/competitions"
            className="hub-link-more"
            style={{ color: INK }}
            prefetch={false}
          >
            전체 대회 목록 →
          </Link>
        </div>

        <div className="hub-explore-grid">
          {/* 종목별 */}
          <ExploreAxis title="종목별 대회" subtitle="By Division">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={c.href}
                className="hub-explore-row"
                style={{ borderTop: `1px solid ${FAINT}` }}
                prefetch={false}
              >
                <span className="hub-explore-name" style={{ color: INK }}>
                  {getCategoryLabel(c.name)}
                </span>
                <span className="hub-explore-count mono" style={{ color: A }}>
                  {c.count}
                </span>
              </Link>
            ))}
          </ExploreAxis>

          {/* 유형별 */}
          <ExploreAxis title="유형별 대회" subtitle="By Type">
            {types.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className="hub-explore-row"
                style={{ borderTop: `1px solid ${FAINT}` }}
                prefetch={false}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="hub-explore-name" style={{ color: INK }}>
                    {t.kr}
                  </div>
                  <div className="hub-explore-hint" style={{ color: MUTE }}>
                    {t.hint}
                  </div>
                </div>
                <span
                  className="hub-explore-count mono"
                  style={{ color: A, flexShrink: 0, marginLeft: 8 }}
                >
                  {t.count}
                </span>
              </Link>
            ))}
          </ExploreAxis>

          {/* 지역별 */}
          <ExploreAxis title="지역별 대회" subtitle="By Region">
            {regions.map((r) => (
              <Link
                key={r.name}
                href={r.href}
                className="hub-explore-row"
                style={{ borderTop: `1px solid ${FAINT}` }}
                prefetch={false}
              >
                <span className="hub-explore-name" style={{ color: INK }}>
                  {r.name}
                </span>
                <span className="hub-explore-count mono" style={{ color: A }}>
                  {r.count}
                </span>
              </Link>
            ))}
          </ExploreAxis>

          {/* 단체별 */}
          <ExploreAxis title="단체별 대회" subtitle="By Organization">
            {organizations.map((o) => (
              <Link
                key={o.id}
                href={o.href}
                className="hub-explore-row hub-explore-row-org"
                style={{ borderTop: `1px solid ${FAINT}` }}
                prefetch={false}
              >
                <div
                  className="hub-explore-name"
                  style={{
                    color: INK,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {getOrganizationLabel(o)}
                </div>
                <span
                  className="hub-explore-count mono"
                  style={{ color: A, flexShrink: 0, marginLeft: 8 }}
                >
                  {o.count}
                </span>
              </Link>
            ))}
          </ExploreAxis>
        </div>
      </div>
    </section>
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
      <div style={{ marginBottom: 12 }}>
        <div className="hub-axis-sub" style={{ color: A }}>
          {subtitle}
        </div>
        <h3 className="hub-axis-title" style={{ color: INK }}>
          {title}
        </h3>
      </div>
      <div
        className="hub-axis-list"
        style={{
          border: `1px solid ${FAINT}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {visibleItems}
        {hasMore && !expanded && (
          <button
            className="hub-explore-row hub-explore-more"
            type="button"
            style={{ borderTop: `1px solid ${FAINT}` }}
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
    <section className="hub-section" style={{ background: PAPER }}>
      <div className="container">
        <div className="hub-section-head">
          <div>
            <div className="hub-eyebrow" style={{ color: A }}>
              03 · 주요 해외 무대
            </div>
            <h2 className="hub-h2">글로벌 주요 대회 일정.</h2>
            <p className="hub-section-body" style={{ color: MUTE }}>
              Mr. Olympia, Arnold Classic 등 세계적으로 주목받는
              보디빌딩·피트니스 주요 대회 일정을 정리했습니다. 국내 대회와 함께
              주요 해외 무대를 한곳에서 확인해보세요.
            </p>
          </div>
          <Link
            href="/competitions/types/global"
            className="hub-link-more"
            style={{ color: INK }}
            prefetch={false}
          >
            주요 해외 무대 보기 →
          </Link>
        </div>

        {hero ? (
          <MajorHeroCard comp={hero} today={today} />
        ) : (
          <div
            className="hub-major-empty"
            style={{
              background: INK,
              color: MUTE,
              borderRadius: 18,
              padding: 36,
            }}
          >
            주요 해외 무대 일정을 준비 중입니다.
          </div>
        )}

        {rest.length > 0 && (
          <div className="hub-2col" style={{ marginTop: 16 }}>
            {rest.map((m) => (
              <MajorCard key={m.id} comp={m} today={today} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MajorHeroCard({ comp, today }: { comp: Competition; today: Date }) {
  const d = parseDateStr(comp.date);
  const dEnd = comp.dateEnd ? parseDateStr(comp.dateEnd) : null;
  const days = daysUntil(comp.date, today);
  return (
    <Link
      href={`/competitions/${comp.id}`}
      className="hub-lift-card"
      prefetch={false}
      style={{
        display: "block",
        background: INK,
        color: "#fff",
        borderRadius: 18,
        padding: "36px 40px",
        position: "relative",
        overflow: "hidden",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 85% 30%, rgba(200,169,97,.18), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div className="hub-major-hero-inner">
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#C8A961",
              letterSpacing: "1.6px",
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            ● {comp.org} · {comp.date.slice(0, 4)}
          </div>
          <div className="hub-major-hero-name">{comp.title}</div>
          <div className="hub-major-hero-meta">
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,.5)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                일정
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {d.monthKo} {d.day}일
                {dEnd ? `–${dEnd.day}일` : ""}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,.5)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                장소
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {comp.venue !== "장소 확인 필요" ? comp.venue : comp.region}
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,.5)",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Countdown
          </div>
          <div className="hub-major-countdown mono">D−{days}</div>
        </div>
      </div>
    </Link>
  );
}

function MajorCard({ comp, today }: { comp: Competition; today: Date }) {
  const d = parseDateStr(comp.date);
  const dEnd = comp.dateEnd ? parseDateStr(comp.dateEnd) : null;
  const days = daysUntil(comp.date, today);
  return (
    <Link
      href={`/competitions/${comp.id}`}
      className="hub-lift-card"
      prefetch={false}
      style={{
        display: "block",
        background: "#fff",
        border: `1px solid ${FAINT}`,
        borderRadius: 14,
        padding: 22,
        textDecoration: "none",
        color: INK,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: A,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
          }}
        >
          {comp.org}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.4px",
            color: INK,
          }}
        >
          D−{days}
        </span>
      </div>
      <h3 className="hub-major-card-name">{comp.title}</h3>
      <div style={{ fontSize: 13, color: MUTE }}>
        {d.monthKo} {d.day}일
        {dEnd ? `–${dEnd.day}` : ""} · {comp.region}
      </div>
    </Link>
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
    <section className="hub-section" style={{ background: "#fff" }}>
      <div className="container">
        <div className="hub-section-head">
          <div>
            <div className="hub-eyebrow" style={{ color: A }}>
              04 · 곧 열리는 대회
            </div>
            <h2 className="hub-h2">다가오는 국내 대회 일정.</h2>
            <p className="hub-section-body" style={{ color: MUTE }}>
              가까운 날짜순으로 예정된 대회를 확인해보세요.
            </p>
          </div>
          <Link
            href="/competitions"
            className="hub-link-more"
            style={{ color: INK }}
            prefetch={false}
          >
            전체 일정 보기 →
          </Link>
        </div>

        <div className="hub-upcoming-list">
          {items.length === 0 ? (
            <div style={{ padding: "40px 0", color: MUTE, fontSize: 14 }}>
              예정된 대회가 없습니다.
            </div>
          ) : (
            items.map((item) => (
              <CompetitionListItem
                key={item.id}
                competition={item}
                today={today}
              />
            ))
          )}
          <div style={{ borderTop: `1px solid ${FAINT}` }} />
        </div>
      </div>
    </section>
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
    <section className="hub-section" style={{ background: PAPER }}>
      <div className="container">
        <div className="hub-section-head">
          <div>
            <div className="hub-eyebrow" style={{ color: A }}>
              05 · 루키·노비스 부문
            </div>
            <h2 className="hub-h2">첫 출전을 준비한다면.</h2>
            <p className="hub-section-body" style={{ color: MUTE }}>
              루키, 노비스, 비기너 등 입문 성격의 부문이 포함된 대회를
              모았습니다. 각 대회별 참가 기준은 공식 공지를 함께 확인해보세요.
            </p>
          </div>
          <Link
            href="/competitions/types/rookie"
            className="hub-link-more"
            style={{ color: INK }}
            prefetch={false}
          >
            루키·노비스 대회 보기 →
          </Link>
        </div>

        <div className="hub-3col">
          {items.length === 0 ? (
            <div
              style={{
                padding: "40px 0",
                color: MUTE,
                fontSize: 14,
                gridColumn: "1/-1",
              }}
            >
              현재 접수 예정인 루키·노비스 대회가 없습니다.
            </div>
          ) : (
            items.map((item) => (
              <RookieCard key={item.id} item={item} today={today} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function RookieCard({ item, today }: { item: Competition; today: Date }) {
  const d = parseDateStr(item.date);
  const days = daysUntil(item.date, today);
  return (
    <Link
      href={`/competitions/${item.id}`}
      className="hub-lift-card"
      prefetch={false}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: `1px solid ${FAINT}`,
        borderRadius: 14,
        padding: 22,
        textDecoration: "none",
        color: INK,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <span
          className="hub-tag"
          style={{ background: A, color: "#fff", letterSpacing: "0.5px" }}
        >
          루키·노비스
        </span>
        <span className="hub-tag" style={{ background: PAPER, color: INK }}>
          {item.orgShort}
        </span>
      </div>
      <h3 className="hub-rookie-name">{item.title}</h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        <span style={{ color: INK, fontWeight: 500 }}>
          {d.monthKo} {d.day}일 · {item.region}
        </span>
        <span className="mono" style={{ color: A, fontWeight: 700 }}>
          D−{days}
        </span>
      </div>
      <div
        style={{
          marginTop: "auto",
          paddingTop: 14,
          borderTop: `1px solid ${FAINT}`,
          fontSize: 12,
          color: "#3A3833",
          lineHeight: 1.5,
        }}
      >
        루키·노비스 부문 포함. 세부 참가 기준은 공식 공지를 확인하세요.
      </div>
    </Link>
  );
}

// ── Guide CTA ───────────────────────────────────────────────────────
function GuideSection() {
  const cards = [
    {
      eyebrow: "GUIDE 01",
      title: "첫 출전 가이드",
      body: "체급 선택, 컨디셔닝, 포징, 준비물까지 첫 대회를 준비할 때 확인해야 할 내용을 정리했습니다.",
      cta: "가이드 보기 →",
      href: "/guide#first-competition",
      dark: true,
    },
    {
      eyebrow: "GUIDE 02",
      title: "종목별 가이드",
      body: "보디빌딩, 클래식 피지크, 맨즈 피지크, 비키니, 웰니스 등 주요 종목의 특징과 평가 포인트를 비교합니다.",
      cta: "종목 비교 →",
      href: "/guide#categories",
      dark: false,
    },
    {
      eyebrow: "GUIDE 03",
      title: "단체별 가이드",
      body: "KBBF, IFBB, NABBA, WNBF, Musclemania 등 주요 단체의 대회 성격, 출전 기준, 프로카드 흐름을 비교합니다.",
      cta: "단체 비교 →",
      href: "/guide#organizations",
      dark: false,
    },
  ];

  return (
    <section
      className="hub-section hub-section-last"
      style={{ background: "#fff" }}
    >
      <div className="container">
        <div style={{ marginBottom: 28 }}>
          <div className="hub-eyebrow" style={{ color: A }}>
            06 · 가이드
          </div>
          <h2 className="hub-h2">대회를 준비하기 전에.</h2>
          <p className="hub-section-body" style={{ color: MUTE }}>
            처음 출전하는 선수부터 단체와 종목을 비교하려는 사용자까지, 대회
            선택에 필요한 기본 정보를 정리했습니다.
          </p>
        </div>
        <div className="hub-3col">
          {cards.map((c) => (
            <Link
              key={c.eyebrow}
              href={c.href}
              className="hub-lift-card"
              prefetch={false}
              style={{
                display: "flex",
                flexDirection: "column",
                background: c.dark ? INK : "#fff",
                color: c.dark ? "#fff" : INK,
                border: c.dark ? "none" : `1px solid ${FAINT}`,
                borderRadius: 14,
                padding: 28,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.dark ? "#C8A961" : A,
                  letterSpacing: "1.4px",
                  marginBottom: 16,
                  textTransform: "uppercase",
                }}
              >
                {c.eyebrow}
              </div>
              <h3 className="hub-guide-name">{c.title}</h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  margin: "0 0 24px",
                  color: c.dark ? "rgba(255,255,255,.75)" : "#3A3833",
                }}
              >
                {c.body}
              </p>
              <span
                style={{
                  marginTop: "auto",
                  fontSize: 14,
                  fontWeight: 600,
                  color: c.dark ? "#fff" : INK,
                }}
              >
                {c.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
