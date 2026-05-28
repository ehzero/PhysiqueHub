import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, PageMain, PageSection } from "@/components/PageLayout";
import { ShareButton } from "@/components/ShareButton";
import type { Competition } from "@/lib/data";
import {
  getCompetitionClassificationTags,
  getCompetitionClassLabel,
  getCompetitionDateLabel,
  getCompetitionFeatureTags,
  getCompetitionFeeLabel,
  getCompetitionLocationLabel,
  getCompetitionRegistrationLabel,
} from "@/lib/competition-display";
import {
  getCompetitionPath,
  getCompetitionSlug,
  normalizeCompetitionRouteSlug,
} from "@/lib/competition-slug";
import {
  getCompetitionBySlug,
  getCompetitionIndexingMetaById,
} from "@/lib/competition-server";
import {
  getSiteUrl,
  OPEN_GRAPH_IMAGE_URL,
  SHARE_IMAGE_ALT,
  SITE_NAME,
  TWITTER_IMAGE_URL,
} from "@/lib/site";

export const revalidate = 86_400;

interface CompetitionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CompetitionDetailPageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const competition = await getCompetitionBySlug(slug);

  if (!competition) {
    notFound();
  }

  const indexingMeta = await getCompetitionIndexingMetaById(competition.id);
  const path = getCompetitionPath(competition);
  const description = getDescription(competition);

  return {
    title: competition.title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: indexingMeta?.isIndexable ?? false,
      follow: true,
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
          url: OPEN_GRAPH_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: SHARE_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${competition.title} - ${SITE_NAME}`,
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

  if (!competition) {
    notFound();
  }

  if (
    normalizeCompetitionRouteSlug(decodeURIComponent(slug)) !==
    normalizeCompetitionRouteSlug(getCompetitionSlug(competition))
  ) {
    redirect(getCompetitionPath(competition));
  }

  const officialUrl = competition.sourceUrl || competition.registrationUrl;
  const eventJsonLd = getEventJsonLd(competition);
  const breadcrumbJsonLd = getBreadcrumbJsonLd(competition);
  const classificationTags = getCompetitionClassificationTags(competition);
  const featureTags = getCompetitionFeatureTags(competition);

  return (
    <PageMain>
      <StructuredData data={breadcrumbJsonLd} />
      {eventJsonLd && <StructuredData data={eventJsonLd} />}

      <PageHeader
        title={competition.title}
        subtitle={`${competition.org} · ${getCompetitionDateLabel(competition)} · ${getCompetitionLocationLabel(competition)}`}
        actions={
          <>
            <ShareButton
              className="cta-btn"
              path={getCompetitionPath(competition)}
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
            <dd>{getCompetitionDateLabel(competition)}</dd>

            <dt>접수 기간</dt>
            <dd>{getCompetitionRegistrationLabel(competition)}</dd>

            <dt>장소</dt>
            <dd>{getCompetitionLocationLabel(competition)}</dd>

            <dt>주최</dt>
            <dd>{competition.org}</dd>

            <dt>종목</dt>
            <dd>
              <div className="cat-pill-row">
                {competition.categories.length > 0 ? (
                  competition.categories.map((category) => (
                    <span className="cat-pill" key={category}>
                      {category}
                    </span>
                  ))
                ) : (
                  <span>공식 소스 기준 정보 확인 필요</span>
                )}
              </div>
            </dd>

            <dt>체급 구분</dt>
            <dd>{getCompetitionClassLabel(competition)}</dd>

            <dt>분류</dt>
            <dd>
              <div className="cat-pill-row">
                {classificationTags.map((tag) => (
                  <span className="cat-pill" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </dd>

            <dt>참가비</dt>
            <dd>{getCompetitionFeeLabel(competition)}</dd>

            <dt>특징</dt>
            <dd>
              <div className="cat-pill-row">
                {featureTags.map((tag) => (
                  <span className="cat-pill" key={tag}>
                    {tag}
                  </span>
                ))}
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

function getDescription(competition: Competition) {
  const locationLabel = getCompetitionLocationLabel(competition);
  const locationPhrase = /확인 필요/.test(locationLabel)
    ? "장소는 공식 채널에서 확인이 필요합니다"
    : `${locationLabel}에서 열립니다`;

  return `${competition.org} 주최 ${competition.title}은 ${getCompetitionDateLabel(competition)}에 ${locationPhrase}. 접수 정보: ${getCompetitionRegistrationLabel(competition)}.`;
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
        item: `${siteUrl}${getCompetitionPath(competition)}`,
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
    url: `${getSiteUrl()}${getCompetitionPath(competition)}`,
    startDate: competition.date,
    endDate: competition.dateEnd ?? competition.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: competition.venue,
      address: getCompetitionLocationLabel(competition),
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
