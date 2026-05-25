import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, PageMain, PageSection } from "@/components/PageLayout";
import { ShareButton } from "@/components/ShareButton";
import { fmtDate } from "@/lib/data";
import type { Competition } from "@/lib/data";
import { getCompetitionById } from "@/lib/competition-server";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 86_400;

interface CompetitionDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CompetitionDetailPageProps): Promise<Metadata> {
  const id = decodeURIComponent((await params).id);
  const competition = await getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  const path = getCompetitionPath(competition.id);
  const description = getDescription(competition);

  return {
    title: competition.title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: SITE_NAME,
      title: `${competition.title} - ${SITE_NAME}`,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} 공유 이미지`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${competition.title} - ${SITE_NAME}`,
      description,
      images: ["/twitter-image"],
    },
  };
}

export default async function CompetitionDetailPage({
  params,
}: CompetitionDetailPageProps) {
  const id = decodeURIComponent((await params).id);
  const competition = await getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  const officialUrl = competition.sourceUrl || competition.registrationUrl;
  const eventJsonLd = getEventJsonLd(competition);
  const breadcrumbJsonLd = getBreadcrumbJsonLd(competition);

  return (
    <PageMain>
      <StructuredData data={breadcrumbJsonLd} />
      {eventJsonLd && <StructuredData data={eventJsonLd} />}

      <PageHeader
        title={competition.title}
        subtitle={`${competition.org} · ${getDateLabel(competition)} · ${competition.venue}`}
        actions={
          <>
            <ShareButton
              className="cta-btn"
              path={getCompetitionPath(competition.id)}
            />
            <Link className="cta-btn" href="/competitions" prefetch>
              대회 목록으로
            </Link>
          </>
        }
      />

      <PageSection>
        <article className="competition-detail">
          <div className="competition-detail-intro">
            <p className="eyebrow">Competition Detail</p>
            <p>{getDescription(competition)}</p>
          </div>

          <dl className="kv-grid competition-detail-grid">
            <dt>개최일</dt>
            <dd>{getDateLabel(competition)}</dd>

            <dt>접수 기간</dt>
            <dd>{getRegistrationLabel(competition)}</dd>

            <dt>장소</dt>
            <dd>{competition.venue}, {competition.region}</dd>

            <dt>주최</dt>
            <dd>{competition.org}</dd>

            <dt>종목</dt>
            <dd>
              <div className="cat-pill-row">
                {competition.categories.map((category) => (
                  <span className="cat-pill" key={category}>
                    {category}
                  </span>
                ))}
              </div>
            </dd>

            <dt>참가비</dt>
            <dd>{competition.fee > 0 ? `₩ ${competition.fee.toLocaleString()}` : "확인 필요"}</dd>

            <dt>특징</dt>
            <dd>
              <div className="cat-pill-row">
                {competition.tags.length > 0 ? (
                  competition.tags.map((tag) => (
                    <span className="cat-pill" key={tag}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span>공식 소스 기준 정보 확인 필요</span>
                )}
              </div>
            </dd>

            <dt>공식 채널</dt>
            <dd>
              {officialUrl ? (
                <a className="text-link" href={officialUrl} rel="noreferrer" target="_blank">
                  {officialUrl}
                </a>
              ) : (
                "확인 필요"
              )}
            </dd>
          </dl>
        </article>
      </PageSection>
    </PageMain>
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

function getCompetitionPath(id: string) {
  return `/competitions/${encodeURIComponent(id)}`;
}

function getDescription(competition: Competition) {
  return `${competition.org} 주최 ${competition.title}은 ${getDateLabel(competition)}에 ${competition.venue}, ${competition.region}에서 열립니다. 접수 정보: ${getRegistrationLabel(competition)}.`;
}

function getDateLabel(competition: Competition) {
  if (competition.dateEnd) {
    return `${fmtDate(competition.date, { style: "long" })} - ${fmtDate(competition.dateEnd, { style: "long" })}`;
  }

  return fmtDate(competition.date, { style: "long" });
}

function getRegistrationLabel(competition: Competition) {
  if (competition.registrationStatus === "unknown") {
    return competition.regClose === competition.date
      ? "공식 접수 정보 확인 필요"
      : `마감 ${fmtDate(competition.regClose, { style: "long" })}`;
  }

  return `${fmtDate(competition.regOpen, { style: "long" })} - ${fmtDate(competition.regClose, { style: "long" })}`;
}

function getBreadcrumbJsonLd(competition: Competition) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "대회 목록",
        item: `${siteUrl}/competitions`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: competition.title,
        item: `${siteUrl}${getCompetitionPath(competition.id)}`,
      },
    ],
  };
}

function getEventJsonLd(competition: Competition) {
  if (!hasReliableLocation(competition)) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: competition.title,
    url: `${getSiteUrl()}${getCompetitionPath(competition.id)}`,
    startDate: competition.date,
    endDate: competition.dateEnd ?? competition.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: competition.venue,
      address: `${competition.venue}, ${competition.region}`,
    },
    organizer: {
      "@type": "Organization",
      name: competition.org,
      url: competition.sourceUrl || competition.registrationUrl || undefined,
    },
    description: getDescription(competition),
  };
}

function hasReliableLocation(competition: Competition) {
  return !/(장소 확인 필요|추후 공지|예정|미정|확인 필요)/.test(
    `${competition.venue} ${competition.region}`,
  );
}
