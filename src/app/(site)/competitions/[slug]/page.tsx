import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShareButton } from "@/components/ShareButton";
import { KakaoAd } from "@/components/KakaoAd";
import { PosterFigure, posterFigureColor } from "@/components/PosterFigure";
import { StatusPill } from "@/components/UIPrimitives";
import type { Competition } from "@/lib/data";
import {
  daysBetween,
  parseDate,
  regStatusAt,
  fmtDate,
} from "@/lib/data";
import {
  getCompetitionDateLabel,
  getCompetitionLocationLabel,
  getCompetitionRegistrationLabel,
  hasReliableCompetitionLocation,
} from "@/lib/competition-display";
import {
  getCompetitionPath,
  getCompetitionSlug,
  normalizeCompetitionRouteSlug,
} from "@/lib/competition-slug";
import {
  getCompetitionBySlug,
  getCompetitionSeasonPage,
} from "@/lib/competition-server";
import { getKoreaDateParam, getKoreaYear } from "@/lib/date";
import {
  getSiteUrl,
  OPEN_GRAPH_IMAGE_URL,
  SHARE_IMAGE_ALT,
  SITE_NAME,
  TWITTER_IMAGE_URL,
} from "@/lib/site";
import { COMPETITION_TIER_LABELS } from "@/lib/competition-classification";
import { Icons } from "@/components/Icons";

export const revalidate = 86_400;

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  open:    { label: "접수 중",    color: "var(--ph-success)", bg: "var(--ph-success-bg)" },
  urgent:  { label: "마감 임박", color: "var(--ph-accent)", bg: "var(--ph-accent-soft)" },
  soon:    { label: "접수 예정", color: "var(--ph-ink-3)", bg: "var(--ph-sub)" },
  closed:  { label: "마감",      color: "var(--ph-ink-5)", bg: "var(--ph-sub)" },
  ended:   { label: "종료된 대회", color: "var(--ph-ink-4)", bg: "var(--ph-sub)" },
  unknown: { label: "확인 필요", color: "var(--ph-warn)", bg: "var(--ph-warn-bg)" },
};

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

function statusVars(info: { color: string; bg: string }): CSSVars {
  return {
    "--status-color": info.color,
    "--status-bg": info.bg,
  };
}

const ATTR_META: Record<string, { name: string; desc: string }> = {
  global:   { name: "글로벌 무대",      desc: "Mr. Olympia·Arnold 등 세계 무대와 연결되는 국제 대회입니다." },
  proShow:  { name: "프로쇼",           desc: "프로 부문 또는 프로 쇼로 분류된 대회입니다. 참가 자격과 운영 단체는 공식 공지를 확인하세요." },
  proQual:  { name: "프로 퀄리파이어",  desc: "단체별 프로 자격 또는 카드와 연결될 수 있는 대회입니다. 발급 기준과 호환 범위는 공식 공지를 확인하세요." },
  natural:  { name: "내추럴",           desc: "내추럴 규정이 적용될 수 있는 대회입니다. 검사 방식과 금지 기간은 단체별 공식 규정을 확인하세요." },
  rookie:   { name: "입문·루키 부문",   desc: "신인·비기너 부문이 포함되어 첫 출전에 적합합니다." },
  national: { name: "국가대표 선발",    desc: "국가대표 또는 시·도 대표 선발과 연계된 대회입니다." },
  teamEvent:{ name: "국가대표전",       desc: "대표팀 단위로 치러지는 대회입니다." },
  festival: { name: "전국체전",         desc: "대한체육회 공인 전국체육대회 종목입니다." },
};

function buildFlags(c: Competition): string[] {
  const out: string[] = [];
  if (c.attributes.global) out.push("글로벌");
  if (c.tier === "pro_show") out.push("프로쇼");
  if (c.tier === "pro_qualifier") out.push("프로 퀄리파이어");
  if (c.natural) out.push("내추럴");
  if (c.beginner || c.rookie) out.push("루키부문");
  if (c.attributes.nationalSelection) out.push("국가대표 선발");
  if (c.attributes.nationalTeamEvent) out.push("국가대표전");
  if (c.attributes.nationalSportsFestival) out.push("전국체전");
  return out;
}

function buildAttrs(c: Competition): { name: string; desc: string }[] {
  const out: { name: string; desc: string }[] = [];
  if (c.attributes.global) out.push(ATTR_META.global);
  if (c.tier === "pro_show") out.push(ATTR_META.proShow);
  if (c.tier === "pro_qualifier") out.push(ATTR_META.proQual);
  if (c.natural) out.push(ATTR_META.natural);
  if (c.beginner || c.rookie) out.push(ATTR_META.rookie);
  if (c.attributes.nationalSelection) out.push(ATTR_META.national);
  if (c.attributes.nationalTeamEvent) out.push(ATTR_META.teamEvent);
  if (c.attributes.nationalSportsFestival) out.push(ATTR_META.festival);
  return out;
}

function posterVariant(id: string): number {
  return Array.from(id).reduce((h, ch) => (h + ch.charCodeAt(0)) % 6, 0);
}

interface CompetitionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CompetitionDetailPageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const competition = await getCompetitionBySlug(slug);
  if (!competition) notFound();

  const path = getCompetitionPath(competition);
  const description = getDescription(competition);

  return {
    title: competition.title,
    description,
    alternates: { canonical: path },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: SITE_NAME,
      title: `${competition.title} | ${SITE_NAME}`,
      description,
      images: [{ url: OPEN_GRAPH_IMAGE_URL, width: 1200, height: 630, alt: SHARE_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${competition.title} | ${SITE_NAME}`,
      description,
      images: [TWITTER_IMAGE_URL],
    },
  };
}

export default async function CompetitionDetailPage({
  params,
}: CompetitionDetailPageProps) {
  const slug = (await params).slug;
  const competition = await getCompetitionBySlug(slug);
  if (!competition) notFound();

  if (
    normalizeCompetitionRouteSlug(decodeURIComponent(slug)) !==
    normalizeCompetitionRouteSlug(getCompetitionSlug(competition))
  ) {
    redirect(getCompetitionPath(competition));
  }

  // Today in Korea
  const todayStr = getKoreaDateParam();
  const today = parseDate(todayStr);

  // Related competitions
  const seasonPage = await getCompetitionSeasonPage(getKoreaYear(), {
    sort: "date-asc",
    startsFrom: todayStr,
  });
  const related = seasonPage.items
    .filter((c) => c.id !== competition.id)
    .sort((a, b) => {
      const sa = a.org === competition.org ? 0 : 1;
      const sb = b.org === competition.org ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return a.date.localeCompare(b.date);
    })
    .slice(0, 3);

  // Derived data
  const daysToComp = daysBetween(today, competition.date);
  const eventPassed = daysToComp < 0;
  const status = regStatusAt(competition, today);
  const statusInfo = eventPassed
    ? STATUS_INFO.ended
    : STATUS_INFO[status.kind] ?? STATUS_INFO.unknown;
  const ddayTxt = daysToComp > 0 ? `D−${daysToComp}` : daysToComp === 0 ? "D-DAY" : "종료";
  const isUrgent = !eventPassed && status.kind === "urgent";
  const isClosed = eventPassed || status.kind === "closed";

  const tierLabel = COMPETITION_TIER_LABELS[competition.tier];
  const locationLabel = getCompetitionLocationLabel(competition);
  const dateLabel = getCompetitionDateLabel(competition);
  const registrationLabel = getCompetitionRegistrationLabel(competition, today);

  const flags = buildFlags(competition);
  const attrs = buildAttrs(competition);

  const variant = posterVariant(competition.id);
  const theme = competition.poster || "amber";
  const figColor = posterFigureColor(theme);

  // Timeline states
  const regOpenPassed = competition.regOpen ? daysBetween(today, competition.regOpen) <= 0 : false;
  const regClosePassed = competition.regClose ? daysBetween(today, competition.regClose) < 0 : false;

  const actionUrl = competition.registrationUrl || competition.sourceUrl;
  const actionLabel = competition.registrationUrl ? "접수 페이지로 →" : "공식 공지 확인 →";
  const disabledActionLabel = eventPassed ? "대회 종료" : "접수 마감";

  const eventJsonLd = getEventJsonLd(competition);
  const breadcrumbJsonLd = getBreadcrumbJsonLd(competition);

  return (
    <main>
      <StructuredData data={breadcrumbJsonLd} />
      {eventJsonLd && <StructuredData data={eventJsonLd} />}

      <div className="det-page-container">
        {/* Breadcrumb */}
        <nav className="det-crumb" aria-label="breadcrumb">
          <Link href="/competitions">대회 일정</Link>
          <span className="det-crumb-sep">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </span>
          <span>{tierLabel}</span>
        </nav>

        {/* Hero */}
        <section className={`det-hero poster-${theme}`} aria-label="대회 헤더">
          <div className="det-hero-fig" aria-hidden="true">
            <PosterFigure variant={variant} color={figColor} />
          </div>
          <div className="det-hero-wash" />
          <div className="det-hero-inner">
            <div className="det-hero-eyebrow">
              ● {competition.org} · {competition.date.slice(0, 4)}
            </div>
            <h1 className="det-hero-title">{competition.title}</h1>
            <div className="det-hero-meta">
              <span className="det-hero-meta-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {dateLabel}
              </span>
              <span className="det-hero-meta-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {locationLabel}
              </span>
            </div>
            {flags.length > 0 && (
              <div className="det-hero-flags">
                {flags.map((f) => (
                  <span key={f} className="det-flag">{f}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Body: main + sidebar */}
        <div className="det-body">
          {/* Main */}
          <div className="det-main">
            {/* Overview */}
            <section className="det-sec">
              <h2 className="det-sec-title">한눈에 보기</h2>
              <div className="det-facts">
                <div>
                  <div className="det-fact-label">일정</div>
                  <div className="det-fact-value">{dateLabel}</div>
                </div>
                <div>
                  <div className="det-fact-label">장소</div>
                  <div className="det-fact-value">{locationLabel}</div>
                </div>
                <div>
                  <div className="det-fact-label">주최 단체</div>
                  <div className="det-fact-value">{competition.org}</div>
                </div>
                <div>
                  <div className="det-fact-label">대회 유형</div>
                  <div className="det-fact-value">{tierLabel}</div>
                </div>
              </div>
            </section>

            {/* Categories */}
            <section className="det-sec">
              <h2 className="det-sec-title">진행 종목 · {competition.categories.length}개</h2>
              <div className="det-cats">
                {competition.categories.length > 0 ? (
                  competition.categories.map((c) => (
                    <span key={c} className="det-cat">{c}</span>
                  ))
                ) : (
                  <span className="det-cat is-muted">공식 소스 확인 필요</span>
                )}
              </div>
            </section>

            {/* Attributes */}
            {attrs.length > 0 && (
              <section className="det-sec">
                <h2 className="det-sec-title">대회 특징</h2>
                <div className="det-attrs">
                  {attrs.map((a) => (
                    <div key={a.name} className="det-attr">
                      <div className="det-attr-ico">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </div>
                      <div>
                        <div className="det-attr-name">{a.name}</div>
                        <div className="det-attr-desc">{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Registration timeline */}
            <section className="det-sec">
              <h2 className="det-sec-title">접수 일정</h2>
              <div className="det-timeline">
                <TimelineRow
                  label="접수 시작"
                  dateStr={competition.regOpen || null}
                  done={regOpenPassed && regClosePassed}
                  active={regOpenPassed && !regClosePassed}
                />
                <TimelineRow
                  label="접수 마감"
                  sub={isClosed ? "접수가 마감되었습니다" : undefined}
                  dateStr={competition.regClose || null}
                  done={regClosePassed}
                  active={false}
                />
                <TimelineRow
                  label="대회 개최"
                  sub={locationLabel}
                  dateStr={competition.date}
                  done={eventPassed}
                  active={false}
                />
              </div>
            </section>

            {/* Note */}
            <section className="det-sec">
              <div className="det-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>표시된 일정·접수·종목 정보는 참고용입니다. 체급·계측·복장·자격 등 세부 규정과 변경 사항은 <strong>{competition.org}</strong> 공식 공지를 반드시 확인하세요.</span>
              </div>
            </section>

            <KakaoAd
              as="section"
              className="det-mobile-ad-section"
              unit="DAN-XLTmMI7kEjqrR8QD"
              width={320}
              height={100}
              maxWidth={980}
            />
          </div>

          {/* Sidebar */}
          <aside className="det-side">
            <div className="det-reg-card">
              <div className="det-reg-top">
                <StatusPill
                  className="det-status-pill"
                  dotClassName="det-status-dot"
                  label={statusInfo.label}
                  labelClassName="det-status-label"
                  style={statusVars(statusInfo)}
                />
                <div
                  className={`det-reg-dday mono${isUrgent ? " is-urgent" : ""}`}
                >
                  {ddayTxt}
                </div>
              </div>

              {eventPassed && (
                <div className="det-ended-note">
                  이 대회는 종료되었습니다. 표시된 일정·장소·종목 정보는 기록용이며,
                  변경 사항은 공식 공지를 확인하세요.
                </div>
              )}

              <div className="det-reg-kv">
                <span className="k">대회일</span>
                <span className="v">{dateLabel}</span>
              </div>
              <div className="det-reg-kv">
                <span className="k">접수 기간</span>
                <span className="v">{registrationLabel}</span>
              </div>
              <div className="det-reg-kv">
                <span className="k">장소</span>
                <span className="v">{locationLabel}</span>
              </div>

              {actionUrl ? (
                <a
                  href={actionUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`det-reg-cta${isClosed ? " disabled" : ""}`}
                >
                  {isClosed ? disabledActionLabel : actionLabel}
                </a>
              ) : (
                <button className={`det-reg-cta${isClosed ? " disabled" : ""}`} disabled={isClosed}>
                  {isClosed ? disabledActionLabel : "접수 정보 확인 필요"}
                </button>
              )}

              <div className="det-reg-actions">
                <ShareButton
                  className="det-reg-action"
                  path={getCompetitionPath(competition)}
                />
                <Link
                  href="/competitions"
                  className="det-reg-action"
                  prefetch={false}
                >
                  {Icons.list}
                  <span>목록</span>
                </Link>
              </div>

              <div className="det-reg-host">
                <div className="det-reg-host-label">주최</div>
                <div className="det-reg-host-name">{competition.org}</div>
              </div>
            </div>

            <KakaoAd
              className="det-side-ad"
              unit="DAN-Mm9wA9gi0GYtIsun"
              width={300}
              height={250}
              minWidth={981}
            />
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="det-related">
            <h2 className="det-related-title">이런 대회도 있어요</h2>
            <div className="det-rel-grid">
              {related.map((r) => {
                const rd = daysBetween(today, r.date);
                const rStatus = regStatusAt(r, today);
                const rInfo = STATUS_INFO[rStatus.kind] ?? STATUS_INFO.unknown;
                return (
                  <Link
                    key={r.id}
                    href={getCompetitionPath(r)}
                    className="det-rel-card"
                    prefetch={false}
                  >
                    <div className="det-rel-top">
                      <span className="det-rel-org">{r.orgShort}</span>
                      <span
                        className={`det-rel-dday mono${rStatus.kind === "urgent" ? " is-urgent" : ""}`}
                      >
                        {rd >= 0 ? `D−${rd}` : "종료"}
                      </span>
                    </div>
                    <div className="det-rel-title">{r.title}</div>
                    <div className="det-rel-meta">
                      {fmtDate(r.date, { style: "long" })} · {r.region} ·{" "}
                      <span className="det-rel-status" style={statusVars(rInfo)}>
                        {rInfo.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function TimelineRow({
  label,
  sub,
  dateStr,
  done,
  active,
}: {
  label: string;
  sub?: string;
  dateStr: string | null;
  done: boolean;
  active: boolean;
}) {
  const cls = `det-tl-row${done ? " tl-done" : ""}${active ? " tl-active" : ""}`;
  return (
    <div className={cls}>
      <div className="det-tl-rail">
        <span className="det-tl-dot" />
        <span className="det-tl-line" />
      </div>
      <div className="det-tl-label">
        {label}
        {sub && <div className="det-tl-sub">{sub}</div>}
      </div>
      <div className="det-tl-date mono">
        {dateStr ? fmtDate(dateStr, { style: "long" }) : "미정"}
      </div>
    </div>
  );
}

function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}

function getDescription(competition: Competition) {
  const loc = getCompetitionLocationLabel(competition);
  const locPhrase = !hasReliableCompetitionLocation(competition)
    ? "장소는 공식 채널에서 확인이 필요합니다"
    : `${loc}에서 열립니다`;
  return `${competition.org} 주최 ${competition.title}은 ${fmtDate(competition.date, { style: "long" })}에 ${locPhrase}.`;
}

function getBreadcrumbJsonLd(competition: Competition) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "대회 일정", item: `${siteUrl}/competitions` },
      { "@type": "ListItem", position: 3, name: competition.title, item: `${siteUrl}${getCompetitionPath(competition)}` },
    ],
  };
}

function getEventJsonLd(competition: Competition) {
  const loc = getCompetitionLocationLabel(competition);
  if (!hasReliableCompetitionLocation(competition)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: competition.title,
    url: `${getSiteUrl()}${getCompetitionPath(competition)}`,
    startDate: competition.date,
    endDate: competition.dateEnd ?? competition.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: competition.venue || loc, address: loc },
    organizer: { "@type": "Organization", name: competition.org, url: competition.sourceUrl || competition.registrationUrl || undefined },
    description: getDescription(competition),
  };
}
